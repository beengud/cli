import { buildRouteMap } from "@stricli/core";
import { listCommand } from "./list";

export const rbacStatementRoutes = buildRouteMap({
  routes: {
    list: listCommand,
  },
  docs: {
    brief: "Read RBAC statements",
    fullDescription: [
      "Read-only access to RBAC statements.",
      "",
      "Commands:",
      "  list   List RBAC statements",
    ].join("\n"),
  },
});
