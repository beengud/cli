import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { parse } from "graphql";
import type { Config } from "../../lib/config";
import { executeGraphQL } from "../gql-request";

// Hand-authored GraphQL operations; mirror gqlSetDefaultDashboard and
// gqlClearDefaultDashboard in the Go fork (cmd_board.go).
interface ResultStatus {
  success: boolean | null;
  errorMessage: string | null;
}

interface SetDefaultResult {
  setDefaultDashboard: ResultStatus;
}

interface SetDefaultVariables {
  dsid: string;
  dashid: string;
}

const SetDefaultDashboardDocument = parse(`
  mutation Board_SetDefault($dsid: ObjectId!, $dashid: ObjectId!) {
    setDefaultDashboard(dsid: $dsid, dashid: $dashid) {
      success
      errorMessage
    }
  }
`) as unknown as TypedDocumentNode<SetDefaultResult, SetDefaultVariables>;

interface ClearDefaultResult {
  clearDefaultDashboard: ResultStatus;
}

interface ClearDefaultVariables {
  dsid: string;
}

const ClearDefaultDashboardDocument = parse(`
  mutation Board_ClearDefault($dsid: ObjectId!) {
    clearDefaultDashboard(dsid: $dsid) {
      success
      errorMessage
    }
  }
`) as unknown as TypedDocumentNode<ClearDefaultResult, ClearDefaultVariables>;

export async function setDefaultDashboard(
  config: Config,
  { dsid, dashid }: { dsid: string; dashid: string },
) {
  const response = await executeGraphQL(config, SetDefaultDashboardDocument, {
    dsid,
    dashid,
  });
  return response.data.setDefaultDashboard;
}

export async function clearDefaultDashboard(config: Config, dsid: string) {
  const response = await executeGraphQL(config, ClearDefaultDashboardDocument, {
    dsid,
  });
  return response.data.clearDefaultDashboard;
}
