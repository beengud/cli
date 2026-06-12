import { buildRouteMap } from "@stricli/core";
import { listCommand } from "./list";
import { viewCommand } from "./view";

export const datasetRoutes = buildRouteMap({
  routes: {
    list: listCommand,
    view: viewCommand,
  },
  docs: {
    brief: "View observe datasets",
    fullDescription: [
      "View and manage datasets in Observe",
      "",
      "Commands:",
      "  list    List datasets in Observe",
      "  view    View details of a dataset",
    ].join("\n"),
  },
});
