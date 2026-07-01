import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";

// Mirrors boardScaffoldTemplate in the Go fork (cmd_board.go). Prints a minimal
// valid board JSON template; makes no API calls.
function scaffoldTemplate(name: string) {
  return {
    name,
    workspaceId: "YOUR_WORKSPACE_ID",
    visibility: "Listed",
    layout: {
      autoPack: true,
      gridLayout: {
        sections: [
          {
            card: {
              title: "Section",
              closed: false,
              cardType: "section",
            },
            items: [
              {
                card: {
                  stageId: "stage-abc123",
                  cardType: "stage",
                },
                layout: { h: 12, w: 12, x: 0, y: 0 },
              },
            ],
          },
        ],
      },
      stageListLayout: {
        timeRange: {
          display: "Past 24 hours",
          millisFromCurrentTime: 86400000,
          timeRangeInfo: {
            key: "PRESETS",
            name: "Presets",
            presetType: "PAST_24_HOURS",
          },
        },
        isModified: false,
        parameters: [],
      },
    },
    stages: [
      {
        stageID: "stage-abc123",
        pipeline: "limit 100",
        input: [
          {
            inputName: "main",
            datasetId: "YOUR_DATASET_ID",
          },
        ],
      },
    ],
  };
}

interface ScaffoldFlags {
  name?: string;
}

async function scaffold(
  this: LocalContext,
  flags: ScaffoldFlags,
): Promise<void> {
  const { writer } = this;
  const template = scaffoldTemplate(flags.name ?? "My Dashboard");
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
    brief: "Print a minimal board (dashboard) JSON template",
  },
});
