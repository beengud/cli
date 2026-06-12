import { buildRouteMap } from "@stricli/core";
import { hostContentRoutes } from "./host/index";
import { kubernetesContentRoutes } from "./kubernetes/index";
import { tracingContentRoutes } from "./tracing/index";

export const contentRoutes = buildRouteMap({
  routes: {
    host: hostContentRoutes,
    kubernetes: kubernetesContentRoutes,
    tracing: tracingContentRoutes,
  },
  docs: {
    brief: "Manage installed content",
    fullDescription: [
      "Install and view content packs in Observe.",
      "",
      "Commands:",
      "  host         Manage Host Explorer content",
      "  kubernetes   Manage Kubernetes Explorer content",
      "  tracing      Manage Trace Explorer content",
    ].join("\n"),
  },
});
