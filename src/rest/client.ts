import {
  // TEMP: trimmed — the skill/tag/tag-value/metric commands stay disabled in this
  // build. The tenant spec (109601619518, 1.0.230307) now exposes Skills, Tags,
  // TagValues and Metrics, so the regenerated src/rest/generated client has them;
  // restoring the commands is a separate change. ExternalSharesApi (inbound-share)
  // is still absent from the tenant spec.
  // SkillsApi,
  // V2KnowledgeGraphApi,
  // TagsApi,
  // TagValuesApi,
  // ExternalSharesApi,
  // MetricsApi — upstream (#44) wired a REST metric-list backend, but the metric
  // command is gql-backed and trimmed on this tenant, so MetricsApi stays out
  // from this build. Restore alongside the metric command.
  AlertApi,
  APMApi,
  DashboardsApi,
  DatasetApi,
  DocumentationApi,
  ExportApi,
  MonitorMuteApi,
  MonitorApi,
} from "./generated";
import type { Config } from "../lib/config";
import { createApiConfiguration } from "./api-config";

export class ObserveRestSDK {
  public exportApi: ExportApi;
  public datasetApi: DatasetApi;
  public alertApi: AlertApi;
  public apmApi: APMApi;
  public dashboardsApi: DashboardsApi;
  public monitorMuteApi: MonitorMuteApi;
  public monitorApi: MonitorApi;
  public documentationApi: DocumentationApi;
  // TEMP: trimmed — disabled in this build (see import note above).
  // public metricsApi: MetricsApi;
  // public tagsApi: TagsApi;
  // public tagValuesApi: TagValuesApi;
  // public knowledgeGraphApi: V2KnowledgeGraphApi;
  // public skillsApi: SkillsApi;
  // public externalSharesApi: ExternalSharesApi;

  constructor(_config: Config) {
    const config = createApiConfiguration(_config);

    this.exportApi = new ExportApi(config);
    this.datasetApi = new DatasetApi(config);
    this.alertApi = new AlertApi(config);
    this.apmApi = new APMApi(config);
    this.dashboardsApi = new DashboardsApi(config);
    this.monitorMuteApi = new MonitorMuteApi(config);
    this.monitorApi = new MonitorApi(config);
    this.documentationApi = new DocumentationApi(config);
    // TEMP: trimmed — disabled in this build (see import note above).
    // this.metricsApi = new MetricsApi(config);
    // this.tagsApi = new TagsApi(config);
    // this.tagValuesApi = new TagValuesApi(config);
    // this.knowledgeGraphApi = new V2KnowledgeGraphApi(config);
    // this.skillsApi = new SkillsApi(config);
    // this.externalSharesApi = new ExternalSharesApi(config);
  }
}
