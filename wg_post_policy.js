/* Worlds Gallery V2.23.3 combined: client posting policy and link warnings.
 * This is NOT a security boundary. Repeat and strengthen checks in trusted
 * server/database code before the public publishing feature is enabled.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WorldsGalleryPostPolicy = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const MATCHES = [
    // Common and unusual URL schemes, including attempts to use dangerous schemes.
    /(?:^|[^\p{L}\p{N}])(?:[a-z][a-z0-9+.-]{1,30}):\s*(?:\/\/|\\\\)/iu,
    /(?:^|[^\p{L}\p{N}])(?:https?|hxxps?|ftp|ftps|file|javascript|data|blob|ipfs|magnet|mailto|tel|sms|intent|discord|tg|whatsapp|viber):\s*\S+/iu,
    /(?:^|[^\p{L}\p{N}])(?:www|ww2|m)\s*\.\s*[\p{L}\p{N}-]+/iu,
    // Domains including country TLDs, uncommon TLDs and IDNs.
    /(?:^|[^\p{L}\p{N}_.@-])(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?\.)+[\p{L}]{2,63}(?=$|[^\p{L}\p{N}-])/iu,
    // E-mail and direct IPv4/IPv6 destinations are not allowed in story text.
    /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+/iu,
    /(?:^|[^\d])(?:\d{1,3}\.){3}\d{1,3}(?=$|[^\d])/u,
    /\[(?:[a-f0-9]{0,4}:){2,}[a-f0-9:]*\](?::\d{1,5})?/iu,
    // Markdown links and HTML link / image tags, even when partially malformed.
    /\]\s*\(\s*(?:\w+[+.-]*:|\/\/|www\.)/iu,
    /<\s*(?:a|iframe|img|script)\b[^>]*\b(?:href|src)\s*=/iu,
    /\b(?:href|src)\s*=\s*["']?\s*(?:\w+[+.-]*:|\/\/)/iu,
    // External URLs pasted as protocol-relative links.
    /(?:^|\s)\/\/[\p{L}\p{N}-]+(?:\.|\/)/iu
  ];
  const COMMON_TLDS = '(?:com|net|org|ph|io|co|gov|edu|mil|uk|us|au|nz|ca|de|fr|jp|kr|in|cn|ru|me|tv|app|dev|xyz|online|store|site|info|biz|ai|gg|ly|to|cc|link|click|travel|shop|cloud|live|social|video|news|world|blog|tech|page|space)';
  function normalizeForSafety(input) {
    let text = String(input ?? '').normalize('NFKC')
      .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/gu, '')
      .replace(/[\u3002\uFF0E\uFF61\u2024\u2219\u00B7]/gu, '.')
      .replace(/&#(?:x2e|46);?|&period;/giu, '.')
      .replace(/\s*(?:\[\s*(?:dot|\.)\s*\]|\(\s*(?:dot|\.)\s*\)|\{\s*(?:dot|\.)\s*\})\s*/giu, '.')
      .replace(/\b(hxxps?)\s*:\s*\/\//giu, '$1://');
    // Decode percent escapes only to detect disguised links, never to render or save.
    for (let i = 0; i < 2 && /%[0-9a-f]{2}/iu.test(text); i++) {
      try { text = decodeURIComponent(text); } catch { break; }
    }
    // Detect common spaced-out domains without treating normal sentence punctuation as a link.
    text = text.replace(new RegExp('([\\p{L}\\p{N}-]{2,})\\s*\\.\\s*(' + COMMON_TLDS + ')(?=$|[^\\p{L}\\p{N}-])', 'giu'), '$1.$2');
    text = text.replace(new RegExp('([\\p{L}\\p{N}-]{2,})\\s+dot\\s+(' + COMMON_TLDS + ')(?=$|[^\\p{L}\\p{N}-])', 'giu'), '$1.$2');
    return text;
  }
  function containsProhibitedLink(input) {
    const normalized = normalizeForSafety(input);
    return MATCHES.some(re => re.test(normalized));
  }
  function findPolicyIssue(fields) {
    const data = fields || {};
    for (const name of ['description', 'title', 'author', 'region', 'city']) {
      if (containsProhibitedLink(data[name])) {
        return { field: name, message: 'Links, domains, invitations and contact links are not allowed in posts. Remove them from the ' + (name === 'description' ? 'story description' : name) + ' before continuing.' };
      }
    }
    return null;
  }
  return Object.freeze({ normalizeForSafety, containsProhibitedLink, findPolicyIssue });
});
