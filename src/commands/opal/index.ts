import { buildRouteMap } from "@stricli/core";
import { checkCommand } from "./check";
import { verbsCommand } from "./verbs";
import { functionsCommand } from "./functions";
import { validateIngestCommand } from "./validate-ingest";

export const opalRoutes = buildRouteMap({
  routes: {
    check: checkCommand,
    verbs: verbsCommand,
    functions: functionsCommand,
    "validate-ingest": validateIngestCommand,
  },
  docs: {
    brief: "Validate and inspect OPAL pipelines and functions",
    fullDescription: [
      "Validate and inspect OPAL pipelines, verbs, and functions.",
      "",
      "Commands:",
      "  check            Validate an OPAL pipeline",
      "  verbs            List all OPAL verbs",
      "  functions        List all OPAL functions",
      "  validate-ingest  Validate an OPAL ingest filter expression",
    ].join("\n"),
  },
});
