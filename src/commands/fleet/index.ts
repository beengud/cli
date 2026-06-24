import { buildRouteMap } from "@stricli/core";
import { statusCommand } from "./status";
import { hostCommand } from "./host";
import { versionsCommand } from "./versions";
import { authCommand } from "./auth";

export const fleetRoutes = buildRouteMap({
  routes: {
    status: statusCommand,
    host: hostCommand,
    versions: versionsCommand,
    auth: authCommand,
  },
  docs: {
    brief: "Query fleet status of observe-agent instances",
    fullDescription: [
      "Query the observe-agent fleet from the Default.Observe Agent/Events",
      "dataset. Each command runs an OPAL query over the AgentLifecycleEvent",
      "stream; use --window to set the lookback (Go duration, e.g. 20m, 24h,",
      "168h; default 20m).",
      "",
      "Commands:",
      "  status     Current agent inventory (newest first)",
      "  host       Event history for one host, incl. agent start time",
      "  versions   Version distribution across the fleet",
      "  auth       Auth-check status (failures first)",
    ].join("\n"),
  },
});
