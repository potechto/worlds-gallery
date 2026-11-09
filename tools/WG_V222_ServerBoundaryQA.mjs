'use strict';
// Worlds Gallery V2.22 OFFLINE behavior tests: mocks, no real network/backend.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {WorkflowDenied} from './WG_V221_TrustedWorkflow.mjs';
import {createServerBoundary, serverBoundaryActions} from './WG_V222_ServerBoundary.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const uid='11111111-1111-4111-8111-111111111111';
const mod='22222222-2222-4222-8222-222222222222';
const outsider='33333333-3333-4333-8333-333333333333';
const sid='44444444-4444-4444-8444-444444444444';
const subId='55555555-5555-4555-8555-555555555555';
const photoId='77777777-7777-4777-8777-777777777777';
const now='2026-11-09T09:00:00.000Z';
const story={id:sid,user_id:uid,status:'draft',author:'Visitor',title:'The Mountain',body:'This is a real story. '.repeat(67),country_code:'PH',country_name:'Philippines',region:'Central Luzon',city:'Bataan',theme:'Nature',layout:'single',language_code:'en'};
const photo={id:photoId,story_id:sid,user_id:uid,position:0,storage_path:`${uid}/private/photo.jpg`,mime_type:'image/jpeg'};
const attestations={rights:true,consent:true,locationPrivacy:true};
const evidence={copyrightAndConsentReviewed:true,youthSafetyReviewed:true,locationPrivacyReviewed:true,storyAndMediaReviewed:true,mediaSnapshotSealed:true};
const fixtures={
  'owner-token-secure':uid,
  'moderator-token-secure':mod,
  'outsider-token-secure':outsider
};
const checks=[];
function test(name, fn){return Promise.resolve().then(fn).then(()=>{checks.push(name); console.log('PASS:',name)});}
async function rejects(code,fn){await assert.rejects(fn,e=>e instanceof WorkflowDenied && e.code===code, `Expected ${code}`);}
function req(body,token='owner-token-secure') {
  return {headers:new Headers({'authorization':`Bearer ${token}`}),body};
}
function setup({seedReview=false,moderators=[mod],rateAllowed=true}={}) {
  let state={
    stories:[structuredClone(story)], photos:[structuredClone(photo)], submissions:[], photoRefs:[],
    audits:[], moderators:[...moderators], evidence: {}
  };
  if(seedReview){state.submissions.push({...structuredClone(story),id:subId,story_id:sid,owner_id:uid,status:'pending',reviewer_id:null});}
  const stats={getUser:0,rate:0,transactions:0,commits:0,rollbacks:0};
  const flags={auditFails:false,claimConflict:false,decideConflict:false,insertConflict:false,rateAllowed,missingTxMethod:null};
  const deps={
    auth:{async getUser(token){stats.getUser++; const id=fixtures[token]; return id ? {data:{user:{id,user_metadata:{isModerator:true}}},error:null} : {data:{user:null},error:new Error('unauthorized')};}},
    async rateLimit({userId,action}){stats.rate++; return flags.rateAllowed && !!userId && serverBoundaryActions.includes(action);},
    serverNow:()=>now,
    repository:{async transaction(fn){
      stats.transactions++;
      const txState=structuredClone(state);
      const tx={
        async moderatorAuthorizedForUpdate(id){return txState.moderators.includes(id);},
        async loadOwnedDraftForUpdate(id){return txState.stories.find(s=>s.id===id)??null;},
        async loadOwnedPhotosForUpdate(id){return txState.photos.filter(p=>p.story_id===id);},
        async activeSubmissionExistsForUpdate(id){return txState.submissions.some(s=>s.story_id===id && ['pending','in_review'].includes(s.status));},
        async createSubmission(plan){
          if(flags.insertConflict || txState.submissions.some(s=>s.story_id===plan.story_id && ['pending','in_review'].includes(s.status)))throw Error('database partial unique conflict');
          txState.submissions.push({...structuredClone(plan),id:subId,reviewer_id:null});return subId;
        },
        async createSubmissionPhotoRefs(id,refs){txState.photoRefs.push(...refs.map(p=>({...p,submission_id:id})));},
        async loadSubmissionForUpdate(id){return txState.submissions.find(s=>s.id===id)??null;},
        async claimSubmissionCAS(plan){
          const s=txState.submissions.find(s=>s.id===plan.submission_id);
          if(flags.claimConflict || !s || s.status!=='pending' || s.reviewer_id) return false;
          s.status=plan.status;s.reviewer_id=plan.reviewer_id;s.claimed_at=plan.claimed_at;return true;
        },
        async loadSealedReviewEvidenceForUpdate(id){return txState.evidence[id]??null;},
        async decideSubmissionCAS(plan){
          const s=txState.submissions.find(s=>s.id===plan.submission_id);
          if(flags.decideConflict || !s || s.status!=='in_review' || s.reviewer_id!==plan.reviewer_id) return false;
          s.status=plan.status;s.public_feedback=plan.public_feedback;s.reviewed_at=plan.reviewed_at;return true;
        },
        async appendAudit(e){if(flags.auditFails)throw Error('audit failed');txState.audits.push(structuredClone(e));}
      };
      if(flags.missingTxMethod)delete tx[flags.missingTxMethod];
      try {const result=await fn(tx);state=txState;stats.commits++;return result;}
      catch(e){stats.rollbacks++;throw e;}
    }}
  };
  return {dispatch:createServerBoundary(deps),get state(){return state},stats,flags,deps};
}

await test('only submit claim decide are available (no stage, release or media)',()=>{
 assert.deepEqual([...serverBoundaryActions].sort(),['claim','decide','submit']);
});
await test('fails configuration when trusted dependencies are missing',()=>{
 assert.throws(()=>createServerBoundary({}),/SERVER_DEPENDENCIES_MISSING/);
});
await test('no authorization header denies before any transaction',async()=>{
 const f=setup();await rejects('AUTH_REQUIRED',()=>f.dispatch({headers:new Headers(),body:{action:'submit',storyId:sid,attestations}}));assert.equal(f.stats.transactions,0);
});
await test('malformed bearer header is denied',async()=>{
 const f=setup();await rejects('AUTH_REQUIRED',()=>f.dispatch({headers:new Headers({'authorization':'Basic owner-token-secure'}),body:{action:'submit',storyId:sid,attestations}}));
});
await test('Supabase getUser rejects invalid or revoked token',async()=>{
 const f=setup();await rejects('AUTH_REQUIRED',()=>f.dispatch(req({action:'submit',storyId:sid,attestations},'revoked-token-123456')));assert.equal(f.stats.transactions,0);
});
await test('user identity in request body is rejected',async()=>{
 const f=setup();await rejects('BODY_FIELDS_INVALID',()=>f.dispatch(req({action:'submit',storyId:sid,attestations,principal:{userId:uid,verifiedByServer:true}})));
});
await test('client moderator and evidence flags are rejected',async()=>{
 const f=setup({seedReview:true});await rejects('BODY_FIELDS_INVALID',()=>f.dispatch(req({action:'decide',submissionId:subId,decision:'approved',serverReview:evidence},'moderator-token-secure')));
});
await test('arbitrary status field is rejected',async()=>{
 const f=setup();await rejects('BODY_FIELDS_INVALID',()=>f.dispatch(req({action:'submit',storyId:sid,attestations,status:'published'})));
});
await test('unsupported release action denied without transaction',async()=>{
 const f=setup();await rejects('ACTION_NOT_AVAILABLE',()=>f.dispatch(req({action:'release',galleryId:subId})));assert.equal(f.stats.transactions,0);
});
await test('empty and invalid action envelopes denied',async()=>{
 const f=setup();await rejects('BODY_INVALID',()=>f.dispatch(req(null)));await rejects('ACTION_NOT_AVAILABLE',()=>f.dispatch(req({action:'publish'})));
});
await test('oversized payload denied',async()=>{
 const f=setup();await rejects('BODY_TOO_LARGE',()=>f.dispatch(req({action:'submit',storyId:sid,attestations:{...attestations,notes:'x'.repeat(5000)}})));
});
await test('rate limiter denies before database transaction',async()=>{
 const f=setup({rateAllowed:false});await rejects('RATE_LIMITED',()=>f.dispatch(req({action:'submit',storyId:sid,attestations})));assert.equal(f.stats.transactions,0);
});
await test('role cannot be inferred from verified user_metadata',async()=>{
 const f=setup({seedReview:true,moderators:[]});await rejects('MODERATOR_REQUIRED',()=>f.dispatch(req({action:'claim',submissionId:subId},'moderator-token-secure')));
});
await test('owner submit persists pending, private photo references and audit in one transaction',async()=>{
 const f=setup();const out=await f.dispatch(req({action:'submit',storyId:sid,attestations}));
 assert.deepEqual(out,{ok:true,action:'submit',submissionId:subId,status:'pending'});
 assert.equal(f.state.submissions.length,1);assert.equal(f.state.photoRefs.length,1);assert.equal(f.state.audits.length,1);
 assert.equal(f.state.submissions[0].status,'pending'); assert.equal(f.stats.commits,1);
 for(const hidden of ['storage_path','source_photo_id','owner_id','serverReview','signedUrl','role'])assert.equal(Object.hasOwn(out,hidden),false);
});
await test('wrong owner cannot submit existing draft',async()=>{
 const f=setup();await rejects('NOT_OWNED_DRAFT',()=>f.dispatch(req({action:'submit',storyId:sid,attestations},'outsider-token-secure')));assert.equal(f.state.submissions.length,0);
});
await test('user must explicitly attest all three protections',async()=>{
 const f=setup();await rejects('AUTHOR_ATTESTATIONS_REQUIRED',()=>f.dispatch(req({action:'submit',storyId:sid,attestations:{rights:true,consent:true,locationPrivacy:false}})));
});
await test('existing active submission cannot be duplicated',async()=>{
 const f=setup({seedReview:true});await rejects('ACTIVE_SUBMISSION_EXISTS',()=>f.dispatch(req({action:'submit',storyId:sid,attestations})));assert.equal(f.state.submissions.length,1);
});
await test('unique conflict from repository rolls back',async()=>{
 const f=setup();f.flags.insertConflict=true;await assert.rejects(()=>f.dispatch(req({action:'submit',storyId:sid,attestations})),/partial unique conflict/);assert.equal(f.state.submissions.length,0);assert.equal(f.stats.rollbacks,1);
});
await test('bad photo ownership is denied by domain validation',async()=>{
 const f=setup();f.state.photos[0].user_id=outsider;await rejects('PHOTO_NOT_OWNED',()=>f.dispatch(req({action:'submit',storyId:sid,attestations})));
});
await test('failed audit append rolls back submission and photo refs',async()=>{
 const f=setup();f.flags.auditFails=true;await assert.rejects(()=>f.dispatch(req({action:'submit',storyId:sid,attestations})),/audit failed/);assert.equal(f.state.submissions.length,0);assert.equal(f.state.photoRefs.length,0);assert.equal(f.state.audits.length,0);
});
await test('missing transaction-port method fails closed and rolls back',async()=>{
 const f=setup();f.flags.missingTxMethod='createSubmissionPhotoRefs';await assert.rejects(()=>f.dispatch(req({action:'submit',storyId:sid,attestations})),/REPOSITORY_CONTRACT_MISSING/);assert.equal(f.state.submissions.length,0);
});
await test('owner cannot claim own submission even with server-authorized role',async()=>{
 const f=setup({seedReview:true,moderators:[uid]});await rejects('SELF_REVIEW_FORBIDDEN',()=>f.dispatch(req({action:'claim',submissionId:subId})));
});
await test('trusted moderator claims pending review and audits event',async()=>{
 const f=setup({seedReview:true});const out=await f.dispatch(req({action:'claim',submissionId:subId},'moderator-token-secure'));
 assert.deepEqual(out,{ok:true,action:'claim',submissionId:subId,status:'in_review'});
 assert.equal(f.state.submissions[0].reviewer_id,mod);assert.equal(f.state.audits[0].action,'review_started');
});
await test('duplicate claim denies with no second audit',async()=>{
 const f=setup({seedReview:true});await f.dispatch(req({action:'claim',submissionId:subId},'moderator-token-secure'));await rejects('REVIEW_NOT_PENDING',()=>f.dispatch(req({action:'claim',submissionId:subId},'moderator-token-secure')));assert.equal(f.state.audits.length,1);
});
await test('claim CAS race is detected and rolled back',async()=>{
 const f=setup({seedReview:true});f.flags.claimConflict=true;await rejects('REVIEW_CONFLICT',()=>f.dispatch(req({action:'claim',submissionId:subId},'moderator-token-secure')));assert.equal(f.state.submissions[0].status,'pending');assert.equal(f.state.audits.length,0);
});
await test('reviewer approval cannot come from absent server evidence',async()=>{
 const f=setup({seedReview:true});await f.dispatch(req({action:'claim',submissionId:subId},'moderator-token-secure'));
 await rejects('MODERATION_INCOMPLETE',()=>f.dispatch(req({action:'decide',submissionId:subId,decision:'approved'},'moderator-token-secure')));
});
await test('sealed evidence from server-owned transaction permits only private approval',async()=>{
 const f=setup({seedReview:true});await f.dispatch(req({action:'claim',submissionId:subId},'moderator-token-secure'));
 f.state.evidence[subId]={...evidence};const out=await f.dispatch(req({action:'decide',submissionId:subId,decision:'approved'},'moderator-token-secure'));
 assert.equal(out.status,'approved');assert.equal(out.published_at,undefined);assert.equal(f.state.submissions[0].status,'approved');assert.equal(f.state.audits.length,2);
});
await test('approval cannot be forced by a partial review checklist',async()=>{
 const f=setup({seedReview:true});await f.dispatch(req({action:'claim',submissionId:subId},'moderator-token-secure'));
 f.state.evidence[subId]={mediaSnapshotSealed:true};await rejects('MODERATION_INCOMPLETE',()=>f.dispatch(req({action:'decide',submissionId:subId,decision:'approved'},'moderator-token-secure')));
});
await test('rejection needs meaningful feedback',async()=>{
 const f=setup({seedReview:true});await f.dispatch(req({action:'claim',submissionId:subId},'moderator-token-secure'));
 await rejects('REJECTION_REASON_REQUIRED',()=>f.dispatch(req({action:'decide',submissionId:subId,decision:'rejected'},'moderator-token-secure')));
});
await test('assigned moderator may reject without publishing',async()=>{
 const f=setup({seedReview:true});await f.dispatch(req({action:'claim',submissionId:subId},'moderator-token-secure'));
 const out=await f.dispatch(req({action:'decide',submissionId:subId,decision:'rejected',feedback:'Sensitive GPS'},'moderator-token-secure'));
 assert.equal(out.status,'rejected');assert.equal(f.state.submissions[0].public_feedback,'Sensitive GPS');
});
await test('another moderator cannot decide a claimed submission',async()=>{
 const f=setup({seedReview:true,moderators:[mod,outsider]});await f.dispatch(req({action:'claim',submissionId:subId},'moderator-token-secure'));
 await rejects('REVIEW_CLAIM_REQUIRED',()=>f.dispatch(req({action:'decide',submissionId:subId,decision:'rejected',feedback:'No'},'outsider-token-secure')));
});
await test('decision CAS race prevents status and audit changes',async()=>{
 const f=setup({seedReview:true});await f.dispatch(req({action:'claim',submissionId:subId},'moderator-token-secure'));
 f.flags.decideConflict=true;await rejects('REVIEW_CONFLICT',()=>f.dispatch(req({action:'decide',submissionId:subId,decision:'rejected',feedback:'No'},'moderator-token-secure')));
 assert.equal(f.state.submissions[0].status,'in_review');assert.equal(f.state.audits.length,1);
});
await test('audit failure after decision reverts status',async()=>{
 const f=setup({seedReview:true});await f.dispatch(req({action:'claim',submissionId:subId},'moderator-token-secure'));
 f.flags.auditFails=true;await assert.rejects(()=>f.dispatch(req({action:'decide',submissionId:subId,decision:'rejected',feedback:'No'},'moderator-token-secure')),/audit failed/);
 assert.equal(f.state.submissions[0].status,'in_review');
});
await test('no network/Storage/Edge endpoint is invoked or imported',()=>{
 const code=readFileSync(join(here,'WG_V222_ServerBoundary.mjs'),'utf8');
 assert.doesNotMatch(code,/\bfetch\s*\(|Deno\.serve\s*\(|createSignedUrl\s*\(|createClient\s*\(/);
 assert.doesNotMatch(code,/\bplanRelease\s*\(|\bplanStage\s*\(|\bpublicGalleryView\s*\(/);
});
console.log(JSON.stringify({version:'V2.22',offlineBoundaryChecksPassed:checks.length,liveBackendChanged:false,publicPublishingEnabled:false},null,2));
