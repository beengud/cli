import { buildRouteMap } from "@stricli/core";
import { listCommand } from "./list";
import { viewCommand } from "./view";

export const skillRoutes = buildRouteMap({
  routes: {
    list: listCommand,
    view: viewCommand,
  },
  docs: {
    brief: "View AI agent skills",
    fullDescription: [
      "View and manage AI agent skills in Observe",
      "",
      "Commands:",
      "  list    Search and list AI agent skills",
      "  view    View details of a specific skill",
    ].join("\n"),
  },
});
