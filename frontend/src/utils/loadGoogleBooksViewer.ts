/**
 * Google Embedded Viewer requires google.books.load() + setOnLoadCallback
 * before constructing DefaultViewer. See:
 * https://developers.google.com/books/docs/viewer/developers_guide
 *
 * books.load() should run once per page lifecycle; we cache the ready promise.
 */
let booksViewerApiReady: Promise<void> | null = null;

export function ensureGoogleBooksViewerApi(): Promise<void> {
  if (booksViewerApiReady) return booksViewerApiReady;

  booksViewerApiReady = new Promise((resolve) => {
    const finish = () =>
      typeof queueMicrotask === 'function'
        ? queueMicrotask(() => resolve())
        : void Promise.resolve().then(() => resolve());

    const tryAttach = () => {
      const w = window as Window & { google?: { books?: Record<string, unknown> } };
      const books = w.google?.books;
      if (!books) return false;

      try {
        if (typeof books.setOnLoadCallback === 'function' && typeof books.load === 'function') {
          // Match Google's hello-world order: load() first, then setOnLoadCallback (developers_guide).
          (books.load as () => void)();
          (books.setOnLoadCallback as (cb: () => void) => void)(finish);
          return true;
        }
      } catch {
        // fall through
      }

      if (typeof books.DefaultViewer === 'function') {
        finish();
        return true;
      }

      return false;
    };

    if (tryAttach()) return;

    let attempts = 0;
    const maxAttempts = 100;
    const id = window.setInterval(() => {
      attempts += 1;
      if (tryAttach()) {
        window.clearInterval(id);
      } else if (attempts >= maxAttempts) {
        window.clearInterval(id);
        finish();
      }
    }, 100);
  });

  return booksViewerApiReady;
}

/**
 * Hosted embed URL (iframe). Often works when the JavaScript DefaultViewer API fails
 * (CORS, third-party cookies, embed restrictions on the JS API, React lifecycle).
 */
export function googleBooksEmbedIframeSrc(volumeId: string): string {
  const id = encodeURIComponent(volumeId.trim());
  return `https://books.google.com/books?id=${id}&printsec=frontcover&output=embed`;
}

/** Preview URL form — documented as a valid Embedded Viewer load identifier. */
export function googleBooksPreviewUrlIdentifier(volumeId: string): string {
  const id = encodeURIComponent(volumeId.trim());
  return `https://books.google.com/books?id=${id}&printsec=frontcover`;
}

/**
 * Build load identifier(s): volume id and/or ISBN forms, plus preview URL when useful.
 * Passing an array lets the viewer succeed if any identifier is embeddable (Google docs).
 */
export function googleBooksLoadIdentifiers(volumeId: string): string | string[] {
  const v = volumeId.trim();
  if (!v) return v;
  const isbn10 = /^\d{9}[\dXx]$/;
  const isbn13 = /^\d{13}$/;
  const previewUrl = googleBooksPreviewUrlIdentifier(v);
  if (isbn10.test(v) || isbn13.test(v)) {
    return [`ISBN:${v}`, v, previewUrl];
  }
  return [v, previewUrl];
}
