import {
  // TEMP: trimmed — SkillsApi and V2KnowledgeGraphApi are not exposed by the
  // target tenant's OpenAPI spec (109601619518), so the regenerated
  // src/rest/generated client does not contain them. This is a tenant limitation,
  // not a codegen one: restoring skill/tag-key/tag-value needs those endpoints
  // enabled on the tenant (or a spec that includes them).
  // SkillsApi,
  // V2KnowledgeGraphApi,
  AlertApi,
  APMApi,
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
  public monitorMuteApi: MonitorMuteApi;
  public monitorApi: MonitorApi;
  public documentationApi: DocumentationApi;
  // TEMP: trimmed — not in the tenant OpenAPI spec (see import note above).
  // public knowledgeGraphApi: V2KnowledgeGraphApi;
  // public skillsApi: SkillsApi;

  constructor(_config: Config) {
    const config = createApiConfiguration(_config);

    this.exportApi = new ExportApi(config);
    this.datasetApi = new DatasetApi(config);
    this.alertApi = new AlertApi(config);
    this.apmApi = new APMApi(config);
    this.monitorMuteApi = new MonitorMuteApi(config);
    this.monitorApi = new MonitorApi(config);
    this.documentationApi = new DocumentationApi(config);
    // TEMP: trimmed — not in the tenant OpenAPI spec (see import note above).
    // this.knowledgeGraphApi = new V2KnowledgeGraphApi(config);
    // this.skillsApi = new SkillsApi(config);
  }
}
