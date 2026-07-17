import { defineCommand } from "../../lib/stricli-wrappers";
import type { LocalContext } from "../../context";
import { verbsAndFunctions } from "../../gql/opal/verbs-and-functions";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

async function functions(this: LocalContext): Promise<void> {
  const { process, writer } = this;

  try {
    const config = loadConfig();
    const { functions: funcList } = await verbsAndFunctions(config);

    const sorted = [...funcList].sort((a, b) => a.name.localeCompare(b.name));
    for (const f of sorted) {
      // Tab-separated: name, categories (comma-joined), returnType, description.
      writer.write(
        `${f.name}\t${f.categories.join(",")}\t${f.returnType}\t${f.description}`,
      );
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

export const functionsCommand = defineCommand({
  loader: async () => functions,
  parameters: { positional: { kind: "tuple", parameters: [] }, flags: {} },
  docs: {
    brief:
      "List all OPAL functions (name, categories, return type, description)",
  },
});
