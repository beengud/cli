---
name: setup-k8s-collection
description: >-
  Deploy the Observe Agent helm chart on Kubernetes to collect logs, metrics,
  traces, Prometheus metrics, and K8s events. Use this skill whenever the user
  mentions installing the observe/agent helm chart, configuring helm values
  for an Observe agent, deploying observability to a K8s cluster, or any
  K8s-platform-specific Observe setup (Standard, EKS Fargate, GKE Autopilot,
  EKS Auto Mode) — even if they don't name the helm chart explicitly. Does
  not create Observe backend resources (datastreams, tokens) — see
  setup-k8s-backend for that.
---

# Set Up Kubernetes Data Collection

Interactive workflow to guide users through deploying the Observe Agent on Kubernetes using the `observe/agent` helm chart.

## Prerequisites to Gather

Before starting, collect these from the user. If called from `deploy-k8s-explorer`, these will already be known — do not re-ask.

1. **Observe collection endpoint** — format: `https://<CUSTOMER_ID>.collect.<DOMAIN>/`
2. **Observe ingest token** — or confirm one exists as a K8s secret
3. **Cluster name** — a human-readable identifier for this cluster
4. **Kubernetes environment type** — determines the deployment topology

Use AskQuestion to determine the environment:

```
AskQuestion:
  id: k8s-environment
  prompt: "What Kubernetes environment are you deploying to?"
  options:
    - id: standard
      label: "Standard Kubernetes (EKS, GKE, AKS, on-prem, kind, etc.)"
    - id: fargate
      label: "AWS EKS Fargate (serverless, no daemonsets)"
    - id: gke-autopilot
      label: "GKE Autopilot"
    - id: eks-auto-mode
      label: "AWS EKS Auto Mode (Karpenter-managed nodes)"
```

Then state the default collection plan to the user. **Don't ask line by line** — that's been shown to make first-time setup feel heavy and leads users to disable things they shouldn't. Use roughly this script, then ask one question:

```
By default I'll set up the recommended Kubernetes Explorer collection:

  Data types collected
    - Container logs
    - Cluster + node metrics
    - Application traces (OpenTelemetry, via OTLP receivers ready for your apps)
    - Kubernetes events + resource state

  Always-on agent features
    - Agent self-monitoring (telemetry about the agent itself)
    - RED metrics derived from traces (rate / errors / duration)
    - Fleet monitoring (heartbeats every ~10 min)

  Off by default (optional, off unless you want them)
    - Prometheus metrics from annotated pods (requires `prometheus.io/scrape` annotations on app pods)
    - Tail-based trace sampling via gateway (adds an extra deployment)
    - Automatic multiline log detection (handy for stack traces)

This is the recommended configuration. Disabling individual data types may degrade the Kubernetes Explorer experience.

Want me to change anything before I proceed, or are these defaults fine?
```

Treat any non-objection — "looks good", "go ahead", "yes", silence — as approval. Only deviate from the defaults if the user explicitly asks for a change. **Do not** issue a multi-select prompt and force the user to confirm every category.

If the user opts out of a data type, say so back ("OK, skipping prometheus") so they have a chance to course-correct, and note in your head which values flags will flip to `false`. If they opt into one of the off-by-default features, enable it without further prompting.

## Flow Router

Based on the answers, follow the appropriate flow:

- **Standard K8s** → [Standard Flow](#standard-flow) (most common; covered inline below)
- **EKS Fargate** → read [references/fargate-reference.md](references/fargate-reference.md) and follow it
- **GKE Autopilot** → read [references/gke-autopilot.md](references/gke-autopilot.md) and follow it
- **EKS Auto Mode** → read [references/eks-auto-mode.md](references/eks-auto-mode.md) and follow it

The platform reference files contain the full values-file template, install commands, and post-install notes for that platform. They are designed to be read top-to-bottom in place of the Standard Flow below.

> **Agent sandbox note:** Do NOT run `helm` or `kubectl` commands from the agent shell. Many agent sandboxes restrict network access, which will cause `helm repo update` and `helm install` to fail. Present all commands to the user for them to execute in their own terminal.

---

## Standard Flow

This is the most common deployment. It uses daemonsets for per-node collection and single-instance deployments for cluster-wide collection.

### Step 1: Generate values file

Build an `observe-agent-values.yaml` based on user selections. Start from this base and toggle sections on/off:

```yaml
observe:
  collectionEndpoint:
    value: "<COLLECTION_ENDPOINT>"
  token:
    create: false # true if user wants helm to create the secret

cluster:
  name: "<CLUSTER_NAME>"
  events:
    enabled: true # almost always on
  metrics:
    enabled: true # almost always on

node:
  enabled: true
  containers:
    logs:
      enabled: <LOGS_SELECTED>
    metrics:
      enabled: true
  forwarder:
    enabled: <TRACES_OR_FORWARDER_NEEDED>
    traces:
      enabled: <TRACES_SELECTED>
    metrics:
      enabled: true
      outputFormat: "otel"

application:
  prometheusScrape:
    enabled: false # off by default per skill defaults; flip to true if user opts in
  REDMetrics:
    enabled: true # always on per skill defaults; harmless if traces are off

agent:
  selfMonitor:
    enabled: true # always on per skill defaults
  config:
    global:
      fleet:
        enabled: true # populates the "Observe Agent/Events" datastream with 10m heartbeats
```

If **trace sampling** is selected, add:

```yaml
gatewayDeployment:
  enabled: true
  traceSampling:
    enabled: true
```

If **automatic multiline detection** is selected, add under `node.containers.logs`:

```yaml
autoMultilineDetection: true
```

### Step 2: Generate install commands

Produce the commands the user should run. The commands below are idempotent — safe to re-run after a partial failure or against an existing install. If token management is manual (the common case):

```bash
# Refresh the chart index. Always run BOTH of these before install:
# `add` is idempotent if the repo is already configured (and fails harmlessly
# if so); `update` is what avoids pulling a stale cached version of the chart.
# Skipping `update` is the most common cause of "I deployed an old chart"
# debugging sessions — do not skip it even if the repo looks already-added.
helm repo add observe https://observeinc.github.io/helm-charts
helm repo update observe

# Create namespace and secret (apply, so re-runs don't fail on already-exists)
kubectl create namespace observe --dry-run=client -o yaml | kubectl apply -f -
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

# Install or upgrade
helm upgrade --install observe-agent observe/agent -n observe \
  --values observe-agent-values.yaml
```

If `observe.token.create: true`, skip the secret creation, annotate, and label commands.

### Step 3: Verification commands

```bash
kubectl get pods -n observe
helm -n observe get values observe-agent -o yaml > observe-agent-values-backup.yaml
```

### Step 4: Post-install guidance

Based on selections, provide relevant next steps:

- **Prometheus selected** → Mention pod annotation `prometheus.io/port` and `prometheus.io/scrape` for autodiscovery. See [prometheus-reference.md](references/prometheus-reference.md).
- **All users** → Link to further reading in [further-reading.md](references/further-reading.md).

### Step 5: Application Instrumentation (Optional)

If `traces` was selected (or the user otherwise plans to send OTLP from app pods), the agent is already set up to receive that telemetry — this skill's responsibility ends here, at the OTLP endpoints below. Wiring the application to emit OTLP is the job of a separate, language-specific skill.

The agent exposes (in-cluster) OTLP at:

| Endpoint                                                        | Protocol  | Use                                                         |
| --------------------------------------------------------------- | --------- | ----------------------------------------------------------- |
| `http://observe-agent-forwarder.observe.svc.cluster.local:4318` | OTLP HTTP | App SDKs that prefer HTTP, or auto-instrumentation defaults |
| `http://observe-agent-forwarder.observe.svc.cluster.local:4317` | OTLP gRPC | App SDKs that prefer gRPC                                   |

#### Hand off

- **Do not modify the application or its build/deploy pipeline yourself.** If a change is required, hand off to the appropriate skill so the user gets a complete, tested workflow rather than partial advice.
- Ask the user whether they want to instrument an application now, set it up later, or just confirm what they already have:
  - If they want to set up new instrumentation — refer them to `opentelemetry-auto-instrumentation`.
  - If they already have OpenTelemetry instrumentation and want to verify it lands in Observe correctly — refer them to `opentelemetry-validation`.
  - If they're not ready to instrument anything yet — exit; the cluster-side setup is complete and the OTLP endpoints will be ready whenever they are.

| Skill                                | Description                                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `opentelemetry-auto-instrumentation` | Add OpenTelemetry to an existing app (auto-instrumentation for Java, Python, Node.js, .NET, Ruby)                         |
| `opentelemetry-validation`           | Verify instrumentation is wired correctly and the expected spans, RED metrics, and runtime metrics are landing in Observe |

> **Backend datastream prerequisite:** if `setup-k8s-backend` was not run with traces selected, the `Tracing/Span` and `Metrics/OpenTelemetry` datastreams won't exist and OTLP data will be accepted by the ingest endpoint but routed nowhere. Re-run `setup-k8s-backend` to add them before instrumenting the app.

---

## Upgrade Flow

If the user already has Observe Agent installed and wants to change configuration:

```bash
# Update values file, then:
helm upgrade --reuse-values observe-agent observe/agent -n observe \
  --values observe-agent-values.yaml

# Restart to pick up changes
kubectl rollout restart deployment -n observe
kubectl rollout restart daemonset -n observe

# Verify
kubectl get pods -o wide -n observe
```

---

## Uninstall Flow

```bash
helm uninstall observe-agent -n observe
kubectl -n observe delete secret agent-credentials
kubectl delete namespace observe
```

This removes the helm release, secret, and namespace. It does **not** remove backend resources (datastreams, content, tokens) from Observe — those must be removed manually in the Observe UI. See `../setup-k8s-backend/SKILL.md` → "Backend Resource Removal".

---

## Key Reference

- Helm chart source: https://github.com/observeinc/helm-charts/tree/main/charts/agent
- Full `values.yaml` reference: https://github.com/observeinc/helm-charts/blob/main/charts/agent/values.yaml
- Examples: https://github.com/observeinc/helm-charts/tree/main/examples/agent and https://github.com/observeinc/helm-charts/tree/main/charts/agent/examples
- Observe docs: https://docs.observeinc.com/docs/kubernetes
