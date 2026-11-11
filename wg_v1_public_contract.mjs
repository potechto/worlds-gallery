// Worlds Gallery V1: public-only client contract. Never use this for authorization.
export const LIVE_PROJECT_REF = 'xmhnmosrwlqxwiizywsa';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROJECT = /^[a-z0-9]{20}$/;
const COUNTRY = /^[A-Z]{2}$/;
export const isUuid = value => typeof value === 'string' && UUID.test(value);

function clean(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}
export function stagingGateway(config, currentOrigin) {
  if (!config || config.enabled !== true) throw new Error('Community preview is not enabled.');
  const ref = config.projectRef;
  if (typeof ref !== 'string' || !PROJECT.test(ref) || ref === LIVE_PROJECT_REF) {
    throw new Error('Separate staging project required.');
  }
  if (typeof config.siteOrigin !== 'string' || config.siteOrigin !== currentOrigin ||
      !/^https:\/\/[a-z0-9.-]+$/i.test(config.siteOrigin)) {
    throw new Error('Stage origin not approved.');
  }
  if (typeof config.gatewayUrl !== 'string') throw new Error('Stage API missing.');
  const url = new URL(config.gatewayUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      url.hostname !== ref + '.supabase.co' ||
      url.pathname !== '/functions/v1/wg-community') {
    throw new Error('Stage API host or path not approved.');
  }
  return url;
}
export function normalizePublicCard(row) {
  if (!row || typeof row !== 'object' || row.status !== 'published' || !isUuid(row.id)) return null;
  const tokens = row.media_tokens;
  if (!Array.isArray(tokens) || tokens.length < 1 || tokens.length > 4 ||
      !tokens.every(isUuid) || new Set(tokens).size !== tokens.length) return null;
  const title = clean(row.title, 120), body = clean(row.body, 15000),
    author = clean(row.author, 60), countryName = clean(row.country_name, 100),
    countryCode = clean(row.country_code, 2), theme = clean(row.theme, 64);
  if (!title || body.length < 1000 || !author || !COUNTRY.test(countryCode) || !countryName || !theme) return null;
  if (typeof row.created_at !== 'string' || !Number.isFinite(Date.parse(row.created_at))) return null;
  // Explicit allowlist: never copy owner UID, email, city/region, raw paths, or credentials.
  return {id:row.id, title, body, author, countryName, countryCode, theme,
    createdAt:row.created_at, mediaTokens:[...tokens]};
}
export function parsePublicFeed(payload) {
  if (!payload || !Array.isArray(payload.items) || payload.items.length > 20) throw new Error('Invalid public feed.');
  return payload.items.map(normalizePublicCard).filter(Boolean);
}
export function publicMediaURL(gateway, token) {
  if (!(gateway instanceof URL) || !isUuid(token) ||
      gateway.pathname !== '/functions/v1/wg-community') throw new Error('Invalid public media request.');
  return gateway.origin + '/functions/v1/wg-community/media/' + token.toLowerCase();
}
