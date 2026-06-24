/**
 * OPAL pipelines for the fleet commands, ported verbatim from the Go CLI
 * (`cmd_fleet.go`). Each runs against the Observe Agent Events dataset and
 * filters to `AgentLifecycleEvent` rows. The `pick_col` order defines the
 * output columns and the trailing `sort` defines row order — both are
 * preserved by the query path, so output matches the Go CLI.
 */

/** `fleet status` — current agent inventory, newest first. */
export const FLEET_STATUS_PIPELINE =
  'filter kind = "AgentLifecycleEvent" | make_col host:string(identifiers["host.name"]), env:string(identifiers["observe.agent.environment"]), version:string(facets["observe.agent.version"]), instance_id:string(identifiers["observe.agent.instance.id"]), data_obj:parse_json(data) | make_col auth_ok:bool(data_obj.authCheck.passed) | pick_col valid_from, host, env, version, auth_ok, instance_id | sort desc(valid_from)';

/** `fleet versions` — version distribution across the fleet. */
export const FLEET_VERSIONS_PIPELINE =
  'filter kind = "AgentLifecycleEvent" | make_col host:string(identifiers["host.name"]), env:string(identifiers["observe.agent.environment"]), version:string(facets["observe.agent.version"]) | pick_col valid_from, host, env, version | sort asc(version), asc(host)';

/** `fleet auth` — auth-check status, failures first. */
export const FLEET_AUTH_PIPELINE =
  'filter kind = "AgentLifecycleEvent" | make_col host:string(identifiers["host.name"]), env:string(identifiers["observe.agent.environment"]), version:string(facets["observe.agent.version"]), data_obj:parse_json(data) | make_col auth_ok:bool(data_obj.authCheck.passed), auth_code:int64(data_obj.authCheck.responseCode), auth_url:string(data_obj.authCheck.url) | pick_col valid_from, host, env, version, auth_ok, auth_code, auth_url | sort asc(auth_ok), desc(valid_from)';

/**
 * `fleet host <hostname>` — event history for one host, newest first,
 * including agent start time. The hostname is interpolated into a quoted OPAL
 * string literal, matching the Go CLI's `%q` formatting.
 */
export function fleetHostPipeline(hostname: string): string {
  return `filter kind = "AgentLifecycleEvent" | filter string(identifiers["host.name"]) = ${quoteOpalString(hostname)} | make_col host:string(identifiers["host.name"]), env:string(identifiers["observe.agent.environment"]), version:string(facets["observe.agent.version"]), data_obj:parse_json(data) | make_col auth_ok:bool(data_obj.authCheck.passed), start_time:from_nanoseconds(int64(data_obj.agentStartTime)*1000000000) | pick_col valid_from, host, env, version, auth_ok, start_time | sort desc(valid_from)`;
}

/**
 * Quote a value as an OPAL double-quoted string literal, escaping characters
 * the way Go's `%q` does for the cases that matter here (backslash and
 * double-quote). Prevents a hostname from breaking out of the filter.
 */
function quoteOpalString(value: string): string {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}
