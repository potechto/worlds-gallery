/** Offline QA for V2.23. No Postgres client or real Supabase access. */
import assert from 'node:assert/strict';
import {createPostgresRepository, pgRepositoryActions} from './WG_V223_PostgresRepository.mjs';
import {createServerBoundary} from './WG_V222_ServerBoundary.mjs';

const AUTHOR='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const MOD='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const OTHER='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const STORY='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const PHOTO='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const SUB='ffffffff-ffff-4fff-8fff-ffffffffffff';
const NOW='2026-11-09T05:30:00.000Z';
const authorStory={id:STORY,user_id:AUTHOR,status:'draft',author:'Explorer',title:'Samat',body:'A'.repeat(1200),country_code:'PH',country_name:'Philippines',region:'Central Luzon',city:'Pilar',theme:'nature',layout:'single',language_code:'en'};
const authorPhoto={id:PHOTO,story_id:STORY,user_id:AUTHOR,storage_path:AUTHOR+'/sample.jpg',position:0,mime_type:'image/jpeg'};
const attest={rights:true,consent:true,locationPrivacy:true};
const clone=value=>structuredClone(value);

function fakePool(options={}) {
  const state={stories:[clone(authorStory)],photos:[clone(authorPhoto)],submissions:[],photoRefs:[],audits:[]};
  const calls=[];
  let released=0;
  let active=0;
  let actor=options.actor??AUTHOR;
  const controls={...options};
  const pool={
    async connect(){
      if(controls.failConnect) throw Error('POOL_DOWN');
      let backup=null;
      return {
        async query(sql,params=[]){
          calls.push({sql,params:clone(params)});
          const flat=sql.replace(/\s+/g,' ').trim();
          if(flat==='BEGIN'){
            if(active) throw Error('NESTED_FAKE_TRANSACTION');
            backup=clone(state);active++;return {rows:[]};
          }
          if(flat==='COMMIT'){
            if(controls.failCommit) throw Error('COMMIT_DOWN');
            backup=null;active--;return {rows:[]};
          }
          if(flat==='ROLLBACK'){
            if(controls.failRollback)throw Error('ROLLBACK_DOWN');
            if(backup)Object.assign(state,clone(backup));
            backup=null;active--;return {rows:[]};
          }
          if(flat.startsWith('SET LOCAL'))return {rows:[]};
          if(!active)throw Error('QUERY_OUTSIDE_TRANSACTION');
          if(flat.includes('FROM auth.users')){
            return {rows: (controls.moderators??[MOD]).includes(params[0])?[{id:params[0]}]:[]};
          }
          if(flat.includes('FROM public.wg_stories')){
            return {rows:state.stories.filter(s=>s.id===params[0]&&s.user_id===params[1]&&s.status==='draft').map(clone)};
          }
          if(flat.includes('FROM public.wg_story_photos')){
            return {rows:state.photos.filter(p=>p.story_id===params[0]&&p.user_id===params[1]).sort((a,b)=>a.position-b.position).map(clone)};
          }
          if(flat.includes('FROM public.wg_publication_submissions')&&flat.includes('story_id = $1')){
            return {rows:state.submissions.filter(s=>s.story_id===params[0]&&['pending','in_review'].includes(s.status)).map(clone)};
          }
          if(flat.startsWith('INSERT INTO public.wg_publication_submissions')){
            if(state.submissions.some(s=>s.story_id===params[0]&&['pending','in_review'].includes(s.status))){
              const err=Error('duplicate active submission');err.code='23505';throw err;
            }
            state.submissions.push({id:SUB,story_id:params[0],owner_id:params[1],status:'pending',reviewer_id:null,
              author:params[2],title:params[3],body:params[4],country_code:params[5],country_name:params[6]});
            return {rows:[{id:SUB}]};
          }
          if(flat.startsWith('INSERT INTO public.wg_publication_submission_photos')){
            state.photoRefs.push({submission_id:params[0],source_photo_id:params[1],position:params[2]});return {rows:[]};
          }
          if(flat.startsWith('INSERT INTO public.wg_moderation_events')){
            if(controls.failAudit)throw Error('AUDIT_UNAVAILABLE');
            state.audits.push({submission_id:params[0],actor_id:params[1],action:params[2],occurred_at:params[3]});return {rows:[]};
          }
          if(flat.includes('FROM public.wg_publication_submissions')&&flat.includes('WHERE id = $1')){
            return {rows:state.submissions.filter(s=>s.id===params[0]).map(clone)};
          }
          if(flat.startsWith('UPDATE public.wg_publication_submissions')&&flat.includes("SET status = 'in_review'")){
            const s=state.submissions.find(s=>s.id===params[0]&&s.status==='pending'&&!s.reviewer_id&&s.owner_id!==params[1]);
            if(!s||controls.forceCasConflict)return {rows:[]};
            s.status='in_review';s.reviewer_id=params[1];return {rows:[{id:s.id}]};
          }
          if(flat.startsWith('UPDATE public.wg_publication_submissions')&&flat.includes('SET status = $3')){
            const s=state.submissions.find(s=>s.id===params[0]&&s.status==='in_review'&&s.reviewer_id===params[1]&&s.owner_id!==params[1]);
            if(!s||controls.forceCasConflict)return {rows:[]};
            s.status=params[2];s.public_feedback=params[4];return {rows:[{id:s.id}]};
          }
          throw Error('UNEXPECTED_SQL:'+flat.slice(0,110));
        },
        release(){released++;}
      };
    }
  };
  return {
    pool,state,calls,controls,
    setActor(id){actor=id;},getActor(){return actor;},
    get released(){return released;},get active(){return active;},
    seedPending(){state.submissions.push({id:SUB,story_id:STORY,owner_id:AUTHOR,status:'pending',reviewer_id:null});},
    seedClaimed(){state.submissions.push({id:SUB,story_id:STORY,owner_id:AUTHOR,status:'in_review',reviewer_id:MOD});}
  };
}
function makeDispatch(db){
  return createServerBoundary({
    auth:{async getUser(token){return token==='thisistesttoken'?{data:{user:{id:db.getActor()}},error:null}:{error:'bad'}}},
    rateLimit:async()=>true,
    serverNow:()=>NOW,
    repository:createPostgresRepository({pool:db.pool})
  });
}
const request=body=>({headers:new Headers({Authorization:'Bearer thisistesttoken'}),body});
const submit=()=>request({action:'submit',storyId:STORY,attestations:clone(attest)});
const claim=()=>request({action:'claim',submissionId:SUB});
const decide=(decision,feedback='')=>request({action:'decide',submissionId:SUB,decision,feedback});
let passed=0;
async function test(label,fn){await fn();passed++;console.log('PASS: '+label);}
async function rejectsCode(promise,code){await assert.rejects(promise,error=>error?.code===code||error?.message===code);}

await test('only submit claim decide are implemented (no release endpoint)',()=>{
  assert.deepEqual(pgRepositoryActions,['submit','claim','decide']);
});
await test('a server-supplied connection pool is mandatory',()=>{
  assert.throws(()=>createPostgresRepository({}),/SERVER_POOL_REQUIRED/);
});
await test('successful owner submission uses one BEGIN and one COMMIT',async()=>{
  const db=fakePool();const output=await makeDispatch(db)(submit());
  assert.equal(output.status,'pending');assert.equal(db.state.submissions.length,1);
  assert.equal(db.state.photoRefs.length,1);assert.equal(db.state.audits.length,1);
  assert.equal(db.calls.filter(x=>x.sql==='BEGIN').length,1);
  assert.equal(db.calls.filter(x=>x.sql==='COMMIT').length,1);
  assert.equal(db.calls.filter(x=>x.sql==='ROLLBACK').length,0);
});
await test('all submission and audit work shares a single connection',async()=>{
  const db=fakePool();await makeDispatch(db)(submit());
  assert.equal(db.released,1);assert.equal(db.active,0);
  assert(db.calls.some(c=>c.sql.includes('FOR UPDATE')));
});
await test('SQL uses $ parameters; story body cannot become SQL',async()=>{
  const db=fakePool();db.state.stories[0].title="Robert'); DROP TABLE important;--";
  await makeDispatch(db)(submit());
  const q=db.calls.find(c=>c.sql.includes('INSERT INTO public.wg_publication_submissions'));
  assert(q.params.includes("Robert'); DROP TABLE important;--"));
  assert(!q.sql.includes('Robert'));
  assert(q.sql.includes('$16'));
});
await test('no user-provided owner ID is accepted in the request',async()=>{
  const db=fakePool();await rejectsCode(makeDispatch(db)(request({action:'submit',storyId:STORY,ownerId:OTHER,attestations:attest})),'BODY_FIELDS_INVALID');
  assert.equal(db.calls.length,0);
});
await test('wrong owner causes ROLLBACK without persistent changes',async()=>{
  const db=fakePool({actor:OTHER});await rejectsCode(makeDispatch(db)(submit()),'NOT_OWNED_DRAFT');
  assert.equal(db.state.submissions.length,0);assert.equal(db.active,0);
  assert.equal(db.calls.filter(c=>c.sql==='ROLLBACK').length,1);
});
await test('all three author attestations are mandatory',async()=>{
  const db=fakePool();const r=submit();r.body.attestations.consent=false;
  await rejectsCode(makeDispatch(db)(r),'AUTHOR_ATTESTATIONS_REQUIRED');assert.equal(db.state.submissions.length,0);
});
await test('missing owned photo denies submission and rolls back',async()=>{
  const db=fakePool();db.state.photos=[];await rejectsCode(makeDispatch(db)(submit()),'PHOTO_COUNT_INVALID');
  assert.equal(db.state.submissions.length,0);
});
await test('active submission cannot be duplicated',async()=>{
  const db=fakePool();db.seedPending();await rejectsCode(makeDispatch(db)(submit()),'ACTIVE_SUBMISSION_EXISTS');
  assert.equal(db.state.submissions.length,1);assert.equal(db.state.audits.length,0);
});
await test('unique-index insert conflict rolls back safely',async()=>{
  const db=fakePool();db.controls.forceInsertUnique=true;
  const original=db.pool.connect;
  db.pool.connect=async()=>{const c=await original();const q=c.query; c.query=async(sql,args)=>{
    if(sql.includes('INSERT INTO public.wg_publication_submissions')){const e=Error('unique');e.code='23505';throw e;}
    return q(sql,args);
  };return c;};
  await assert.rejects(makeDispatch(db)(submit()),e=>e.code==='23505');
  assert.equal(db.state.audits.length,0);assert.equal(db.active,0);
});
await test('photo reference insert failure rolls back submission',async()=>{
  const db=fakePool();const original=db.pool.connect;
  db.pool.connect=async()=>{const c=await original();const q=c.query;c.query=async(sql,args)=>{
    if(sql.includes('INSERT INTO public.wg_publication_submission_photos'))throw Error('PHOTO_INSERT_DOWN');
    return q(sql,args);
  };return c;};
  await assert.rejects(makeDispatch(db)(submit()),/PHOTO_INSERT_DOWN/);
  assert.equal(db.state.submissions.length,0);assert.equal(db.state.photoRefs.length,0);
});
await test('failed audit append rolls back submission and photo refs',async()=>{
  const db=fakePool({failAudit:true});await assert.rejects(makeDispatch(db)(submit()),/AUDIT_UNAVAILABLE/);
  assert.equal(db.state.submissions.length,0);assert.equal(db.state.photoRefs.length,0);
  assert.equal(db.state.audits.length,0);assert.equal(db.released,1);
});
await test('non-moderator cannot claim review',async()=>{
  const db=fakePool();db.seedPending();db.setActor(OTHER);
  await rejectsCode(makeDispatch(db)(claim()),'MODERATOR_REQUIRED');
  assert.equal(db.state.submissions[0].status,'pending');
});
await test('moderator membership is queried from trusted auth app metadata',async()=>{
  const db=fakePool();db.seedPending();db.setActor(MOD);
  await makeDispatch(db)(claim());
  const roleQuery=db.calls.find(x=>x.sql.includes('FROM auth.users'));
  assert(roleQuery.sql.includes('raw_app_meta_data'));
  assert(!roleQuery.sql.includes('raw_user_meta_data'));
  assert(roleQuery.sql.includes('FOR SHARE'));
  assert.deepEqual(roleQuery.params,[MOD]);
});
await test('moderator claim conditionally changes pending to in_review',async()=>{
  const db=fakePool();db.seedPending();db.setActor(MOD);
  const output=await makeDispatch(db)(claim());
  assert.equal(output.status,'in_review');assert.equal(db.state.submissions[0].reviewer_id,MOD);
  assert.equal(db.state.audits[0].action,'review_started');
});
await test('reviewer cannot claim own submission, even if moderator',async()=>{
  const db=fakePool({moderators:[AUTHOR]});db.seedPending();
  await rejectsCode(makeDispatch(db)(claim()),'SELF_REVIEW_FORBIDDEN');
  assert.equal(db.state.submissions[0].status,'pending');
});
await test('stale CAS claim fails and audit remains empty',async()=>{
  const db=fakePool({forceCasConflict:true});db.seedPending();db.setActor(MOD);
  await rejectsCode(makeDispatch(db)(claim()),'REVIEW_CONFLICT');
  assert.equal(db.state.submissions[0].status,'pending');assert.equal(db.state.audits.length,0);
});
await test('assigned moderator can reject with written explanation',async()=>{
  const db=fakePool();db.seedClaimed();db.setActor(MOD);
  const output=await makeDispatch(db)(decide('rejected','Rights could not be verified.'));
  assert.equal(output.status,'rejected');assert.equal(db.state.submissions[0].status,'rejected');
  assert.equal(db.state.audits[0].action,'rejected');
});
await test('a different moderator cannot decide an assigned case',async()=>{
  const db=fakePool({moderators:[MOD,OTHER]});db.seedClaimed();db.setActor(OTHER);
  await rejectsCode(makeDispatch(db)(decide('rejected','No consent.')),'REVIEW_CLAIM_REQUIRED');
  assert.equal(db.state.submissions[0].status,'in_review');
});
await test('approval fails CLOSED until sealed media review exists',async()=>{
  const db=fakePool();db.seedClaimed();db.setActor(MOD);
  await assert.rejects(makeDispatch(db)(decide('approved')),/SEALED_REVIEW_NOT_IMPLEMENTED/);
  assert.equal(db.state.submissions[0].status,'in_review');assert.equal(db.state.audits.length,0);
});
await test('failed moderation audit rolls back rejection decision',async()=>{
  const db=fakePool({failAudit:true});db.seedClaimed();db.setActor(MOD);
  await assert.rejects(makeDispatch(db)(decide('rejected','Violation.')),/AUDIT_UNAVAILABLE/);
  assert.equal(db.state.submissions[0].status,'in_review');assert.equal(db.state.audits.length,0);
});
await test('stale decision CAS fails without changing status',async()=>{
  const db=fakePool({forceCasConflict:true});db.seedClaimed();db.setActor(MOD);
  await rejectsCode(makeDispatch(db)(decide('rejected','Violation.')),'REVIEW_CONFLICT');
  assert.equal(db.state.submissions[0].status,'in_review');
});
await test('reused transaction callback cannot execute after COMMIT',async()=>{
  const db=fakePool();const repo=createPostgresRepository({pool:db.pool});let captured;
  await repo.transaction(async tx=>{captured=tx;return true;});
  await assert.rejects(captured.loadSubmissionForUpdate(SUB),/TRANSACTION_CLOSED/);
});
await test('invalid connection cannot start transactions',async()=>{
  await assert.rejects(createPostgresRepository({pool:{async connect(){return {query:null,release(){}};}}}).transaction(()=>{}),/INVALID_CONNECTION/);
});
await test('connection failures do not report success',async()=>{
  const db=fakePool({failConnect:true});await assert.rejects(makeDispatch(db)(submit()),/POOL_DOWN/);
});
await test('COMMIT error reports failure and attempts rollback',async()=>{
  const db=fakePool({failCommit:true});await assert.rejects(makeDispatch(db)(submit()),/COMMIT_DOWN/);
  assert(db.calls.some(c=>c.sql==='ROLLBACK'));assert.equal(db.released,1);
});
await test('ROLLBACK failure is surfaced instead of hidden',async()=>{
  const db=fakePool({failAudit:true,failRollback:true});
  await assert.rejects(makeDispatch(db)(submit()),/WG_PG_ROLLBACK_FAILED/);
  assert.equal(db.released,1);
});
await test('SET LOCAL timeouts are applied inside every transaction',async()=>{
  const db=fakePool();await makeDispatch(db)(submit());
  const statements=db.calls.map(x=>x.sql);
  assert(statements.findIndex(x=>x==='BEGIN')<statements.findIndex(x=>x.startsWith('SET LOCAL')));
  assert(statements.some(s=>s.includes('statement_timeout')));
  assert(statements.some(s=>s.includes('lock_timeout')));
});
await test('unavailable publishing actions cannot reach SQL',async()=>{
  const db=fakePool();await rejectsCode(makeDispatch(db)(request({action:'release',submissionId:SUB})),'ACTION_NOT_AVAILABLE');
  assert.equal(db.calls.length,0);
});
console.log(JSON.stringify({version:'V2.23',postgresAdapterOfflineChecksPassed:passed,sqlDatabaseUsed:false,liveBackendChanged:false,publicPublishingEnabled:false},null,2));
