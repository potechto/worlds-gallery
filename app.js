/* Worlds Gallery private original-upload gallery. Public publishing is NOT deployed.
   Legacy offline demos and bundled seeds are excluded from discovery, not erased.
*/
'use strict';
const $ = id => document.getElementById(id);
const html = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = value => String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s*\([^)]*\)/g,'').toLowerCase().trim();
const fullCountries=COUNTRIES.slice().sort((a,b)=>a[1].localeCompare(b[1]));
const countryName=code=>COUNTRIES.find(x=>x[0]===code)?.[1]||code;
const countryCode=name=>COUNTRIES.find(x=>x[1]===name)?.[0]||'';
const themeFor=id=>{const t=THEMES.find(t=>t[0]===id)||THEMES[THEMES.length-1];return {id:t[0],name:t[1],icon:t[2]}};
const countGraphemes=s=>typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(s)].length:Array.from(s).length;
const layoutChoices={
  1:[['single','Full frame'],['polaroid','Polaroid']],
  2:[['duo-vertical','Side by side'],['duo-horizontal','Stacked'],['duo-diagonal','Diagonal'],['polaroid','Polaroid']],
  3:[['trio-hero','Hero left'],['trio-wide','Hero top'],['trio-columns','Three columns'],['polaroid','Polaroid']],
  4:[['quad-grid','Classic grid'],['quad-feature','Feature layout'],['quad-top','Panorama top'],['quad-film','Filmstrip'],['polaroid','Polaroid']]
};
const DB_NAME='worlds_gallery_v3_demo',DB_STORE='posts';
const HEARTS_KEY='worldsGalleryPrototypeHeartsV1';
let db=null, demoStories=[], uploadImages=[], imageSelectionRevision=0, chosenLayout='single', currentStoryId=null, lightboxIndex=0, lightboxImages=[];
let hearts=[];try{hearts=JSON.parse(localStorage.getItem(HEARTS_KEY)||'[]');if(!Array.isArray(hearts))hearts=[]}catch{hearts=[]}
const state={themes:new Set(),draftThemes:new Set(),selectedRegion:null,selectedCountry:'',selectedContinent:'',search:'',sort:'new',mineOnly:false};
let globe=null,speechRunning=false,speechToken=0,speechParts=[],speechIndex=0;
// The current IndexedDB gallery is a local preview, not a publishable database.
// Exclude ownerless legacy uploads and other users' browser entries.
const currentOwner=()=>window.WorldsGalleryAuth?.getCurrentUserId?.()||null;
// Keep another account's cached private drafts out of the gallery while sessions change.
const stories=()=>cloudStories.filter(s=>currentOwner() && s.owner_id===currentOwner() && s.cloud && s.paths?.length>0 && s.images?.length>0 && String(s.title||'').trim() && String(s.story||'').trim());
let cloudStories=[],cloudUser=null,cloudRevision=0,cloudSignedAt=0,cloudRefreshBusy=false;
const CLOUD_URL_REFRESH_AFTER_MS=45*60*1000; // signed links last 60 minutes
const cloudClient=()=>window.WorldsGalleryAuth?.getClient?.();
const CLOUD_BUCKET='wg-private-photos';
const cloudReady=()=>Boolean(currentOwner() && cloudClient());
function cloudError(error){return error?.message || 'Cloud request failed';}
// WG_V2231_POST_ACTIONS_BEGIN - owner-only controls. Hiding is already enforced by private RLS.
function ownerPostMenu(story){
 if(!story?.cloud || story.status!=='draft' || !currentOwner() || story.owner_id!==currentOwner())return '';
 const id=html(story.id);
 return `<details class="wg-post-menu"><summary aria-label="Manage your post" title="Manage post">⋮</summary><div class="wg-post-menu-options" role="group" aria-label="Owner post actions"><button type="button" data-post-visibility="${id}" title="This post is already private">Hide / Unhide</button><button type="button" data-post-edit="${id}">Edit</button><button type="button" data-post-delete="${id}">Delete</button></div></details>`;
}
function ownedPostById(id){return cloudStories.find(s=>s.id===id && s.cloud && s.status==='draft' && s.owner_id===currentOwner())||null;}
function postVisibilityNotice(story){if(!ownedPostById(story?.id))return;notify('This post is already Only me. Public Hide / Unhide will activate after moderated posting launches.');}
function runOwnerPostAction(e){
 const visibility=e.target.closest('[data-post-visibility]');
 if(visibility){const story=ownedPostById(visibility.dataset.postVisibility);if(story)postVisibilityNotice(story);return true;}
 const edit=e.target.closest('[data-post-edit]');
 if(edit){const story=ownedPostById(edit.dataset.postEdit);if(story)openCloudEditor(story);return true;}
 const deletion=e.target.closest('[data-post-delete]');
 if(deletion){const story=ownedPostById(deletion.dataset.postDelete);if(story)removeCloudStory(story);return true;}
 return false;
}
// WG_V2231_POST_ACTIONS_END
async function fetchCloudStories(){
 const uid=currentOwner(),revision=++cloudRevision;
 if(!uid){cloudUser=null;cloudStories=[];cloudSignedAt=0;renderGallery();return;}
 const client=cloudClient();if(!client)return;
 try{
 const [storyResult,photoResult]=await Promise.all([
  client.from('wg_stories').select('*').eq('user_id',uid).order('created_at',{ascending:false}),
  client.from('wg_story_photos').select('story_id,storage_path,position').eq('user_id',uid).order('position')
 ]);
 if(revision!==cloudRevision||uid!==currentOwner())return;
 if(storyResult.error||photoResult.error){notify('Cloud drafts unavailable: '+cloudError(storyResult.error||photoResult.error));return;}
 const photosByStory=new Map();
 for(const row of photoResult.data||[]){const a=photosByStory.get(row.story_id)||[];a.push(row);photosByStory.set(row.story_id,a);}
 const next=[];
 for(const row of storyResult.data||[]){
  if(revision!==cloudRevision||uid!==currentOwner())return;
  const photoRows=(photosByStory.get(row.id)||[]).sort((a,b)=>a.position-b.position);
  const paths=photoRows.map(x=>x.storage_path);
  const images=[];
  for(const path of paths){
   const result=await client.storage.from(CLOUD_BUCKET).createSignedUrl(path,3600);
   if(result.error){images.push('');}else images.push(result.data.signedUrl);
  }
  next.push({id:row.id,owner_id:row.user_id,author:row.author,country:row.country_name,region:row.region,city:row.city,theme:row.theme,title:row.title,story:row.body,layout:row.layout,language_code:row.language_code,images:images.filter(Boolean),paths,created:Date.parse(row.created_at),sample:false,cloud:true,status:row.status});
 }
 if(revision!==cloudRevision||uid!==currentOwner())return;
 cloudUser=uid;cloudStories=next;cloudSignedAt=Date.now();renderGallery();
 }catch(err){
  if(revision===cloudRevision&&uid===currentOwner())notify('Cloud drafts unavailable: '+cloudError(err));
 }
}
// Refresh expiring private photo links while leaving story text, filters, and narration intact.
async function refreshPrivatePhotoLinks(){
 const uid=currentOwner();
 if(document.visibilityState==='hidden'||!uid||cloudUser!==uid||!cloudStories.length||cloudRefreshBusy)return;
 if(Date.now()-cloudSignedAt<CLOUD_URL_REFRESH_AFTER_MS)return;
 const revision=cloudRevision,client=cloudClient();if(!client)return;
 cloudRefreshBusy=true;
 try{
  const updates=await Promise.all(cloudStories.filter(s=>s.owner_id===uid).map(async story=>{
   const images=await Promise.all((story.paths||[]).map(async path=>{
    const response=await client.storage.from(CLOUD_BUCKET).createSignedUrl(path,3600);
    if(response.error||!response.data?.signedUrl)throw response.error||new Error('Private photo link unavailable.');
    return response.data.signedUrl;
   }));
   return [story.id,images];
  }));
  if(revision!==cloudRevision||uid!==currentOwner())return;
  const updated=new Map(updates),openStory=cloudStories.find(s=>s.id===currentStoryId);
  const updateLightbox=Boolean(openStory&&$('lightboxDialog')?.open&&lightboxImages===openStory.images);
  for(const story of cloudStories){if(updated.has(story.id))story.images=updated.get(story.id);}
  cloudSignedAt=Date.now();
  renderGallery();
  // Do not re-render the reader: that would restart text-to-speech and move its scroll position.
  if(openStory&&$('readDialog')?.open){
   $('readBody').querySelectorAll('.read-gallery img').forEach((img,i)=>{if(openStory.images[i])img.src=openStory.images[i];});
   if(updateLightbox){lightboxImages=openStory.images;renderLightbox();}
  }
 }catch(err){
  if(revision===cloudRevision&&uid===currentOwner())notify('Could not refresh private photos: '+cloudError(err));
 }finally{cloudRefreshBusy=false;}
}
async function saveCloudDraft(){
 const postingSafetyError=validateUpload();if(postingSafetyError)throw new Error(postingSafetyError);
 if(!cloudReady())throw new Error('Sign in before creating a cloud draft.');
 const uid=currentOwner(),client=cloudClient(),photos=uploadImages.slice();
 if(photos.length<1||photos.length>4)throw new Error('Choose between one and four photos.');
 const payload={user_id:uid,author:$('author').value.trim(),country_code:$('uploadCountry').value,country_name:countryName($('uploadCountry').value),region:$('uploadRegion').value.trim(),city:$('uploadCity').value.trim(),theme:$('uploadTheme').value,title:$('uploadTitle').value.trim(),body:$('uploadBody').value.trim(),layout:chosenLayout,language_code:$('storyLanguage').value,status:'draft'};
 const inserted=await client.from('wg_stories').insert(payload).select('id').single();
 if(inserted.error)throw inserted.error;
 const storyId=inserted.data.id,uploaded=[];
 try{
  for(let i=0;i<photos.length;i++){
   if(currentOwner()!==uid)throw new Error('Session changed during upload.');
   const dataUrl=photos[i];const mime=dataUrl.startsWith('data:image/webp')?'image/webp':'image/jpeg';
   const response=await fetch(dataUrl);const blob=await response.blob();
   if(blob.size>10*1024*1024)throw new Error('A compressed photo exceeds 10 MB.');
   const path=uid+'/'+storyId+'/'+i+'-'+crypto.randomUUID()+'.'+(mime==='image/webp'?'webp':'jpg');
   const object=await client.storage.from(CLOUD_BUCKET).upload(path,blob,{contentType:mime,upsert:false,cacheControl:'3600'});
   if(object.error)throw object.error;
   uploaded.push(path);
   const meta=await client.from('wg_story_photos').insert({story_id:storyId,user_id:uid,storage_path:path,position:i,mime_type:mime});
   if(meta.error)throw meta.error;
  }
  return storyId;
 }catch(error){
  if(uploaded.length)await client.storage.from(CLOUD_BUCKET).remove(uploaded);
  await client.from('wg_stories').delete().eq('id',storyId).eq('user_id',uid);
  throw error;
 }
}
async function removeCloudStory(s){
 const uid=currentOwner();if(!uid||s.owner_id!==uid)return;
 if(!confirm('Permanently delete this private post and its photos?'))return;
 const client=cloudClient();const deleted=await client.from('wg_stories').delete().eq('id',s.id).eq('user_id',uid).select('id');
 if(deleted.error){notify('Delete failed: '+cloudError(deleted.error));return;}
 const paths=s.paths||[];let removeIssue=false;
 if(paths.length){const result=await client.storage.from(CLOUD_BUCKET).remove(paths);removeIssue=!!result.error;}
 stopSpeech();if($('readDialog').open)$('readDialog').close();await fetchCloudStories();
 notify(removeIssue?'Post deleted, but photo cleanup needs review.':'Private post deleted');
}
function openCloudEditor(s){
 if(!s.cloud||s.owner_id!==currentOwner()||s.status!=='draft')return;
 const dialog=$('cloudEditDialog'),form=$('cloudEditForm');
 form.elements.namedItem('story_id').value=s.id;
 form.elements.namedItem('title').value=s.title;
 form.elements.namedItem('author').value=s.author;
 form.elements.namedItem('body').value=s.story;
 form.elements.namedItem('region').value=s.region||'';
 form.elements.namedItem('city').value=s.city||'';
 form.elements.namedItem('language_code').value=s.language_code||'en';
 form.elements.namedItem('editPolicyConfirm').checked=false;
 $('wgEditLinkWarning').hidden=true;
 $('cloudEditStatus').textContent='';$('readDialog').close();dialog.showModal();
}


// WG_V219_REVIEW_BEGIN - local-only readiness aid, not a publication or moderation system.
let publicationReviewId=null;
const REVIEW_ATTESTATIONS=['reviewRights','reviewConsent','reviewPrivacy'];
function isOwnedReviewDraft(s){
 const uid=currentOwner();
 return Boolean(uid&&s&&s.cloud&&s.status==='draft'&&s.owner_id===uid);
}
function publicationDraftChecks(s){
 const photoCount=(s.paths||[]).length;
 const body=String(s.story||'').trim(),bodyCount=countGraphemes(body);
 return [
  {ok:!!String(s.author||'').trim()&&String(s.author).trim().length>=2&&!!String(s.title||'').trim()&&String(s.title).trim().length<=120,label:'Title and pen name added'},
  {ok:bodyCount>=1000&&body.length<=15000,label:'Story length is 1,000–15,000 characters'},
  {ok:photoCount>=1&&photoCount<=4,label:'One to four photographs attached'},
  {ok:!!countryCode(s.country)&&!!s.theme,label:'Country and story theme selected'}
 ];
}
function closePublicationChecklist(){
 publicationReviewId=null;
 const dialog=$('publicationChecklistDialog');
 if(dialog?.open)dialog.close();
}
function openPublicationChecklist(s){
 if(!isOwnedReviewDraft(s))return;
 publicationReviewId=s.id;
 $('reviewStoryTitle').textContent=s.title;
 for(const id of REVIEW_ATTESTATIONS){$(id).checked=false;}
 if($('readDialog').open)$('readDialog').close();
 $('publicationChecklistDialog').showModal();
 renderPublicationChecklist();
}
function renderPublicationChecklist(){
 const s=cloudStories.find(x=>x.id===publicationReviewId);
 if(!isOwnedReviewDraft(s)){closePublicationChecklist();return;}
 const checks=publicationDraftChecks(s);
 $('reviewAutoChecks').innerHTML=checks.map(c=>`<li class="${c.ok?'wg-review-ok':'wg-review-missing'}"><span aria-hidden="true">${c.ok?'✓':'○'}</span> ${html(c.label)}</li>`).join('');
 const metadataReady=checks.every(c=>c.ok);
 const confirmationsReady=REVIEW_ATTESTATIONS.every(id=>$(id).checked);
 const result=$('reviewReadyStatus');
 result.classList.toggle('wg-review-ready',metadataReady&&confirmationsReady);
 result.textContent=metadataReady&&confirmationsReady
  ? 'Preparation complete. This draft is still private. Submission and moderator approval are not enabled yet.'
  : 'Not ready for future submission: complete the missing requirements and confirmations. No content has been published.';
}
function editFromPublicationChecklist(){
 const s=cloudStories.find(x=>x.id===publicationReviewId);
 if(!isOwnedReviewDraft(s)){closePublicationChecklist();return;}
 closePublicationChecklist();
 openCloudEditor(s);
}
// WG_V219_REVIEW_END

function notify(message){const t=$('toast');t.textContent=message;t.classList.add('show');clearTimeout(notify.t);notify.t=setTimeout(()=>t.classList.remove('show'),3300)}
function openDb(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window))return reject(new Error('Browser storage not available'));const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(DB_STORE))r.result.createObjectStore(DB_STORE,{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('Could not open browser storage'))})}
function dbAll(){return new Promise((resolve,reject)=>{const r=db.transaction(DB_STORE,'readonly').objectStore(DB_STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)})}
const LOCAL_FALLBACK_KEY='worldsGalleryV3FallbackPosts';
function readFallbackStories(){try{const a=JSON.parse(localStorage.getItem(LOCAL_FALLBACK_KEY)||'[]');return Array.isArray(a)?a:[]}catch{return []}}
function writeFallbackStories(a){try{localStorage.setItem(LOCAL_FALLBACK_KEY,JSON.stringify(a));return true}catch{return false}}
function dbPut(s){return new Promise((resolve,reject)=>{
 if(!db){const saved=writeFallbackStories([...readFallbackStories().filter(x=>x.id!==s.id),s]);resolve(saved);return}
 const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put(s);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error)
})}
function dbDelete(id){return new Promise((resolve,reject)=>{
 if(!db){const saved=writeFallbackStories(readFallbackStories().filter(x=>x.id!==id));resolve(saved);return}
 const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).delete(id);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error)
})}
function regionOptions(code){return SUBDIVISIONS[code]||[]}
function regionMatch(post,r){if(!r)return true;const terms=[post.region||'',post.province||'',post.city||''].filter(Boolean).map(norm);const rn=norm(r.name);if(terms.some(t=>t===rn||t.startsWith(rn)||rn.startsWith(t)))return true;
  if(r.code&&post.regionCode===r.code)return true;
  // If a province was chosen, posts from its parent subdivision can appear only if explicitly tagged.
  return false;
}
function getFiltered(){const q=norm(state.search);
 const result=stories().filter(s=>{
  const iso=countryCode(s.country);const meta=COUNTRY_META[iso]||{};
  if(state.mineOnly && (!currentOwner() || s.owner_id!==currentOwner()))return false;
  if(state.selectedContinent && meta.continent!==state.selectedContinent) return false;
  if(state.selectedCountry&&iso!==state.selectedCountry)return false;
  if(!regionMatch(s,state.selectedRegion))return false;
  if(state.themes.size&&!state.themes.has(s.theme||'other'))return false;
  if(q){return [s.author,s.title,s.story,s.country,s.region||'',s.province||'',s.city||'',themeFor(s.theme).name].some(str=>norm(str).includes(q))}
  return true;
 });
 const sorter=state.sort;
 result.sort((a,b)=>sorter==='title'?a.title.localeCompare(b.title):sorter==='author'?a.author.localeCompare(b.author):sorter==='country'?a.country.localeCompare(b.country):sorter==='hearts'?heartCount(b)-heartCount(a):Number(b.created||0)-Number(a.created||0));
 return result;
}
function heartCount(s){return (s.hearts||0)+(hearts.includes(s.id)?1:0)}
function toggleHeart(id){const s=stories().find(st=>st.id===id);if(!s)return;hearts=hearts.includes(id)?hearts.filter(i=>i!==id):[...hearts,id];try{localStorage.setItem(HEARTS_KEY,JSON.stringify(hearts))}catch{}
 renderGallery();if(currentStoryId===id&&$('readDialog').open){const button=$('readBody').querySelector('[data-heart]');if(button){button.classList.toggle('active',hearts.includes(id));button.setAttribute('aria-pressed',String(hearts.includes(id)));button.querySelector('span').textContent=heartCount(s)+' hearts'}}}
function collageMarkup(images,layout='single',options={}){
 const n=Math.max(1,images.length||1),allowed=layoutChoices[n]||layoutChoices[1],style=allowed.some(x=>x[0]===layout)?layout:allowed[0][0];
 return `<div class="collage-layout count-${n} layout-${html(style)}">${images.map((src,i)=>`<div class="tile" ${options.lightbox?'data-photo-index="'+i+'" tabindex="0" role="button" aria-label="View photo '+(i+1)+' at full size"':''}><img src="${html(src)}" alt="Photo ${i+1} of ${n}" loading="lazy"></div>`).join('')}</div>`
}
function storyOwnerAvatar(s){
 const first=String(s.author||'?').slice(0,1).toUpperCase();
 return `<span class="avatar wg-v2232-story-avatar" data-wg-avatar-owner="${html(s.owner_id||'none')}" data-wg-avatar-fallback="${html(first)}">${html(first)}</span>`;
}
function renderStats(){const all=stories();$('statStories').textContent=all.length.toLocaleString();$('statCountries').textContent=new Set(all.map(s=>s.country)).size}
function renderGallery(){const items=getFiltered();$('resultsCount').textContent=`Showing ${items.length} of ${stories().length} stories`;
 $('gallery').innerHTML=items.length?items.map(s=>{
  const t=themeFor(s.theme),liked=hearts.includes(s.id);
  return `<article class="story-card" data-id="${html(s.id)}"><button class="card-image-button" type="button" data-open-story="${html(s.id)}" aria-label="Read ${html(s.title)}">${collageMarkup(s.images,s.layout||(s.images.length===1?'single':(s.images.length===2?'duo-vertical':(s.images.length===3?'trio-hero':'quad-grid'))))}${s.images.length>1?`<span class="image-count">▧ ${s.images.length} photos</span>`:''}</button><div class="card-text"><div class="card-meta"><span>${html(s.country)}</span><span class="sample-label">Only me</span></div><div class="category">${t.icon} ${html(t.name)}</div><h3 class="card-title">${html(s.title)}</h3><p class="card-excerpt" data-open-story="${html(s.id)}" role="button" tabindex="0">${html(s.story.slice(0,300))}</p><div class="card-footer"><span class="byline">${storyOwnerAvatar(s)}<span>${html(s.author)}</span></span><button type="button" class="heart ${liked?'active':''}" data-heart="${html(s.id)}" aria-label="Heart ${html(s.title)}" aria-pressed="${liked}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 6l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.3a5.5 5.5 0 0 0 0-7.8Z"/></svg><span>${heartCount(s)}</span></button>${ownerPostMenu(s)}</div></div></article>`
 }).join(''):`<div class="empty-state"><div style="font-size:39px" aria-hidden="true">&#10024;</div><h3>No original stories here yet.</h3><p>Private posts appear only for their owners. Public community stories will appear once secure review and sharing are ready.</p>${(state.selectedCountry||state.selectedContinent||state.selectedRegion||state.search||state.themes.size)?'<button class="button button-light" type="button" data-reset>Clear all filters</button>':''}</div>`;
 renderStats();renderChips();
}
function renderCountryOptions(keep=true){const current=keep?state.selectedCountry:'';
 const countries=fullCountries.filter(c=>!state.selectedContinent||(COUNTRY_META[c[0]]?.continent||'')===state.selectedContinent);
 $('countryFilter').innerHTML='<option value="">All countries / territories</option>'+countries.map(c=>`<option value="${c[0]}">${html(c[1])}</option>`).join('');
 if(countries.some(c=>c[0]===current)){$('countryFilter').value=current}else{state.selectedCountry='';$('countryFilter').value=''}
}
function renderUploadCountries(){const countries=fullCountries.map(c=>`<option value="${c[0]}">${html(c[1])}</option>`).join('');$('uploadCountry').insertAdjacentHTML('beforeend',countries);$('uploadTheme').insertAdjacentHTML('beforeend',THEMES.map(t=>`<option value="${t[0]}">${t[2]} ${html(t[1])}</option>`).join(''))}
function renderRegionLabel(){const b=$('regionLabel');b.textContent=state.selectedRegion?state.selectedRegion.name:'All regions';$('openRegion').disabled=!state.selectedCountry}
function renderChips(){const chips=[];
 for(const id of state.themes){const t=themeFor(id);chips.push(`<button class="filter-chip" data-remove-theme="${id}" type="button" aria-label="Remove ${html(t.name)}">${t.icon} ${html(t.name)} <span aria-hidden="true">×</span></button>`)}
 if(state.selectedRegion)chips.push(`<button class="filter-chip" data-remove-region type="button" aria-label="Remove region filter">⌖ ${html(state.selectedRegion.name)} <span aria-hidden="true">×</span></button>`);
 if(state.selectedCountry)chips.push(`<button class="filter-chip" data-remove-country type="button" aria-label="Remove country filter">🌍 ${html(countryName(state.selectedCountry))} <span aria-hidden="true">×</span></button>`);
 if(state.selectedContinent)chips.push(`<button class="filter-chip" data-remove-continent type="button" aria-label="Remove world region filter">◉ ${html(state.selectedContinent)} <span aria-hidden="true">×</span></button>`);
 $('themeChips').innerHTML=chips.join('');$('activeFilters').hidden=chips.length===0;$('themeCount').textContent=String(state.themes.size);renderRegionLabel();
}
function setCountry(iso,source){state.selectedCountry=iso;state.selectedRegion=null;const meta=COUNTRY_META[iso]||{};
 if(iso&&meta.continent){state.selectedContinent=meta.continent;$('continentFilter').value=state.selectedContinent}
 renderCountryOptions();$('countryFilter').value=state.selectedCountry;renderGallery();renderGlobeLabel();if(globe){if(iso)globe.select(iso);else if(source!=='globe')globe.reset()}
}
function renderGlobeLabel(){const iso=state.selectedCountry,n=iso?countryName(iso):'The whole world';$('globeLocation').textContent=n;
 if(iso){const total=stories().filter(s=>countryCode(s.country)===iso).length;$('globeSelection').innerHTML=`<b>${html(n)}</b> · ${total} private ${total===1?'story':'stories'} in this country. <button type="button" id="scrollGallery">View gallery ↓</button> <button type="button" id="globeRegionChoose">Choose region ↗</button>`}else{$('globeSelection').textContent='Drag to rotate, select a country, or filter 249 countries and territories below.'}
}
function openThemeModal(){state.draftThemes=new Set(state.themes);renderThemeOptions();$('themesDialog').showModal()}
function renderThemeOptions(){const currentCountry=state.selectedCountry;
 $('themeOptions').innerHTML=THEMES.map(t=>{const checked=state.draftThemes.has(t[0]);const count=stories().filter(s=>(!currentCountry||countryCode(s.country)===currentCountry)&&s.theme===t[0]).length;
 return `<label class="theme-option ${checked?'selected':''}"><input type="checkbox" value="${t[0]}" ${checked?'checked':''}><span class="theme-icon">${t[2]}</span><span><strong>${html(t[1])}</strong><small>${count} ${count===1?'story':'stories'}</small></span></label>`}).join('')
}
function openRegionModal(){if(!state.selectedCountry){notify('Select a country first, then choose a region.');return}$('regionSearch').value='';renderRegionChoices();$('regionDialog').showModal()}
function renderRegionChoices(){const code=state.selectedCountry;const options=regionOptions(code),q=norm($('regionSearch').value);
 const list=options.filter(r=>!q||norm(r.name).includes(q)||norm(r.type).includes(q));
 $('regionHelp').textContent=`${countryName(code)} · ${options.length} ISO-listed subdivisions. Choose a region, state or province. Names may reflect published ISO data; exact location boundaries are not drawn in this demo.`;
 const shown=list.slice(0,140);
 $('regionChoices').innerHTML=shown.length?shown.map(r=>`<button class="region-choice ${r.parent?'nested':''} ${state.selectedRegion?.code===r.code?'active':''}" data-region="${html(r.code)}" type="button"><span>${html(r.name)}</span><small>${html(r.type||'Subdivision')} ${r.parent?'· ↳':''}</small></button>`).join('')+(list.length>shown.length?`<div class="region-empty">${list.length-shown.length} more — use search to narrow results.</div>`:''):`<div class="region-empty">${options.length?'No matching subdivisions.':'No subdivisions listed for this country in the included directory.'}</div>`
}
function resetFilters(){state.themes.clear();state.selectedCountry='';state.selectedContinent='';state.selectedRegion=null;state.sort='new';state.search='';state.mineOnly=false;$('mineOnly').checked=false;$('search').value='';$('sortFilter').value='new';$('continentFilter').value='';renderCountryOptions(false);renderGallery();if(globe)globe.reset();renderGlobeLabel()}
function selectRegion(code){const reg=regionOptions(state.selectedCountry).find(x=>x.code===code);if(!reg)return;state.selectedRegion={code:reg.code,name:reg.name,parent:reg.parent};$('regionDialog').close();renderGallery();notify('Region filter applied');if(globe)globe.zoomBy(.08)}
function prepareUpload(){imageSelectionRevision++;uploadImages=[];chosenLayout='single';$('uploadForm').reset();$('submitStory').disabled=false;const audience=$('uploadForm').querySelector('input[name=wgAudience][value=private]');if(audience)audience.checked=true;$('storyLanguage').value=window.WorldsGalleryLocale?.get?.()||'en';$('imageTools').hidden=true;$('formMessage').classList.remove('ok');$('formMessage').textContent='';renderTemplateChoices();renderCollagePreview();renderUploadRegionSuggestions();updateCharacterProgress();$('uploadDialog').showModal()}
function renderUploadRegionSuggestions(){$('uploadRegions').innerHTML=regionOptions($('uploadCountry').value).map(x=>`<option value="${html(x.name)}"></option>`).join('')}
function compressImage(file){return new Promise((resolve,reject)=>{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))return reject(new Error('Only JPG, PNG or WebP photos are supported.'));
  if(file.size>12*1024*1024)return reject(new Error('Each original photo must be at most 12 MB.'));
  const reader=new FileReader();reader.onerror=()=>reject(new Error('Unable to read your photo.'));reader.onload=()=>{
    const img=new Image();img.onerror=()=>reject(new Error('Cannot decode photo.'));img.onload=()=>{
      const max=1300,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const cx=canvas.getContext('2d');if(!cx)return reject(new Error('Canvas not supported'));
      // Opaque background avoids unexpected black output when converting transparent PNG.
      cx.fillStyle='#ffffff';cx.fillRect(0,0,w,h);cx.drawImage(img,0,0,w,h);
      let out=canvas.toDataURL('image/webp',.68);if(!out.startsWith('data:image/webp'))out=canvas.toDataURL('image/jpeg',.70);resolve(out)
    };img.src=reader.result;
  };reader.readAsDataURL(file);
 })}
function renderImageTools(){$('imageTools').hidden=!uploadImages.length;$('imagePicked').innerHTML=uploadImages.map((src,i)=>`<div class="image-item"><button type="button" class="image-preview-btn" data-preview-upload="${i}" aria-label="View photo ${i+1}"><img src="${html(src)}" alt="Selected photo ${i+1}"></button><div class="order-buttons"><button type="button" data-move-image="-1" data-image-index="${i}" aria-label="Move photo left" ${i===0?'disabled':''}>←</button><button type="button" data-move-image="1" data-image-index="${i}" aria-label="Move photo right" ${i===uploadImages.length-1?'disabled':''}>→</button><button type="button" data-remove-image="${i}" aria-label="Remove photo ${i+1}">×</button></div></div>`).join('')}
function renderTemplateChoices(){const n=Math.max(uploadImages.length,1),options=layoutChoices[n];if(!options.some(t=>t[0]===chosenLayout))chosenLayout=options[0][0];
 $('templates').innerHTML=options.map(([id,label])=>`<button type="button" class="template-option ${id===chosenLayout?'active':''}" data-layout="${id}" aria-pressed="${id===chosenLayout}"><div class="collage-layout count-${n} layout-${id}">${Array.from({length:n},()=>'<div class="tile"></div>').join('')}</div><strong>${html(label)}</strong></button>`).join('');
}
function renderCollagePreview(){$('previewLayoutName').textContent=(layoutChoices[Math.max(uploadImages.length,1)].find(t=>t[0]===chosenLayout)||[])[1]||'Classic layout';
 $('collagePreview').innerHTML=uploadImages.length?collageMarkup(uploadImages,chosenLayout,{lightbox:true}):'<div class="preview-empty">Your chosen collage will appear here <span>✧</span></div>';
}
function updateCharacterProgress(){const n=countGraphemes($('uploadBody').value);$('characterCount').textContent=`${n.toLocaleString()} / 1,000 characters ${n>=1000?'✓':'required'}`;$('characterBar').style.width=Math.min(100,n/1000*100)+'%'}
const POST_SAFETY_CHECKS=['wgPostRights','wgPostConsent','wgPostPrivacy','wgPostRules'];
function postingPolicyIssue(fields){
 const checker=window.WorldsGalleryPostPolicy?.findPolicyIssue;
 if(typeof checker!=='function')return 'Posting safety checker did not load. Refresh this page and try again.';
 return checker(fields)?.message || '';
}
function updatePostLinkWarning(input,notice){
 const element=$(notice),checker=window.WorldsGalleryPostPolicy?.containsProhibitedLink;
 const inputs=notice==='wgUploadLinkWarning'
  ? ['uploadBody','uploadTitle','author','uploadRegion','uploadCity'].map(id=>$(id))
  : ['body','title','author','region','city'].map(name=>$('cloudEditForm')?.elements.namedItem(name));
 const blocked=typeof checker!=='function'||inputs.some(field=>field&&checker(field.value));
 element.hidden=!blocked;
 if(blocked)element.textContent=typeof checker!=='function'?'Posting safety checker unavailable. Refresh to continue.':'Links and contact links are not allowed here. Remove them before continuing.';
}
function validateUpload(){const author=$('author').value.trim(),country=$('uploadCountry').value,theme=$('uploadTheme').value,title=$('uploadTitle').value.trim(),story=$('uploadBody').value.trim();
 if(author.length<2)return 'Add a pen name with at least two characters.';
 if(!country)return 'Choose the country where the memory happened.';
 if(!theme)return 'Choose a story theme.';
 if(!title)return 'Give your story a title.';
 if($('uploadForm').querySelector('input[name=wgAudience]:checked')?.value!=='private')return 'Public posting is not active yet. Select Only me.';
 if(uploadImages.length<1||uploadImages.length>4)return 'Choose between one and four photos.';
 const issue=postingPolicyIssue({description:story,title,author,region:$('uploadRegion').value,city:$('uploadCity').value});
 if(issue)return issue;
 if(countGraphemes(story)<1000)return `Write at least 1,000 characters (currently ${countGraphemes(story)}).`;
 if(!POST_SAFETY_CHECKS.every(id=>$(id)?.checked))return 'Confirm all four photo rights, consent, privacy and posting-rule checkboxes before posting.';
 return '';
}
async function submitUpload(e){e.preventDefault();const invalid=validateUpload();const msg=$('formMessage');if(invalid){msg.classList.remove('ok');msg.textContent=invalid;return}
 const submit=$('submitStory');submit.disabled=true;submit.textContent='Posting privately…';msg.classList.remove('ok');msg.textContent='';
 const ownerId=currentOwner();if(!ownerId){msg.textContent='Please sign in again before posting.';submit.disabled=false;submit.textContent='Post';return;}
 try{await saveCloudDraft();$('uploadDialog').close();resetFilters();await fetchCloudStories();state.mineOnly=true;$('mineOnly').checked=true;renderGallery();notify('Posted privately under My Posts. Only you can see it.');$('stories').scrollIntoView({behavior:'smooth',block:'start'})}
 catch(err){msg.classList.remove('ok');msg.textContent='Could not post privately: '+cloudError(err)}
 finally{submit.disabled=false;submit.textContent='Post'}
}
function stopSpeech(){speechToken++;speechRunning=false;speechParts=[];speechIndex=0;if('speechSynthesis' in window){window.speechSynthesis.cancel()}updateSpeechUi()}
function updateSpeechUi(){const btn=$('ttsButton'),status=$('ttsStatus');if(!btn)return;btn.classList.toggle('active',speechRunning);btn.setAttribute('aria-pressed',String(speechRunning));btn.innerHTML=speechRunning?'■ <span>Stop</span>':'♫ <span>Listen</span>';if(status)status.textContent=speechRunning?'Reading aloud…':'Starts from the title every time.'}
function chooseVoice(locale){
 if(!('speechSynthesis' in window))return null;
 const preferred=($('voiceSelect')?.value==='male'?'male':'female');
 const genderName=preferred==='female'?/zira|samantha|aria|jenny|sonia|susan|victoria|karen|ava|tessa|moira|female|helen|sara|emma|allison|serena|natasha|hazel|fiona|jessa/i:/david|mark|guy|ryan|daniel|george|male|alex|fred|thomas|james|andrew/i;
 const voices=window.speechSynthesis.getVoices();
 const base=(locale||'en').split('-')[0].toLowerCase();
 const eligible=voices.filter(v=>v.lang.toLowerCase().split('-')[0]===base);
 if(!eligible.length)return null;
 const score=v=>(genderName.test(v.name)?100:0)+(/natural|neural|online/i.test(v.name)?25:0)+(v.localService?5:0);
 return eligible.sort((a,b)=>score(b)-score(a))[0];
}
function loadVoices(){const control=$('voiceSelect');if(!control||!('speechSynthesis' in window))return;
 const all=window.speechSynthesis.getVoices();if(!all.length){control.innerHTML='<option value="female">Soft female</option><option value="male">Soft male</option>';control.value=localStorage.getItem('wg_voice_style')==='male'?'male':'female';return}
 control.innerHTML='<option value="female">Soft female</option><option value="male">Soft male</option>';
 control.value=localStorage.getItem('wg_voice_style')==='male'?'male':'female';
}
function splitSpeech(text){const sentences=text.match(/[^.!?\n]+[.!?]?\s*|\n+/g)||[text];let result=[],buff='';
 for(const phrase of sentences){if((buff+phrase).length>190&&buff){result.push(buff.trim());buff=''}if(phrase.length>190){const words=phrase.split(/\s+/);for(const word of words){if((buff+' '+word).length>190&&buff){result.push(buff.trim());buff=''}buff+=(buff?' ':'')+word}}else buff+=phrase}
 if(buff.trim())result.push(buff.trim());return result.filter(Boolean)
}
function playSpeech(){if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){notify('Text-to-speech is unavailable in this browser.');return}const s=stories().find(x=>x.id===currentStoryId);if(!s)return;
 if(speechRunning){stopSpeech();return}stopSpeech();speechRunning=true;const myToken=speechToken;
 speechParts=splitSpeech(`${s.title}. ${s.story}`);speechIndex=0;updateSpeechUi();const locale=s.language_code||window.WorldsGalleryLocale?.get?.()||'en';const voice=chooseVoice(locale);if(!voice){speechRunning=false;updateSpeechUi();notify('No '+locale+' voice installed. Please add a matching voice in your device settings.');return;}
 function next(){if(!speechRunning||myToken!==speechToken)return;if(speechIndex>=speechParts.length){speechRunning=false;updateSpeechUi();return}const utterance=new SpeechSynthesisUtterance(speechParts[speechIndex++]);if(voice)utterance.voice=voice;utterance.lang=voice?.lang||locale;utterance.rate=Number($('narrationSpeed')?.value||0.9);utterance.pitch=1.01;utterance.onend=next;utterance.onerror=err=>{if(myToken!==speechToken||!speechRunning)return;speechRunning=false;updateSpeechUi();if(err.error!=='canceled'&&err.error!=='interrupted')notify('Voice playback stopped. Try a different installed voice.')};window.speechSynthesis.speak(utterance)}
 next()
}
function readerContent(s){const t=themeFor(s.theme);
 return `<div class="read-gallery">${collageMarkup(s.images,s.layout||(s.images.length===1?'single':(s.images.length===2?'duo-vertical':(s.images.length===3?'trio-hero':'quad-grid'))),{lightbox:true})}</div><p class="tap-photo">⌕ Tap a collage photo to see its full frame (${s.images.length} ${s.images.length===1?'photo':'photos'})</p><div class="read-theme">${t.icon} ${html(t.name)} · ${html([s.country,s.region,s.city].filter(Boolean).join(' · '))}</div><div class="read-heading"><h2>${html(s.title)}</h2><div class="tts-block"><button type="button" id="ttsButton" class="tts-toggle" aria-pressed="false" title="Read title, author and story aloud">♫ <span>Listen</span></button></div></div><p class="read-byline"><span class="wg-v2232-reader-author">${storyOwnerAvatar(s)} <span>Shared by <b>${html(s.author)}</b></span></span> · Only me post</p><div class="tts-settings"><span>♪ Built-in narration · depends on installed voices</span><label for="voiceSelect">Voice:</label><select id="voiceSelect" aria-label="Narration voice"><option value="female">Soft female</option><option value="male">Soft male</option></select><label for="narrationSpeed">Pace:</label><select id="narrationSpeed" aria-label="Narration pace"><option value="0.82">Relaxed</option><option value="0.9" selected>Gentle</option><option value="1.0">Normal</option></select><span class="tts-status" id="ttsStatus">Starts from the title every time.</span></div><div class="reading-body" dir="auto">${html(s.story)}</div><div class="reader-bottom"><button class="heart ${hearts.includes(s.id)?'active':''}" type="button" data-heart="${html(s.id)}" aria-pressed="${hearts.includes(s.id)}" aria-label="Heart story"><svg viewBox="0 0 24 24"><path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 6l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.3a5.5 5.5 0 0 0 0-7.8Z"/></svg><span>${heartCount(s)} hearts</span></button>${`<div class="wg-draft-actions">${ownerPostMenu(s)}<button type="button" class="link-button" id="reviewCloudStory">Publication checklist</button></div>`}</div>`
}
function openReader(id){const s=stories().find(st=>st.id===id);if(!s)return;stopSpeech();currentStoryId=id;$('readMeta').textContent='From '+[s.country,s.region].filter(Boolean).join(' · ');$('readBody').innerHTML=readerContent(s);$('readDialog').showModal();loadVoices()}
async function removeStory(){const s=demoStories.find(st=>st.id===currentStoryId);if(!s)return;if(!confirm('Delete this story from your browser demo?'))return;try{await dbDelete(s.id);demoStories=demoStories.filter(x=>x.id!==s.id);stopSpeech();$('readDialog').close();renderGallery();notify('Local demo story deleted')}catch{notify('Could not delete story in this browser')}}
function openLightbox(imgs,index){lightboxImages=imgs;lightboxIndex=(index+imgs.length)%imgs.length;renderLightbox();$('lightboxDialog').showModal()}
function renderLightbox(){if(!lightboxImages.length)return;$('lightboxImage').src=lightboxImages[lightboxIndex];$('lightboxCounter').textContent=`Photo ${lightboxIndex+1} of ${lightboxImages.length}`;$('lightboxPrev').disabled=lightboxImages.length===1;$('lightboxNext').disabled=lightboxImages.length===1}
function lightboxMove(d){if(lightboxImages.length){lightboxIndex=(lightboxIndex+d+lightboxImages.length)%lightboxImages.length;renderLightbox()}}
// Wire up the controls.
$('search').addEventListener('input',e=>{state.search=e.target.value;renderGallery()});
$('continentFilter').addEventListener('change',e=>{state.selectedContinent=e.target.value;state.selectedCountry='';state.selectedRegion=null;renderCountryOptions(false);renderGallery();globe.reset();renderGlobeLabel()});
$('countryFilter').addEventListener('change',e=>setCountry(e.target.value,'filter'));
$('sortFilter').addEventListener('change',e=>{state.sort=e.target.value;renderGallery()});
$('mineOnly').addEventListener('change',e=>{state.mineOnly=e.target.checked;renderGallery()});
document.addEventListener('wg:authenticated',()=>{
 if(cloudUser&&cloudUser!==currentOwner()){
  const privateReader=cloudStories.some(s=>s.id===currentStoryId);
  if(privateReader){stopSpeech();if($('lightboxDialog').open)$('lightboxDialog').close();if($('readDialog').open)$('readDialog').close();}
  if($('cloudEditDialog').open)$('cloudEditDialog').close();
  closePublicationChecklist();
  cloudRevision++;cloudStories=[];cloudUser=null;cloudSignedAt=0;
 }
 fetchCloudStories();renderGallery();
});
document.addEventListener('wg:signedout',()=>{
 const privateReader=cloudStories.some(s=>s.id===currentStoryId);
 if(privateReader){stopSpeech();if($('lightboxDialog').open)$('lightboxDialog').close();if($('readDialog').open)$('readDialog').close();}
 if($('cloudEditDialog').open)$('cloudEditDialog').close();
 closePublicationChecklist();
 cloudRevision++;cloudStories=[];cloudUser=null;cloudSignedAt=0;renderGallery();
});
document.addEventListener('visibilitychange',refreshPrivatePhotoLinks);
window.addEventListener('focus',refreshPrivatePhotoLinks);
setInterval(refreshPrivatePhotoLinks,5*60*1000);
$('themeChoose').addEventListener('click',openThemeModal);
$('themeOptions').addEventListener('change',e=>{if(e.target.matches('input[type="checkbox"]')){e.target.checked?state.draftThemes.add(e.target.value):state.draftThemes.delete(e.target.value);renderThemeOptions()}});
$('themesClear').addEventListener('click',()=>{state.draftThemes.clear();renderThemeOptions()});
$('themesApply').addEventListener('click',()=>{state.themes=new Set(state.draftThemes);$('themesDialog').close();renderGallery()});
$('openRegion').addEventListener('click',openRegionModal);
$('regionSearch').addEventListener('input',renderRegionChoices);
$('regionChoices').addEventListener('click',e=>{const btn=e.target.closest('[data-region]');if(btn)selectRegion(btn.dataset.region)});
$('regionAny').addEventListener('click',()=>{state.selectedRegion=null;$('regionDialog').close();renderGallery()});
$('themeChips').addEventListener('click',e=>{const t=e.target.closest('[data-remove-theme]');if(t){state.themes.delete(t.dataset.removeTheme);renderGallery()}if(e.target.closest('[data-remove-region]')){state.selectedRegion=null;renderGallery()}if(e.target.closest('[data-remove-country]'))setCountry('','filter');if(e.target.closest('[data-remove-continent]')){state.selectedContinent='';$('continentFilter').value='';renderCountryOptions();renderGallery()}});
$('clearFilters').addEventListener('click',resetFilters);
$('gallery').addEventListener('click',e=>{if(runOwnerPostAction(e))return;const h=e.target.closest('[data-heart]');if(h){toggleHeart(h.dataset.heart);return}const open=e.target.closest('[data-open-story]');if(open){openReader(open.dataset.openStory);return}if(e.target.closest('[data-reset]'))resetFilters()});
document.addEventListener('click',e=>{document.querySelectorAll('details.wg-post-menu[open]').forEach(menu=>{if(!menu.contains(e.target))menu.open=false;});});
$('gallery').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.card-excerpt')){e.preventDefault();openReader(e.target.dataset.openStory)}});
$('globeSelection').addEventListener('click',e=>{if(e.target.id==='scrollGallery')$('stories').scrollIntoView({behavior:'smooth'});if(e.target.id==='globeRegionChoose')openRegionModal()});
$('globeReset').addEventListener('click',()=>{globe.reset();setCountry('','globe')});$('globeZoomIn').addEventListener('click',()=>globe.zoomBy(.16));$('globeZoomOut').addEventListener('click',()=>globe.zoomBy(-.16));
document.querySelectorAll('[data-open-upload]').forEach(b=>b.addEventListener('click',prepareUpload));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$((b.dataset.close)).close()));
$('imageInput').addEventListener('change',async e=>{
 const revision=++imageSelectionRevision;
 const files=Array.from(e.target.files||[]);
 const button=$('submitStory'),message=$('formMessage');
 // Never keep old photos when the user begins a new selection or one fails.
 uploadImages=[];
 message.classList.remove('ok');message.textContent='';
 renderImageTools();renderTemplateChoices();renderCollagePreview();
 button.disabled=files.length>0;
 if(!files.length)return;
 if(files.length>4){message.textContent='Choose at most four photos.';e.target.value='';button.disabled=false;return}
 message.textContent='Preparing and compressing your photos…';
 try{
  const result=[];
  for(const file of files){
   const image=await compressImage(file);
   if(revision!==imageSelectionRevision)return;
   result.push(image);
  }
  if(revision!==imageSelectionRevision)return;
  uploadImages=result;
  renderImageTools();renderTemplateChoices();renderCollagePreview();
  message.textContent=`${files.length} ${files.length===1?'photo':'photos'} optimized. Choose a collage design below.`;
  message.classList.add('ok');
 }catch(err){
  if(revision!==imageSelectionRevision)return;
  uploadImages=[];renderImageTools();renderTemplateChoices();renderCollagePreview();
  message.classList.remove('ok');message.textContent=err?.message||'Could not prepare the selected photos.';
 }finally{
  if(revision===imageSelectionRevision)button.disabled=false;
 }
});
$('imagePicked').addEventListener('click',e=>{const preview=e.target.closest('[data-preview-upload]');if(preview){openLightbox(uploadImages,Number(preview.dataset.previewUpload));return}const rm=e.target.closest('[data-remove-image]');if(rm){uploadImages.splice(Number(rm.dataset.removeImage),1);renderImageTools();renderTemplateChoices();renderCollagePreview();return}const mv=e.target.closest('[data-move-image]');if(mv){const i=Number(mv.dataset.imageIndex),j=i+Number(mv.dataset.moveImage);if(j>=0&&j<uploadImages.length){[uploadImages[i],uploadImages[j]]=[uploadImages[j],uploadImages[i]];renderImageTools();renderCollagePreview()}}});
$('templates').addEventListener('click',e=>{const b=e.target.closest('[data-layout]');if(!b)return;chosenLayout=b.dataset.layout;renderTemplateChoices();renderCollagePreview()});
$('collagePreview').addEventListener('click',e=>{const tile=e.target.closest('[data-photo-index]');if(tile)openLightbox(uploadImages,Number(tile.dataset.photoIndex))});
$('uploadCountry').addEventListener('change',()=>{$('uploadRegion').value='';renderUploadRegionSuggestions()});
$('uploadBody').addEventListener('input',()=>{updateCharacterProgress();updatePostLinkWarning('uploadBody','wgUploadLinkWarning')});
['uploadTitle','author','uploadRegion','uploadCity'].forEach(id=>$(id).addEventListener('input',()=>updatePostLinkWarning(id,'wgUploadLinkWarning')));
['body','title','author','region','city'].forEach(name=>$('cloudEditForm').elements.namedItem(name).addEventListener('input',()=>updatePostLinkWarning(name,'wgEditLinkWarning')));
document.addEventListener('click',event=>{
 if(event.target.closest('[data-open-post-rules]'))$('wgPostingRulesDialog').showModal();
});
$('uploadForm').addEventListener('submit',submitUpload);
$('readBody').addEventListener('click',e=>{if(runOwnerPostAction(e))return;const tile=e.target.closest('[data-photo-index]');if(tile){const s=stories().find(st=>st.id===currentStoryId);if(s)openLightbox(s.images,Number(tile.dataset.photoIndex));return}const h=e.target.closest('[data-heart]');if(h){toggleHeart(h.dataset.heart);return}if(e.target.closest('#ttsButton')){playSpeech();return}if(e.target.closest('#removeLocalStory'))removeStory();if(e.target.closest('#reviewCloudStory')){const s=cloudStories.find(x=>x.id===currentStoryId);if(s)openPublicationChecklist(s)}});
$('readBody').addEventListener('keydown',e=>{const tile=e.target.closest('[data-photo-index]');if(tile&&(e.key==='Enter'||e.key===' ')){e.preventDefault();const s=stories().find(st=>st.id===currentStoryId);if(s)openLightbox(s.images,Number(tile.dataset.photoIndex))}});
$('readDialog').addEventListener('close',stopSpeech);$('readBody').addEventListener('change',e=>{if(e.target.id==='voiceSelect')localStorage.setItem('wg_voice_style',e.target.value)});
$('publicationChecklistDialog').addEventListener('change',e=>{if(e.target.matches('input[type=checkbox]'))renderPublicationChecklist()});
$('publicationChecklistDialog').addEventListener('close',()=>{publicationReviewId=null});
$('reviewEditDraft').addEventListener('click',editFromPublicationChecklist);
$('cloudEditForm').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget, d=new FormData(form),uid=currentOwner(),id=String(d.get('story_id'));const s=cloudStories.find(x=>x.id===id&&x.owner_id===uid);const status=$('cloudEditStatus');if(!s||s.status!=='draft'){status.textContent='Draft unavailable.';return}const body=String(d.get('body')).trim();if(countGraphemes(body)<1000||body.length>15000){status.textContent='Story must contain 1,000–15,000 characters.';return}
const editIssue=postingPolicyIssue({description:body,title:d.get('title'),author:d.get('author'),region:d.get('region'),city:d.get('city')});
if(editIssue){status.textContent=editIssue;return}
if(!form.elements.namedItem('editPolicyConfirm')?.checked){status.textContent='Confirm that your edits follow posting privacy and community rules.';return}
const submit=form.querySelector('[type=submit]');submit.disabled=true;try{const res=await cloudClient().from('wg_stories').update({author:String(d.get('author')).trim(),title:String(d.get('title')).trim(),body,region:String(d.get('region')).trim(),city:String(d.get('city')).trim(),language_code:String(d.get('language_code'))}).eq('id',id).eq('user_id',uid).select('id');if(res.error)throw res.error;$('cloudEditDialog').close();await fetchCloudStories();notify('Private post updated')}catch(err){status.textContent=cloudError(err)}finally{submit.disabled=false}});
$('lightboxPrev').addEventListener('click',()=>lightboxMove(-1));$('lightboxNext').addEventListener('click',()=>lightboxMove(1));
$('lightboxDialog').addEventListener('close',()=>{lightboxImages=[];$('lightboxImage').removeAttribute('src')});
document.addEventListener('keydown',e=>{if(!$('lightboxDialog').open)return;if(e.key==='ArrowLeft')lightboxMove(-1);if(e.key==='ArrowRight')lightboxMove(1)});
if('speechSynthesis' in window)window.speechSynthesis.addEventListener?.('voiceschanged',()=>{if($('readDialog').open)loadVoices()});
async function init(){renderCountryOptions(false);renderUploadCountries();renderRegionLabel();renderTemplateChoices();renderCollagePreview();renderGallery();renderGlobeLabel();
 globe=createWorldGlobe($('globeCanvas'),code=>{if(!COUNTRIES.some(c=>c[0]===code)){notify('Map selection unavailable for this territory. Use the country filter below.');return}setCountry(code,'globe')});
 // Do not preload or display legacy browser-only demonstrations. Do not delete local data.
 demoStories=[];renderGallery();if(currentOwner())fetchCloudStories();
}

/* WG PORTAL PHOTO ZOOM + SEARCH V5 */
function enablePortalPhotoZoom() {
  const portal = document.getElementById('portalDrill');
  if (!portal) return;

  const selector =
    '.wg-highlight-photo img, .wg-discover-image img';

  function decorate() {
    portal.querySelectorAll(selector).forEach(img => {
      if (img.dataset.wgZoomReady === '1') return;

      img.dataset.wgZoomReady = '1';
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute(
        'aria-label',
        'Enlarge photo: ' + (img.alt || 'Featured place')
      );
      img.title = 'View larger photo';
    });
  }

  new MutationObserver(decorate).observe(portal, {
    childList: true,
    subtree: true
  });

  decorate();

  function enlarge(img) {
    if (!img) return;

    if (!img.naturalWidth) {
      notify('This photograph has not loaded yet.');
      return;
    }

    const dialog = $('lightboxDialog');
    if (!dialog || dialog.open) return;

    openLightbox([img.currentSrc || img.src], 0);

    $('lightboxCounter').textContent =
      'Featured photograph';

    $('lightboxImage').alt =
      img.alt || 'Featured destination photograph';

    $('lightboxCaption').textContent =
      img.alt || 'Featured destination photograph';
  }

  portal.addEventListener('click', e => {
    const img = e.target.closest?.(selector);
    if (img) enlarge(img);
  });

  portal.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;

    const img = e.target.closest?.(selector);
    if (!img || img !== e.target) return;

    e.preventDefault();
    enlarge(img);
  });

  $('lightboxDialog').addEventListener('close', () => {
    $('lightboxCaption').textContent =
      'View original frame';

    $('lightboxImage').alt =
      'Selected story image';
  });
}

enablePortalPhotoZoom();

window.WorldsGalleryReader={getStoryId:()=>currentStoryId,openStory:id=>{if(!stories().some(s=>s.id===id))return false;openReader(id);return true},openPhoto:index=>{const s=stories().find(x=>x.id===currentStoryId);if(!s?.images?.length)return false;openLightbox(s.images,Math.max(0,Math.min(s.images.length-1,Number(index)||0)));return true}};
init();
