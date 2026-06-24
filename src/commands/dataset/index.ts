import { buildRouteMap } from "@stricli/core";
import { dryRunCommand } from "./dry-run";
import { impactCommand } from "./impact";
import { listCommand } from "./list";
import { viewCommand } from "./view";

export const datasetRoutes = buildRouteMap({
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
      "  dry-run  Dry-run saving a dataset pipeline (nothing is persisted)",
      "  impact   Show downstream datasets affected by saving a dataset pipeline",
    ].join("\n"),
  },
});
