import { GqlApiError } from "../../gql/gql-request";

/**
 * Format an error thrown from the fleet query path into a display string.
 * Fleet talks only to the GraphQL query service, so we surface `GqlApiError`
 * with its HTTP status and fall back to the message for everything else.
 * (Unlike the shared `formatApiError`, this avoids the REST client so the
 * GraphQL-only fleet commands don't pull in generated REST runtime types.)
 */
export function formatFleetError(error: unknown): string {
  if (error instanceof GqlApiError) {
    return `API Error (${error.statusCode}): ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
