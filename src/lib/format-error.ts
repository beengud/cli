import { GqlApiError } from "../gql/gql-request";
import { ResponseError } from "../rest/generated/runtime";

/**
 * Format an unknown error thrown from the GraphQL or REST clients into a
 * human-friendly message suitable for display in the CLI.
 *
 * For REST `ResponseError`s, this consumes the response body and tries to
 * extract a `message`/`error` field from JSON payloads, falling back to the
 * raw body text and finally to the HTTP status line. Without this, the
 * generated client only surfaces "Response returned an error code".
 */
export async function formatApiError(error: unknown): Promise<string> {
  if (error instanceof ResponseError) {
    const { status, statusText } = error.response;
    const detail = await readResponseErrorBody(error.response);
    const statusLine = `HTTP ${status}${statusText ? ` ${statusText}` : ""}`;
    return detail ? `${statusLine}: ${detail}` : statusLine;
  }

  if (error instanceof GqlApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function readResponseErrorBody(response: Response): Promise<string> {
  let body: string;
  try {
    body = await response.clone().text();
  } catch {
    return "";
  }
  const trimmed = body.trim();
  if (!trimmed) return "";

  try {
    const parsed: unknown = JSON.parse(trimmed);
    const extracted = extractMessage(parsed);
    if (extracted) return extracted;
    return trimmed;
  } catch {
    return trimmed;
  }
}

function extractMessage(payload: unknown): string | undefined {
  if (payload == null || typeof payload !== "object") return undefined;
  const obj = payload as Record<string, unknown>;

  for (const key of ["message", "error", "detail", "description"]) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  if (Array.isArray(obj.errors)) {
    const messages = obj.errors
      .map((e) => (typeof e === "string" ? e : extractMessage(e)))
      .filter((m): m is string => Boolean(m));
    if (messages.length > 0) return messages.join("; ");
  }

  return undefined;
}
