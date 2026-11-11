-- Run only under GitHub Actions disposable PostgreSQL 17 service.
-- All users, roles, schemas, fixtures and V1 schema are inside one rollback.
\set ON_ERROR_STOP on
BEGIN;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
INSERT INTO auth.users(id) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
 ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');
\ir ../../supabase/review-only/WG_V1_CommunityDB.sql

-- Confirm server-only Data API model and no accidental browser RPC exposure.
DO $verify$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['wg_v1_staff_roles','wg_v1_public_posts','wg_v1_sealed_media','wg_v1_post_audit'] LOOP
   IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid=('public.'||t)::regclass) THEN
     RAISE EXCEPTION 'Missing RLS: %',t;
   END IF;
   IF has_table_privilege('anon','public.'||t,'SELECT') OR
      has_table_privilege('authenticated','public.'||t,'SELECT') OR
      has_table_privilege('authenticated','public.'||t,'INSERT') OR
      has_table_privilege('authenticated','public.'||t,'UPDATE') OR
      has_table_privilege('authenticated','public.'||t,'DELETE') THEN
     RAISE EXCEPTION 'Client has source-table rights: %',t;
   END IF;
 END LOOP;
 IF has_function_privilege('anon','public.wg_v1_can_serve_media(uuid)','EXECUTE') OR
    has_function_privilege('authenticated','public.wg_v1_admin_post_action(uuid,uuid,text,text)','EXECUTE') OR
    has_function_privilege('authenticated','public.wg_v1_release_post(uuid,uuid)','EXECUTE') OR
    has_function_privilege('anon','public.wg_v1_owner_post_action(uuid,uuid,text)','EXECUTE') THEN
   RAISE EXCEPTION 'Leaked privilege to client RPC';
 END IF;
 IF NOT has_function_privilege('service_role','public.wg_v1_release_post(uuid,uuid)','EXECUTE') THEN
   RAISE EXCEPTION 'Server cannot release';
 END IF;
END $verify$;

-- Fixtures: only externally verified staff identities should be seeded this way.
-- Application must NEVER accept client-supplied actor identity as authority.
INSERT INTO public.wg_v1_staff_roles(user_id,staff_role,active) VALUES
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','moderator',true),
('dddddddd-dddd-4ddd-8ddd-dddddddddddd','admin',true),
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','moderator',false);
INSERT INTO public.wg_v1_public_posts(
  id,owner_id,status,author,title,body,country_code,country_name,theme,
  owner_consent,review_by,review_at,snapshot_sha256
) VALUES
('00000000-0000-4000-8000-000000000001',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','approved_staged','Owner A',
 'Safe reviewed memory',repeat('A',1000),'PH','Philippines','Nature',true,
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',now(),repeat('a',64)),
('00000000-0000-4000-8000-000000000002',
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','pending_review','Owner B',
 'Private unfinished memory',repeat('B',1000),'PH','Philippines','Nature',false,
 null,null,null),
('00000000-0000-4000-8000-000000000003',
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','approved_staged','Owner B',
 'No image safety',repeat('C',1000),'PH','Philippines','Nature',true,
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',now(),repeat('c',64)),
('00000000-0000-4000-8000-000000000004',
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','approved_staged','Owner B',
 'Ready for admin',repeat('D',1000),'PH','Philippines','Nature',true,
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',now(),repeat('d',64));
INSERT INTO public.wg_v1_sealed_media(
 token,post_id,position,source_path,reviewed_path,sha256,byte_length,
 sealed,exif_removed,human_approved
) VALUES
('11111111-1111-4111-8111-111111111111',
 '00000000-0000-4000-8000-000000000001',0,
 'private/a/test-source.jpg','reviewed/a/test-reviewed.webp',repeat('1',64),
 1234,true,true,true),
('33333333-3333-4333-8333-333333333333',
 '00000000-0000-4000-8000-000000000003',0,
 'private/b/test-source.jpg','reviewed/b/test-reviewed.webp',repeat('3',64),
 5678,true,false,true),
('44444444-4444-4444-8444-444444444444',
 '00000000-0000-4000-8000-000000000004',0,
 'private/b/test-source2.jpg','reviewed/b/test-reviewed2.webp',repeat('4',64),
 5678,true,true,true);

-- Reject nonstaff reviewer, owner self-approval, pending source, unsafe photo.
DO $verify$
DECLARE post_id uuid := '00000000-0000-4000-8000-000000000001';
        rev uuid;
BEGIN
 FOREACH rev IN ARRAY ARRAY[
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
   'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid] LOOP
   BEGIN
     PERFORM public.wg_v1_release_post(post_id,rev);
     RAISE EXCEPTION 'UNSAFE: unauthorized release accepted';
   EXCEPTION WHEN insufficient_privilege THEN NULL;
   END;
 END LOOP;
 BEGIN
   PERFORM public.wg_v1_release_post('00000000-0000-4000-8000-000000000003',
     'cccccccc-cccc-4ccc-8ccc-cccccccccccc');
   RAISE EXCEPTION 'UNSAFE: unclean photo published';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
   PERFORM public.wg_v1_release_post('00000000-0000-4000-8000-000000000002',
     'cccccccc-cccc-4ccc-8ccc-cccccccccccc');
   RAISE EXCEPTION 'UNSAFE: pending post published';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $verify$;

-- Verified server actor may release correctly staged post.
DO $verify$
BEGIN
 IF NOT public.wg_v1_release_post('00000000-0000-4000-8000-000000000001',
   'cccccccc-cccc-4ccc-8ccc-cccccccccccc') THEN
   RAISE EXCEPTION 'Reviewed post release failed';
 END IF;
 IF NOT public.wg_v1_can_serve_media('11111111-1111-4111-8111-111111111111') THEN
   RAISE EXCEPTION 'Published reviewed image cannot be served';
 END IF;
 IF public.wg_v1_can_serve_media('33333333-3333-4333-8333-333333333333') THEN
   RAISE EXCEPTION 'Unreviewed media allowed';
 END IF;
 IF (SELECT count(*) FROM public.wg_v1_post_audit WHERE action='publish') <> 1 THEN
   RAISE EXCEPTION 'Missing release audit';
 END IF;
END $verify$;

-- Owner B must not be able to delete/privatize Owner A; Owner A can revoke.
DO $verify$
BEGIN
 IF public.wg_v1_owner_post_action('00000000-0000-4000-8000-000000000001',
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','private') THEN
   RAISE EXCEPTION 'Owner B controlled Owner A post';
 END IF;
 IF NOT public.wg_v1_owner_post_action('00000000-0000-4000-8000-000000000001',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','private') THEN
   RAISE EXCEPTION 'Owner could not withdraw';
 END IF;
 IF public.wg_v1_can_serve_media('11111111-1111-4111-8111-111111111111') THEN
   RAISE EXCEPTION 'Private post still exposes image';
 END IF;
 IF (SELECT status FROM public.wg_v1_public_posts WHERE id='00000000-0000-4000-8000-000000000001') <> 'withdrawn' THEN
   RAISE EXCEPTION 'Incorrect withdrawal state';
 END IF;
 IF public.wg_v1_owner_post_action('00000000-0000-4000-8000-000000000001',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','private') THEN
   RAISE EXCEPTION 'Duplicate withdrawal accepted';
 END IF;
END $verify$;

-- Admin privileges derive from verified server-owned staff row only.
DO $verify$
BEGIN
 IF public.wg_v1_admin_post_action('00000000-0000-4000-8000-000000000004',
   'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','hide','Owner requested content removal') THEN
   RAISE EXCEPTION 'Ordinary member gained admin rights';
 END IF;
EXCEPTION WHEN insufficient_privilege THEN NULL;
END $verify$;

DO $verify$
BEGIN
 IF NOT public.wg_v1_release_post('00000000-0000-4000-8000-000000000004',
   'cccccccc-cccc-4ccc-8ccc-cccccccccccc') THEN
   RAISE EXCEPTION 'Post B release failed';
 END IF;
 IF NOT public.wg_v1_can_serve_media('44444444-4444-4444-8444-444444444444') THEN
   RAISE EXCEPTION 'Expected approved media';
 END IF;
 IF NOT public.wg_v1_admin_post_action('00000000-0000-4000-8000-000000000004',
   'dddddddd-dddd-4ddd-8ddd-dddddddddddd','hide',
   'The photo failed follow-up safety review') THEN
   RAISE EXCEPTION 'Verified admin could not hide';
 END IF;
 IF public.wg_v1_can_serve_media('44444444-4444-4444-8444-444444444444') THEN
   RAISE EXCEPTION 'Hidden post media not revoked';
 END IF;
 IF public.wg_v1_admin_post_action('00000000-0000-4000-8000-000000000004',
   'cccccccc-cccc-4ccc-8ccc-cccccccccccc','delete',
   'Moderator attempted admin delete') THEN
   RAISE EXCEPTION 'Moderator inherited admin role';
 END IF;
END $verify$;
ROLLBACK;
\echo 'PASS: staging-only V1 SQL schema; reviewer, owner, admin, privacy and media revocation checks rolled back.'
