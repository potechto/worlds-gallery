# Worlds Gallery V1 — implementation and release gate

Development branch: \`develop/worlds-gallery-v1-community\`. No production user data changes are authorized by this file.

## Current reality (2026-11-11)

- \`main\` serves an owner-only private upload gallery. It does **not** publish user content to everyone.
- Existing Supabase project \`xmhnmosrwlqxwiizywsa\` is **production** and must not be used as staging.
- \`wg_stories\` and \`wg_story_photos\` enforce owner-only RLS. Photos are in the private \`wg-private-photos\` bucket.
- Two profiles existed when inspected; no source story or photo rows existed in the inspected production tables.
- The V2.25.4 community controls are a synthetic, offline proof-of-concept, not connected to live permissions.
- A hosted Supabase branch needs separately approved cost; local Docker is explicitly out of the user workflow.

## Release principles

1. **Existing items stay private**. Do not backfill public state or expose private photo paths.
2. Only an explicit owner submission with photo rights/consent acknowledgments may start moderation.
3. Approved content is published from a reviewed immutable snapshot. Text edits require another independent review.
4. Only staff identified by verified Auth UID and server-owned role may moderate or administer. Client metadata/username cannot grant power.
5. Never expose \`service_role\`, secret keys, raw storage paths, precise home location or unpublished images in public endpoints.
6. Admin Hide/Delete immediately withdraw card and media visibility; audit retained. Owner may edit, make private, delete their own posts.
7. Reviews, reports, minors' safety, sensitive content, spam limits, takedown, and deletion retention need real end-to-end tests.
8. \`main\` merges and production DB/deploy operations need separate approval. A green mock unit test does not authorize release.

## GitHub + Supabase + VS Code implementation sequence

| Workstream | Acceptance test | Status |
|---|---|---|
| Public response contract | Sanitized, published-only, 1–4 opaque media tokens; no private fields | Added on development branch, CI required |
| Database/RLS isolation | PostgreSQL guest/owner B/A denied cases + photo vault denied | CI fixture added; production is untouched |
| Community schema & migrations | Reconciled working SQL on separate isolated Supabase database, reviewed permissions | Blocked: approved staging not yet available |
| Authentication | Username claim protected against concurrent signup; verified-session role | Pending |
| Upload pipeline | Private upload, server-side image sanitization, EXIF removal, human photo review | Pending real integration |
| Publication | Owner consent, review seal, snapshot release and revocation | Pending real integration |
| Member controls | Vertical 3-dot own Edit / Private / Hide / Delete with server permission | Preview only |
| Admin \`@worldsgallery\` | Verified server-side UID; Edit/Hide/Delete with audit | Preview only |
| Moderator/report queue | Independent reviews, report handling, image re-check | Preview only |
| Feed UI | Real multi-account cards, filters, reading, safe thumbnails | Pending live integration |
| My Album | Keep user scrapbook private and preserve animations | Existing local browser feature |
| Responsive / usability | Auth fit, menu, keyboard and touch checks | Local fixes V2.25.3; not deployed |
| Full account test | Guest, Owner A, Owner B, Moderator, Admin, wrong-origin, revoke race | Pending |
| Final release | User acceptance, Supabase security advisors, explicit merge/deploy authorization | Not authorized |

## Automated checks

\`\`\`sh
node --test tests/wg_v1_public_contract.test.mjs
\`\`\`

GitHub Actions workflow \`.github/workflows/worlds-gallery-v1.yml\` runs the Node contract and an isolated PostgreSQL 17 RLS suite (\`tests/sql/wg_v1_schema_test.sql\`). The PostgreSQL test creates only temporary objects inside a rollback transaction; it does not connect to Supabase production and does not prove Supabase-specific configuration.

## Operator boundaries

Use the connected GitHub and Supabase tools to inspect and implement. VS Code is optional. Do not require Docker or third-party services on the user's PC. Do not write into \`main\`, migrate production schemas, turn on public posting or charge for hosted staging without fresh explicit authorization.
