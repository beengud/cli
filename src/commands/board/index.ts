import { defineRoutes } from "../../lib/stricli-wrappers";
import { createCommand } from "./create";
import { updateCommand } from "./update";
import { getCommand } from "./get";
import { listCommand } from "./list";
import { deleteCommand } from "./delete";
import { scaffoldCommand } from "./scaffold";
import { clearDefaultCommand, setDefaultCommand } from "./set-default";

export const boardRoutes = defineRoutes({
  routes: {
    create: createCommand,
    update: updateCommand,
    get: getCommand,
    list: listCommand,
    delete: deleteCommand,
    scaffold: scaffoldCommand,
    "set-default": setDefaultCommand,
    "clear-default": clearDefaultCommand,
  },
  docs: {
    brief: "Manage boards (dashboards)",
    fullDescription: [
      "Create, update, read, list, delete, and scaffold boards (dashboards),",
      "and set or clear the default dashboard for a dataset.",
      "",
      "Commands:",
      "  create         Create a board from a JSON file",
      "  update         Update an existing board from a JSON file",
      "  get            Get a board by ID as JSON",
      "  list           List boards in a workspace",
      "  delete         Delete a board by ID",
      "  scaffold       Print a minimal board JSON template",
      "  set-default    Set the default dashboard for a dataset",
      "  clear-default  Clear the default dashboard for a dataset",
    ].join("\n"),
  },
});
