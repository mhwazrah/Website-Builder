/**
 * Origin of the NestJS API/asset server.
 *
 * In local dev the app is served by the Angular dev-server on :4200 while the
 * backend (API + `/uploads`) runs on :3000, so we talk to it directly at
 * `http://localhost:3000` (CORS is enabled server-side). This needs NO proxy
 * and NO dev-server restart — uploaded images load immediately.
 *
 * In production the app and backend are served from the same origin, so we use
 * relative paths (empty origin). We detect dev purely by the :4200 port to
 * avoid hardcoding the backend host anywhere it shouldn't be.
 */
const DEV_SERVER =
  typeof location !== 'undefined' &&
  (location.port === '4200' || location.port === '4201');

export const SERVER_ORIGIN = DEV_SERVER ? 'http://localhost:3000' : '';

/** Base URL for the JSON API. */
export const API_BASE = `${SERVER_ORIGIN}/api`;

/**
 * Resolve a server path (e.g. an uploaded logo `/uploads/x.png`) to a URL the
 * browser can load. Absolute URLs pass through; otherwise the path is prefixed
 * with {@link SERVER_ORIGIN} (the backend in dev, same-origin in prod).
 */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SERVER_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}
