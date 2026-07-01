import { getApiBaseUrl, type Config } from "../../lib/config";
import { observeApiHeaders } from "../../lib/user-agent";
import { Configuration, ExportApi } from "../generated";

/**
 * Run a single-stage OPAL pipeline against a dataset (by path or id) over a
 * time window and return the raw CSV body. Thin wrapper over the REST
 * /v1/meta/export/query endpoint (ExportApi). Used by `fleet`, mirroring
 * runFleetQuery in the Go fork (cmd_fleet.go).
 */
export async function runOpalQueryCsv(
  config: Config,
  {
    pipeline,
    datasetPath,
    datasetId,
    startTime,
    endTime,
  }: {
    pipeline: string;
    datasetPath?: string;
    datasetId?: string;
    startTime: string;
    endTime: string;
  },
): Promise<string> {
  // Build the ExportApi with `Accept: text/csv` baked into the configuration
  // headers. These are merged by the generated runtime (Object.assign over the
  // request init), unlike per-call `initOverrides` headers which REPLACE the
  // computed headers and would drop Authorization (yielding a 401).
  const restConfig = new Configuration({
    basePath: getApiBaseUrl(config),
    accessToken: async () => `${config.customerId} ${config.token}`,
    headers: observeApiHeaders({ Accept: "text/csv" }),
  });
  const exportApi = new ExportApi(restConfig);

  const csv = await exportApi.exportQuery({
    startTime,
    endTime,
    exportQueryRequest: {
      query: {
        outputStage: "query",
        stages: [
          {
            stageID: "query",
            pipeline,
            input: [
              {
                inputName: "_",
                ...(datasetId != null
                  ? { datasetId }
                  : { datasetPath: datasetPath ?? "" }),
              },
            ],
          },
        ],
      },
      presentation: { linkify: false },
    },
  });
  return csv ?? "";
}
