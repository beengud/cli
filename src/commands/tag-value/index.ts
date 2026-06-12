import { buildRouteMap } from "@stricli/core";
import { listCommand } from "./list";

export const tagValueRoutes = buildRouteMap({
  routes: {
    list: listCommand,
  },
  docs: {
    brief: "Search and view tag values",
    fullDescription: [
      "Search and view tag values",
      "",
      "Commands:",
      "  list    Search for tag values",
    ].join("\n"),
  },
});
