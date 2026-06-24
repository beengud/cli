import { buildRouteMap } from "@stricli/core";
import { introspectCommand } from "./introspect";

export const schemaRoutes = buildRouteMap({
  routes: {
    introspect: introspectCommand,
  },
  docs: {
    brief: "Inspect the Observe GraphQL API schema",
    fullDescription: [
      "Inspect the Observe GraphQL API schema via introspection.",
      "",
      "Commands:",
      "  introspect   Run a GraphQL introspection query and print the schema",
    ].join("\n"),
  },
});
