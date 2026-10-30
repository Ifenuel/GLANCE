/**
 * Turn a stored media reference into a playable, privacy-friendly embed URL.
 *
 * The gallery stores either a provider id (YouTube) or a full share URL
 * (Instagram reels/IGTV, YouTube links). We resolve both to an inline player so
 * films and reels actually play on the page instead of showing a link card.
 */
export function videoEmbedSrc(item: {
  url: string;
  providerId: string | null;
}): string | null {
  // YouTube by provider id (set when the item is saved as a YouTube video).
  // iv_load_policy=3 suppresses YouTube's own annotation overlays, so the
  // film stays a film in the gallery instead of drawing click-out cards.
  if (item.providerId) {
    return `https://www.youtube-nocookie.com/embed/${item.providerId}?rel=0&modestbranding=1&iv_load_policy=3`;
  }

  const url = item.url.trim();

  // Instagram reel / post / IGTV share links embed as an inline player.
  const ig = url.match(
    /instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i,
  );
  if (ig) {
    return `https://www.instagram.com/reel/${ig[1]}/embed`;
  }

  // A bare YouTube share link without a stored provider id.
  const yt = url.match(
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/i,
  );
  if (yt) {
    return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1&iv_load_policy=3`;
  }

  return null;
}
