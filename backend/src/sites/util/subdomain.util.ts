/**
 * Subdomain helpers shared by SitesService and the check-subdomain endpoint.
 * Rules: lowercase English letters, digits, '-' and '.'; no spaces; cannot
 * start or end with '-' or '.'; length 2..63.
 */

/** Trim surrounding whitespace and lowercase the value. */
export function normalizeSubdomain(v: string): string {
  return (v ?? '').trim().toLowerCase();
}

/**
 * Validate a (already-normalized) subdomain against the URL-safe handle rules.
 * Matches `/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/` and enforces length 2..63.
 */
export function isValidSubdomain(v: string): boolean {
  if (typeof v !== 'string') {
    return false;
  }
  if (v.length < 2 || v.length > 63) {
    return false;
  }
  return /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(v);
}
