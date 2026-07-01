import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { verbsAndFunctions } from "../../gql/opal/verbs-and-functions";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

async function verbs(this: LocalContext): Promise<void> {
  const { process, writer } = this;

  try {
    const config = loadConfig();
    const { verbs: verbList } = await verbsAndFunctions(config);

    const sorted = [...verbList].sort((a, b) => a.name.localeCompare(b.name));
    for (const v of sorted) {
      // Tab-separated: name, categories (comma-joined), description.
      writer.write(`${v.name}\t${v.categories.join(",")}\t${v.description}`);
    }
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

export const verbsCommand = buildCommand({
  loader: async () => verbs,
  parameters: { positional: { kind: "tuple", parameters: [] }, flags: {} },
  docs: {
    brief: "List all OPAL verbs (name, categories, description)",
  },
});
