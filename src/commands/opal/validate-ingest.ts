import { defineCommand } from "../../lib/stricli-wrappers";
import type { LocalContext } from "../../context";
import { validateIngestFilter } from "../../gql/opal/validate-ingest-filter";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

interface ValidateIngestFlags {
  dataset: string;
}

async function validateIngest(
  this: LocalContext,
  flags: ValidateIngestFlags,
  pipeline: string,
): Promise<void> {
  const { process, writer } = this;

  try {
    const config = loadConfig();
    const diags = await validateIngestFilter(config, {
      pipeline,
      sourceDatasetID: flags.dataset,
    });

    // A non-empty array means errors; an empty array means valid.
    let hasErrors = false;
    for (const d of diags) {
      writer.write(`ERROR: ${d.message}`);
      hasErrors = true;
    }

    if (hasErrors) {
      writer.error("Error: opal validate-ingest: pipeline has errors");
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

export const validateIngestCommand = defineCommand({
  loader: async () => validateIngest,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "OPAL ingest filter expression",
          parse: String,
        },
      ],
    },
    flags: {
      dataset: {
        kind: "parsed",
        parse: String,
        brief: "Source dataset ID to validate the filter against",
        optional: false,
      },
    },
  },
  docs: {
    brief: "Validate an OPAL ingest filter expression against a dataset",
  },
});
