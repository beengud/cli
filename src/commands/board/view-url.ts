import { getApiBaseUrl, type Config } from "../../lib/config";

/**
 * Returns the Observe UI URL for viewing a dashboard. Mirrors boardViewURL in
 * the Go fork (cmd_board.go).
 *
 * Pattern: https://{customerId}.{domain}/workspace/{workspaceId}/dashboard/{boardId}
 * The UI also accepts a name-slug prefix (e.g. My-Board-43102612) but the bare
 * ID works too.
 */
export function boardViewURL(
  config: Config,
  workspaceId: string,
  boardId: string,
): string {
  const base = getApiBaseUrl(config);
  return `${base}/workspace/${workspaceId}/dashboard/${boardId}`;
}
