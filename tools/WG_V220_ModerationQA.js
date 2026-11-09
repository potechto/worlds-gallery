'use strict';
// OFFLINE STATIC GATE ONLY: SQL preview is not applied or database-executed.
// Security assertions guard accidental loosening of planned policies.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const project = process.argv[2] || path.join(__dirname, '..');
const sqlFile = process.argv[3] || path.join(__dirname, 'wg_v220_moderation_preview.sql');
const source = fs.readFileSync(sqlFile, 'utf8');
const stripped = source.replace(/--[^\n]*/g, '').trim();
const app = fs.readFileSync(path.join(project, 'app.js'), 'utf8');
const index = fs.readFileSync(path.join(project, 'index.html'), 'utf8');
let count = 0;
function check(label, fn) { fn(); count += 1; console.log('PASS:', label); }
const tableNames = [
 'wg_publication_submissions','wg_publication_submission_photos',
 'wg_gallery_stories','wg_gallery_photos','wg_content_reports','wg_moderation_events'
];
function tableDefinition(name) {
 const start = stripped.indexOf(`CREATE TABLE public.${name} (`);
 assert(start >= 0, `Missing table: ${name}`);
 const end = stripped.indexOf('\n);', start);
 assert(end > start, `Incomplete table ${name}`);
 return stripped.slice(start, end + 3);
}
function policy(name) {
 const m = stripped.match(new RegExp(`CREATE POLICY ${name}\\s+ON public\\.\\w+ FOR SELECT TO [^;]+;`, 'i'));
 assert(m, `Missing or unsafe SELECT policy: ${name}`);
 return m[0];
}
check('explicit transaction defaults to ROLLBACK, never COMMIT', () => {
 assert.match(stripped, /^BEGIN\s*;/);
 assert.match(stripped, /ROLLBACK\s*;$/);
 assert.doesNotMatch(stripped, /\bCOMMIT\s*;/i);
});
check('six isolated moderation/gallery tables', () => {
 assert.equal((stripped.match(/CREATE TABLE public\./g)||[]).length, 6);
 for (const name of tableNames) tableDefinition(name);
});
check('every new table has RLS enabled', () => {
 for (const name of tableNames) assert(stripped.includes(`ALTER TABLE public.${name} ENABLE ROW LEVEL SECURITY;`));
});
check('no client write grants or write policies', () => {
 assert.doesNotMatch(stripped, /GRANT\s+(?:INSERT|UPDATE|DELETE|ALL)\b[^;]*\bTO\s+(?:anon|authenticated)\b/i);
 assert.doesNotMatch(stripped, /CREATE POLICY\s+\w+[^;]*\bFOR\s+(?:INSERT|UPDATE|DELETE|ALL)\b/i);
});
check('explicit revocation on all new tables before narrow grants', () => {
 for (const name of tableNames) {
  assert(stripped.includes(`REVOKE ALL ON public.${name} FROM PUBLIC, anon, authenticated;`));
 }
});
check('private submissions readable only by authenticated owners', () => {
 assert.match(policy('wg_submission_owner_read'), /TO authenticated\s+USING\s*\(owner_id\s*=\s*\(SELECT auth\.uid\(\)\)\)/);
 assert(stripped.includes('GRANT SELECT ON public.wg_publication_submissions TO authenticated;'));
 assert(!stripped.includes('GRANT SELECT ON public.wg_publication_submissions TO anon'));
});
check('private submission photo references are owner-scoped', () => {
 assert.match(policy('wg_submission_photo_owner_read'), /s\.owner_id = \(SELECT auth\.uid\(\)\)/);
});
check('gallery rows must be explicitly approved before public read', () => {
 const gallery = tableDefinition('wg_gallery_stories');
 assert.match(gallery, /status text NOT NULL DEFAULT 'staged'/);
 assert.match(gallery, /status <> 'published' OR published_at IS NOT NULL/);
 assert.match(policy('wg_gallery_only_published_read'), /USING \(status = 'published'\)/);
 assert(stripped.includes('GRANT SELECT ON public.wg_gallery_stories TO anon, authenticated;'));
});
check('gallery photo references are server-only (V2.21 tightened)', () => {
 assert(!stripped.includes('GRANT SELECT ON public.wg_gallery_photos TO anon'));
 assert(!stripped.includes('GRANT SELECT ON public.wg_gallery_photos TO authenticated'));
 assert.doesNotMatch(stripped, /CREATE POLICY\s+\w+\s+ON public\.wg_gallery_photos/i);
 assert(stripped.includes('GRANT ALL ON public.wg_gallery_photos TO service_role;'));
});
check('public gallery tables contain no owner UUID, Storage path or GPS metadata', () => {
 for (const name of ['wg_gallery_stories','wg_gallery_photos']) {
  const body = tableDefinition(name);
  assert.doesNotMatch(body, /\bowner_id\b|\buser_id\b|\bstorage_path\b|\bgps\b|\bexif\b|latitude|longitude/i);
 }
});
check('submitted media references remain private and 1–4 position-scoped', () => {
 for(const name of ['wg_publication_submission_photos','wg_gallery_photos']) {
  const body = tableDefinition(name);
  assert.match(body, /source_photo_id uuid NOT NULL REFERENCES public\.wg_story_photos\(id\)/);
  assert.match(body, /CHECK \(position BETWEEN 0 AND 3\)/);
 }
});
check('author attestations and claimed-reviewer tracking are present', () => {
 const submission = tableDefinition('wg_publication_submissions');
 for(const name of ['rights_attested','consent_attested','privacy_attested'])
  assert(submission.includes(`${name} boolean NOT NULL CHECK (${name} IS TRUE)`));
 assert.match(submission, /reviewer_id uuid REFERENCES auth\.users\(id\)/);
 assert.match(submission, /claimed_at timestamptz/);
});
check('reports are service-only writes with reporter-private reads', () => {
 assert.match(policy('wg_reports_owner_read'), /reporter_id = \(SELECT auth\.uid\(\)\)/);
 assert(!stripped.includes('GRANT INSERT ON public.wg_content_reports TO authenticated;'));
});
check('moderation audit events have no client-facing SELECT policy', () => {
 assert.doesNotMatch(stripped, /CREATE POLICY\s+\w+\s+ON public\.wg_moderation_events/i);
 assert(!stripped.includes('GRANT SELECT ON public.wg_moderation_events TO'));
});
check('existing private draft/storage entities are never mutated', () => {
 assert.doesNotMatch(stripped, /\b(?:ALTER|UPDATE|DELETE FROM|DROP|TRUNCATE)\s+(?:TABLE\s+)?(?:public\.)?wg_(?:stories|story_photos)\b/i);
 assert.doesNotMatch(stripped, /\b(?:INSERT|UPDATE|DELETE FROM|DROP|ALTER)\s+(?:INTO\s+|TABLE\s+)?storage\./i);
 assert.doesNotMatch(stripped, /\b(?:CREATE|ALTER)\s+POLICY\b[^;]+\bON storage\.objects/i);
});
check('no security-definer functions, new bucket, credentials or active publishing call', () => {
 assert.doesNotMatch(stripped, /SECURITY DEFINER|service_role\s*=|sb_secret_|create_bucket/i);
 assert.match(app, /WG_V219_REVIEW_BEGIN/);
 assert.match(app, /still private/i);
 assert.doesNotMatch(app, /\.from\(['"]wg_gallery_stories['"]\)/i);
 assert.doesNotMatch(index, /wg-publication-workflow/i);
});
console.log(JSON.stringify({version:'V2.20',offlineSchemaChecksPassed:count,liveSchemaChanged:false,publicPublishingEnabled:false},null,2));
