-- WORLDS GALLERY V2.20 -- OFFLINE MODERATION SCHEMA PREVIEW ONLY.
-- DO NOT APPLY TO LIVE SUPABASE.  No live migration is authorized by this package.
-- This is intentionally wrapped in BEGIN/ROLLBACK: even if executed, it persists nothing.
-- Before any future deployment, review against the current Supabase schema, test on a
-- separate non-production database, complete the trusted moderation/media Edge Function,
-- and obtain explicit approval.  This file is NOT an active migration.
-- Existing wg_stories, wg_story_photos and wg-private-photos are NOT altered here.

BEGIN;

-- Private submission snapshots. All writes and moderation transitions must occur
-- inside a trusted server function after verifying the caller's JWT / reviewer role.
-- Never accept client-supplied owner IDs, status, or reviewer metadata as authority.
CREATE TABLE public.wg_publication_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.wg_stories(id) ON DELETE RESTRICT,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_review','approved','rejected','withdrawn')),
  author text NOT NULL CHECK (char_length(author) BETWEEN 2 AND 60),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1000 AND 15000),
  country_code text NOT NULL,
  country_name text NOT NULL,
  region text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  theme text NOT NULL,
  layout text NOT NULL,
  language_code text NOT NULL DEFAULT 'en',
  rights_attested boolean NOT NULL CHECK (rights_attested IS TRUE),
  consent_attested boolean NOT NULL CHECK (consent_attested IS TRUE),
  privacy_attested boolean NOT NULL CHECK (privacy_attested IS TRUE),
  public_feedback text,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  reviewed_at timestamptz
);

CREATE UNIQUE INDEX wg_one_active_submission_per_story
  ON public.wg_publication_submissions(story_id)
  WHERE status IN ('pending','in_review');
CREATE INDEX wg_publication_review_queue
  ON public.wg_publication_submissions(status, submitted_at);
CREATE INDEX wg_publication_owner_history
  ON public.wg_publication_submissions(owner_id, submitted_at DESC);

-- Review photos remain PRIVATE. Only trusted code may add photo references;
-- it must check that they belong to the same owner and story as the submission.
-- The server must verify existence/contents when reviewing, not trust a path string.
CREATE TABLE public.wg_publication_submission_photos (
  submission_id uuid NOT NULL REFERENCES public.wg_publication_submissions(id) ON DELETE CASCADE,
  source_photo_id uuid NOT NULL REFERENCES public.wg_story_photos(id) ON DELETE RESTRICT,
  position smallint NOT NULL CHECK (position BETWEEN 0 AND 3),
  PRIMARY KEY (submission_id, position),
  UNIQUE (submission_id, source_photo_id)
);

-- Public gallery metadata is deliberately distinct from private drafts.
-- No owner UUID, storage_path, original file name, EXIF, GPS or precise coordinates
-- are placed in the publicly selectable record. A trusted reviewer-approved
-- server operation is the ONLY pathway to a published record.
CREATE TABLE public.wg_gallery_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL UNIQUE
    REFERENCES public.wg_publication_submissions(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'staged'
    CHECK (status IN ('staged','published','withdrawn')),
  author text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  country_code text NOT NULL,
  country_name text NOT NULL,
  region text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  theme text NOT NULL,
  layout text NOT NULL,
  language_code text NOT NULL DEFAULT 'en',
  published_at timestamptz,
  withdrawn_at timestamptz,
  CONSTRAINT wg_published_requires_timestamp
    CHECK (status <> 'published' OR published_at IS NOT NULL)
);
CREATE INDEX wg_gallery_browse_country_time
  ON public.wg_gallery_stories(country_code, published_at DESC)
  WHERE status = 'published';

-- The public API may list photo positions/opaque references, but never gets
-- private Storage paths or permanent private-object download links.
-- A separate trusted, rate-limited media broker must verify published status
-- and issue short-lived media URLs before the frontend can display photos.
CREATE TABLE public.wg_gallery_photos (
  gallery_story_id uuid NOT NULL REFERENCES public.wg_gallery_stories(id) ON DELETE CASCADE,
  source_photo_id uuid NOT NULL REFERENCES public.wg_story_photos(id) ON DELETE RESTRICT,
  position smallint NOT NULL CHECK (position BETWEEN 0 AND 3),
  PRIMARY KEY (gallery_story_id, position),
  UNIQUE (gallery_story_id, source_photo_id)
);

-- Reports are intake-only via a trusted rate-limited API, with a fair review
-- and appeal process to be implemented before public access is enabled.
CREATE TABLE public.wg_content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_story_id uuid NOT NULL REFERENCES public.wg_gallery_stories(id) ON DELETE RESTRICT,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  reason text NOT NULL CHECK (reason IN
    ('privacy','minor_safety','copyright','harassment','graphic_content','spam','other')),
  details text NOT NULL DEFAULT '' CHECK (char_length(details) <= 1200),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_review','resolved','dismissed')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX wg_reports_review_queue
  ON public.wg_content_reports(status, submitted_at);

-- Internal audit events are NOT queryable by client roles. No SELECT policy.
CREATE TABLE public.wg_moderation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES public.wg_publication_submissions(id) ON DELETE RESTRICT,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN
    ('submitted','review_started','approved','rejected','withdrawn','report_received','report_resolved')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX wg_moderation_event_history
  ON public.wg_moderation_events(submission_id, occurred_at DESC);

-- LOCK DOWN NEW TABLES. Client roles receive only narrowly scoped reads.
ALTER TABLE public.wg_publication_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wg_publication_submission_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wg_gallery_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wg_gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wg_content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wg_moderation_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.wg_publication_submissions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.wg_publication_submission_photos FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.wg_gallery_stories FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.wg_gallery_photos FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.wg_content_reports FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.wg_moderation_events FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.wg_publication_submissions TO authenticated;
GRANT SELECT ON public.wg_publication_submission_photos TO authenticated;
GRANT SELECT ON public.wg_gallery_stories TO anon, authenticated;
-- V2.21 hardening: gallery photo source references are SERVER-ONLY.
-- The public media broker resolves approved positions after checking published status.
GRANT SELECT ON public.wg_content_reports TO authenticated;

-- service_role is only for trusted server code, never a web or mobile client.
GRANT ALL ON public.wg_publication_submissions TO service_role;
GRANT ALL ON public.wg_publication_submission_photos TO service_role;
GRANT ALL ON public.wg_gallery_stories TO service_role;
GRANT ALL ON public.wg_gallery_photos TO service_role;
GRANT ALL ON public.wg_content_reports TO service_role;
GRANT ALL ON public.wg_moderation_events TO service_role;

CREATE POLICY wg_submission_owner_read
  ON public.wg_publication_submissions FOR SELECT TO authenticated
  USING (owner_id = (SELECT auth.uid()));

CREATE POLICY wg_submission_photo_owner_read
  ON public.wg_publication_submission_photos FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.wg_publication_submissions s
    WHERE s.id = submission_id AND s.owner_id = (SELECT auth.uid())
  ));

CREATE POLICY wg_gallery_only_published_read
  ON public.wg_gallery_stories FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- V2.21: no anonymous/authenticated SELECT policy on wg_gallery_photos.
-- This intentionally prevents exposing private source_photo_id values through Data API.

CREATE POLICY wg_reports_owner_read
  ON public.wg_content_reports FOR SELECT TO authenticated
  USING (reporter_id = (SELECT auth.uid()));

-- V2.20 deployment gate: this is an OFFLINE PREVIEW and always rolls back.
-- For a future approved migration, do not simply replace ROLLBACK with COMMIT:
-- first add/test trusted submission, reviewer, withdrawal and media-broker code;
-- moderation/auth, immutable media, abuse rate limits and storage isolation.
ROLLBACK;
