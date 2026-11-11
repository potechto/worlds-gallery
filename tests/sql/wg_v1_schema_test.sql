-- Worlds Gallery V1 CI: isolated PostgreSQL permission test, no Supabase/prod access.
-- All schema/data/roles are temporary and rolled back at the end of this file.
\set ON_ERROR_STOP on
BEGIN;
CREATE ROLE wg_ci_guest NOLOGIN;
CREATE ROLE wg_ci_member NOLOGIN;
CREATE SCHEMA wg_ci;
GRANT USAGE ON SCHEMA wg_ci TO wg_ci_guest, wg_ci_member;
CREATE TABLE wg_ci.posts (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL,
  visibility text NOT NULL CHECK (visibility IN ('private','pending','published','hidden','removed')),
  consent boolean NOT NULL DEFAULT false,
  sanitized boolean NOT NULL DEFAULT false,
  title text NOT NULL,
  media_token uuid
);
CREATE TABLE wg_ci.media (
  token uuid PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES wg_ci.posts(id),
  private_path text NOT NULL
);
ALTER TABLE wg_ci.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wg_ci.media ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON wg_ci.posts TO wg_ci_guest, wg_ci_member;
GRANT INSERT, UPDATE, DELETE ON wg_ci.posts TO wg_ci_member;
-- Guests see only fully reviewed, explicitly consented, sanitized posts.
CREATE POLICY wg_ci_guest_published ON wg_ci.posts FOR SELECT TO wg_ci_guest
  USING (visibility='published' AND consent AND sanitized AND media_token IS NOT NULL);
-- Member sees the same public cards plus their own (never strangers' private rows).
CREATE POLICY wg_ci_member_visible ON wg_ci.posts FOR SELECT TO wg_ci_member
  USING (
    (visibility='published' AND consent AND sanitized AND media_token IS NOT NULL)
    OR owner_id = NULLIF(current_setting('wg_ci.actor',true),'')::uuid
  );
-- Owner may create only private posts. No direct public publication.
CREATE POLICY wg_ci_member_insert ON wg_ci.posts FOR INSERT TO wg_ci_member
  WITH CHECK(owner_id = NULLIF(current_setting('wg_ci.actor',true),'')::uuid AND visibility='private');
CREATE POLICY wg_ci_member_update ON wg_ci.posts FOR UPDATE TO wg_ci_member
  USING(owner_id = NULLIF(current_setting('wg_ci.actor',true),'')::uuid AND visibility='private')
  WITH CHECK(owner_id = NULLIF(current_setting('wg_ci.actor',true),'')::uuid AND visibility='private');
CREATE POLICY wg_ci_member_delete ON wg_ci.posts FOR DELETE TO wg_ci_member
  USING(owner_id = NULLIF(current_setting('wg_ci.actor',true),'')::uuid AND visibility='private');
-- Crucial: no grants or policies expose raw private media.
INSERT INTO wg_ci.posts(id,owner_id,visibility,consent,sanitized,title,media_token) VALUES
 ('00000000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','published',true,true,'Published A','11111111-1111-4111-8111-111111111111'),
 ('00000000-0000-4000-8000-000000000002','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','private',false,false,'Private B',null),
 ('00000000-0000-4000-8000-000000000003','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','published',false,true,'Unconsented B','33333333-3333-4333-8333-333333333333'),
 ('00000000-0000-4000-8000-000000000004','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','hidden',true,true,'Hidden B','44444444-4444-4444-8444-444444444444'),
 ('00000000-0000-4000-8000-000000000005','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','published',true,false,'Unreviewed B','55555555-5555-4555-8555-555555555555'),
 ('00000000-0000-4000-8000-000000000006','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','pending',true,true,'Pending B','66666666-6666-4666-8666-666666666666');
INSERT INTO wg_ci.media(token,post_id,private_path) VALUES
 ('11111111-1111-4111-8111-111111111111','00000000-0000-4000-8000-000000000001','private/a/raw.jpg');
SET ROLE wg_ci_guest;
DO $check$
DECLARE visible_count integer; labels text;
BEGIN
 SELECT count(*),string_agg(title,',') INTO visible_count,labels FROM wg_ci.posts;
 IF visible_count <> 1 OR labels <> 'Published A' THEN
  RAISE EXCEPTION 'guest privacy failure: % / %', visible_count, labels;
 END IF;
 IF has_table_privilege(current_user,'wg_ci.media','SELECT') THEN
  RAISE EXCEPTION 'guest can read private media mapping';
 END IF;
END $check$;
RESET ROLE;
SELECT set_config('wg_ci.actor','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
SET ROLE wg_ci_member;
DO $check$
DECLARE visible_count integer; result_count integer; forbidden_count integer;
BEGIN
 SELECT count(*) INTO visible_count FROM wg_ci.posts;
 IF visible_count <> 6 THEN RAISE EXCEPTION 'owner B cannot read their own records: %',visible_count; END IF;
 SELECT count(*) INTO forbidden_count FROM wg_ci.posts WHERE owner_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' AND visibility<>'published';
 IF forbidden_count <> 0 THEN RAISE EXCEPTION 'cross-account private read'; END IF;
 IF has_table_privilege(current_user,'wg_ci.media','SELECT') THEN
   RAISE EXCEPTION 'member can read private media mapping';
 END IF;
 BEGIN
  UPDATE wg_ci.posts SET visibility='published' WHERE id='00000000-0000-4000-8000-000000000002';
  RAISE EXCEPTION 'owner bypassed publication review';
 EXCEPTION
  WHEN insufficient_privilege OR check_violation OR with_check_option_violation THEN NULL;
 END;
 UPDATE wg_ci.posts SET title='Malicious edit' WHERE id='00000000-0000-4000-8000-000000000001';
 GET DIAGNOSTICS result_count=ROW_COUNT;
 IF result_count <> 0 THEN RAISE EXCEPTION 'owner B changed owner A public post'; END IF;
 DELETE FROM wg_ci.posts WHERE id='00000000-0000-4000-8000-000000000001';
 GET DIAGNOSTICS result_count=ROW_COUNT;
 IF result_count <> 0 THEN RAISE EXCEPTION 'owner B deleted owner A public post'; END IF;
END $check$;
RESET ROLE;
SELECT set_config('wg_ci.actor','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
SET ROLE wg_ci_member;
DO $check$
DECLARE visible_count integer;
BEGIN
 SELECT count(*) INTO visible_count FROM wg_ci.posts;
 IF visible_count <> 1 THEN RAISE EXCEPTION 'owner A can see B private posts'; END IF;
END $check$;
RESET ROLE;
ROLLBACK;
\echo 'PASS: isolated PostgreSQL RLS guest/owner/private media and publish-denial checks; all changes rolled back.'
