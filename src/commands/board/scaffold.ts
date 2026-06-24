import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { boardScaffoldTemplate } from "./board-input";

interface ScaffoldBoardFlags {
  name?: string;
}

export async function scaffold(
  this: LocalContext,
  flags: ScaffoldBoardFlags,
): Promise<void> {
  const { writer } = this;
  const template = boardScaffoldTemplate(flags.name ?? "My Dashboard");
  writer.write(JSON.stringify(template, null, 2));
}

export const scaffoldCommand = buildCommand({
  loader: async () => scaffold,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [],
    },
    flags: {
      name: {
        kind: "parsed",
        parse: String,
        brief: "Name to set on the scaffolded board",
        optional: true,
      },
    },
  },
  docs: {
    brief: "Print a starting board (dashboard) JSON template",
    fullDescription:
      "Print a DashboardInput JSON template suitable for 'observe board create'.\n\n" +
      "Example:\n" +
      '  observe board scaffold --name "My Dashboard" > board.json',
  },
});
