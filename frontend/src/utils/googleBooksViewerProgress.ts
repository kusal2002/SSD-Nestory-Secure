/**
 * Tracks progress inside Google Books Embedded DefaultViewer.
 * - Parsed page numbers when Google returns them (monotonic max).
 * - A visit stack of (pageId + label) handles spreads and detects Back
 *   so returning to an earlier page does not inflate the count.
 */

export type ViewerSegmentState = {
  preferNumeric: boolean;
  startNumeric: number | null;
  maxNumeric: number | null;
  visitStack: string[];
  initialized: boolean;
};

function fingerprint(pageId: string, pageLabel: string): string {
  return `${pageId}\n${pageLabel.trim() || '—'}`;
}

export function createEmptySegment(): ViewerSegmentState {
  return {
    preferNumeric: false,
    startNumeric: null,
    maxNumeric: null,
    visitStack: [],
    initialized: false,
  };
}

function parseViewerPageNumber(viewer: { getPageNumber?: () => string }): number | null {
  const raw = viewer.getPageNumber?.();
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  const direct = parseInt(s, 10);
  if (Number.isFinite(direct) && String(direct) === s) return direct;
  const m = s.match(/\d+/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  return Number.isFinite(n) ? n : null;
}

function updateVisitStack(segment: ViewerSegmentState, fp: string): number {
  const stack = segment.visitStack;
  if (stack.length === 0) {
    stack.push(fp);
    return 0;
  }
  const last = stack[stack.length - 1];
  if (fp === last) {
    return Math.max(0, stack.length - 1);
  }
  const idx = stack.lastIndexOf(fp);
  if (idx >= 0) {
    stack.splice(idx + 1);
    return Math.max(0, stack.length - 1);
  }
  stack.push(fp);
  return Math.max(0, stack.length - 1);
}

/**
 * Returns pages to log this segment (0 … maxPages), and updates segment in place.
 */
export function computePagesToAddFromViewer(
  viewer: {
    isLoaded?: () => boolean;
    getPageNumber?: () => string;
    getPageId?: () => string;
  },
  segment: ViewerSegmentState,
  maxPages: number
): { pagesToAdd: number; pageLabel: string } {
  const pageLabel = String(viewer.getPageNumber?.() ?? '');
  const pageId = String(viewer.getPageId?.() ?? '__unknown__');
  const hasPositionSignal =
    pageLabel.trim().length > 0 || (pageId.length > 0 && pageId !== '__unknown__');
  const loaded = viewer.isLoaded?.();
  // Some browsers report isLoaded() === false briefly while getPageNumber already updates.
  if (loaded === false && !hasPositionSignal) {
    return { pagesToAdd: 0, pageLabel: '' };
  }
  const fp = fingerprint(pageId, pageLabel);
  const n = parseViewerPageNumber(viewer);

  if (!segment.initialized) {
    segment.initialized = true;
    segment.visitStack = [fp];
    if (n !== null) {
      segment.preferNumeric = true;
      segment.startNumeric = n;
      segment.maxNumeric = n;
    } else {
      segment.preferNumeric = false;
      segment.startNumeric = null;
      segment.maxNumeric = null;
    }
    return { pagesToAdd: 0, pageLabel };
  }

  const stackDelta = updateVisitStack(segment, fp);

  if (!segment.preferNumeric && n !== null) {
    segment.preferNumeric = true;
    segment.startNumeric = n;
    segment.maxNumeric = n;
    return { pagesToAdd: Math.min(maxPages, stackDelta), pageLabel };
  }

  let numericDelta = 0;
  if (segment.preferNumeric && segment.startNumeric !== null) {
    if (n !== null) {
      segment.maxNumeric = Math.max(segment.maxNumeric ?? n, n);
    }
    const maxN = segment.maxNumeric ?? segment.startNumeric;
    numericDelta = Math.max(0, maxN - segment.startNumeric);
  }

  const combined = Math.max(numericDelta, stackDelta);
  return { pagesToAdd: Math.min(maxPages, combined), pageLabel };
}

export function resetSegmentFromViewer(viewer: {
  isLoaded?: () => boolean;
  getPageNumber?: () => string;
  getPageId?: () => string;
}): ViewerSegmentState {
  const next = createEmptySegment();
  const pageLabel = String(viewer.getPageNumber?.() ?? '');
  const pageId = String(viewer.getPageId?.() ?? '__unknown__');
  const hasPositionSignal =
    pageLabel.trim().length > 0 || (pageId.length > 0 && pageId !== '__unknown__');
  const loaded = viewer.isLoaded?.();
  if (loaded === false && !hasPositionSignal) {
    return next;
  }
  const fp = fingerprint(pageId, pageLabel);
  const n = parseViewerPageNumber(viewer);
  next.initialized = true;
  next.visitStack = [fp];
  if (n !== null) {
    next.preferNumeric = true;
    next.startNumeric = n;
    next.maxNumeric = n;
  }
  return next;
}
