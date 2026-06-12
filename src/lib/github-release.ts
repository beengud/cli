/**
 * Thin wrapper around the GitHub Releases API for observeinc/cli.
 */

import { GITHUB_REPO, GITHUB_RELEASES_LATEST_URL } from "./constants";

const HEADERS = { Accept: "application/vnd.github+json" } as const;

export interface ReleaseAsset {
  name: string;
  digest: string | null;
  browser_download_url: string;
}

export interface ReleaseResponse {
  tag_name: string;
  html_url: string;
  assets: ReleaseAsset[];
}

export async function fetchReleaseByTag({
  tag,
  signal,
}: {
  tag: string;
  signal?: AbortSignal;
}) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/${encodeURIComponent(tag)}`;
  const response = await fetch(url, { headers: HEADERS, signal });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch release ${tag}: HTTP ${String(response.status)}`,
    );
  }

  return (await response.json()) as ReleaseResponse;
}

export async function fetchLatestRelease({
  signal,
}: { signal?: AbortSignal } = {}) {
  const response = await fetch(GITHUB_RELEASES_LATEST_URL, {
    headers: HEADERS,
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch latest release: HTTP ${String(response.status)}`,
    );
  }

  const data = (await response.json()) as ReleaseResponse;

  return {
    version: data.tag_name.replace(/^v/, ""),
    tag: data.tag_name,
    url: data.html_url,
  };
}
