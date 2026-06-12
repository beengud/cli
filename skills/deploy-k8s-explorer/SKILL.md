---
name: deploy-k8s-explorer
description: >-
  End-to-end onboarding of a Kubernetes cluster to Observe — creates the
  backend datastreams + content via the Observe CLI and deploys the
  observe/agent helm chart. Use for ANY request to install or set up the
  Observe Agent on Kubernetes, onboard a K8s cluster to Observe, or send
  K8s data to Observe — across any flavor (EKS, GKE, AKS, GKE Autopilot,
  EKS Fargate, EKS Auto Mode, minikube, kind, on-prem). Do NOT route a
  Kubernetes onboarding request to a generic datastream-creation flow;
  always orchestrate via this skill, which delegates to setup-k8s-backend
  and setup-k8s-collection.
---

# Deploy Kubernetes Explorer

Interactive workflow that replicates the Observe UI's Kubernetes Explorer setup flow entirely from the terminal. Orchestrates sub-skills to create all backend resources via the Observe CLI and deploy the Observe Agent helm chart.

Supports: Standard K8s, EKS Fargate, GKE Autopilot, EKS Auto Mode.

## Reference Files

- [setup-k8s-backend datastream-reference.md](../setup-k8s-backend/references/datastream-reference.md) — Datastream-to-dataset mapping (useful for understanding CLI output)

---

## Phase 1: Gather Information

Ask these questions in order. Infrastructure type must be first since it determines the rest of the flow.

### Step 1a: Infrastructure Type

```
AskQuestion:
  id: k8s-infrastructure
  prompt: "What Kubernetes infrastructure are you running on?"
  options:
    - id: standard
      label: "Standard Kubernetes (self-managed, EKS, GKE Standard, AKS, on-prem, kind, minikube, etc.)"
    - id: eks-fargate
      label: "AWS EKS Fargate (serverless, no daemonsets)"
    - id: gke-autopilot
      label: "GKE Autopilot (managed node pools with restrictions)"
    - id: eks-auto-mode
      label: "AWS EKS Auto Mode (Karpenter-managed nodes)"
```

### Step 1b: Observe Tenant Info

Ask for:

1. **Customer URL** — the full Observe URL (e.g., `https://105611059680.observeinc.com`)
2. **Cluster name** — human-readable identifier for this cluster

Derive the collection endpoint from the customer URL: if the URL is `https://<CUSTOMER_ID>.<DOMAIN>`, the collection endpoint is `https://<CUSTOMER_ID>.collect.<DOMAIN>/`.

### Step 1c: Confirm collection defaults

State the default plan to the user (don't ask line by line — that's been shown to make first-time setup feel heavy and leads users to disable things they shouldn't). Use roughly this script, then ask one question:

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

If the user opts out of a data type, say so back ("OK, skipping prometheus") so they have a chance to course-correct, and note in your head which values flags will flip to `false`.

Note: For **EKS Fargate**, warn that logs and metrics require additional setup (OTel Operator sidecars, emptyDir volumes, pod annotations). Prometheus scraping is not supported on Fargate.

### Step 1d: Optional features

Two features are off by default. If the user has already opted into one of them in their phrasing (e.g. "make sure trace sampling is on", "I want multiline log detection"), just enable it. Otherwise don't ask — both are advanced and most users don't need them on day one. Mention them briefly:

```
Two optional features are off by default — let me know if you want either:
  - Tail-based trace sampling (adds a gateway deployment that decides which
    traces to keep based on tail-sampling policies)
  - Automatic multiline log detection (groups stack-trace lines into one log
    record; helpful if your apps emit Java/Python/Ruby tracebacks)
```

If the user doesn't volunteer one, leave both off and move on.

### Step 1e: Fargate Prerequisites (only if eks-fargate)

If the user selected EKS Fargate:

1. Confirm a **Fargate profile** exists for the `observe` namespace. If not, show the `eksctl create fargateprofile` command (see [fargate-reference.md](../setup-k8s-collection/references/fargate-reference.md)).
2. Confirm the **OpenTelemetry Operator** is installed. If not, show the helm install command.
3. Collect **namespace-to-service-account mappings** for pods to monitor:
   ```
   AskQuestion:
     id: fargate-sa
     prompt: "List the namespaces and service accounts for pods you want to monitor (e.g., 'default: [my-app-sa]'). Enter 'skip' to set this up later."
   ```

---

## Phase 2: Authenticate via CLI

Run:

```bash
observe auth status
```

If auth is already configured and valid, skip to Phase 3. If not authenticated or the token is expired:

```bash
observe auth login --url <CUSTOMER_URL>
```

For headless environments (no browser):

```bash
observe auth login --url <CUSTOMER_URL> --use-device-code
```

After login, verify with `observe auth status`. If it fails, ask the user to retry.

---

## Phase 3: Create Backend Resources

Read `../setup-k8s-backend/SKILL.md` and execute it. Do NOT re-ask for information already collected.

Pass the following context:

| Context         | Source   |
| --------------- | -------- |
| Customer URL    | Phase 1b |
| Cluster name    | Phase 1b |
| Traces selected | Phase 1c |

Auth (Phase 2) is already complete — skip the auth steps in setup-k8s-backend and go directly to "Phase 2: Detect Existing State."

After setup-k8s-backend completes, you will have:

- All datastream IDs
- Ingest token secret (the `secret` field from the token creation response)

---

## Phase 4: Deploy Helm Chart

Read `../setup-k8s-collection/SKILL.md` and execute it. Do NOT re-ask for information already collected.

Pass the following context:

| Context                          | Source                                                                 |
| -------------------------------- | ---------------------------------------------------------------------- |
| Collection endpoint              | Derived from Phase 1b: `https://<CUSTOMER_ID>.collect.<DOMAIN>/`       |
| Ingest token                     | `secret` value from Phase 3 (setup-k8s-backend)                        |
| Cluster name                     | Phase 1b                                                               |
| Infrastructure type              | Phase 1a (maps to: Standard, Fargate, GKE Autopilot, or EKS Auto Mode) |
| Data type selections             | Phase 1c                                                               |
| Optional feature selections      | Phase 1d                                                               |
| Fargate service account mappings | Phase 1e (if Fargate)                                                  |

Skip the "Prerequisites to Gather" section of setup-k8s-collection and go directly to the matching platform flow, starting from "Step 1: Generate values file."

---

## Phase 5: Verify

### Step 5a: kubectl Verification

```bash
kubectl get pods -n observe
```

Check all pods are in Running state. If any are in CrashLoopBackOff or Pending, direct the user to `../debug-k8s-collection/SKILL.md` for troubleshooting.

### Step 5b: Datastream Ingestion Verification

Poll each created datastream's stats via the CLI. Check `totalObservations > 0`. Poll up to 60 seconds with 10-second intervals.

```bash
observe datastream view <DATASTREAM_ID>
```

The JSON response includes stats with `totalObservations`, `totalVolumeBytes`, and `lastIngest`.

Report results per datastream:

```
Verification results:
  Kubernetes Explorer/OpenTelemetry Logs: ✓ receiving data (142 observations)
  Kubernetes Explorer/Prometheus: ✓ receiving data (89 observations)
  Kubernetes Explorer/Kubernetes Entity: ✓ receiving data (37 observations)
  Observe Agent/Events: ✗ no data yet
```

If some datastreams have no data after 60 seconds, direct the user to `../debug-k8s-collection/SKILL.md` for targeted troubleshooting.

---

## Phase 6: Summary

Print a complete summary:

```
Kubernetes Explorer Setup Complete
===================================

Infrastructure: <INFRASTRUCTURE_TYPE>
Cluster: <CLUSTER_NAME>
Tenant: <CUSTOMER_URL>

Backend Resources Created:
  Datastreams: <list with IDs>
  Content: Kubernetes Explorer Content (installed)
  Ingest Token: "K8s Explorer - <CLUSTER_NAME>"

Helm Deployment:
  Release: observe-agent
  Namespace: observe
  Values: observe-agent-values.yaml

Kubernetes Explorer URL:
  <CUSTOMER_URL>/kubernetes-explorer

Next Steps:
  - Open the Kubernetes Explorer in your browser
  - [If traces] Set OTEL_EXPORTER_OTLP_ENDPOINT in your app pods
  - [If prometheus] Add prometheus.io/scrape annotations to app pods
  - See further reading: https://docs.observeinc.com/docs/kubernetes
```

---

## Error Handling

At any phase, if an operation fails:

1. Show the full error message
2. Show what has been created so far
3. Ask the user how to proceed:
   ```
   AskQuestion:
     id: error-recovery
     prompt: "An error occurred. How would you like to proceed?"
     options:
       - id: retry
         label: "Retry the failed step"
       - id: skip
         label: "Skip this step and continue"
       - id: abort
         label: "Stop here (resources created so far are kept)"
   ```

---

## Upgrade Flow

### Backend Changes (datastreams, content, tokens)

Read `../setup-k8s-backend/SKILL.md` and execute the relevant parts of Phases 2–3 to add missing datastreams or content (e.g., enabling traces after initial setup).

### Helm Chart Changes

Read `../setup-k8s-collection/SKILL.md` and follow its Upgrade Flow section.

---

## Uninstall Flow

### Kubernetes Resources Only

Read `../setup-k8s-collection/SKILL.md` and follow its Uninstall Flow section. This removes the helm release, secret, and namespace but does NOT remove backend resources from Observe.

### Backend Resources

The Observe CLI does not expose delete commands for datastreams, content packages, or ingest tokens — this is intentional, since removing them risks irreversible data loss. Direct the user to remove backend resources manually in the Observe UI.

---

## Application Instrumentation (Optional)

This skill stands up the cluster-side collection plane (datastreams, agent, OTLP gateway). Wiring individual application pods to emit OTLP is a separate concern. The agent exposes:

| Endpoint                                                        | Protocol  | Use                                                         |
| --------------------------------------------------------------- | --------- | ----------------------------------------------------------- |
| `http://observe-agent-forwarder.observe.svc.cluster.local:4318` | OTLP HTTP | App SDKs that prefer HTTP, or auto-instrumentation defaults |
| `http://observe-agent-forwarder.observe.svc.cluster.local:4317` | OTLP gRPC | App SDKs that prefer gRPC                                   |

### Hand off

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
