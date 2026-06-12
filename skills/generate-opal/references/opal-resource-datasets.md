# Querying Resource Datasets: state tracking, duration, filtering

Resource datasets track **mutable state over time**. Each row represents a time interval during which an entity (pod, host, deployment) was in a particular state, bounded by a valid-from (start) and valid-to (end) time. Reference these with the `row_start_time()` (valid-from) and `row_end_time()` (valid-to) functions instead of hardcoding column names. An **open interval** (`row_end_time()` is null) means the entity is **currently** in that state.

## Duration Calculation — ALWAYS account for valid-to

To compute how long an entity has been in a state, you MUST account for the valid-to time:

    make_col state_duration:coalesce(row_end_time(), now()) - row_start_time()

**NEVER** use `now() - row_start_time()` alone — this inflates durations for rows where the state already ended (i.e., `row_end_time()` is not null). Without `coalesce`, a pod that was Pending for 5 seconds but has a valid-to set would incorrectly appear as pending for hours/days.

## "Currently In State X" Filtering

When the user asks about entities **currently** in a state (e.g., "pods currently failing", "hosts that are down"), filter for open intervals:

    filter is_null(row_end_time())

Combine with a duration threshold to find entities stuck in a state:

    filter is_null(row_end_time())
    make_col state_duration:now() - row_start_time()
    filter state_duration > duration_min(10)

## Worked Example: Pods in a Bad State > 10 Minutes

    filter starts_with(namespace, "prod")
    filter status = "Pending" or status = "Failed"
    filter is_null(row_end_time())
    make_col state_duration:now() - row_start_time()
    make_col state_minutes:to_minutes(state_duration)
    filter state_duration > duration_min(10)
    pick_col @."Valid From":row_start_time(), @."Valid To":row_end_time(), name, namespace, uid, clusterUid, status, statusReason, statusMessage, nodeName, state_minutes
    topk 100, max(state_minutes)

Key points:

- `is_null(row_end_time())` ensures only currently-bad pods are included
- Duration uses `now() - row_start_time()` which is correct here because we already filtered for a null valid-to
- `topk` is required instead of `limit` for Resource datasets
- Retain temporal columns in `pick_col`: `row_start_time()` for valid-from and `row_end_time()` for valid-to
- Include ALL `primaryKey` columns in `pick_col` — this dataset's primary key is `["name", "namespace", "uid", "clusterUid"]`, so all four must appear. Check the schema's `primaryKey` array for every Resource dataset before writing `pick_col`

## Worked Example: Stale Resources (Not Updated in 30 Days)

    filter is_null(row_end_time())
    make_col age:now() - row_start_time()
    filter age > 30d
    make_col age_days:to_hours(age) / 24
    pick_col @."Valid From":row_start_time(), @."Valid To":row_end_time(), name, namespace, uid, clusterUid, age_days
    topk 100, max(age_days)

Key points:

- `30d` is a duration literal expressing 30 days — use literals for day/week thresholds
- `to_hours(age) / 24` converts the duration to a human-readable day count
- For full duration reference (constructors, extractors, literals), load [opal-duration](opal-duration.md)

## ever / always / never — Entity-Level Temporal Filters

These filter verbs keep or drop **entire primary-key groups** based on whether a predicate was true for any/all/no rows in the group. The input must have a non-empty primary key. Particularly useful for Resource datasets where you want to filter entire entities by their history.

    ever string(status_code) ~ /^5.*/                     ← keep all rows for groups that had ANY 5xx
    always string(status_code) = "200"                    ← keep all rows for groups that were ALWAYS 200
    never string(status_code) ~ /^5.*/                    ← keep all rows for groups that NEVER had 5xx

With `frame()` for temporal windowing:

    ever string(status_code) ~ /^5.*/, frame(back:30m)    ← check within trailing 30 minutes
    always bytesUsed < 20000000, frame(back:1h)           ← require condition in trailing 1 hour
    never error = true, frame(back:15m)                   ← no errors in trailing 15 minutes

Use these instead of multi-step `filter` + `statsby` patterns when the question asks "which [entities] ever/always/never [condition]".

## Resource Dataset Checklist (verify before every Resource query)

1. **BOTH temporal columns in `pick_col`**: Use `row_start_time()` for valid-from and `row_end_time()` for valid-to. Omitting either will cause an error.
2. **ALL `primaryKey` columns in `pick_col`**: Check the schema's `primaryKey` array and include every column listed.
3. **`topk` instead of `limit`**: Resource datasets reject `limit` — error: `"limit" does not support Resource kind input, use "topk" instead`. Always use `topk N, max(col)` with an aggregate scoring function.
4. **`topk` requires aggregate scoring**: `topk 20, max(col)` — never `topk 20, col` (bare column is invalid).

## Enriching Resources with Event Data — update_resource

Use `update_resource` to build new columns on a Resource dataset by matching Event rows on the primary key. The default input must be a Resource; the additional dataset must be Events.

    update_resource pod_uid = @"events".pod_uid, last_event:@"events".message, event_reason:@"events".reason

With expiry option (controls how long event-sourced values remain, default 24h):

    update_resource options(expiry:duration_hr(12)), host_id = @"metrics".host_id, cpu:@"metrics".cpu_usage

Key rules:

- Key predicates must cover the full primary key or a candidate key on the resource
- Column bindings add NEW columns — cannot overwrite existing resource columns
- For full join pattern reference, load [opal-join-patterns](opal-join-patterns.md)

## Dataset Kind Conversion Verbs

These verbs convert between dataset kinds (Event, Interval, Resource, Table):

| Verb            | Converts from             | Converts to | Key behavior                                                          |
| :-------------- | :------------------------ | :---------- | :-------------------------------------------------------------------- |
| `make_event`    | Resource, Interval, Table | Event       | Resource → expands history into point-shaped update rows              |
| `make_interval` | Event, Table, Resource    | Interval    | Event → pass a `valid_to` column; Table → pass both `valid_from`/`to` |
| `make_resource` | Event, Interval           | Resource    | Packs stream into mutable state tracked by primary key                |
| `make_table`    | Any temporal              | Table       | Strips temporal semantics; no arguments                               |

### make_resource — create Resources from Events

    make_resource options(expiry:duration_hr(4)), primary_key(station_id)
    make_resource options(expiry:duration_hr(24)), reading:temp_c, primary_key(station_id, region)

`primary_key(...)` declares which columns identify each resource instance. `expiry` sets the default TTL for resource state. Column bindings (`reading:temp_c`) project specific columns; without bindings, all columns carry forward.

### make_event — expand Resources to Events

    make_event                                        ← Resource → Event (expand state history into events)
    make_event timestamp                              ← Table → Event (promote timestamp column)
    make_event options(use_valid_to:true)              ← Interval → Event at end time instead of start

On Resource input, `make_event` takes no arguments and produces one row per state change, with event timestamp from the resource's Valid From.

### make_interval — create Intervals

    make_interval end_ts                              ← Event → Interval (reuse valid_from, add valid_to)
    make_interval start_ts, end_ts                    ← Table → Interval (provide both endpoints)
    make_interval options(max_time_diff:24h)           ← Resource → Interval (allow up to 24h spans)

### make_table — strip temporal semantics

    make_table                                        ← no arguments; converts any temporal dataset to Table

## Complementary Resource Datasets

Many resources have related condition/status datasets that provide richer state information. For example:

- **kubernetes/Pod** tracks pod-level status (Pending, Running, Failed)
- **kubernetes/Pod Condition** tracks condition-level detail (Ready=false, ContainersReady=false, PodScheduled)

When investigating resource state, consider querying both the primary resource dataset AND its condition dataset for a complete picture. Conditions often reveal _why_ an entity is in a bad state (e.g., a pod is Pending because `PodScheduled=false`).
