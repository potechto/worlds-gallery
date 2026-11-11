# Worlds Gallery - Public Beta Checkpoint (2026-11-11)

This sanitized file records the website's PUBLIC project state. The full private handover, internal experiments, user records, and credentials are NOT included in the repository.

## Current frontend

- Most recent feature version: V2.24.5, with member-only My Album entry points in both the account menu and Album API.
- The globe, private story drafts, profiles, Mood Compass, browser-local Mosaic, scrapbook album, and feedback interface are active beta features. Real browser and cross-account acceptance tests remain necessary.
- My Album and Mosaic currently use browser-local storage, not private cross-device cloud synchronization. Shared browser profiles cannot be treated as a secure private vault.
- Public story publishing and trusted production moderation are NOT enabled. The prior offline moderation experiments are excluded from the current public Git tree.
- Original uploaded stories/photos are subject to Supabase owner-based RLS and a private photo Storage bucket. Verify real two-account and guest access before declaring the site secure.

## Security and privacy posture

- The current public tree deliberately excludes the internal master handover, obsolete standalone preview, private development notes, and offline moderation mock modules.
- Supabase authenticated TRUNCATE/TRIGGER/REFERENCES grants were revoked on five public data tables and read/write operations remained allowed subject to owner RLS (verified in the live project in November 2026). This operational fix is not represented by an applied Git SQL migration.
- Git history still contains older documentation and may expose previously committed author metadata. It has NOT been rewritten; GitHub history cleanup would be a separate, reviewed action.
- Supabase security adviser still reports leaked-password protection disabled. Two service-owned tables deliberately have RLS enabled and no client policies; do not add public policies without reviewing server access patterns.
- Pattern scans did not discover obvious committed privileged keys in sampled frontend and old handover materials, but scanning alone cannot establish absence of secrets or full application security.
- Sensitive API keys, database exports, and personally identifiable user content must never be committed. See SECURITY.md for private vulnerability reporting.

## Remaining engineering focus

1. Auth/guest and account isolation testing; avatar saving/reloading and support email/cooldown verification.
2. GitHub historic privacy exposure review and Supabase Auth leaked-password protection.
3. Owner-secured cloud backup/sync for My Album and Mosaic (NOT implemented).
4. Trusted backend public-submission review, media safety and moderation (NOT deployed).
5. Homepage design, globe geographic/language/voice refinements, mobile/accessibility QA, image licensing, and optional integrated GIF search.
6. Future concepts: The Daily Window; Seven Days, Seven Worlds; video uploads deferred pending cost, privacy and moderation assessment.

Public source is inspectable by design. Public code is NOT an authorization boundary.