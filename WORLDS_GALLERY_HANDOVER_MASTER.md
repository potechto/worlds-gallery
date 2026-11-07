# WORLDS GALLERY — FULL PROJECT HANDOVER

Edition: V2.4.3 foundation / November 7, 2026
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

## 4. LOCKED HANDOVER WORKFLOW

The handover is maintained from the VS Code PowerShell terminal.

The canonical editable source is:
WORLDS_GALLERY_HANDOVER_MASTER.md

The official reader-friendly document is:
WORLDS_GALLERY_FULL_PROJECT_HANDOVER.docx

The reusable generator is:
wg_handover.py

All three live in the Worlds Gallery main project folder, with no special handover or backup subfolder.

When the master content is updated:
1. Regenerate the DOCX.
2. Validate the DOCX structure and handover content.
3. Stage only the handover source, generator, and DOCX by default.
4. Commit and push to the verified GitHub main branch.
5. Verify the remote commit matches local HEAD.
6. Generate the latest ZIP from the pushed Git commit.
7. Place the ZIP in the parent ME FILES folder.
8. Replace the prior LATEST ZIP rather than accumulating many duplicate ZIPs.

The command to repeat this pipeline after editing the master is:
py -3 .\wg_handover.py

The generator does not retrieve or automatically transcribe ChatGPT conversations. New decisions and milestones must first be added to the master handover. It also does not silently stage unrelated code changes.

The ZIP is a Git source snapshot, not an extra source tree or database backup.

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
The user now requires terminal-maintained comprehensive handover source, generated DOCX in project root, GitHub push, and an automatically generated latest ZIP in parent ME FILES.

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
A handover DOCX is not a backup of those remote systems.

Avoid copying credentials, private user uploads, production databases, OAuth tokens, .env files, or hidden auth configuration into public archives.

Before production launch, establish an appropriate private data recovery process separate from the source ZIP.

## 26. HANDOVER UPDATE POLICY

After any major milestone, update this master source with:
- Date and project version.
- What changed.
- Exact files/modules changed.
- User-approved design decisions and locks.
- Tests actually performed and results.
- Git commit hash after successful push.
- Supabase migrations or Edge Function versions if applicable.
- New external integration links if verified.
- Open bugs and limitations.
- Immediate next actions.

The master must not be overwritten with an empty or generic summary. Preserve earlier important decisions unless explicitly superseded.

Regenerate the DOCX and latest ZIP via:
py -3 .\wg_handover.py

The Word document is for reading/transferring. The Markdown master remains the editable project context.

## 27. STARTING IN A NEW CHAT

Read this entire handover first.

Continue Worlds Gallery from the latest verified GitHub main checkpoint, preserving the approved globe, geography work, account UI, auth, and Supabase infrastructure.

If the repository has newer commits than f5a04e0, inspect them and update the handover baseline rather than reverting to f5a04e0.

Use VS Code PowerShell terminal commands only. Do not automatically hand off to Codex/agents. Do not create backups or perform destructive operations.

Begin by inspecting the existing gallery-related HTML, JavaScript, CSS, and Supabase integration. Report what is already implemented, what is partially implemented, and what remains planned.

Then work toward the FIRST functional user-facing photo gallery browsing milestone. Avoid unnecessary redesign of the approved globe or account features.

Keep the terminal-driven master handover -> DOCX -> verified GitHub push -> parent ME FILES ZIP process locked for future handovers.