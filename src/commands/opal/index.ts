import { defineRoutes } from "../../lib/stricli-wrappers";
import { checkCommand } from "./check";
import { verbsCommand } from "./verbs";
import { functionsCommand } from "./functions";
import { validateIngestCommand } from "./validate-ingest";

export const opalRoutes = defineRoutes({
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
      "  check            Validate an OPAL pipeline and print its result schema",
      "  verbs            List all OPAL verbs",
      "  functions        List all OPAL functions",
      "  validate-ingest  Validate an OPAL ingest filter against a dataset",
    ].join("\n"),
  },
});
