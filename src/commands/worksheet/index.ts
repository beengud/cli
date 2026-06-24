import { buildRouteMap } from "@stricli/core";
import { createCommand } from "./create";
import { deleteCommand } from "./delete";
import { getCommand } from "./get";
import { listCommand } from "./list";

export const worksheetRoutes = buildRouteMap({
  routes: {
    list: listCommand,
    get: getCommand,
    create: createCommand,
    delete: deleteCommand,
  },
  docs: {
    brief: "Manage worksheets",
    fullDescription: [
      "List, get, create, or delete worksheets in Observe.",
      "",
      "Commands:",
      "  list     List worksheets",
      "  get      Get a worksheet by ID (includes stages)",
      "  create   Create a worksheet from a JSON file",
      "  delete   Delete a worksheet by ID",
    ].join("\n"),
  },
});
