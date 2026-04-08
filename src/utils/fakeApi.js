/**
 * STUB — URL analysis API.
 *
 * Replace `analyseUrl` with a real fetch() call once the backend is ready.
 * The real endpoint should accept { url } and return the shape below.
 * See assumptions.md for full details.
 */

/**
 * Fake ~900 ms round-trip, then return hardcoded classification.
 *
 * @param {string} url
 * @returns {Promise<{ category, subcategory, summary, origin }>}
 *
 * Note: `source` (platform) is no longer returned — it is derived from the
 * URL by detectSource() wherever it is needed. The backend will do the same
 * derivation and store both url and source separately in the DB.
 */
export async function analyseUrl(url) {
  void url; // real backend will use this to classify content
  await new Promise(r => setTimeout(r, 900));

  // HARDCODED: always classifies as AI / LLM & Prompting.
  // Real backend would use an LLM or classifier to determine this.
  return {
    category:    'ai',
    subcategory: 'LLM & Prompting',
    summary:
      'Content saved from the provided URL. A full AI-generated summary will appear here once the classification backend is connected.',
    origin: 'added',
  };
}
