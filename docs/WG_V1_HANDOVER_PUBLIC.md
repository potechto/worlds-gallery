<!-- WG_V1_PUBLIC_HANDOVER_REV_20261111 -->
# Worlds Gallery V1 — Public Development Handover

Snapshot: November 11, 2026. This is a **public-safe project summary**, not the complete private handover. Keep personal details, private history, private source photo paths, backup archives, account credentials, user uploads, and the private master **outside this public repository**.

## Project and current status

Worlds Gallery is a photo-first explorer of the Earth, countries, and places, built around original photographs and personal stories. Public beta: https://potechto.github.io/worlds-gallery/ . GitHub: https://github.com/potechto/worlds-gallery .

The public site from `main` supports immersive world exploration, country discovery and highlights, cinematic authentication, owner-only photo-story uploads, reading/filtering, album features, profile/settings and support surfaces. Newer local-only UI changes and private project checkpoints have not been merged. **Real cross-user publishing is not active on the live site. V1 is NOT complete.**

The active development branch is `develop/worlds-gallery-v1-community` with **Draft Pull Request #1**: https://github.com/potechto/worlds-gallery/pull/1 . It is not merged or deployed. Do not merge it into `main` without explicit release approval.

## Established V1 requirements

1. **Community objective:** approved public posts from one member should be discoverable by other members and guests. Never automatically turn existing private content public; the owner must explicitly request publication.
2. **Owner controls:** a vertical three-dot menu similar to familiar social posts, with Edit, Make Private / Hide and Delete for the owner's posts. A public edit must be reviewed before publication; removing visibility should work immediately.
3. **Safe publication:** photo rights, informed consent, minors' safeguards, content screening, independent human moderation, reviewed immutable story/media snapshot and clear status.
4. **Private storage by default:** upload 1–4 photos to private storage; validate type/size; decode, re-encode approved photos to WebP without EXIF or other identifying metadata; make only sanitized, sealed and reviewed media available through an opaque-token broker. Hide/private/delete must immediately revoke broker access.
5. **Administration:** user-facing `@worldsgallery` controls Edit/Hide/Delete, with server-verified Auth UUID and server-owned active staff role; a username, user metadata or client-provided role never grants authorization. Moderator and admin roles remain separate; reviewer cannot approve their own submission/revision. Record audit reasons and support report/takedown procedures.
6. **Preserve working experiences:** interactive globe and country boundaries, location discovery, world clock, cinematic signup/login, transitions, gallery filters, photo lightbox, private album/cover/page-flipping, account menu, localization/voice, support/feedback with cooldown, accessibility and responsive layout.
7. **Safety:** limit exposure of personally identifying locations/contact details; prevent scams, stolen media, exploitation, harassment, threats, and harmful or sexualized minors' content. Provide report, review and takedown paths.

## Completed development (not live)

- `wg_v1_public_contract.mjs` and `tests/wg_v1_public_contract.test.mjs`: published-only public response allowlist, safe opaque media tokens, strict stage endpoint rules and tests.
- `supabase/review-only/WG_V1_CommunityDB.sql`: **REVIEW-ONLY SQL draft** for public-post state, independent staff approval, sealed media mapping, audit logs and server-only owner/admin actions. NOT deployed and NOT an approved production migration.
- `tests/sql/wg_v1_schema_test.sql` and `tests/sql/wg_v1_community_integrity.sql`: real, isolated PostgreSQL 17 security tests for guest/owner isolation, publish denial, reviewer/admin distinctions and revocation.
- `.github/workflows/worlds-gallery-v1.yml`: automated Node and temporary PostgreSQL integration checks; successful run #13 (both jobs passed).
- `docs/V1_RELEASE_GATE.md`: release checklist and blockers.
- Earlier local-only work includes V2.24.9 UI stabilization, V2.25.0 image processing preparation, V2.25.1 gateway mock contracts, V2.25.2 schema bridge, V2.25.3 authentication layout, V2.25.4 interactive synthetic community preview, V2.25.5 read-only audit with 185 offline test passes. Those local fixes may be newer than GitHub `main`.

## Remaining work before any real release

Complete atomic username registration and partial signup recovery; provision an isolated and approved Supabase Auth/Storage/Edge test environment without unapproved costs; reconcile migrations, grants and RLS in actual Supabase; build the authenticated upload/review/publication gateway, image sanitizer and broker, revision/report queues and actual community UI; test with different real accounts (A/B, guest, reviewer, admin), browser, mobile, race/withdrawal and security cases; then obtain explicit approval for production database changes and any `main` merge/deployment. Do not confuse offline or PostgreSQL contract tests with finished Supabase end-to-end validation.

## Workflow and handover rules

User-preferred tooling: **GitHub + Supabase + VS Code**, with minimum steps and no Docker requirement on the user's computer. For specifically requested local handover/backup/patch work, provide **one complete PowerShell 5.1 file and one VS Code terminal command**. Keep the chronological private master and dated recoverable ZIP files outside the public repo. The full private handover is in the separately supplied private backup; it must not be pushed to public GitHub.

**Release gates:** no unapproved force push, no `main` merge, no production Supabase schema/role/storage change, no mass-publication of private posts, no deletion of user content, and no staging charges without separate authorization.

## Resume point

Read the **private** handover from the owner, this public summary, and the latest Draft PR #1 before coding. Preserve all existing designs, stories, albums and personal backups. Next priority is real authenticated publication/review and user/admin actions, not another mock presented as live. Verify actual status before claiming "V1 DONE."
