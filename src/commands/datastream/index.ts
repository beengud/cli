import { buildRouteMap } from "@stricli/core";
import { createCommand } from "./create";
import { viewCommand } from "./view";
import { listCommand } from "./list";
import { updateCommand } from "./update";

export const datastreamRoutes = buildRouteMap({
  routes: {
    create: createCommand,
    view: viewCommand,
    list: listCommand,
    update: updateCommand,
  },
  docs: {
    brief: "Manage datastreams",
    fullDescription: [
      "Create, read, update, and list datastreams in Observe.",
      "",
      "Commands:",
      "  create   Create a new datastream",
      "  view     View a datastream by ID",
      "  list     List datastreams",
      "  update   Update a datastream",
    ].join("\n"),
  },
});
