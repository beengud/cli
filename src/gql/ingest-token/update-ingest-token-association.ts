import type { Config } from "../../lib/config";
import {
  UpdateIngestTokenAssociationDocument,
  type UpdateIngestTokenAssociationMutationVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export async function updateIngestTokenAssociation(
  config: Config,
  variables: UpdateIngestTokenAssociationMutationVariables,
): Promise<boolean> {
  const response = await executeGraphQL(
    config,
    UpdateIngestTokenAssociationDocument,
    variables,
  );
  return response.data.updateIngestTokenAssociation.success;
}
