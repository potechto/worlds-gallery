# WORLDS GALLERY — FULL PROJECT HANDOVER

## SINGLE CANONICAL HANDOVER - LOCKED NOVEMBER 9, 2026

**ONE HANDOVER ONLY: WORLDS_GALLERY_HANDOVER_MASTER.md.**
Update this file in place. Never recreate the former Word export.
Historical DOCX instructions below are superseded.

Locked: VS Code PowerShell full commands; no Codex; no project backup folders;
no unapproved Git push or backend changes; MVP-first development.


<!-- WG_MIGRATION_20261109_BEGIN -->

## 0. LIVE CURRENT STATE - NOVEMBER 9, 2026 - V2.16

THIS SECTION OVERRIDES HISTORICAL STATUS STATEMENTS BELOW.
Older sections remain part of the development record. Do not treat V2.4.3 as the latest application version.

PROJECT: Worlds Gallery.
MISSION: A geography-based, photo-first world gallery for discovering places, publishing meaningful photographs and stories, and exploring reliable educational geography.
REPOSITORY: https://github.com/potechto/worlds-gallery
BRANCH: main.
DEVELOPMENT: Existing plain HTML/CSS/JavaScript application, VS Code integrated PowerShell, local HTTP server on port 5500.
BACKEND: Supabase project xmhnmosrwlqxwiizywsa.
CURRENT LOCAL UI: V2.16 login recovery with V2.15 support centering and V2.14 postal animation.
CURRENT DIRECTION: MVP FIRST.
LATEST APP CHECKPOINT: Must be established from Git after the requested handover push. Historical confirmed commits were f5a04e0 and b3f439f; do not assume either is the latest remote commit.
SOURCE OF TRUTH: Current Windows working tree, verified Git commit, and current Supabase deployment. Earlier uploaded ZIP snapshots may predate V2.16.

### 0.1 Critical migration instruction

This is a CONTINUATION, NOT A RESTART.
Never discard, redesign, or rebuild the project because the chat changed.
Read the entire master handover, inspect the current code and Git history, and preserve established UI and functional decisions.
Preserve earlier requirements even when deferred by MVP prioritization.
Distinguish historical plans, local implementations, actually tested features, live backend functions, and unverified functionality.
The summary is not a verbatim export of ChatGPT messages; the original source code and Git history provide additional detail.

### 0.2 Latest development chronology: November 8-9

V2.5:
Integrated private cloud drafts into the existing application.
Supabase tables public.wg_stories and public.wg_story_photos were created with owner-scoped RLS.
The existing private bucket wg-private-photos was reused with user-prefixed paths.
Draft uploads support one to four photos and collage options.
The frontend compresses/resizes images before upload.
Draft story body requires 1,000 to 15,000 characters in the latest UI.
A story draft belongs to its authenticated owner and is not publicly published.
Owner editing and deletion were added to the cloud-draft workflow.
Live cross-account isolation and full end-to-end upload verification remained pending.
Added language/voice preference-related fields to content preferences.
Do not recreate these tables just because a new chat starts.

V2.6:
Updated locale/language support, UI icons, view-state behavior, account integration, and support notification groundwork.
A support email notifier was initially deployed while the email sender configuration was pending.
The historical V2.6 email setup document describes that earlier state, not the latest state.

Later backend work:
Support notifications were connected to Resend.
wg-notify-support Edge Function version 6 was verified active.
The existing wg-guest-support function continues to handle guest intake.
Email formatting was refined to include highlighted field labels and authenticated profile identity.
Username and Display Name are obtained from verified profile data rather than arbitrary client-supplied identity fields.
Saving a ticket and delivering its email notification are distinct operations.
A saved ticket may still have a pending notification.
No real email, authentication secret, or service-role key should be placed in frontend files or Git.

V2.7:
Applied further support/account layout and administrative presentation changes.
The existing project source was incrementally patched rather than recreated.
Syntax checks passed, but those historical checks did not prove complete browser behavior.

V2.8:
Worked on UI and avatar/profile presentation refinements.
Additional CSS/JS assets were introduced.
Keep the existing account structure and approved appearance.

V2.9 and V2.9.1:
Experimented with more exact mailbox-slot and envelope movement, including faster and centered mailbox behavior.
Some experimental overlay implementations were not accepted as the final design.
Do not reactivate old overlay scripts merely because their files remain in the folder.

V2.10:
Added a separate mailbox/scene experiment.
This is historical work, not the current approved final animation.

V2.11:
Corrected the animation placement to use the EXISTING Support & Feedback account drawer.
No independent popup, duplicate support window, or second modal.
Older assets remain on disk but should not be blindly loaded or deleted.

V2.12:
A realistic postal rider concept was explored.
Do not assume this experimental ZIP was the final installed solution.

V2.13:
Refined the support flow.
The letter must visibly enter an envelope, the envelope must rotate edge-on, and then visibly enter the mailbox slot.
The effect should feel like a card being inserted into an ATM.
The cooldown result should follow real slot insertion, not appear prematurely.
No preview or replay buttons.
No separate animation window.

V2.14:
Finalized the inline mailbox and postal cyclist direction.
After insertion, show the successful submission state and illustrated postal worker/cyclist.
The rider should wear blue, use a bicycle, and have scenic motion with road, hills, clouds, and wind.
The animation remains in the original Support & Feedback drawer.
A real three-hour cooldown appears after submission.
No Preview/Replay.
V2.14 was installed successfully in the Windows project according to terminal logs.

V2.15:
Added automatic centering of the actual mailbox stage within the visible account drawer.
When results appear, recenter the postal rider and cooldown.
The underlying webpage scroll position should not control where the animation is visible.
The change was applied directly to wg_v214_inline.js, wg_v214_inline.css, and index.html.
The initial ZIP download failed twice due to a mismatched filename.
The workflow was changed to a full self-contained PowerShell command.
That command installed successfully and Node syntax validation passed.
Final animation usability should still be evaluated using actual desktop/mobile recording.

V2.16:
Diagnosed a sign-in problem where the page refreshed rather than completing login.
The earlier source snapshot passed JavaScript syntax and local asset checks.
The failure was reproduced when the external Supabase browser library was unavailable.
A secondary CDN source was added for the browser client.
A form submission guard was added to prevent native navigation when authentication initialization fails.
The stuck wg-refresh-restore hidden-screen condition was guarded.
The index.html authentication asset version was refreshed.
.gitignore was updated to ignore .wg_v*_backups/ directories.
No new backup folders were created by V2.16.
The terminal showed V2.16 LOGIN RECOVERY APPLIED.
The user subsequently reported that things were okay.
Treat that as informal acceptance, not proof of a completed security or cross-browser test matrix.

### 0.3 Latest support flow and backend rules

Support & Feedback must use the original account drawer.
Guest email required; phone optional; type and message required.
Support message maximum: 1,000 characters.
Guest intake must go through wg-guest-support rather than direct protected-table inserts.
Authenticated submissions are stored in wg_support_tickets.
Notifications are handled separately by wg-notify-support.
The notifier uses Resend; version 6 is the latest verified version as of this handover.
The exact production sender/domain configuration must be checked before public launch.
Protect authenticated username and display-name integrity.
Do not leak server-side credentials.
The three-hour cooldown must follow the actual saved ticket and persist across refreshes.
Authenticated cooldown is checked against server records, including wg_support_cooldown_resets.
Guest cooldown uses separate guest controls and backend limits.
Never treat animation timing as the authority for server cooldown expiration.
Never reset cooldown or submit test tickets without explicit user authorization.
Latest specifically requested member reset occurred on November 9, 2026 at 11:15:33 AM Philippine time.
A subsequent member support ticket was recorded at 11:16:10 AM Philippine time, making the cooldown active again.
Those timestamps are historical testing events, not permission to repeat the reset.

### 0.4 Locked visual acceptance requirements

Maintain one original Support & Feedback window.
No second overlay or popup.
No Preview or Replay control.
Envelope sequence: letter enters envelope, envelope closes, edge-on rotation, visible mailbox slot insertion, then success.
Mailbox does not disappear before the envelope completes insertion.
Result: clear thank-you text, illustrated blue postal cyclist, moving scenery, and readable real countdown.
Automatically center the active stage in the visible drawer, including after the user scrolls.
Maintain desktop and mobile responsiveness.
Avoid clipping rider/head and other artwork.
Preserve accepted cosmic dark theme outside the gallery and lighter in-gallery design.
Preserve approved transparent, naturally scrolling account header and functional X button.

### 0.5 Updated development rules - LOCKED

Use the existing Windows VS Code integrated PowerShell terminal.
Prefer ONE complete, copy-paste-ready command for each update.
Do not hand development to Codex, agents, or alternative local automation during this handover phase.
Do not require ZIP downloads when an inline PowerShell patch is practical.
No automatic project-backup folders, .bak files, duplicate source trees, or report clutter.
Use Git history and targeted in-memory restoration where feasible.
Never perform git reset, git clean, force push, or destructive file removal without explicit authorization.
Never silently use git add . or stage unrelated files.
Never automatically commit or push except for a specifically requested checkpoint/handover action.
When pushing, inspect the branch, origin, staging, validation, and remote history.
Do not stage credentials, OAuth tokens, secrets, private user content, or private Apps Script exports.
Do not modify the live Supabase backend unless the user asks and the change is necessary.
Do not send real emails or support submissions for testing without authorization.
Preserve source, assets, approved UI, and existing integrated services.
Read actual source selectors/functions before proposing edits.
Validate syntax, HTML references, browser behavior, and relevant backend results before declaring completion.
Distinguish code installation from observed browser acceptance.
Do not create unnecessary project files.
Keep old experimental scripts inactive; audit their references before deciding whether to remove them.
Preserve the current working tree; no automatic broad cleanup.
Protect minors, content ownership, privacy, and real-world location information.
Every new feature should be evaluated against MVP goals before implementation.

### 0.6 Active source and historical-file warning

Current important frontend modules include:
index.html, styles.css, portal.css, app.js, portal.js, wg_auth.js, wg_auth.css, wg_account.js, wg_account.css, wg_locale.js, wg_locale.css, wg_locale_country.js, wg_ui_icons.js, wg_view_state.js, wg_v26_ui.css, wg_v27_ui.css, wg_v28_ui.css, wg_v28_ui.js, wg_v214_inline.js, wg_v214_inline.css.
Other geography and gallery resources include the original globe/data modules, MapLibre vendor assets, photographs, world geometry and Philippine boundaries.
The currently active script and stylesheet references in index.html are authoritative.
Files such as wg_v29_mail, wg_v210_scene, wg_v211_inline, and wg_v213_inline are historical experiments unless current source inspection proves otherwise.
Four old untracked project backup directories appeared in the terminal logs before V2.16.
V2.16 ignores matching .wg_v*_backups/ folders for future staging, but did not delete them.
Never assume old experimental files are safe to delete without a dependency audit.
Old README and V2.6 setup notes may have historical status descriptions superseded by this section.

### 0.7 Website authentication and QA

Sign-up: username, display name, email, password, home country.
Username/display name maximum ten characters under current UI rules.
Password minimum eight characters, maximum 128.
Keep profile identities distinct from private email information.
A single eye control should show/hide both sign-up password fields.
Existing sign-in and account navigation must remain functional.
Use real Supabase Auth, never a frontend-only simulated login.
V2.16 introduced CDN fallback and login failure handling.
Important acceptance checks: homepage renders, wrong-password errors, correct login, session survives refresh, profile navigation, logout, and login again.
The static scan found no missing local assets and passed root JavaScript syntax.
A local server previously returned HTTP 200.
Do not equate these checks with an authenticated public launch.
If sign-in again loops, inspect browser Console and Network before changing more code.

### 0.8 MVP-FIRST DIRECTION - ACCEPTED

The user's co-developer/friend recommended an MVP focus, and the user agreed.
The website should first prove its essential photo-sharing purpose.
Freeze unnecessary animation iteration unless it breaks a required journey.

MVP critical user journey:
Visit site -> create account/sign in -> upload real photographs -> save them persistently -> discover a location-associated gallery -> manage own content safely.

Required capabilities:
- Account registration, login, logout, session persistence, failure handling.
- Private secure photo and story storage with proper user ownership.
- Public gallery/photo detail experience, only after an approved publishing/moderation pathway exists.
- Country/location association.
- Reliable photo and story retrieval across devices and accounts according to visibility rules.
- Owner management and deletion.
- File type and size validation, image processing, safe metadata handling.
- Reporting, basic moderation, abuse prevention and privacy enforcement.
- Functional desktop and mobile behavior.

IMPORTANT CURRENT LIMITATION:
V2.5 cloud drafts are PRIVATE. They are not a proven public publishing/gallery workflow.
Public content models, moderation approval, and cross-account visibility must be separately implemented and tested.
Do not describe a local demo feed as a real community upload system.

Deferred until after MVP stability:
Advanced fully accurate globe/world regional interactions beyond essential discovery.
Full world-to-country-to-region-to-province-to-city cinematic features.
More detailed animations, videos, extensive personalization, extra languages, premium voice systems, and cosmetic refinements.
Keep existing features when safe, but do not prioritize polishing them over the core platform.

### 0.9 Product vision that must not be lost

Worlds Gallery is global, geography-grounded, photo-first, and educational.
The opening experience is an immersive Earth/cosmic globe.
Other planets may be decorative but are not navigable.
Geographic positioning must be accurate; never fabricate real political boundary shapes.
The intended hierarchy is world -> country -> regional subdivisions -> cities/municipalities.
Philippines coverage must respect real island groups, regions, provinces, and cities.
Bataan, Hermosa, Central Luzon, Cavite, and landmark examples were used in earlier refinements.
Curated educational highlights must have verifiable facts and legitimately sourced photos.
The project previously addressed duplicate Back controls, mobile overlaps, content readability, and locator/map-as-photo mistakes.
Gallery expectations include search, multiple selectable themes, individual photo viewing, one-to-four-photo collages, stories, attribution and future hearts.
Browser Web Speech narration should preserve Play, Stop, and restart-from-title behavior.
Video uploading remains future work.
Accurate globe geography and licensing checks remain future validation tasks, not permission to replace the established interface with invented shapes.

### 0.10 Content protection and youth safety

The platform may include users under 18, including teens around ages 15 to 17.
Prior discussions proposed maturity/safety handling of user uploads.
Require actual server-enforced moderation, not appearance-only frontend rules.
Enforce allowed media types, size limits, privacy, EXIF-sensitive metadata removal and safe ownership.
Preserve photographer attribution and copyright respect.
Provide user reporting and a fair review/appeal pathway.
Previously discussed escalating restrictions included a one-hour upload limitation, a country-only browsing limitation, and a temporary three-day ban; these are PROPOSALS, not deployed policy.
Reassess proportionality, user safety, appeals, and abuse risks before implementation.
Never reveal precise private addresses from photos or geographic metadata.

### 0.11 Near-term roadmap and open risks

FIRST: verify the currently accepted V2.16 login fix across desktop/mobile and refresh/logout behavior.
SECOND: assess actual private cloud draft upload using an authenticated test account.
THIRD: test ownership, RLS, private Storage URLs, deletion, cross-account isolation, and failure states.
FOURTH: design the public publishing state machine and moderation/review queue.
FIFTH: implement the minimum usable public gallery/feed with location tags and details.
SIXTH: add reporting and user-facing moderation safety.
SEVENTH: conduct private beta with the co-developer, then production security/accessibility/performance review.
LATER: expand verified geography, highlight coverage, cinematic travel, voice, advanced search, language and visual polish.
Also review error visibility, provider outages, registration confirmation, rate limiting, CAPTCHA/anti-spam, production origin rules and email sender verification.
There is no verified full production launch, global geography completeness, or general public gallery publication as of this handover.

### 0.12 Git and migration checkpoint policy

Historic verified V2.4.3 GitHub commit: f5a04e0 (November 7).
Another local checkpoint recorded in terminal history: b3f439f (V2.5 preparation).
The current local branch and remote HEAD must be verified before the next commit.
Never declare older hashes to be the latest without checking.
The single canonical handover is the existing Markdown master. The Word duplicate is retired.
The retired Word generator has been replaced with a handover-only Git checkpoint tool.
For this requested checkpoint, generate its DOCX through the generator's create_docx function, then selectively stage current active website files and handover files.
Push only after validation, with explicit user authorization.
Verify remote main matches local HEAD before generating the ZIP.
ZIP goes in the parent ME FILES folder as WorldsGallery_LATEST_CHECKPOINT.zip, replacing the prior LATEST file.
The ZIP must come from the verified pushed Git commit, NOT a random working-folder copy.
Keep project backups and inactive scripts out of the public ZIP.
This is NOT a Supabase database, user-account, private Storage or Edge Function backup.

### 0.13 Apps Script export boundary

Google Apps Script projects are not confirmed dependencies of Worlds Gallery.
Their source export is a separate optional private workflow.
Use clasp for the signed-in Google account, including list-scripts, clone-script and pull.
Export into a separate private folder under ME FILES, OUTSIDE the Worlds Gallery repository.
Never use clasp push while backing up code.
Never include exported Apps Script source, .clasprc credentials, project secrets, or internal Script IDs in the public Worlds Gallery GitHub checkpoint.
A single signed-in account's list may omit scripts held under other Google accounts or not listed by the API; inventory missing project IDs separately.

### 0.14 Rules for the next ChatGPT conversation

Read this document completely, including historical sections below.
This is a full project migration; DO NOT restart or roll back to V2.4.3.
Use existing source and current GitHub main, preserve user-confirmed V2.16 behavior.
Carry all design locks and MVP-first priorities forward.
Use complete PowerShell code blocks, no Codex, no automatic backup folders.
Do not claim GitHub or Supabase changes are completed unless evidence confirms them.
Start with a status inventory and the most important MVP blocker, not another round of mailbox art.
Keep handover Markdown and DOCX updated at new milestones.
Do not push without an explicit user instruction.
Avoid redundant questions already answered in the handover.

NEW CHAT STARTER:
Continue the EXISTING Worlds Gallery project from the latest verified source checkpoint. This is a full migration, not a restart. Read WORLDS_GALLERY_HANDOVER_MASTER.md completely. Preserve previous UI, geography and support animations, Supabase integration and all development locks. The latest local milestone is V2.16 login recovery, V2.15 centered Support & Feedback, V2.14 postal rider and Resend notifier V6. Our active goal is an MVP: stable Auth, secure real uploads and storage, location-based public gallery, ownership, moderation and privacy. Use complete VS Code PowerShell commands, no Codex and no new backup folders. Verify GitHub, source files and backend before changes. Report completed, partially implemented and pending features, then continue from the highest-priority MVP task.

<!-- WG_MIGRATION_20261109_END -->


Edition: Single master V2.16 / November 9, 2026 / MVP-first
Purpose: Preserve project context across ChatGPT conversations.
Official baseline: GitHub commit f5a04e0.
Status: Existing frontend and account foundation checkpointed; actual photo gallery development is next.

## 1. MASTER MIGRATION INSTRUCTION

Continue the EXISTING Worlds Gallery project. This is a full chat migration, not a restart.

Inspect the existing source and latest GitHub checkpoint before proposing changes. Preserve approved UI, cinematic navigation, assets, working Supabase integrations, and all locked development rules.

The handover documents decisions, tested outcomes, implementation context, future requirements, and known limitations. It is not a verbatim archive of every chat message or screenshot. Source code and Git history remain the technical source of truth.

Do not claim unfinished functionality is complete. Distinguish verified, implemented, planned, and proposed items.

## 2. PROJECT IDENTITY

Project name: Worlds Gallery.
GitHub repository: https://github.com/potechto/worlds-gallery
Git branch: main.
Verified V2.4.3 baseline commit: f5a04e0.
Commit message: Checkpoint: Worlds Gallery V2.4.3 auth and gallery foundation.
Latest confirmed GitHub push: November 7, 2026.
Baseline included 23 committed files and was synchronized with origin/main.

Local Windows directory:
C:\Users\Ralph John\OneDrive\Desktop\ME FILES\Worlds Gallery

Parent directory for latest ZIP:
C:\Users\Ralph John\OneDrive\Desktop\ME FILES

Local server command:
py -m http.server 5500

Local browser:
http://localhost:5500/index.html

Use Ctrl+Shift+R after changing styles or scripts.

## 3. LOCKED DEVELOPMENT RULES

- Work through the existing VS Code integrated PowerShell terminal.
- Provide complete, copy-paste-ready commands.
- Work incrementally and explain what each operation does.
- Inspect existing selectors, files, and functions before editing.
- Verify command output before assuming a task succeeded.
- Never trust a printed PASS message when an earlier command failed.
- Do not route development to Codex, computer-use agents, or autonomous browser development.
- Do not create backup folders, .bak files, timestamped source copies, duplicate project folders, or other clutter.
- Use Git history for code recovery.
- Never use git reset, git clean, force push, or destructive overwrite without explicit authorization.
- Preserve approved source, assets, and visual behavior.
- Never push incomplete or untested site development.
- Review changes before a requested development checkpoint.
- Never expose passwords, service-role secrets, tokens, or private credentials.
- Keep guest/private data out of public source.
- Do not randomly recreate Supabase databases, tables, buckets, or RLS policies.
- Distinguish local source changes from deployed Supabase changes.
- Do not silently replace the frontend architecture just because another stack was once suggested.
- Do not fabricate educational facts or geographic boundary data.
- Protect minors and personal/private location data.

## 4. LOCKED HANDOVER WORKFLOW - ONE FILE

Only `WORLDS_GALLERY_HANDOVER_MASTER.md` is the handover.
Every milestone updates this SAME file. Never generate a parallel Word,
PDF, or second Markdown handover by default.

The former Word handover was a generated reading copy.
Any unique text was merged before retirement.

`wg_handover.py` is the checkpoint utility, not another handover document.

When an authorized handover checkpoint is requested:
1. Update the existing Markdown master.
2. Run `py -3 .\wg_handover.py`.
3. Verify the GitHub main push.
4. Generate `ME FILES/WorldsGallery_LATEST_CHECKPOINT.zip` from the pushed commit.

The ZIP is a source snapshot, not another handover or Supabase backup.
No extra backup folders, duplicate summaries, or automatic source staging.

## 5. ORIGINAL PRODUCT VISION

Worlds Gallery is a geography-based global photo-sharing and discovery website.

People should be able to explore the world, select real locations, discover educational information, and view photographs or visual stories associated with those locations.

The project should eventually support global participation. Its initial media format is PHOTOS ONLY. Video upload is a possible future feature, not an already approved or working upload feature.

The experience should feel realistic, immersive, interactive, modern, intuitive, and connected to real-world geography.

Content quality, photographer attribution, ownership, privacy, user protection, and age-appropriate moderation are core principles, not optional launch extras.

## 6. ORIGINAL EXPLORATION AND NAVIGATION DESIGN

The opening should present an immersive 3D Earth rather than a cluttered collection of controls.

Previously requested details:
- Animated stars, galaxy effects, and other planets may appear as atmospheric decoration.
- Non-Earth planets are decorative and not navigable.
- The Earth should feel realistic and visually impressive.
- Dragging/swiping and cinematic movement should feel natural.
- A top-right 12-hour clock is part of the intended interface.
- Day/night presentation should reflect relevant actual local time, especially the selected place.
- Choose Earth, then select a country, then an appropriate geographical subdivision, and ultimately a city or municipality.
- Country selection transitions into its localized homepage/gallery experience.
- Travel/flight transitions should connect globe and location selection.
- Do not replace the previously approved cinematic transitions with abrupt navigational changes.
- Avoid visible scrollbars while retaining accessible scrolling.
- Use responsive behavior on desktop and mobile.

These were accumulated product requirements. Inspect which parts are actually implemented in the current code before making completeness claims.

## 7. GEOGRAPHICAL ACCURACY — STRICT RULE

Real countries, regions, provinces, cities, municipalities, islands, and their spatial positions must be accurate.

Do not invent substitute shapes for real geographic boundaries. Do not present a stylized outline as if it is authoritative mapping data.

World-level selection should lead to an accurate country representation; subsequent navigation levels should show the relevant accurate geographical boundary or map.

Philippines-specific work must respect actual Luzon, Visayas, Mindanao, regions, provinces, cities, and municipalities.

Use real GeoJSON, TopoJSON, vector-map sources, or other properly sourced authoritative data when appropriate, with attribution and license review.

The earlier user feedback explicitly rejected inaccurate globe geography, oddly placed countries, and fabricated-looking Philippines administrative shapes.

Maps and geography should be verified, not merely visually plausible.

## 8. VERIFIED EDUCATIONAL HIGHLIGHTS

Locations should have concise, meaningful information about history, culture, landmarks, attractions, and relevant accomplishments.

The desired scope includes:
- Countries.
- Regions and provinces.
- Cities and municipalities.
- Notable historical and cultural sites.
- Important landmarks and natural attractions.
- Significant achievements with verifiable references.

A selected place should show a clear featured educational highlight and suitable photo, not an unwanted directory dump or raw data/locator diagram.

Past tests and refinements addressed:
- A duplicated Back control.
- Cavite featured text/photo legibility.
- Displaying raw filenames or locator diagrams as content.
- Curated Philippines/Bataan highlight presentation.
- Mobile overlap issues.

A previous V4 assessment reported those items corrected. The historical sample collection was limited; a prior assessment mentioned only seven curated highlights. Do not imply complete worldwide or Philippine educational coverage.

The next educational work is to expand verified facts and images without fabrication.

## 9. PHOTO GALLERY PRODUCT REQUIREMENTS

Gallery should ultimately display location-associated user photographs and curated content.

Expected user interactions:
- Browse photos associated with a selected location.
- Open photos individually.
- View supporting stories/descriptions and attribution.
- Search and filter content.
- Choose multiple themes using searchable selections or chips.
- Favor search-based discovery over the unwanted A–Z filter.
- React to or save photos with a heart interaction, subject to actual backend design.
- Explore content according to geographic context.
- Navigate back to the corresponding mapped location.

Do not assume any visual prototype has a complete data persistence layer.

## 10. COLLAGE AND STORY FORMATS

Previously requested collage support:
- One photograph.
- Two photographs.
- Three photographs.
- Four photographs.
- Several selectable layouts/templates rather than one fixed arrangement.
- A visually polished story/photo presentation.
- Individual photo viewing when applicable.

The previous prototype included four collage layouts and multi-theme controls. Before implementing live upload/publishing, inspect whether the current committed frontend still contains the relevant UI and how it is wired.

## 11. TEXT TO SPEECH

A built-in story narration option was previously requested.

Expected behavior:
- Listen/Play.
- Stop.
- Restart reading from the beginning when played again.
- Start at the story title where applicable.
- Do not layer duplicate speech playback.
- Keep the controls understandable and accessible.

Earlier implementation used browser Web Speech capabilities in the prototype. Verify current behavior in the committed site rather than assuming it remains identical.

## 12. AUTHENTICATION AND REGISTRATION DECISIONS

Supabase Auth was integrated during the later foundation work.

The intended sign-up experience includes username, email, password, and selected location information where appropriate.

Previously agreed interface requirements:
- Create Account first in the intended initial auth flow.
- Username and display-name fields were requested at a maximum of 10 characters.
- Password minimum eight characters.
- A sensible password maximum of 128 characters was discussed.
- Show an email confirmation notice.
- Password visibility controls must feel consistent; a single eye control behavior was requested for the confirm-password interface.
- Pseudonymous usernames should not be automatically derived from private names or email addresses.
- Logout should return the user to the expected sign-in state.
- Gate applicable personalized globe/gallery functionality appropriately.
- The selected home country may personalize user navigation.
- Do not expose private profile data to other users without the user's consent.

These are UX/product rules. Validate server-side enforcement separately from visual validation.

## 13. ACCOUNT, PROFILE, AND SETTINGS

The implemented foundation includes an Account drawer and account-related pages/sections.

Major areas:
- Account/Profile.
- Settings.
- Privacy preferences.
- Content preferences.
- Support & Feedback.

Preserve the account drawer structure, approved dark/light appearance, and existing authentication integration.

Actual stored preferences must be checked against the Supabase schema and RLS before extending fields.

## 14. SUPPORT AND FEEDBACK RULES

Guest and signed-in member support flows were addressed.

Guest form:
- Email required.
- Phone optional.
- Support type/category, message, and validation.
- Message length capped at 1,000 characters in the agreed interface.
- Guest submissions must not directly insert into protected database tables.

Member support should retain authenticated behavior.

Theme:
- Outside gallery: dark cosmic treatment.
- Inside gallery: lighter account/support theme.

The guest-support backend was separately deployed as a Supabase Edge Function and includes validation, origin checks, and rate limiting.

Important unresolved item: a real support email delivery/notification provider was not yet configured, so a stored ticket must not be described as a delivered notification email.

## 15. SUPABASE PROJECT DETAILS

Project name: Worlds Gallery.
Project reference: xmhnmosrwlqxwiizywsa.
Region: Tokyo, Japan.

Known project resources:
- wg_profiles
- wg_privacy_settings
- wg_content_preferences
- wg_support_tickets
- wg_guest_support_limits
- Private Storage bucket wg-private-photos
- Edge Function wg-guest-support

The current foundation previously implemented or tested:
- Auth integration.
- Profile and account-related data.
- Home-country and preference storage.
- Owner-focused private photo bucket policies.
- Row-level security for relevant user-owned records.
- A guest-support Edge Function instead of anonymous direct DB insertion.
- Guest support validation and rate limiting.
- Service-role-only guest support processing inside the backend.

For local testing, previously discussed permitted origins included:
http://localhost:5500
http://127.0.0.1:5500

A production origin requires its own verified configuration, including WG_ALLOWED_ORIGIN as appropriate for the deployed function.

Do not expose Supabase service-role credentials in client JavaScript, the DOCX, Markdown, ZIP, or GitHub.

Known remaining work:
- Recheck production origin controls.
- Add/verify suitable CAPTCHA or equivalent abuse prevention before public launch.
- Connect and test actual email notifications if desired.
- Configure and validate email confirmation behavior.
- Review leaked-password protection and other Auth security settings.
- Review security policy gaps and operational readiness.
- Test actual RLS behavior as authenticated and unauthenticated users.
- Capture a separate safe infrastructure/schema migration strategy if required.

The deployed database/functions are NOT automatically backed up just because a frontend Git commit succeeded.

## 16. SECURITY AND CONTENT SAFETY ROADMAP

The website may be accessible to people younger than 18, including users approximately 15–17 years old.

The original policy concept included:
- Automatic image compression.
- Content safety scanning before public distribution.
- Blocking prohibited/unsafe uploads.
- Copyright and ownership protections.
- Reporting of abusive or violating content.
- Review/moderation and user notifications.
- A proposed one-hour first-offense upload restriction.
- A proposed second-offense browsing restriction to the user's country.
- A proposed temporary three-day ban for repeated violations.

These restrictions are previously discussed design concepts, NOT verified deployed enforcement rules. They require careful review for fairness, appeal procedures, anti-abuse design, and effective moderation before implementation.

Safety and privacy must not depend only on browser-side checks.

User uploads should strip or limit sensitive EXIF/geolocation metadata, enforce allowed file types and limits, and keep private content private until approved for visibility.

Avoid revealing a creator's precise residential address or private location just because a photo is associated with a broad city or attraction.

## 17. IMPLEMENTED FRONTEND AND ASSET FILE MAP

Current source files include:
- index.html — HTML entry point and module/style references.
- app.js — core client behavior and gallery/portal coordination.
- portal.js — portal/navigation interactions.
- ph_admin_geo.js — Philippines geography behavior.
- place_highlights.js — place highlights.
- wg_account.css and wg_account.js — account drawer and interactions.
- wg_auth.css and wg_auth.js — authentication UI/client behavior.
- wg_cinematic.js — cinematic transition support.
- wg_global_map.css and wg_global_map.js — global map UI.
- wg_image_fix.css — image display adjustments.
- wg_landmark_discovery.css and wg_landmark_discovery.js — landmark discovery UI.
- wg_world_knowledge.css and wg_world_knowledge.js — educational place content UI.
- wg_earth_preview.webp — globe/earth visual asset.
- geo/ph_boundaries_metadata.json — Philippines geography metadata.
- assets/photos/mount-samat-shrine.jpg — curated local highlight photo.
- assets/vendor/maplibre/maplibre-gl.css and maplibre-gl.js — map library assets.
- LICENSES_AND_SOURCES.md — source/license tracking.

These are verified as part of the previously pushed V2.4.3 source checkpoint, but their exact implementation should be read before changes.

The project uses the actual committed web application. Prior Next.js/React/Vercel suggestions were architecture options, not proof that a React/Next migration happened.

## 18. DEVELOPMENT HISTORY — HIGH-LEVEL CHRONOLOGY

Early planning:
Worlds Gallery was defined as a photo-first global platform with educational geographic exploration, galleries, stories, user registration, privacy, content safety, and possible future video support.

Prototype design:
An interactive globe and hierarchical country/location flow were explored. Gallery search, multi-theme selection, four collage layouts, Web Speech narration, photo viewing, and related presentation ideas were developed as prototype features.

Geographic correction phase:
The user rejected inaccurate geographic shapes and demanded better real-world boundary data, especially for the Philippines and its subdivisions.

Local VS Code migration:
The application was transferred into the existing Windows Worlds Gallery folder. GitHub source control and the terminal workflow became the preferred development method.

V4 refinement:
Featured place highlights were improved. Earlier checks reported removal of duplicate Back, clearer Cavite content, better curated examples, and fewer mobile overlap issues.

V5/V6 foundation:
World and Philippines navigation, global map, geographic metadata, educational content modules, cinematic globe/flight behavior, and account/portal visuals were integrated. Preserve approved behavior rather than redesigning.

November 7 authentication/backend phase:
A dedicated Worlds Gallery Supabase project was used for profile, preference, private storage, and support-related infrastructure. Auth, the Account drawer, and guest/member Support & Feedback workflows were integrated and adjusted.

V2.4 integrated patch:
An integrated V2.4 ZIP was used successfully to update the existing app. A later V2.4 patch overlay was rolled back due to problematic behavior; the stable integrated source was retained.

Account scrolling issue:
The Account header WORDS.GALLERY / ACCOUNT and its X control had an undesirable sticky/overlapping presentation. The approved direction became natural scrolling and transparent backgrounds.

Accidental CSS empty-file incident:
An earlier PowerShell script split if/elseif/else execution, and wg_account.css became zero bytes. This was diagnosed by checking its file length. The original stylesheet was restored from the verified V2.4 ZIP.

V2.4.1 correction:
The original account stylesheet was restored and its sticky header rule changed to static scrolling.

V2.4.2 and V2.4.3:
Initial transparency rules did not fully override the guest header. The more specific guest header and X trigger selectors were updated. The user approved the final transparent appearance.

Git verification issue:
git diff --cached --check flagged a new blank line at the end of wg_account.css. The whitespace was fixed without changing meaningful styling, then 23 files passed Git validation.

GitHub checkpoint:
Commit f5a04e0 was created locally and pushed successfully to origin/main on November 7, 2026. The final terminal showed HEAD, main, and origin/main at the same commit.

Handover automation:
The user now requires terminal-maintained comprehensive handover source, ONE Markdown handover in project root, GitHub push, and an automatically generated latest ZIP in parent ME FILES.

## 19. VERIFIED CURRENT BASELINE

- Frontend foundation is committed and pushed.
- The latest account header appearance was approved.
- A damaged/empty stylesheet was recovered.
- The Git whitespace check was resolved.
- Baseline commit: f5a04e0.
- GitHub push succeeded and matched origin/main.
- 23 files were committed in that checkpoint.
- Supabase foundation exists separately.
- The actual live user photo gallery workflow remains the next substantial development phase.

No complete production audit, worldwide geography QA, or end-to-end public gallery upload test was established by the checkpoint logs.

## 20. WHAT HAS NOT BEEN CONFIRMED COMPLETE

- Fully accurate worldwide and all-level Philippine geographic data.
- Full country/province/city factual content coverage.
- Permanent user photo submission and public publishing.
- Automated image moderation.
- Actual creator-facing reporting and appeals.
- Final user hearts/likes persistence.
- Full gallery feed and discovery backend.
- All collage formats connected to saved user uploads.
- Production-grade email notifications and anti-spam.
- Production launch and complete public security review.
- Mobile/browser accessibility coverage across all pages.
- Real-world high-volume performance testing.

Do not describe these as finished without inspection and verified tests.

## 21. NEXT PHASE — ACTUAL PHOTO GALLERY

Begin with a source inspection and inventory of the current gallery-related code.

Smallest next milestone:
Render a working gallery browse view using existing suitable data and existing selected-location navigation.

Then progress to:
1. Photo cards/gallery grid and working individual-photo viewer.
2. Reliable location-to-gallery content mapping.
3. Creator attribution and supporting stories/metadata.
4. Search and multi-theme filtering.
5. Secure database tables for actual gallery records.
6. Private-to-public upload and moderation lifecycle.
7. Authenticated upload form with 1–4 photo/collage selection.
8. Compression, file-type/size validation, metadata handling.
9. Moderator/reporting flows and content policy.
10. Likes/hearts, account content management, and user controls.
11. Mobile, accessibility, loading-state, and failure-state testing.
12. Production security/performance/deployment work.

Preserve the globe and approved account interface during this phase.

Do not implement all phases in one unreviewed code patch.

## 22. DESIGN ACCEPTANCE AND QA RULES

Always test:
- Selected country positioning and accurate boundary rendering.
- Globe-to-location transitions.
- Back navigation and history.
- Globe movement/flight preservation.
- User entry, login, logout, email verification states.
- Account open/close and scrolling.
- Support & Feedback behavior.
- Mobile layouts and overlapping controls.
- Browser console errors.
- Actual Supabase reads/writes and RLS enforcement.
- Graceful handling of missing photos and incomplete location data.
- Loading, empty, and failure states.
- User content privacy and moderation expectations.

For the approved V2.4.3 drawer:
- Header should not obscure scrolling content.
- Header background should remain transparent.
- X control should remain an icon without its previous solid green background.
- X must remain clickable.
- Light and dark contexts should remain coherent.

## 23. GITHUB AND RELEASE RULES

Never assume GitHub push succeeded merely because a local commit exists.

A successful checkpoint requires:
- git diff --check or the relevant staged whitespace check.
- Correct local branch and GitHub remote.
- A successful git commit.
- A successful git push origin main.
- Final Git status without ahead/behind.
- If possible, verification of remote HEAD against local HEAD.

Do not commit private secrets or generated local clutter.

The handover automation is authorized to push its OWN handover files when explicitly run. Other product code must first be separately reviewed and approved for checkpointing.

Latest ZIP must be created after remote push verification, using git archive from HEAD.

## 24. GOOGLE APPS SCRIPT SOURCE EXPORT — SEPARATE PRIVATE WORKFLOW

No Google Apps Script project IDs or verified Worlds Gallery Apps Script integrations were established in the recovered Worlds Gallery history.

If existing Apps Script projects need source exports, use the Google clasp CLI in a separate private folder OUTSIDE the Worlds Gallery repository.

Prerequisites:
- Node.js and npm.
- @google/clasp installed.
- Interactive clasp login with the intended Google account.
- Apps Script API enabled where required.

Current clasp v3 commands include:
clasp login
clasp list-scripts --json
clasp clone-script SCRIPT_ID
clasp pull

The listing covers projects returned by the signed-in account; do not assume it is a complete cross-account inventory.

Do not run clasp push for a backup/export task.
Do not export OAuth files or credentials into the public GitHub repo.
Do not include private Apps Script exports inside the Worlds Gallery public checkpoint ZIP.

Use the separate terminal export command provided in the migration conversation to automatically iterate through the projects listed by clasp, cloning new projects and pulling updates for previously exported projects.

## 25. INFORMATION SECURITY AND DATA BACKUP BOUNDARIES

GitHub contains only committed code/documentation/assets.
The generated checkpoint ZIP is a Git source archive.
Supabase live data, authentication users, object storage, deployed Edge Functions, and database configurations are separate cloud resources.
Google Apps Script projects are separate cloud resources.
The single Markdown handover is not a backup of remote systems.

Avoid copying credentials, private user uploads, production databases, OAuth tokens, .env files, or hidden auth configuration into public archives.

Before production launch, establish an appropriate private data recovery process separate from the source ZIP.

## 26. HANDOVER UPDATE POLICY - ONE FILE

Update ONLY `WORLDS_GALLERY_HANDOVER_MASTER.md` in place after milestones.

Include current version, achievements, actual tests, changed modules,
locked rules, Supabase state, pending issues, MVP priorities, and future plans.

Preserve all earlier history. Mark superseded decisions clearly.
No DOCX regeneration or independent handover copies.

When explicitly authorized, run `py -3 .\wg_handover.py`
to verify GitHub and renew the latest ZIP in parent ME FILES.

No unnecessary backups, destructive cleanup, or unapproved code pushes.

## 27. STARTING IN A NEW CHAT

Read this entire handover first.

Continue Worlds Gallery from the latest verified GitHub main checkpoint, preserving the approved globe, geography work, account UI, auth, and Supabase infrastructure.

If the repository has newer commits than f5a04e0, inspect them and update the handover baseline rather than reverting to f5a04e0.

Use VS Code PowerShell terminal commands only. Do not automatically hand off to Codex/agents. Do not create backups or perform destructive operations.

Begin by inspecting the existing gallery-related HTML, JavaScript, CSS, and Supabase integration. Report what is already implemented, what is partially implemented, and what remains planned.

Then work toward the FIRST functional user-facing photo gallery browsing milestone. Avoid unnecessary redesign of the approved globe or account features.

Keep the single Markdown master -> verified GitHub push -> parent ME FILES ZIP workflow locked for future handovers.