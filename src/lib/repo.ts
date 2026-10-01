export const REPO_URL = "https://github.com/LordEisenfaust/is-it-worth-it";

/** Link to the build's commit on GitHub, or null when the hash is not a real commit (e.g. "dev"). */
export function commitUrl(hash: string): string | null {
  return /^[0-9a-f]{7,40}$/.test(hash) ? `${REPO_URL}/commit/${hash}` : null;
}
