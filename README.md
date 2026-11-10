# Worlds Gallery

A photo-first, globe-based discovery and storytelling website. This is an **active beta**, not a security-certified production release.

## Public application

`index.html` is the website entry point. Its browser JavaScript, stylesheets, maps, and licensed artwork are intentionally public so that the website can load. Treat all browser-delivered code and configuration as inspectable by anyone.

The live site uses Supabase Auth, owner-scoped Row Level Security, and a private photo Storage bucket. Story posting currently creates private drafts; **public publishing is not enabled**. The backend's trusted publishing/moderation workflow is not deployed.

**My Album** requires an authenticated member in the interface, but its photos and stickers currently live in browser local storage rather than encrypted cloud storage. A shared device/browser profile is therefore not a secure place for highly sensitive media. Clearing local browser data can erase album contents. Account-only interface checks do not replace server-side authorization.

Third-party imagery, including user-pasted public GIF URLs, is fetched from remote hosts that can see ordinary network metadata. Users should review image rights before sharing content.

## Public code and private material

- Never commit passwords, `service_role`/secret API keys, credential files, private support records, database exports, developer handovers, or local private documentation.
- Supabase publishable keys or legacy `anon` keys can be used by the browser; **only RLS and trusted backend checks authorize private access**.
- Local-only internal previews, handover/build tools and offline moderation experiments are excluded from the latest public repository tree. They are not evidence of live production endpoints.
- Historical Git commits may still be reachable; removing a file from the latest tree is not a Git history purge.

For geographic datasets and imagery credits, see [LICENSES_AND_SOURCES.md](LICENSES_AND_SOURCES.md).

Security concerns should be reported privately to the repository maintainer, **not** in a public GitHub issue or discussion containing sensitive details. See [SECURITY.md](SECURITY.md).
