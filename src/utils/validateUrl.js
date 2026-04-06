/**
 * Client-side URL validation — guards against obviously malicious or malformed input.
 *
 * This is NOT a substitute for server-side validation. The backend must re-run
 * equivalent checks before fetching any user-supplied URL (SSRF prevention).
 * See assumptions.md §2 for backend requirements.
 */

const MAX_URL_LENGTH = 2048;

// Hostnames that refer to the local machine or internal network.
// Submitting these could trigger SSRF once a real backend fetch is added.
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '0.0.0.0',
  '0',
  '[::1]',
  '::1',
]);

// Regex patterns for private/reserved IP ranges
const PRIVATE_IP_PATTERNS = [
  /^127\./,           // loopback
  /^10\./,            // RFC 1918
  /^192\.168\./,      // RFC 1918
  /^172\.(1[6-9]|2\d|3[01])\./,  // RFC 1918
  /^169\.254\./,      // link-local / AWS metadata
  /^100\.(6[4-9]|[7-9]\d|1([01]\d|2[0-7]))\./,  // RFC 6598 shared address
  /^fd[0-9a-f]{2}:/i, // IPv6 ULA
  /^fe80:/i,          // IPv6 link-local
];

/**
 * Validate a URL string for safe submission.
 *
 * @param {string} raw
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateUrl(raw) {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { ok: false, error: 'Paste a link before saving.' };
  }

  if (trimmed.length > MAX_URL_LENGTH) {
    return { ok: false, error: 'That URL is too long.' };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      ok: false,
      error: "That doesn't look like a valid URL — make sure it starts with https://",
    };
  }

  // Only HTTPS — blocks http://, file://, ftp://, javascript://, data://, etc.
  if (parsed.protocol !== 'https:') {
    return {
      ok: false,
      error: 'Only secure links (https://) are accepted.',
    };
  }

  // No embedded credentials (https://user:pass@domain.com)
  if (parsed.username || parsed.password) {
    return {
      ok: false,
      error: 'Links with embedded credentials are not allowed.',
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block known private/loopback hostnames
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { ok: false, error: 'That link points to an internal address and cannot be added.' };
  }

  // Block private IP ranges
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { ok: false, error: 'That link points to an internal address and cannot be added.' };
    }
  }

  return { ok: true };
}
