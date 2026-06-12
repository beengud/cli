import { buildRouteMap } from "@stricli/core";
import { installCommand } from "./install";
import { viewCommand } from "./view";

export const hostContentRoutes = buildRouteMap({
  routes: {
    install: installCommand,
    view: viewCommand,
  },
  docs: {
    brief: "Manage Host Explorer content",
  },
});
