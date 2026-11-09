'use strict';
// OFFLINE domain tests. No Supabase access, browser, Git or network.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {
 WorkflowDenied, planSubmit, planStartReview, planDecision,
 planStage, planRelease, planWithdraw, publicGalleryView, publishedMediaAllowed
} from './WG_V221_TrustedWorkflow.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const uid='11111111-1111-4111-8111-111111111111';
const modId='22222222-2222-4222-8222-222222222222';
const outsider='33333333-3333-4333-8333-333333333333';
const sid='44444444-4444-4444-8444-444444444444';
const subId='55555555-5555-4555-8555-555555555555';
const galleryId='66666666-6666-4666-8666-666666666666';
const photoId='77777777-7777-4777-8777-777777777777';
const now='2026-11-09T05:30:00.000Z';
const author={userId:uid,verifiedByServer:true,moderatorAuthorizedByServer:false};
const reviewer={userId:modId,verifiedByServer:true,moderatorAuthorizedByServer:true};
const thirdParty={userId:outsider,verifiedByServer:true,moderatorAuthorizedByServer:false};
const badReviewer={...reviewer,moderatorAuthorizedByServer:false};
const story={id:sid,user_id:uid,status:'draft',author:'Visitor',title:'The Mountain',body:'This is a real story. '.repeat(67),country_code:'PH',country_name:'Philippines',region:'Central Luzon',city:'Bataan',theme:'Nature',layout:'single',language_code:'en'};
const photos=[{id:photoId,story_id:sid,user_id:uid,position:0,storage_path:`${uid}/private/photo.jpg`,mime_type:'image/jpeg'}];
const attestations={rights:true,consent:true,locationPrivacy:true};
const submission={...story,id:subId,story_id:sid,owner_id:uid,status:'pending'};
const claimed={...submission,status:'in_review',reviewer_id:modId};
const approved={...submission,status:'approved'};
const staged={...story,id:galleryId,submission_id:subId,status:'staged'};
const published={...staged,status:'published',published_at:now,storage_path:'SHOULD_NOT_LEAK',user_id:uid,source_photo_id:photoId,gps:{lat:0,long:0}};
const checks=[];
function test(name,fn){fn();checks.push(name); console.log('PASS:',name);}
function rejects(expected, fn){assert.throws(fn,e=>e instanceof WorkflowDenied && e.code===expected, `expected ${expected}`);}
function run(){
 test('owner can plan a private pending submission with one photo',()=>{
  const p=planSubmit({principal:author,story,photos,attestations,now});
  assert.equal(p.status,'pending'); assert.equal(p.story_id,sid);
  assert.deepEqual(p.photos,[{source_photo_id:photoId,position:0}]);
  assert.equal(p.published_at,undefined);
  assert.equal(Object.isFrozen(p.photos),true);
 });
 test('missing verified session is denied',()=>rejects('AUTH_REQUIRED',()=>planSubmit({principal:{userId:uid},story,photos,attestations,now})));
 test('different account cannot submit another owner draft',()=>rejects('NOT_OWNED_DRAFT',()=>planSubmit({principal:thirdParty,story,photos,attestations,now})));
 test('active submission cannot be duplicated',()=>rejects('ACTIVE_SUBMISSION_EXISTS',()=>planSubmit({principal:author,story,photos,attestations,existingActiveSubmission:true,now})));
 test('photo ownership is checked',()=>rejects('PHOTO_NOT_OWNED',()=>planSubmit({principal:author,story,photos:[{...photos[0],user_id:outsider}],attestations,now})));
 test('photo path must remain under owner prefix',()=>rejects('PHOTO_PATH_INVALID',()=>planSubmit({principal:author,story,photos:[{...photos[0],storage_path:`${outsider}/photo.jpg`}],attestations,now})));
 test('photo content type must be approved',()=>rejects('PHOTO_TYPE_INVALID',()=>planSubmit({principal:author,story,photos:[{...photos[0],mime_type:'image/svg+xml'}],attestations,now})));
 test('photo sequence must be unique and contiguous',()=>rejects('PHOTO_SEQUENCE_INVALID',()=>planSubmit({principal:author,story,photos:[{...photos[0],position:2}],attestations,now})));
 test('photo count is limited to one through four',()=>rejects('PHOTO_COUNT_INVALID',()=>planSubmit({principal:author,story,photos:[],attestations,now})));
 test('attestations must be explicit booleans',()=>rejects('AUTHOR_ATTESTATIONS_REQUIRED',()=>planSubmit({principal:author,story,photos,attestations:{rights:true,consent:true,locationPrivacy:'true'},now})));
 test('minimum story length is enforced',()=>rejects('STORY_LENGTH_INVALID',()=>planSubmit({principal:author,story:{...story,body:'too short'},photos,attestations,now})));
 test('no author may act as their own moderator',()=>rejects('SELF_REVIEW_FORBIDDEN',()=>planStartReview({principal:{...author,moderatorAuthorizedByServer:true},submission,now})));
 test('user-editable moderator flag is not enough when missing server gate',()=>rejects('MODERATOR_REQUIRED',()=>planStartReview({principal:badReviewer,submission,now})));
 test('moderator may claim a pending review',()=>{
  const p=planStartReview({principal:reviewer,submission,now});
  assert.equal(p.expected_status,'pending');assert.equal(p.status,'in_review');assert.equal(p.reviewer_id,modId);assert.equal(p.claimed_at,now);
 });
 test('claimed or approved review cannot be claimed twice',()=>rejects('REVIEW_NOT_PENDING',()=>planStartReview({principal:reviewer,submission:claimed,now})));
 test('unassigned reviewer cannot decide on another claimed submission',()=>rejects('REVIEW_CLAIM_REQUIRED',()=>planDecision({principal:{...reviewer,userId:outsider},submission:claimed,decision:'rejected',feedback:'not allowed',now})));
 test('moderator cannot skip server safety review evidence',()=>rejects('MODERATION_INCOMPLETE',()=>planDecision({principal:reviewer,submission:claimed,decision:'approved',serverReview:{youthSafetyReviewed:true},now})));
 const completeReview={copyrightAndConsentReviewed:true,youthSafetyReviewed:true,locationPrivacyReviewed:true,storyAndMediaReviewed:true,mediaSnapshotSealed:true};
 test('approval is a moderation decision, not public release',()=>{
  const p=planDecision({principal:reviewer,submission:claimed,decision:'approved',serverReview:completeReview,now});
  assert.equal(p.status,'approved');assert.equal(p.published_at,undefined);
 });
 test('rejection requires feedback',()=>rejects('REJECTION_REASON_REQUIRED',()=>planDecision({principal:reviewer,submission:claimed,decision:'rejected',feedback:'',now})));
 test('a moderation rejection stays non-public',()=>{
  const p=planDecision({principal:reviewer,submission:claimed,decision:'rejected',feedback:'Blurry photo',now});
  assert.equal(p.status,'rejected');assert.equal(p.public_feedback,'Blurry photo');
 });
 test('unsealed images cannot be staged',()=>rejects('UNSEALED_MEDIA',()=>planStage({principal:reviewer,submission:approved,sealedMediaVerified:false,now})));
 test('staged gallery snapshot omits private identifiers and media links',()=>{
  const p=planStage({principal:reviewer,submission:{...approved,storage_path:'private',user_id:uid,gps:{a:2}},sealedMediaVerified:true,now});
  assert.equal(p.status,'staged');assert.equal(p.storage_path,undefined);assert.equal(p.owner_id,undefined);assert.equal(p.gps,undefined);
 });
 test('staged gallery cannot be shown in public feed',()=>rejects('NOT_PUBLIC',()=>publicGalleryView(staged)));
 test('release needs broker and media-safety checks',()=>rejects('RELEASE_NOT_READY',()=>planRelease({principal:reviewer,submission:approved,gallery:staged,serverRelease:{sealedMediaUnchanged:true},now})));
 const completeRelease={sealedMediaUnchanged:true,privacyMetadataRemoved:true,mediaBrokerAccessChecked:true,noTakedownOrOpenSafetyHold:true,publicationTransactionReady:true};
 test('release plan requires approved and staged states and emits only a conditional intent',()=>{
  const p=planRelease({principal:reviewer,submission:approved,gallery:staged,serverRelease:completeRelease,now});
  assert.equal(p.expected_status,'staged');assert.equal(p.status,'published');assert.equal(p.gallery_story_id,galleryId);
 });
 test('even a reviewer cannot release their own story',()=>rejects('SELF_REVIEW_FORBIDDEN',()=>planRelease({principal:{...author,moderatorAuthorizedByServer:true},submission:approved,gallery:staged,serverRelease:completeRelease,now})));
 test('public DTO whitelists display metadata only',()=>{
  const publicStory=publicGalleryView(published);
  assert.equal(publicStory.title,story.title);
  for(const hidden of ['user_id','owner_id','storage_path','source_photo_id','gps','submission_id'])assert.equal(Object.hasOwn(publicStory,hidden),false,hidden);
 });
 test('media broker gating denies staged, unmatched, or held photos',()=>{
  assert.equal(publishedMediaAllowed({gallery:staged,photoPosition:0,releasedPositions:[0]}),false);
  assert.equal(publishedMediaAllowed({gallery:published,photoPosition:1,releasedPositions:[0]}),false);
  assert.equal(publishedMediaAllowed({gallery:published,photoPosition:0,releasedPositions:[0],onSafetyHold:true}),false);
  assert.equal(publishedMediaAllowed({gallery:published,photoPosition:0,releasedPositions:[0]}),true);
 });
 test('owner can request takedown only for owned published story',()=>{
  rejects('WITHDRAW_FORBIDDEN',()=>planWithdraw({principal:thirdParty,submission:approved,gallery:published,now}));
  const p=planWithdraw({principal:author,submission:approved,gallery:published,now});
  assert.equal(p.status,'withdrawn');assert.equal(p.expected_status,'published');
 });
 test('public content is invisible after withdrawal',()=>{
  assert.equal(publishedMediaAllowed({gallery:{...published,status:'withdrawn'},photoPosition:0,releasedPositions:[0]}),false);
  rejects('NOT_PUBLIC',()=>publicGalleryView({...published,status:'withdrawn'}));
 });
 test('V2.20 schema preview remains rollback-only',()=>{
  const s=readFileSync(join(here,'wg_v220_moderation_preview.sql'),'utf8').replace(/--[^\n]*/g,'').trim();
  assert.match(s,/^BEGIN\s*;/);assert.match(s,/ROLLBACK\s*;$/);assert.doesNotMatch(s,/\bCOMMIT\s*;/i);
 });
 test('V2.21 keeps public source-photo IDs server-only',()=>{
  const s=readFileSync(join(here,'wg_v220_moderation_preview.sql'),'utf8').replace(/--[^\n]*/g,'');
  assert.doesNotMatch(s,/GRANT SELECT ON public\.wg_gallery_photos TO (?:anon|authenticated)/i);
  assert.doesNotMatch(s,/CREATE POLICY\s+\w+\s+ON public\.wg_gallery_photos/i);
  assert.match(s,/REVOKE ALL ON public\.wg_gallery_photos FROM PUBLIC, anon, authenticated/);
 });
 test('pure domain module has no live API or secret access',()=>{
  const s=readFileSync(join(here,'WG_V221_TrustedWorkflow.mjs'),'utf8');
  assert.doesNotMatch(s,/\bfetch\s*\(|Deno\.env\.get\s*\(|process\.env\s*\[|createClient\s*\(/);
 });
 console.log(JSON.stringify({version:'V2.21',offlineWorkflowChecksPassed:checks.length,liveBackendChanged:false,frontendChanged:false,publicPublishingEnabled:false},null,2));
}
run();
