import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { validateIngestFilter } from "../../gql/opal/validate-ingest-filter";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

interface ValidateIngestFlags {
  dataset: string;
}

export interface ValidateIngestDeps {
  loadConfig?: typeof loadConfig;
  validateIngestFilter?: typeof validateIngestFilter;
}

export async function validateIngest(
  this: LocalContext,
  flags: ValidateIngestFlags,
  pipeline: string,
  deps: ValidateIngestDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    validateIngestFilter: validateIngestFilterImpl = validateIngestFilter,
  } = deps;
  const { process, writer } = this;

  try {
    const config = loadConfigImpl();
    const result = await validateIngestFilterImpl(config, {
      pipeline,
      sourceDatasetID: flags.dataset,
    });

    // A null result means valid. A non-empty array means errors.
    const diagnostics = result ?? [];
    if (diagnostics.length > 0) {
      for (const d of diagnostics) {
        writer.write(`ERROR: ${d.message}`);
      }
      process.exit(1);
      return;
    }

    writer.write("OK");
  } catch (error) {
    if (error instanceof GqlApiError) {
      writer.error(`API Error (${error.statusCode}): ${error.message}`);
    } else {
      const message = error instanceof Error ? error.message : String(error);
      writer.error(`Error: ${message}`);
    }
    process.exit(1);
  }
}

export const validateIngestCommand = buildCommand({
  loader: async () => validateIngest,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "OPAL ingest filter expression to validate",
          parse: String,
        },
      ],
    },
    flags: {
      dataset: {
        kind: "parsed",
        parse: String,
        brief: "Source dataset ID to validate the ingest filter against",
      },
    },
  },
  docs: {
    brief: "Validate an OPAL ingest filter expression",
    fullDescription: [
      "Validate an OPAL ingest filter expression against a source dataset",
      "via the validateIngestFilterExpression API.",
      "",
      "On error, prints each as 'ERROR: message' and exits 1.",
      "On success, prints 'OK'.",
      "",
      "Example:",
      "  observe opal validate-ingest --dataset 42918275 'filter true'",
    ].join("\n"),
  },
});
