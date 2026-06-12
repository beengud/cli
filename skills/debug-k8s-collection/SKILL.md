---
name: debug-k8s-collection
description: >-
  Troubleshoot and debug Observe Agent data collection on Kubernetes. Use this
  skill whenever the user reports any K8s-side problem with Observe — pods
  crashing, stuck Pending, ImagePullBackOff, "no data in Observe", missing
  datastreams, suspected token/secret issues, endpoint reachability failures,
  or platform-specific symptoms on Fargate / GKE Autopilot / EKS Auto Mode —
  even if they don't explicitly say "debug" or "Observe Agent." Covers pod
  status, secrets, endpoint reachability, debug logging, self-monitoring
  metrics, and platform-specific failure modes.
---

# Debug Kubernetes Collection

Interactive troubleshooting workflow for diagnosing Observe Agent collection problems on Kubernetes. Work through the steps below in order, stopping when the root cause is found.

> **Agent sandbox note:** Do NOT run `helm` or `kubectl` commands from the agent shell. Present all commands to the user for them to execute in their own terminal, then ask for the output.

---

## Step 1: Check Pod Status

Start by getting a complete picture of what is running:

```bash
kubectl get pods -n observe
```

What to look for:

- **Running** — pod is healthy
- **CrashLoopBackOff** — container is crashing on startup; check logs immediately
- **Pending** — pod cannot be scheduled; check events and node capacity
- **ImagePullBackOff** — image pull failed; check network or image name
- **Error** — container exited non-zero; check logs

For any non-Running pod, get detailed status:

```bash
kubectl describe pod -n observe <pod-name>
```

Check the `Events` section at the bottom of the describe output — it usually contains the root cause for scheduling and startup failures.

---

## Step 2: Check Pod Logs

Most agent issues surface as exporter errors spread across all three (or more) agent pods. Fetch logs from every agent pod at once and filter to the high-signal lines — the raw output is dominated by long OTel stack traces:

```bash
kubectl logs -n observe -l app.kubernetes.io/name=observe-agent --all-containers --tail=200 \
  | grep -iE "401|403|unauthorized|forbidden|context deadline|connection refused|certificate|out of memory|oom"
```

For pods that previously crashed (to see the last run):

```bash
kubectl logs -n observe <pod-name> --previous
```

For multi-container pods, specify the container:

```bash
kubectl logs -n observe <pod-name> -c <container-name>
```

Common log indicators of problems:

- `401` / `Unauthenticated` / `unauthorized` — bad ingest token (most common). The OTel exporter logs this on every send attempt; expect many copies, one per signal. The token ID prefix may be correct but the secret portion wrong, so don't assume the token is good just because it looks familiar — see Step 3.
- `403` / `forbidden` — token valid but lacks permission for the target datastream.
- `connection refused` or `context deadline exceeded` — endpoint or network issue; jump to Step 5.
- `certificate` errors — TLS/certificate problem with collection endpoint.
- `out of memory` / `oom` — pod needs resource limit increase.

---

## Step 3: Verify the Agent Secret

The agent authenticates using the `agent-credentials` secret. Confirm it exists:

```bash
kubectl get secret agent-credentials -n observe
```

Confirm it has the `OBSERVE_TOKEN` key, and that the token isn't truncated or partially overwritten:

```bash
kubectl get secret agent-credentials -n observe -o jsonpath='{.data}' \
  | python3 -c "import sys,json,base64; d=json.load(sys.stdin); [print(f'{k} = {base64.b64decode(v).decode()[:8]}...{base64.b64decode(v).decode()[-4:]} (length={len(base64.b64decode(v).decode())})') for k,v in d.items()]"
```

This prints the key names plus the first 8 chars, last 4 chars, and total length of each value. Token format is `<token-id>:<secret>` — the token ID is at the front and the secret is at the end. Showing both ends and the length catches the common failure modes (truncation, partial overwrite, secret corruption) that an 8-char prefix check would miss. A typical token looks like:

```
OBSERVE_TOKEN = ds1Wbnfm...JC5Q (length=53)
```

If the length or last 4 chars don't match what was issued by `observe ingest-token create`, the secret is wrong even if the prefix looks familiar.

If the secret is missing or wrong, re-apply it idempotently (works whether or not it already exists):

```bash
kubectl -n observe create secret generic agent-credentials \
  --from-literal=OBSERVE_TOKEN=<INGEST_TOKEN> \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl annotate secret agent-credentials -n observe \
  meta.helm.sh/release-name=observe-agent \
  meta.helm.sh/release-namespace=observe \
  --overwrite
kubectl label secret agent-credentials -n observe \
  app.kubernetes.io/managed-by=Helm \
  --overwrite
kubectl rollout restart deployment -n observe
kubectl rollout restart daemonset -n observe
```

The rollout restart is required — agent pods read the secret at startup, so they need to restart to pick up the new value.

---

## Step 4: Check Helm Release Values

Confirm the deployed configuration matches what was intended:

```bash
helm -n observe get values observe-agent -o yaml
```

Key fields to check:

- `observe.collectionEndpoint.value` — must be the full URL with trailing slash, e.g., `https://105611059680.collect.observeinc.com/`
- `cluster.name` — should match the cluster name used when setting up the backend
- `node.enabled`, `cluster.events.enabled` — confirm the expected collectors are enabled

---

## Step 5: Verify Endpoint Reachability

If pod logs show connection errors, confirm the collection endpoint is reachable from inside the cluster by running a one-off curl pod:

```bash
kubectl run curl-test --image=curlimages/curl:latest -n observe --restart=Never --rm -it -- \
  curl -v --max-time 10 https://<CUSTOMER_ID>.collect.<DOMAIN>/
```

Expected: HTTP 200 or 404 (any HTTP response confirms network connectivity). A timeout or `connection refused` means network egress is blocked.

Clean up if the pod was not auto-removed:

```bash
kubectl delete pod curl-test -n observe
```

---

## Step 6: Check Data Arrival in Observe

Poll each datastream to see if data is arriving. Replace `<DATASTREAM_ID>` with the actual ID from setup:

```bash
observe datastream view <DATASTREAM_ID>
```

Check the `totalObservations` field in the response. Poll every 10 seconds for up to 60 seconds:

```bash
for i in 1 2 3 4 5 6; do
  echo "--- Check $i ---"
  observe datastream view <DATASTREAM_ID> | grep -E 'totalObservations|lastIngest'
  sleep 10
done
```

If `totalObservations` stays at 0 after a minute, the agent is not successfully sending data. Continue to Step 7.

---

## Step 7: Enable Debug Logging

To get verbose output from the agent, add debug configuration to the values file:

```yaml
agent:
  config:
    global:
      debug:
        enabled: true
        verbosity: detailed
```

Apply with:

```bash
helm upgrade --reuse-values observe-agent observe/agent -n observe \
  --values observe-agent-values.yaml
```

Then tail logs from the relevant pod:

```bash
kubectl logs -n observe -f <pod-name>
```

Debug output will show per-pipeline processing counts, exporter retry attempts, and detailed error messages. Look for `exporter` lines that show how many records are being sent vs. failing.

After debugging, remove the debug block and re-apply to avoid excess log volume.

---

## Step 8: Check Self-Monitor Metrics (if enabled)

If `agent.selfMonitor.enabled: true` was set in the helm values, the `monitor` deployment collects internal agent metrics. Check the monitor pod is running:

```bash
kubectl get pods -n observe -l app.kubernetes.io/component=monitor
kubectl logs -n observe -l app.kubernetes.io/component=monitor
```

Self-monitor metrics are sent to Observe under the `Observe Agent/Events` datastream. You can query them in the Observe UI to see per-pipeline send rates and error counts.

---

## Platform-Specific Failure Modes

### EKS Fargate

**DaemonSets cannot run on Fargate nodes.** If you deployed with the Standard values (which enable DaemonSets), pods will be stuck in Pending indefinitely. Symptoms:

- `kubectl get pods -n observe` shows `node-logs-metrics-*` pods as Pending
- `kubectl describe pod` shows `0/N nodes are available: N node(s) didn't match node affinity`

Resolution: Use the Fargate-specific values (`node.enabled: false`, `nodeless.enabled: true`). See `../setup-k8s-collection/SKILL.md` Fargate Flow for the correct values.

Also confirm:

- A Fargate profile exists for the `observe` namespace
- The OpenTelemetry Operator is installed and running
- Target pods have the sidecar annotation: `sidecar.opentelemetry.io/inject: observe/fargate-collector`

### GKE Autopilot

**Affinity constraint rejection.** GKE Autopilot blocks the `observeinc.com/unschedulable` node affinity label used by Standard values. Symptoms:

- Pods stuck in Pending
- `describe pod` shows: `node(s) had untolerated taint` or `node(s) didn't match node affinity`

Resolution: All components need the OS-only affinity override (`kubernetes.io/os: NotIn: [windows]`). Use the GKE Autopilot values from `../setup-k8s-collection/SKILL.md`.

Also note: **node-level host metrics are not available on Autopilot** — `node.metrics.enabled` must be `false`.

### EKS Auto Mode (Karpenter)

**DaemonSet pods stuck in Pending because Karpenter doesn't provision nodes for DaemonSets.** Symptoms:

- `kubectl get pods -n observe` shows `node-logs-metrics-*` as Pending on new nodes
- `kubectl describe pod` shows: `0/0 nodes are available`

Resolution: Apply a PriorityClass before helm install:

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: observe-agent-priority
globalDefault: false
value: 10000
preemptionPolicy: "PreemptLowerPriority"
```

```bash
kubectl apply -f observe-agent-priority.yaml
```

Then add to values:

```yaml
node-logs-metrics:
  priorityClassName: "observe-agent-priority"
```

Also ensure `node.kubeletstats.useNodeIp: true` is set — Auto Mode uses instance IDs as node names, and without this kubelet stats collection fails silently.

---

## Key Reference

- Helm chart source: https://github.com/observeinc/helm-charts/tree/main/charts/agent
- Full `values.yaml` reference: https://github.com/observeinc/helm-charts/blob/main/charts/agent/values.yaml
- Observe K8s docs: https://docs.observeinc.com/docs/kubernetes
