import { buildRouteMap } from "@stricli/core";
import { installCommand } from "./install";
import { viewCommand } from "./view";

export const tracingContentRoutes = buildRouteMap({
  routes: {
    install: installCommand,
    view: viewCommand,
  },
  docs: {
    brief: "Manage Trace Explorer content",
  },
});
