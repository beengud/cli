import { buildRouteMap } from "@stricli/core";
import { getCommand } from "./get";
import { listCommand } from "./list";

export const rbacGroupRoutes = buildRouteMap({
  routes: {
    list: listCommand,
    get: getCommand,
  },
  docs: {
    brief: "Read RBAC groups and their members",
    fullDescription: [
      "Read-only access to RBAC groups.",
      "",
      "Commands:",
      "  list   List RBAC groups",
      "  get    Get an RBAC group by ID (optionally with members)",
    ].join("\n"),
  },
});
