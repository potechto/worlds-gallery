-- WG V1 REVIEW-ONLY SCHEMA DRAFT. NOT a migration; DO NOT run in production.
-- Designed for separate, approved staging. CI loads this into disposable PostgreSQL.
-- No backfill of existing private stories, no public storage bucket and no staff bootstrap.
-- All client access is denied. Only a server using its protected service_role may write/read.
-- The Edge gateway MUST obtain actor UID using Supabase Auth getUser() (never user metadata).
--
-- Supabase rollout: review SQL, test against isolated staging DB, then generate a versioned
-- migration with Supabase CLI. Do not execute this review draft on the live project.

CREATE TABLE public.wg_v1_staff_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_role text NOT NULL CHECK (staff_role IN ('moderator','admin')),
  active boolean NOT NULL DEFAULT false,
  granted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.wg_v1_public_posts (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review','approved_staged','published','hidden','withdrawn','removed')),
  author text NOT NULL CHECK (char_length(btrim(author)) BETWEEN 2 AND 60),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1000 AND 15000),
  country_code text NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
  country_name text NOT NULL CHECK (char_length(country_name) BETWEEN 2 AND 100),
  theme text NOT NULL CHECK (char_length(theme) BETWEEN 1 AND 64),
  language_code text NOT NULL DEFAULT 'en'
    CHECK (language_code ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'),
  owner_consent boolean NOT NULL DEFAULT false,
  review_by uuid REFERENCES auth.users(id),
  review_at timestamptz,
  snapshot_sha256 text CHECK (snapshot_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wg_v1_approved_requires_review CHECK (
    status NOT IN ('approved_staged','published')
    OR (owner_consent AND review_by IS NOT NULL AND review_at IS NOT NULL
        AND review_by <> owner_id AND snapshot_sha256 IS NOT NULL)
  )
);
CREATE INDEX wg_v1_posts_public_idx
 ON public.wg_v1_public_posts(created_at DESC)
 WHERE status='published';
CREATE INDEX wg_v1_posts_owner_idx
 ON public.wg_v1_public_posts(owner_id,created_at DESC);

CREATE TABLE public.wg_v1_sealed_media (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.wg_v1_public_posts(id) ON DELETE CASCADE,
  position smallint NOT NULL CHECK (position BETWEEN 0 AND 3),
  source_bucket text NOT NULL DEFAULT 'wg-private-photos'
    CHECK (source_bucket='wg-private-photos'),
  source_path text NOT NULL CHECK (char_length(source_path) BETWEEN 20 AND 450),
  reviewed_bucket text NOT NULL DEFAULT 'wg-reviewed-webp'
    CHECK (reviewed_bucket='wg-reviewed-webp'),
  reviewed_path text NOT NULL CHECK (char_length(reviewed_path) BETWEEN 20 AND 450),
  mime_type text NOT NULL DEFAULT 'image/webp' CHECK (mime_type='image/webp'),
  sha256 text NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  byte_length integer NOT NULL CHECK (byte_length BETWEEN 1 AND 5242880),
  sealed boolean NOT NULL DEFAULT false,
  exif_removed boolean NOT NULL DEFAULT false,
  human_approved boolean NOT NULL DEFAULT false,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, position),
  UNIQUE (reviewed_bucket, reviewed_path)
);
CREATE INDEX wg_v1_media_post_idx ON public.wg_v1_sealed_media(post_id);

CREATE TABLE public.wg_v1_post_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.wg_v1_public_posts(id),
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL CHECK(action IN ('publish','make_private','owner_delete','admin_hide','admin_delete')),
  reason text NOT NULL CHECK(char_length(btrim(reason)) BETWEEN 10 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS on every Data-API-exposed table. No anon/authenticated policies deliberately:
-- all source mappings and staff roles are server-only. RLS is defense in depth.
ALTER TABLE public.wg_v1_staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wg_v1_public_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wg_v1_sealed_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wg_v1_post_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.wg_v1_staff_roles,public.wg_v1_public_posts,
 public.wg_v1_sealed_media,public.wg_v1_post_audit FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE
 public.wg_v1_staff_roles,public.wg_v1_public_posts,public.wg_v1_sealed_media,
 public.wg_v1_post_audit TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.wg_v1_post_audit_id_seq TO service_role;

-- Only server-side Edge code may call this RPC, after verifying the reviewer Auth UID.
-- SQL is a second barrier against mistaken/public early release.
CREATE FUNCTION public.wg_v1_release_post(p_post_id uuid,p_reviewer uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $wg$
DECLARE rec public.wg_v1_public_posts%ROWTYPE;
        n integer; all_clean boolean;
BEGIN
  SELECT * INTO rec FROM public.wg_v1_public_posts
  WHERE id=p_post_id FOR UPDATE;
  IF NOT FOUND OR rec.status <> 'approved_staged' OR NOT rec.owner_consent
    OR rec.review_at IS NULL OR rec.snapshot_sha256 IS NULL
    OR rec.review_by IS DISTINCT FROM p_reviewer OR rec.owner_id=p_reviewer THEN
    RAISE EXCEPTION 'Post has not passed independent review' USING ERRCODE='42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.wg_v1_staff_roles
      WHERE user_id=p_reviewer AND active AND staff_role IN ('moderator','admin')) THEN
    RAISE EXCEPTION 'Verified reviewer required' USING ERRCODE='42501';
  END IF;
  SELECT count(*)::integer,COALESCE(bool_and(
    sealed AND exif_removed AND human_approved AND revoked_at IS NULL
    AND mime_type='image/webp' AND byte_length BETWEEN 1 AND 5242880),false)
    INTO n,all_clean
  FROM public.wg_v1_sealed_media WHERE post_id=p_post_id;
  IF n NOT BETWEEN 1 AND 4 OR NOT all_clean THEN
    RAISE EXCEPTION 'Sanitized reviewed photo(s) required' USING ERRCODE='42501';
  END IF;
  UPDATE public.wg_v1_public_posts SET status='published',updated_at=now()
    WHERE id=p_post_id;
  INSERT INTO public.wg_v1_post_audit(post_id,actor_id,action,reason)
    VALUES (p_post_id,p_reviewer,'publish','Independent review and media seal verified');
  RETURN true;
END;
$wg$;

-- Opaque token check only. Never returns bucket/path or creates public signed URL.
-- A production media Edge Function must also re-check the state after reading storage.
CREATE FUNCTION public.wg_v1_can_serve_media(p_token uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=''
AS $wg$
 SELECT EXISTS (
   SELECT 1 FROM public.wg_v1_sealed_media m
   JOIN public.wg_v1_public_posts p ON p.id=m.post_id
   WHERE m.token=p_token AND p.status='published' AND p.owner_consent
     AND p.review_by IS NOT NULL AND p.review_at IS NOT NULL
     AND m.sealed AND m.exif_removed AND m.human_approved AND m.revoked_at IS NULL
     AND m.mime_type='image/webp'
 );
$wg$;

-- p_owner_id MUST come from server-side Auth verification, never request JSON.
-- Going private needs fresh moderation to publish again.
CREATE FUNCTION public.wg_v1_owner_post_action(p_post_id uuid,p_owner_id uuid,p_action text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $wg$
DECLARE new_state text;
BEGIN
  IF p_action NOT IN ('private','delete') THEN
    RAISE EXCEPTION 'Unsupported owner action' USING ERRCODE='22023';
  END IF;
  new_state := CASE WHEN p_action='private' THEN 'withdrawn' ELSE 'removed' END;
  UPDATE public.wg_v1_public_posts
  SET status=new_state,updated_at=now()
  WHERE id=p_post_id AND owner_id=p_owner_id AND status NOT IN ('removed','withdrawn');
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO public.wg_v1_post_audit(post_id,actor_id,action,reason)
   VALUES(p_post_id,p_owner_id,
     CASE WHEN p_action='private' THEN 'make_private' ELSE 'owner_delete' END,
     CASE WHEN p_action='private'
       THEN 'Owner explicitly withdrew public visibility'
       ELSE 'Owner requested post soft deletion' END);
  RETURN true;
END;
$wg$;

-- Admin UUID must match server-owned active staff row. Hide and delete are
-- immediately revoked from public feed and media broker; both retain audit.
CREATE FUNCTION public.wg_v1_admin_post_action(
 p_post_id uuid,p_admin_id uuid,p_action text,p_reason text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $wg$
BEGIN
  IF p_action NOT IN ('hide','delete') OR char_length(btrim(COALESCE(p_reason,''))) < 10
    OR char_length(p_reason) > 1000 THEN
    RAISE EXCEPTION 'Unsupported action or missing reason' USING ERRCODE='22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.wg_v1_staff_roles
        WHERE user_id=p_admin_id AND active AND staff_role='admin') THEN
    RAISE EXCEPTION 'Verified active admin required' USING ERRCODE='42501';
  END IF;
  UPDATE public.wg_v1_public_posts
  SET status=CASE WHEN p_action='hide' THEN 'hidden' ELSE 'removed' END,
      updated_at=now()
  WHERE id=p_post_id AND status NOT IN ('removed','withdrawn');
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO public.wg_v1_post_audit(post_id,actor_id,action,reason)
   VALUES(p_post_id,p_admin_id,
     CASE WHEN p_action='hide' THEN 'admin_hide' ELSE 'admin_delete' END,
     btrim(p_reason));
  RETURN true;
END;
$wg$;

-- Revoke PUBLIC's default EXECUTE grant! There are intentionally no browser-callable RPCs.
REVOKE ALL ON FUNCTION public.wg_v1_release_post(uuid,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.wg_v1_can_serve_media(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.wg_v1_owner_post_action(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.wg_v1_admin_post_action(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wg_v1_release_post(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.wg_v1_can_serve_media(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.wg_v1_owner_post_action(uuid,uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.wg_v1_admin_post_action(uuid,uuid,text,text) TO service_role;
