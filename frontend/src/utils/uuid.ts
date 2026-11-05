/**
 * Safely generates an RFC4122 version 4 compliant UUID string.
 *
 * In secure contexts (HTTPS or localhost), this delegates to `crypto.randomUUID()`.
 * In insecure contexts (e.g. HTTP over LAN IP), `crypto.randomUUID` is undefined in modern browsers.
 * In such cases, this function falls back to a standard UUID v4 generation algorithm using `Math.random()`.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback RFC4122 version 4 UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

