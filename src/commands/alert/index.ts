import { buildRouteMap } from "@stricli/core";
import { listCommand } from "./list";
import { viewCommand } from "./view";

export const alertRoutes = buildRouteMap({
  routes: {
    list: listCommand,
    view: viewCommand,
  },
  docs: {
    brief: "View observe alerts",
    fullDescription: [
      "View and manage alerts in Observe",
      "",
      "Commands:",
      "  list    Search and list alerts in Observe",
      "  view    View details of a specific alert",
    ].join("\n"),
  },
});
