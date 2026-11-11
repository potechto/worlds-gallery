import test from 'node:test';
import assert from 'node:assert/strict';
import {LIVE_PROJECT_REF, stagingGateway, normalizePublicCard, parsePublicFeed, publicMediaURL} from '../wg_v1_public_contract.mjs';
const ref = 'abcdefghijklmnopqrst';
const base = {enabled:true,projectRef:ref,siteOrigin:'https://potechto.github.io',
  gatewayUrl:'https://' + ref + '.supabase.co/functions/v1/wg-community'};
const id = '11111111-1111-4111-8111-111111111111';
const token = '22222222-2222-4222-8222-222222222222';
const row = {id, status:'published',title:'Our morning in the forest',body:'A'.repeat(1000),
 author:'Traveler',country_code:'PH',country_name:'Philippines',theme:'Nature',
 created_at:'2026-11-11T08:00:00Z',media_tokens:[token],
 owner_id:'secret-account-uuid',email:'never@example.com',city:'private location',
 region:'private region',storage_path:'private/raw/source.jpg',service_role:'not-for-clients'};
test('requires explicit staging enable',()=>assert.throws(()=>stagingGateway({...base,enabled:false},base.siteOrigin)));
test('refuses production Supabase project even if enabled',()=>assert.throws(()=>stagingGateway({...base,projectRef:LIVE_PROJECT_REF,gatewayUrl:'https://'+LIVE_PROJECT_REF+'.supabase.co/functions/v1/wg-community'},base.siteOrigin)));
test('requires exact approved site origin',()=>assert.throws(()=>stagingGateway(base,'https://evil.example')));
test('refuses HTTP, credentials, queries and wrong path',()=>{
 for(const gatewayUrl of ['http://'+ref+'.supabase.co/functions/v1/wg-community',
 'https://u:p@'+ref+'.supabase.co/functions/v1/wg-community',
 'https://'+ref+'.supabase.co/functions/v1/wg-community?key=x',
 'https://'+ref+'.supabase.co/functions/v1/wg-admin'])
 assert.throws(()=>stagingGateway({...base,gatewayUrl},base.siteOrigin));
});
test('accepts exact isolated staging endpoint',()=>assert.equal(stagingGateway(base,base.siteOrigin).host,ref+'.supabase.co'));
test('public feed drops all private source metadata',()=>{
 const card=normalizePublicCard(row);
 assert.deepEqual(Object.keys(card).sort(),['id','title','body','author','countryName','countryCode','theme','createdAt','mediaTokens'].sort());
 assert.ok(!JSON.stringify(card).includes('private'));
 assert.ok(!JSON.stringify(card).includes('never@example.com'));
});
test('rejects unpublished cards and raw/unreviewed media',()=>{
 for(const status of ['draft','pending','approved_staged','hidden','removed','private'])assert.equal(normalizePublicCard({...row,status}),null);
 assert.equal(normalizePublicCard({...row,media_tokens:[]}),null);
 assert.equal(normalizePublicCard({...row,media_tokens:['../private.jpg']}),null);
 assert.equal(normalizePublicCard({...row,media_tokens:[token,token]}),null);
 assert.equal(normalizePublicCard({...row,body:'Short'}),null);
});
test('limits feed pagination and removes invalid records',()=>{
 assert.equal(parsePublicFeed({items:[row,{...row,status:'hidden'}]}).length,1);
 assert.throws(()=>parsePublicFeed({items:Array(21).fill(row)}));
 assert.throws(()=>parsePublicFeed({items:{}}));
});
test('media URL uses only opaque token and approved gateway',()=>{
 const gateway=stagingGateway(base,base.siteOrigin);
 const url=publicMediaURL(gateway,token);
 assert.equal(url,'https://'+ref+'.supabase.co/functions/v1/wg-community/media/'+token);
 assert.ok(!url.includes('storage_path'));
 assert.throws(()=>publicMediaURL(gateway,'../../private.jpg'));
});
