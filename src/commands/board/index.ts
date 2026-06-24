import { buildRouteMap } from "@stricli/core";
import { createCommand } from "./create";
import { updateCommand } from "./update";
import { scaffoldCommand } from "./scaffold";
import { setDefaultCommand } from "./set-default";
import { clearDefaultCommand } from "./clear-default";
import { listCommand } from "./list";
import { getCommand } from "./get";
import { deleteCommand } from "./delete";

export const boardRoutes = buildRouteMap({
  routes: {
    create: createCommand,
    update: updateCommand,
    scaffold: scaffoldCommand,
    "set-default": setDefaultCommand,
    "clear-default": clearDefaultCommand,
    list: listCommand,
    get: getCommand,
    delete: deleteCommand,
  },
  docs: {
    brief: "Manage boards (dashboards)",
    fullDescription: [
      "Create, update, scaffold, list, get, delete, and set/clear defaults for",
      "boards (dashboards) in Observe.",
      "",
      "Commands:",
      "  create         Create a board from a JSON file",
      "  update         Update a board from a JSON file",
      "  scaffold       Print a starting board JSON template",
      "  set-default    Set the default board for a dataset",
      "  clear-default  Clear the default board for a dataset",
      "  list           List boards (dashboards)",
      "  get            Get a board by ID",
      "  delete         Delete a board by ID",
    ].join("\n"),
  },
});
