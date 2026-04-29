/**
 * Spotify share/open URLs commonly support `t` as the start offset in milliseconds.
 * Applied to embed URLs so the iframe can resume near where the learner left off.
 */
export function withSpotifyEmbedResume(embedUrl: string, positionSeconds: number): string {
  if (!embedUrl.trim() || positionSeconds <= 0) return embedUrl;

  try {
    const u = new URL(embedUrl);
    u.searchParams.set("t", String(Math.floor(positionSeconds * 1000)));
    return u.toString();
  } catch {
    const sep = embedUrl.includes("?") ? "&" : "?";
    return `${embedUrl}${sep}t=${Math.floor(positionSeconds * 1000)}`;
  }
}
