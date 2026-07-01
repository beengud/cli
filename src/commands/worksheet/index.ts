import { defineRoutes } from "../../lib/stricli-wrappers";
import { listCommand } from "./list";
import { getCommand } from "./get";
import { createCommand } from "./create";
import { deleteCommand } from "./delete";

export const worksheetRoutes = defineRoutes({
  routes: {
    list: listCommand,
    get: getCommand,
    create: createCommand,
    delete: deleteCommand,
  },
  docs: {
    brief: "Manage worksheets",
    fullDescription: [
      "List, read, create, and delete worksheets.",
      "",
      "Commands:",
      "  list     List worksheets in a workspace",
      "  get      Get a worksheet by ID as JSON",
      "  create   Create a worksheet from a JSON file",
      "  delete   Delete a worksheet by ID",
    ].join("\n"),
  },
});
