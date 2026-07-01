import { defineRoutes } from "../../lib/stricli-wrappers";
import { introspectCommand } from "./introspect";

export const schemaRoutes = defineRoutes({
  routes: {
    introspect: introspectCommand,
  },
  docs: {
    brief: "Inspect the Observe GraphQL API schema",
    fullDescription: [
      "Inspect the Observe GraphQL API schema.",
      "",
      "Commands:",
      "  introspect   Dump the full schema (or one --type) as JSON",
      "",
      "Note: requires GraphQL introspection to be enabled on the tenant.",
    ].join("\n"),
  },
});
