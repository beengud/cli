import { buildApplication } from "@stricli/core";
import { name } from "../package.json";
import { alertRoutes } from "./commands/alert/index.js";
// TEMP: trimmed pending full Observe schema access (introspection disabled). Restore when schema available.
// The committed src/gql/generated/graphql.ts snapshot only contains the three
// OPAL operations (CheckQueries, ValidateIngestFilter, VerbsAndFunctions); the
// generated Document constants and result types for every other upstream
// operation are absent and cannot be regenerated (the tenant has GraphQL
// introspection disabled). Every route below whose command modules statically
// import a missing generated GraphQL export therefore fails to load, so they
// are trimmed until schema access is restored and `bun codegen:gql` can run.
//   GraphQL-broken: auth (logout->delete-authtoken), metric, query, content,
//   ingest-token, datastream, datastream-token.
//   Schema-type-broken (skill/tag/datasource/data-connection): as before.
// import { dataConnectionRoutes } from "./commands/data-connection/index.js";
// import { datasourceRoutes } from "./commands/datasource/index.js";
// import { datastreamTokenRoutes } from "./commands/datastream-token/index.js";
// import { authRoutes } from "./commands/auth/index.js";
import { cliRoutes } from "./commands/cli/index.js";
// import { contentRoutes } from "./commands/content/index.js";
import { datasetRoutes } from "./commands/dataset/index.js";
// import { datastreamRoutes } from "./commands/datastream/index.js";
import { helpCommand } from "./commands/help.js";
// import { ingestTokenRoutes } from "./commands/ingest-token/index.js";
// import { metricRoutes } from "./commands/metric/index.js";
// import { queryCommand } from "./commands/query.js";
// import { skillRoutes } from "./commands/skill/index.js";
// import { tagKeyRoutes } from "./commands/tag-key/index.js";
// import { tagValueRoutes } from "./commands/tag-value/index.js";
import { boardRoutes } from "./commands/board/index.js";
import { folderRoutes } from "./commands/folder/index.js";
import { opalRoutes } from "./commands/opal/index.js";
import { fleetRoutes } from "./commands/fleet/index.js";
import { schemaRoutes } from "./commands/schema/index.js";
import { worksheetRoutes } from "./commands/worksheet/index.js";
import { CURRENT_CLI_VERSION } from "./lib/constants.js";
import { defineRoutes } from "./lib/stricli-wrappers.js";

/** Top-level route map containing all CLI commands */
export const routes = defineRoutes({
  routes: {
    help: helpCommand,
    // TEMP: trimmed pending full Observe schema access (introspection disabled). Restore when schema available.
    // auth: authRoutes,
    // "tag-value": tagValueRoutes,
    // "tag-key": tagKeyRoutes,
    dataset: datasetRoutes,
    // metric: metricRoutes,
    // query: queryCommand,
    // skill: skillRoutes,
    alert: alertRoutes,
    // content: contentRoutes,
    // "ingest-token": ingestTokenRoutes,
    // datasource: datasourceRoutes,
    // "data-connection": dataConnectionRoutes,
    // datastream: datastreamRoutes,
    // "datastream-token": datastreamTokenRoutes,
    board: boardRoutes,
    folder: folderRoutes,
    opal: opalRoutes,
    fleet: fleetRoutes,
    schema: schemaRoutes,
    worksheet: worksheetRoutes,
    cli: cliRoutes,
  },
  defaultCommand: "help",
  docs: {
    brief: "Observe CLI",
    fullDescription:
      "observe is a command-line interface for interacting with Observe Inc. " +
      "It provides commands for configuration, querying datasets, and more.",
  },
});

export const app = buildApplication(routes, {
  name,
  versionInfo: {
    currentVersion: CURRENT_CLI_VERSION,
  },
  scanner: {
    caseStyle: "allow-kebab-for-camel",
  },
});
