import type { Config } from "../../lib/config";
import {
  DeleteAuthtokenDocument,
  type DeleteAuthtokenMutationVariables,
} from "../generated/graphql";
import { executeGraphQL, GqlApiError } from "../gql-request";

/**
 * Delete an authtoken by ID.
 * Returns true if successful, false otherwise.
 */
export async function deleteAuthtoken(
  config: Config,
  variables: DeleteAuthtokenMutationVariables,
): Promise<boolean> {
  try {
    const response = await executeGraphQL(
      config,
      DeleteAuthtokenDocument,
      variables,
    );
    return response.data.deleteAuthtoken.success;
  } catch (error) {
    if (error instanceof GqlApiError) {
      return false;
    }
    throw error;
  }
}
