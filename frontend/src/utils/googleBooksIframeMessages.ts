/**
 * Best-effort: Google Books embed iframes may postMessage to the parent.
 * This is undocumented; we only use clearly numeric hints to avoid junk.
 */
function extractFromObject(o: Record<string, unknown>): number | null {
  const keys = ['pageNumber', 'page', 'currentPage', 'pg', 'pp', 'pageIndex', 'pn', 'n'];
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return Math.floor(v);
    if (typeof v === 'string' && /^\d+$/.test(v.trim())) return parseInt(v.trim(), 10);
  }
  return null;
}

export function extractGoogleBooksEmbedPageHint(data: unknown): number | null {
  if (typeof data === 'number' && Number.isFinite(data) && data >= 0) return Math.floor(data);
  if (typeof data === 'string') {
    const t = data.trim();
    if (/^\d+$/.test(t)) return parseInt(t, 10);
    try {
      const j = JSON.parse(t) as Record<string, unknown>;
      const fromRoot = extractFromObject(j);
      if (fromRoot != null) return fromRoot;
      if (typeof j.data === 'object' && j.data !== null) {
        return extractFromObject(j.data as Record<string, unknown>);
      }
    } catch {
      const m = t.match(/(?:page|pg|pp)[=:]\s*(\d+)/i);
      if (m) return parseInt(m[1], 10);
    }
  }
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return extractFromObject(data as Record<string, unknown>);
  }
  return null;
}

export function isLikelyGoogleBooksOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    return u.hostname === 'books.google.com' || u.hostname.endsWith('.google.com');
  } catch {
    return false;
  }
}
