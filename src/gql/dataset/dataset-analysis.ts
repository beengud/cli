import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { parse } from "graphql";
import type { Config } from "../../lib/config";
import { executeGraphQL } from "../gql-request";

// Hand-authored GraphQL operations for `dataset dry-run` and `dataset impact`,
// ported from the Go fork (cmd_dataset.go).
//
// IMPORTANT — NOT verified against the current tenant. Both operations have
// drifted vs the Go fork's schema: `saveDatasetDryRun` no longer exists as a
// Mutation field (only `saveDataset` remains, with no dryRun argument), and
// `getDatasetsAffectedByDatasetUpdate` still exists but its result type
// `DatasetsAffectedByDatasetUpdateResult` no longer exposes the
// `affectedDatasets`/`errorDatasets` selections used below. The new field
// names could not be recovered because GraphQL introspection is disabled on
// the tenant. These are kept faithful to the Go fork so they work on tenants
// that still expose the legacy schema (and as a starting point once
// introspection is restored). See task: "Restore schema-blocked functionality".

type DatasetInput = Record<string, unknown>;
type MultiStageQueryInput = Record<string, unknown>;

interface DatasetRef {
  id: string | null;
  name: string | null;
}

interface ErrorDataset {
  dataset: DatasetRef | null;
  errorText: string | null;
}

interface DryRunResult {
  saveDatasetDryRun: {
    dataset: DatasetRef | null;
    dematerializedDatasets: DatasetRef[] | null;
    errorDatasets: ErrorDataset[] | null;
  };
}

interface DatasetAnalysisVariables {
  workspaceId: string;
  dataset: DatasetInput;
  query: MultiStageQueryInput;
}

const DryRunDocument = parse(`
  mutation SaveDatasetDryRun($workspaceId: ObjectId!, $dataset: DatasetInput!, $query: MultiStageQueryInput!) {
    saveDatasetDryRun(workspaceId: $workspaceId, dataset: $dataset, query: $query) {
      dataset { id name }
      dematerializedDatasets { id name }
      errorDatasets { dataset { id name } errorText }
    }
  }
`) as unknown as TypedDocumentNode<DryRunResult, DatasetAnalysisVariables>;

interface AffectedDataset {
  dataset: DatasetRef | null;
  dependencyType: string | null;
}

interface ImpactResult {
  getDatasetsAffectedByDatasetUpdate: {
    affectedDatasets: AffectedDataset[] | null;
    errorDatasets: ErrorDataset[] | null;
  };
}

const ImpactDocument = parse(`
  query DatasetsAffectedByUpdate($workspaceId: ObjectId!, $dataset: DatasetInput!, $query: MultiStageQueryInput) {
    getDatasetsAffectedByDatasetUpdate(workspaceId: $workspaceId, dataset: $dataset, query: $query) {
      affectedDatasets { dataset { id name } dependencyType }
      errorDatasets { dataset { id name } errorText }
    }
  }
`) as unknown as TypedDocumentNode<ImpactResult, DatasetAnalysisVariables>;

export async function datasetDryRun(
  config: Config,
  variables: DatasetAnalysisVariables,
) {
  const response = await executeGraphQL(config, DryRunDocument, variables);
  return response.data.saveDatasetDryRun;
}

export async function datasetImpact(
  config: Config,
  variables: DatasetAnalysisVariables,
) {
  const response = await executeGraphQL(config, ImpactDocument, variables);
  return response.data.getDatasetsAffectedByDatasetUpdate;
}
