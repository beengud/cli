import { buildRouteMap } from "@stricli/core";
import { dotCommand } from "./dot";
import { rbacGroupRoutes } from "./group/index";
import { rbacStatementRoutes } from "./statement/index";

export const rbacRoutes = buildRouteMap({
  routes: {
    group: rbacGroupRoutes,
    statement: rbacStatementRoutes,
    dot: dotCommand,
  },
  docs: {
    brief: "Read RBAC groups, statements, and relationship graphs",
    fullDescription: [
      "Read-only access to Role-Based Access Control (RBAC) data, plus",
      "GraphViz DOT visualizations of the relationships between users,",
      "groups, and statements.",
      "",
      "Commands:",
      "  group       Read RBAC groups and their members",
      "  statement   Read RBAC statements",
      "  dot         Output a GraphViz DOT graph of RBAC relationships",
    ].join("\n"),
  },
});
