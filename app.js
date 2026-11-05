/* Worlds Gallery V3 — standalone interactive browser concept.
   No server/API keys, no public uploads. Demo stories go to IndexedDB only.
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
let db=null, demoStories=[], uploadImages=[], chosenLayout='single', currentStoryId=null, lightboxIndex=0, lightboxImages=[];
let hearts=[];try{hearts=JSON.parse(localStorage.getItem(HEARTS_KEY)||'[]');if(!Array.isArray(hearts))hearts=[]}catch{hearts=[]}
const state={themes:new Set(),draftThemes:new Set(),selectedRegion:null,selectedCountry:'',selectedContinent:'',search:'',sort:'new'};
let globe=null,speechRunning=false,speechToken=0,speechParts=[],speechIndex=0;
const stories=()=>[...demoStories,...seeds];
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
function getFiltered(){const q=norm(state.search),oneCharacter=q.length===1;
 const result=stories().filter(s=>{
  const iso=countryCode(s.country);const meta=COUNTRY_META[iso]||{};
  if(state.selectedContinent && meta.continent!==state.selectedContinent) return false;
  if(state.selectedCountry&&iso!==state.selectedCountry)return false;
  if(!regionMatch(s,state.selectedRegion))return false;
  if(state.themes.size&&!state.themes.has(s.theme||'other'))return false;
  if(q){if(oneCharacter) return norm(s.author).includes(q);return [s.author,s.title,s.story,s.country,s.region||'',s.province||'',s.city||'',themeFor(s.theme).name].some(str=>norm(str).includes(q))}
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
function renderStats(){const all=stories();$('statStories').textContent=all.length.toLocaleString();$('statCountries').textContent=new Set(all.map(s=>s.country)).size}
function renderGallery(){const items=getFiltered();$('resultsCount').textContent=`Showing ${items.length} of ${stories().length} stories`;
 $('gallery').innerHTML=items.length?items.map(s=>{
  const t=themeFor(s.theme),liked=hearts.includes(s.id);
  return `<article class="story-card" data-id="${html(s.id)}"><button class="card-image-button" type="button" data-open-story="${html(s.id)}" aria-label="Read ${html(s.title)}">${collageMarkup(s.images,s.layout||(s.images.length===1?'single':(s.images.length===2?'duo-vertical':(s.images.length===3?'trio-hero':'quad-grid'))))}${s.images.length>1?`<span class="image-count">▧ ${s.images.length} photos</span>`:''}</button><div class="card-text"><div class="card-meta"><span>${html(s.country)}</span><span class="sample-label">${s.sample?'Demo story':'Your local story'}</span></div><div class="category">${t.icon} ${html(t.name)}</div><h3 class="card-title">${html(s.title)}</h3><p class="card-excerpt" data-open-story="${html(s.id)}" role="button" tabindex="0">${html(s.story.slice(0,300))}</p><div class="card-footer"><span class="byline"><span class="avatar">${html(s.author.slice(0,1).toUpperCase())}</span><span>${html(s.author)}</span></span><button type="button" class="heart ${liked?'active':''}" data-heart="${html(s.id)}" aria-label="Heart ${html(s.title)}" aria-pressed="${liked}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 6l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.3a5.5 5.5 0 0 0 0-7.8Z"/></svg><span>${heartCount(s)}</span></button></div></div></article>`
 }).join(''):`<div class="empty-state"><div style="font-size:39px">✧</div><h3>No stories in this corner yet.</h3><p>Try a different place, theme or search. Your chosen country can be the first to share.</p><button class="button button-light" type="button" data-reset>Clear all filters</button></div>`;
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
 if(iso){const total=stories().filter(s=>countryCode(s.country)===iso).length;$('globeSelection').innerHTML=`<b>${html(n)}</b> · ${total} demo ${total===1?'story':'stories'} in this country. <button type="button" id="scrollGallery">View gallery ↓</button> <button type="button" id="globeRegionChoose">Choose region ↗</button>`}else{$('globeSelection').textContent='Drag to rotate, select a country, or filter 249 countries and territories below.'}
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
function resetFilters(){state.themes.clear();state.selectedCountry='';state.selectedContinent='';state.selectedRegion=null;state.sort='new';state.search='';$('search').value='';$('sortFilter').value='new';$('continentFilter').value='';renderCountryOptions(false);renderGallery();if(globe)globe.reset();renderGlobeLabel()}
function selectRegion(code){const reg=regionOptions(state.selectedCountry).find(x=>x.code===code);if(!reg)return;state.selectedRegion={code:reg.code,name:reg.name,parent:reg.parent};$('regionDialog').close();renderGallery();notify('Region filter applied');if(globe)globe.zoomBy(.08)}
function prepareUpload(){uploadImages=[];chosenLayout='single';$('uploadForm').reset();$('imageTools').hidden=true;$('formMessage').textContent='';renderTemplateChoices();renderCollagePreview();renderUploadRegionSuggestions();updateCharacterProgress();$('uploadDialog').showModal()}
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
function validateUpload(){const author=$('author').value.trim(),country=$('uploadCountry').value,theme=$('uploadTheme').value,title=$('uploadTitle').value.trim(),story=$('uploadBody').value.trim();
 if(author.length<2)return 'Add a pen name with at least two characters.';
 if(!country)return 'Choose the country where the memory happened.';
 if(!theme)return 'Choose a story theme.';
 if(!title)return 'Give your story a title.';
 if(uploadImages.length<1||uploadImages.length>4)return 'Choose between one and four photos.';
 if(countGraphemes(story)<1000)return `Write at least 1,000 characters (currently ${countGraphemes(story)}).`;
 return '';
}
async function submitUpload(e){e.preventDefault();const invalid=validateUpload();const msg=$('formMessage');if(invalid){msg.classList.remove('ok');msg.textContent=invalid;return}
 const submit=$('submitStory');submit.disabled=true;submit.textContent='Saving your demo story…';msg.textContent='';
 const s={id:'local-'+(crypto.randomUUID?crypto.randomUUID():String(Date.now())),author:$('author').value.trim(),country:countryName($('uploadCountry').value),region:$('uploadRegion').value.trim(),city:$('uploadCity').value.trim(),theme:$('uploadTheme').value,title:$('uploadTitle').value.trim(),story:$('uploadBody').value.trim(),images:[...uploadImages],layout:chosenLayout,hearts:0,created:Date.now(),sample:false};
 try{const persisted=await dbPut(s);demoStories.unshift(s);$('uploadDialog').close();resetFilters();notify(persisted?'Saved to your private browser demo gallery ✦':'Added for this browser session only (storage unavailable)');$('stories').scrollIntoView({behavior:'smooth',block:'start'})}
 catch(err){msg.classList.remove('ok');msg.textContent='Could not save this story in browser storage. Try smaller photos or allow site storage. '+(err?.message||'')}
 finally{submit.disabled=false;submit.innerHTML='Add to my demo gallery <span>↗</span>'}
}
function stopSpeech(){speechToken++;speechRunning=false;speechParts=[];speechIndex=0;if('speechSynthesis' in window){window.speechSynthesis.cancel()}updateSpeechUi()}
function updateSpeechUi(){const btn=$('ttsButton'),status=$('ttsStatus');if(!btn)return;btn.classList.toggle('active',speechRunning);btn.setAttribute('aria-pressed',String(speechRunning));btn.innerHTML=speechRunning?'■ <span>Stop</span>':'♫ <span>Listen</span>';if(status)status.textContent=speechRunning?'Reading aloud…':'Starts from the title every time.'}
function chooseVoice(){if(!('speechSynthesis' in window))return null;const voices=window.speechSynthesis.getVoices(),choice=$('voiceSelect')?.value;if(choice){const picked=voices.find(v=>v.voiceURI===choice);if(picked)return picked}
 const fem=/\b(zira|samantha|aria|jenny|sonia|susan|victoria|karen|ava|tessa|moira|female|helen|sara|emma|allison|serena|natasha|hazel|fiona|jessa)\b/i;
 const english=voices.filter(v=>v.lang.toLowerCase().startsWith('en'));
 const score=v=>(/natural|neural|online/i.test(v.name)?100:0)+(fem.test(v.name)?30:0)+(/microsoft/i.test(v.name)?10:0)+(v.localService?5:0);
 return english.sort((x,y)=>score(y)-score(x))[0]||voices[0]||null
}
function loadVoices(){const control=$('voiceSelect');if(!control||!('speechSynthesis' in window))return;
 const all=window.speechSynthesis.getVoices();if(!all.length){control.innerHTML='<option value="">Default browser voice</option>';return}
 const preferred=chooseVoice();control.innerHTML='<option value="">Automatic voice</option>'+all.map(v=>`<option value="${html(v.voiceURI)}">${html(v.name)} · ${html(v.lang)}</option>`).join('');if(preferred)control.value=preferred.voiceURI;
}
function splitSpeech(text){const sentences=text.match(/[^.!?\n]+[.!?]?\s*|\n+/g)||[text];let result=[],buff='';
 for(const phrase of sentences){if((buff+phrase).length>190&&buff){result.push(buff.trim());buff=''}if(phrase.length>190){const words=phrase.split(/\s+/);for(const word of words){if((buff+' '+word).length>190&&buff){result.push(buff.trim());buff=''}buff+=(buff?' ':'')+word}}else buff+=phrase}
 if(buff.trim())result.push(buff.trim());return result.filter(Boolean)
}
function playSpeech(){if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){notify('Text-to-speech is unavailable in this browser.');return}const s=stories().find(x=>x.id===currentStoryId);if(!s)return;
 if(speechRunning){stopSpeech();return}stopSpeech();speechRunning=true;const myToken=speechToken;
 speechParts=splitSpeech(`${s.title}. Shared by ${s.author}. ${s.story}`);speechIndex=0;updateSpeechUi();const voice=chooseVoice();
 function next(){if(!speechRunning||myToken!==speechToken)return;if(speechIndex>=speechParts.length){speechRunning=false;updateSpeechUi();return}const utterance=new SpeechSynthesisUtterance(speechParts[speechIndex++]);if(voice){utterance.voice=voice;utterance.lang=voice.lang}else utterance.lang='en-US';utterance.rate=Number($('narrationSpeed')?.value||0.9);utterance.pitch=1.01;utterance.onend=next;utterance.onerror=err=>{if(myToken!==speechToken||!speechRunning)return;speechRunning=false;updateSpeechUi();if(err.error!=='canceled'&&err.error!=='interrupted')notify('Voice playback stopped. Try a different installed voice.')};window.speechSynthesis.speak(utterance)}
 next()
}
function readerContent(s){const t=themeFor(s.theme);
 return `<div class="read-gallery">${collageMarkup(s.images,s.layout||(s.images.length===1?'single':(s.images.length===2?'duo-vertical':(s.images.length===3?'trio-hero':'quad-grid'))),{lightbox:true})}</div><p class="tap-photo">⌕ Tap a collage photo to see its full frame (${s.images.length} ${s.images.length===1?'photo':'photos'})</p><div class="read-theme">${t.icon} ${html(t.name)} · ${html([s.country,s.region,s.city].filter(Boolean).join(' · '))}</div><div class="read-heading"><h2>${html(s.title)}</h2><div class="tts-block"><button type="button" id="ttsButton" class="tts-toggle" aria-pressed="false" title="Read title, author and story aloud">♫ <span>Listen</span></button></div></div><p class="read-byline">Shared by <b>${html(s.author)}</b> · ${s.sample?'Fictional demonstration':'Saved only in your browser'}</p><div class="tts-settings"><span>♪ Built-in narration · voice quality depends on your device</span><label for="voiceSelect">Voice:</label><select id="voiceSelect" aria-label="Narration voice"><option value="">Automatic voice</option></select><label for="narrationSpeed">Pace:</label><select id="narrationSpeed" aria-label="Narration pace"><option value="0.82">Relaxed</option><option value="0.9" selected>Gentle</option><option value="1.0">Normal</option></select><span class="tts-status" id="ttsStatus">Starts from the title every time.</span></div><div class="reading-body" dir="auto">${html(s.story)}</div><div class="reader-bottom"><button class="heart ${hearts.includes(s.id)?'active':''}" type="button" data-heart="${html(s.id)}" aria-pressed="${hearts.includes(s.id)}" aria-label="Heart story"><svg viewBox="0 0 24 24"><path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 6l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.3a5.5 5.5 0 0 0 0-7.8Z"/></svg><span>${heartCount(s)} hearts</span></button>${s.sample?'<span class="micro-hint">Original fictional sample</span>':`<button type="button" class="link-button" id="removeLocalStory">Delete local demo story</button>`}</div>`
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
$('gallery').addEventListener('click',e=>{const h=e.target.closest('[data-heart]');if(h){toggleHeart(h.dataset.heart);return}const open=e.target.closest('[data-open-story]');if(open){openReader(open.dataset.openStory);return}if(e.target.closest('[data-reset]'))resetFilters()});
$('gallery').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.card-excerpt')){e.preventDefault();openReader(e.target.dataset.openStory)}});
$('globeSelection').addEventListener('click',e=>{if(e.target.id==='scrollGallery')$('stories').scrollIntoView({behavior:'smooth'});if(e.target.id==='globeRegionChoose')openRegionModal()});
$('globeReset').addEventListener('click',()=>{globe.reset();setCountry('','globe')});$('globeZoomIn').addEventListener('click',()=>globe.zoomBy(.16));$('globeZoomOut').addEventListener('click',()=>globe.zoomBy(-.16));
$('feedbackOpen').addEventListener('click',()=>{$('feedbackText').value='';$('envelopeScene').classList.remove('sent');$('feedbackStatus').textContent='No message will be transmitted.';$('feedbackSubmit').disabled=false;$('feedbackDialog').showModal()});
$('feedbackForm').addEventListener('submit',e=>{e.preventDefault();if(!$('feedbackText').value.trim())return;$('envelopeScene').classList.add('sent');$('feedbackStatus').textContent='Preview complete — nothing was sent online.';$('feedbackSubmit').disabled=true;});
document.querySelectorAll('[data-open-upload]').forEach(b=>b.addEventListener('click',prepareUpload));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$((b.dataset.close)).close()));
$('imageInput').addEventListener('change',async e=>{const files=Array.from(e.target.files||[]);$('formMessage').textContent='';if(!files.length)return;if(files.length>4){$('formMessage').textContent='Choose at most four photos.';e.target.value='';return}
 const button=$('submitStory');button.disabled=true;$('formMessage').textContent='Preparing and compressing your photos…';
 try{const result=[];for(const f of files){result.push(await compressImage(f))}uploadImages=result;renderImageTools();renderTemplateChoices();renderCollagePreview();$('formMessage').textContent=`${files.length} ${files.length===1?'photo':'photos'} optimized. Choose a collage design below.`;$('formMessage').classList.add('ok')}
 catch(err){$('formMessage').classList.remove('ok');$('formMessage').textContent=err.message}
 finally{button.disabled=false}
});
$('imagePicked').addEventListener('click',e=>{const preview=e.target.closest('[data-preview-upload]');if(preview){openLightbox(uploadImages,Number(preview.dataset.previewUpload));return}const rm=e.target.closest('[data-remove-image]');if(rm){uploadImages.splice(Number(rm.dataset.removeImage),1);renderImageTools();renderTemplateChoices();renderCollagePreview();return}const mv=e.target.closest('[data-move-image]');if(mv){const i=Number(mv.dataset.imageIndex),j=i+Number(mv.dataset.moveImage);if(j>=0&&j<uploadImages.length){[uploadImages[i],uploadImages[j]]=[uploadImages[j],uploadImages[i]];renderImageTools();renderCollagePreview()}}});
$('templates').addEventListener('click',e=>{const b=e.target.closest('[data-layout]');if(!b)return;chosenLayout=b.dataset.layout;renderTemplateChoices();renderCollagePreview()});
$('collagePreview').addEventListener('click',e=>{const tile=e.target.closest('[data-photo-index]');if(tile)openLightbox(uploadImages,Number(tile.dataset.photoIndex))});
$('uploadCountry').addEventListener('change',()=>{$('uploadRegion').value='';renderUploadRegionSuggestions()});
$('uploadBody').addEventListener('input',updateCharacterProgress);
$('uploadForm').addEventListener('submit',submitUpload);
$('readBody').addEventListener('click',e=>{const tile=e.target.closest('[data-photo-index]');if(tile){const s=stories().find(st=>st.id===currentStoryId);if(s)openLightbox(s.images,Number(tile.dataset.photoIndex));return}const h=e.target.closest('[data-heart]');if(h){toggleHeart(h.dataset.heart);return}if(e.target.closest('#ttsButton')){playSpeech();return}if(e.target.closest('#removeLocalStory'))removeStory()});
$('readBody').addEventListener('keydown',e=>{const tile=e.target.closest('[data-photo-index]');if(tile&&(e.key==='Enter'||e.key===' ')){e.preventDefault();const s=stories().find(st=>st.id===currentStoryId);if(s)openLightbox(s.images,Number(tile.dataset.photoIndex))}});
$('readDialog').addEventListener('close',stopSpeech);
$('lightboxPrev').addEventListener('click',()=>lightboxMove(-1));$('lightboxNext').addEventListener('click',()=>lightboxMove(1));
$('lightboxDialog').addEventListener('close',()=>{lightboxImages=[];$('lightboxImage').removeAttribute('src')});
document.addEventListener('keydown',e=>{if(!$('lightboxDialog').open)return;if(e.key==='ArrowLeft')lightboxMove(-1);if(e.key==='ArrowRight')lightboxMove(1)});
if('speechSynthesis' in window)window.speechSynthesis.addEventListener?.('voiceschanged',()=>{if($('readDialog').open)loadVoices()});
async function init(){renderCountryOptions(false);renderUploadCountries();renderRegionLabel();renderTemplateChoices();renderCollagePreview();renderGallery();renderGlobeLabel();
 globe=createWorldGlobe($('globeCanvas'),code=>{if(!COUNTRIES.some(c=>c[0]===code)){notify('Map selection unavailable for this territory. Use the country filter below.');return}setCountry(code,'globe')});
 try{db=await openDb();demoStories=await dbAll();renderGallery()}catch{demoStories=readFallbackStories();renderGallery();notify('Browser storage fallback enabled. Demo posts may be session-only on this device.')}
}
init();
