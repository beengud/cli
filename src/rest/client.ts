import {
  // TEMP: trimmed — the metric and inbound-share commands stay disabled in this
  // build. ExternalSharesApi (inbound-share) is absent from the tenant spec
  // (109601619518, 1.0.230307). MetricsApi — upstream (#44) wired a REST
  // metric-list backend, but the metric command is gql-backed and trimmed on
  // this tenant, so MetricsApi stays out of this build. Restore alongside the
  // metric command. Skills, Tags and TagValues are in the tenant spec and their
  // commands are live (HAT-1265).
  // V2KnowledgeGraphApi,
  // ExternalSharesApi,
  // MetricsApi,
  AlertApi,
  APMApi,
  DashboardsApi,
  DatasetApi,
  DocumentationApi,
  ExportApi,
  MonitorMuteApi,
  MonitorApi,
  SkillsApi,
  TagsApi,
  TagValuesApi,
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
  public tagsApi: TagsApi;
  public tagValuesApi: TagValuesApi;
  public skillsApi: SkillsApi;
  // TEMP: trimmed — disabled in this build (see import note above).
  // public metricsApi: MetricsApi;
  // public knowledgeGraphApi: V2KnowledgeGraphApi;
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
    this.tagsApi = new TagsApi(config);
    this.tagValuesApi = new TagValuesApi(config);
    this.skillsApi = new SkillsApi(config);
    // TEMP: trimmed — disabled in this build (see import note above).
    // this.metricsApi = new MetricsApi(config);
    // this.knowledgeGraphApi = new V2KnowledgeGraphApi(config);
    // this.externalSharesApi = new ExternalSharesApi(config);
  }
}
