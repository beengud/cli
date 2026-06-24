import { buildRouteMap } from "@stricli/core";
import { listCommand } from "./list";
import { getCommand } from "./get";
import { previewQueryCommand } from "./preview-query";
import { previewCommand } from "./preview";
import { alarmsCommand } from "./alarms";

export const monitorRoutes = buildRouteMap({
  routes: {
    list: listCommand,
    get: getCommand,
    "preview-query": previewQueryCommand,
    preview: previewCommand,
    alarms: alarmsCommand,
  },
  docs: {
    brief: "Query Monitor V2 resources",
    fullDescription: [
      "Query Monitor V2 resources in Observe.",
      "",
      "Commands:",
      "  list           List monitors (optionally filtered by name substring)",
      "  get            Get a monitor by ID, including its definition",
      "  preview-query  Compile a monitor input into its OPAL pipeline",
      "  preview        Preview whether a monitor would fire against recent data",
      "  alarms         Search monitor alarms",
    ].join("\n"),
  },
});
