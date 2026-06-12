import type { Config } from "../../lib/config";
import {
  GetCloudInfoDocument,
  type GetCloudInfoQuery,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlCloudInfo = NonNullable<
  GetCloudInfoQuery["currentCustomer"]
>["cloudInfo"];

/**
 * Fetch the Observe-side AWS cloud info (account ID, region) for the current
 * customer. Returns null when the request was unauthenticated; callers needing
 * the value (e.g. building a CloudFormation trust policy) should treat null as
 * a hard error.
 */
export async function getCloudInfo(
  config: Config,
): Promise<GqlCloudInfo | null> {
  const response = await executeGraphQL(config, GetCloudInfoDocument, {});
  return response.data.currentCustomer?.cloudInfo ?? null;
}
