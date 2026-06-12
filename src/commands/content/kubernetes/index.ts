import { buildRouteMap } from "@stricli/core";
import { installCommand } from "./install";
import { viewCommand } from "./view";

export const kubernetesContentRoutes = buildRouteMap({
  routes: {
    install: installCommand,
    view: viewCommand,
  },
  docs: {
    brief: "Manage Kubernetes Explorer content",
  },
});
