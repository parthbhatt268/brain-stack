/**
 * STUB — URL analysis API.
 *
 * Replace `analyseUrl` with a real fetch() call once the backend is ready.
 * The real endpoint should accept { url } and return the shape below.
 * See assumptions.md for full details.
 */

function detectSource(url) {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    const map = {
      'youtube.com':   'youtube',
      'youtu.be':      'youtube',
      'github.com':    'github',
      'instagram.com': 'instagram',
      'tiktok.com':    'tiktok',
      'reddit.com':    'reddit',
      'linkedin.com':  'linkedin',
    };
    return map[host] || 'article';
  } catch {
    return 'article';
  }
}

/**
 * Fake ~900 ms round-trip, then return hardcoded classification.
 *
 * @param {string} url
 * @returns {Promise<{ category, subcategory, source, summary, origin }>}
 */
export async function analyseUrl(url) {
  await new Promise(r => setTimeout(r, 900));

  // HARDCODED: always classifies as AI / LLM & Prompting.
  // Real backend would use an LLM or classifier to determine this.
  return {
    category:    'ai',
    subcategory: 'LLM & Prompting',
    source:      detectSource(url),
    summary:
      'Content saved from the provided URL. A full AI-generated summary will appear here once the classification backend is connected.',
    origin: 'added',
  };
}
