import { defineRoutes } from "../../lib/stricli-wrappers";
import { listCommand } from "./list";
import { viewCommand } from "./view";
import { dryRunCommand } from "./dry-run";
import { impactCommand } from "./impact";

export const datasetRoutes = defineRoutes({
  routes: {
    list: listCommand,
    view: viewCommand,
    "dry-run": dryRunCommand,
    impact: impactCommand,
  },
  docs: {
    brief: "View observe datasets",
    fullDescription: [
      "View and manage datasets in Observe",
      "",
      "Commands:",
      "  list     List datasets in Observe",
      "  view     View details of a dataset",
      "  dry-run  Dry-run a dataset pipeline change (unverified on this tenant)",
      "  impact   Report datasets affected by a change (unverified on this tenant)",
    ].join("\n"),
  },
});
