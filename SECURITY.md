# Security policy

Worlds Gallery is an active beta.

## Report a vulnerability privately

Avoid posting credentials, private photos, user data, or exploit details in public issues. Use GitHub's **Report a vulnerability** feature under the repository's Security section if available, or contact the repository maintainer through a private channel.

## Scope and trust boundaries

- The browser code is public and cannot be treated as a secret or a trusted authorization boundary.
- Never put Supabase secret/service-role keys, email-provider secrets, or private credentials in frontend assets or Git commits.
- Private user data must be protected by server-side authorization and Supabase Row Level Security; UI prompts are not sufficient.
- The My Album scrapbook currently stores data in local browser storage, not encrypted cross-device cloud storage.
- Public storytelling and trusted moderation are not launched.
- Default and third-party image sources must be reviewed for licensing and privacy.

If a credential is leaked, **revoke or rotate it first**. Removing it from a Git commit does not invalidate it. Git history cleanup is a separate coordinated operation because old object IDs, forks and clones may remain accessible.
