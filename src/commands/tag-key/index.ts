import { buildRouteMap } from "@stricli/core";
import { listCommand } from "./list";

export const tagKeyRoutes = buildRouteMap({
  routes: {
    list: listCommand,
  },
  docs: {
    brief: "Search and view tag keys",
    fullDescription: [
      "Search and view tag keys",
      "",
      "Commands:",
      "  list    Search for tag keys",
    ].join("\n"),
  },
});
