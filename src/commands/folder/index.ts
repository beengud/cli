import { defineRoutes } from "../../lib/stricli-wrappers";
import { createCommand } from "./create";
import { getCommand } from "./get";
import { updateCommand } from "./update";
import { deleteCommand } from "./delete";

export const folderRoutes = defineRoutes({
  routes: {
    create: createCommand,
    get: getCommand,
    update: updateCommand,
    delete: deleteCommand,
  },
  docs: {
    brief: "Manage folders (the grouping unit for boards/worksheets)",
    fullDescription: [
      "Create, look up, update, or delete folders. A folder groups boards",
      "(dashboards) and worksheets within a single workspace.",
      "",
      "Commands:",
      "  create   Create a folder (use --ensure to make it idempotent)",
      "  get      Look up a folder by name and print its ID",
      "  update   Update a folder's name, description, or icon URL",
      "  delete   Delete a folder by ID",
    ].join("\n"),
  },
});
