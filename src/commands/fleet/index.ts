import { defineRoutes } from "../../lib/stricli-wrappers";
import {
  authCommand,
  hostCommand,
  statusCommand,
  versionsCommand,
} from "./fleet";

export const fleetRoutes = defineRoutes({
  routes: {
    status: statusCommand,
    host: hostCommand,
    versions: versionsCommand,
    auth: authCommand,
  },
  docs: {
    brief: "Query observe-agent fleet status",
    fullDescription: [
      "Query the status of observe-agent instances from the fleet events",
      'dataset ("Default.Observe Agent/Events").',
      "",
      "Commands:",
      "  status     Current status of all agents",
      "  host       Details for a single host",
      "  versions   Agent versions across the fleet",
      "  auth       Agent auth-check status across the fleet",
      "",
      "All commands accept --window <duration> (default 20m).",
    ].join("\n"),
  },
});
