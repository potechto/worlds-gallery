/* Worlds Gallery V2.8 - additive UX improvements for existing V2.7. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const imageUrl = (kind, seed) => kind === 'multiavatar'
    ? `https://api.multiavatar.com/${encodeURIComponent(seed)}.svg`
    : `https://api.dicebear.com/10.x/${kind === 'dicebear' ? 'lorelei' : kind}/svg?seed=${encodeURIComponent(seed)}`;
  const cleanSeed = s => String(s || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);

  function localePosition() {
    const control = $('.wg-locale-control');
    if (!control) return;
    if (control.parentElement !== document.body) document.body.append(control);
    const footer = $('.footrow');
    let bottom = 14;
    if (footer) {
      const rect = footer.getBoundingClientRect();
      if (rect.top < innerHeight && rect.bottom > 0) {
        // Float above the footer, not over Back to the top.
        bottom = Math.max(14, Math.ceil(innerHeight - rect.top + 12));
      }
    }
    control.style.setProperty('bottom', `${bottom}px`, 'important');
    control.style.setProperty('top', 'auto', 'important');
    control.style.setProperty('right', 'max(12px, env(safe-area-inset-right))', 'important');
  }

  function initSort() {
    const select=$('#sortFilter');
    const field=select?.closest('.filter-field.sort');
    const mine=$('#mineOnly');
    if(!select||!field||!mine||field.querySelector('.wg-v28-sort'))return;
    const component=document.createElement('div');
    component.className='wg-v28-sort wg-polish-sort';
    component.innerHTML=`<button type="button" class="wg-v28-sort-trigger" aria-expanded="false" aria-controls="wg-v28-sort-list" aria-label="Sort and filter stories">
      <span class="wg-polish-sort-label"><strong></strong><small></small></span>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </button><div id="wg-v28-sort-list" class="wg-v28-sort-popup" role="group" aria-label="Story order and visibility" hidden></div>`;
    field.append(component);
    select.classList.add('wg-v28-native-sort');
    select.tabIndex=-1;
    const trigger=component.querySelector('.wg-v28-sort-trigger');
    const popup=component.querySelector('.wg-v28-sort-popup');
    function label(){
      const title=select.selectedOptions[0]?.textContent||'Newest first';
      const main=trigger.querySelector('strong'),detail=trigger.querySelector('small');
      main.textContent=mine.checked?'View mine only':title;
      detail.textContent=mine.checked?`Sorted: ${title}`:'';
      detail.hidden=!mine.checked;
    }
    function close(){popup.hidden=true;trigger.setAttribute('aria-expanded','false');}
    function render(){
      popup.replaceChildren();
      const heading=document.createElement('p');heading.className='wg-polish-sort-heading';heading.textContent='ORDER BY';popup.append(heading);
      for(const option of select.options){
        const b=document.createElement('button');b.type='button';b.className='wg-v28-sort-option';
        b.textContent=option.textContent;
        b.setAttribute('aria-pressed',String(option.value===select.value));
        b.addEventListener('click',()=>{
          select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));
          // Preserve View mine only when changing the order of one's stories.
          label();close();trigger.focus({preventScroll:true});
        });
        popup.append(b);
      }
      const separator=document.createElement('div');separator.className='wg-polish-sort-divider';popup.append(separator);
      const choice=document.createElement('button');choice.type='button';choice.className='wg-v28-sort-option wg-polish-scope-option';
      choice.textContent=mine.checked?'View all stories':'View mine only';
      choice.setAttribute('aria-pressed',String(mine.checked));
      choice.addEventListener('click',()=>{
        if(!mine.checked&&!window.WorldsGalleryAuth?.getCurrentUserId?.()){
          close();document.dispatchEvent(new CustomEvent('wg:require-account',{detail:{action:'view your private stories'}}));return;
        }
        mine.checked=!mine.checked;
        mine.dispatchEvent(new Event('change',{bubbles:true}));
        label();close();trigger.focus({preventScroll:true});
      });
      popup.append(choice);
      if(mine.checked){
        const hint=document.createElement('p');hint.className='wg-polish-sort-hint';
        hint.textContent='Choose any order above; only your stories stay visible.';
        popup.append(hint);
      }
    }
    trigger.addEventListener('click',()=>{
      if(!popup.hidden){close();return;}
      render();popup.hidden=false;trigger.setAttribute('aria-expanded','true');
    });
    component.addEventListener('keydown',event=>{
      if(event.key==='Escape'){close();trigger.focus({preventScroll:true});}
    });
    document.addEventListener('click',event=>{if(!component.contains(event.target))close();});
    select.addEventListener('change',label);
    mine.addEventListener('change',label);
    document.querySelector('#clearFilters')?.addEventListener('click',()=>queueMicrotask(label));
    // app.js also changes its legacy select/checkbox directly after saving or resetting;
    // synchronize display after any gallery rerender without adding a second filter system.
    const gallery=$('#gallery');
    if(gallery)new MutationObserver(label).observe(gallery,{childList:true});
    label();
  }


// V2.23.3: crop a device photo into a square before private upload.
// The authored crop is saved in the WebP bytes; no public crop settings or source file are stored.
function assertAvatarFile(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)
    throw new Error('Choose a JPG, PNG or WebP photo under 5 MB.');
}
function clampAvatar(value, min, max) { return Math.max(min, Math.min(max, value)); }
function renderAvatarCrop(bitmap, position, canvas) {
  const side = Math.min(bitmap.width, bitmap.height) / position.zoom;
  position.x = clampAvatar(position.x, side / 2, bitmap.width - side / 2);
  position.y = clampAvatar(position.y, side / 2, bitmap.height - side / 2);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image crop is unavailable in this browser.');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, position.x - side / 2, position.y - side / 2, side, side, 0, 0, canvas.width, canvas.height);
}
async function avatarCropWebp(canvas) {
  return await new Promise((resolve, reject) =>
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not create cropped WebP photo.')), 'image/webp', .86));
}

  // V2.23.2: one account-owned avatar, reused by the menu, profile, and own posts.
  const AVATAR_BUCKET='wg-private-photos';
  const AVATAR_SEEDS_PER_BATCH=24;
  const MAX_AVATAR_PRESETS=120;
  const avatarGlyph = (name) => {
    const paths={
      camera:'<path d="M14.5 4H9.5L7.8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.8L14.5 4Z"/><circle cx="12" cy="13" r="3.3"/>',
      close:'<path d="M18 6 6 18M6 6l12 12"/>',
      check:'<path d="m5 12 4 4L19 6"/>',
      face:'<circle cx="12" cy="12" r="9"/><path d="M8 10h.01M16 10h.01M8 15q4 4 8 0"/>',
      pen:'<path d="M4 20l5-1 10-10-4-4L5 15l-1 5Z"/><path d="m13.8 6.2 4 4"/>'
    };
    return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||''}</svg>`;
  };
  let avatarRevision=0;
  let currentAvatar={uid:null,source:'dicebear',seed:'WorldsGallery',path:null,src:'',expiresAt:0};
  let avatarPending=null;
  const currentAvatarUser=()=>window.WorldsGalleryAuth?.getCurrentUserId?.()||null;
  const avatarClient=()=>window.WorldsGalleryAuth?.getClient?.()||null;
  // V2.23.7: a single retry for safe/idempotent profile reads and generated-avatar
  // updates. Never retry uploads automatically: a partial upload needs inspection.
  const avatarNetworkError = error => /failed to fetch|networkerror|network request failed|load failed|fetch failed|timeout/i.test(String(error?.message || error || ''));
  const avatarFriendlyError = error => {
    const raw=String(error?.message || error || 'Unknown error');
    if(avatarNetworkError(error))return 'Could not reach the profile service. Your change was not confirmed. Check your internet connection, then try Confirm again.';
    if(/constraint|check violation/i.test(raw))return 'The profile rejected these avatar settings. Please choose another design or try again.';
    if(/401|403|jwt|unauthorized|session/i.test(raw))return 'Your session may have expired. Sign in again and retry.';
    return raw;
  };
  async function avatarSafeRequest(action, expectedUid, mayRetry=true){
    for(let attempt=0;attempt<(mayRetry?2:1);attempt++){
      if(expectedUid!==currentAvatarUser())throw Error('Your session changed. Sign in again.');
      try{
        const response=await action();
        if(response?.error)throw response.error;
        return response;
      }catch(err){
        if(!mayRetry||attempt||!avatarNetworkError(err)||expectedUid!==currentAvatarUser())throw err;
        await new Promise(resolve=>setTimeout(resolve,550));
      }
    }
  }
  function resetAvatarState(){
    avatarRevision++;
    currentAvatar={uid:null,source:'dicebear',seed:'WorldsGallery',path:null,src:'',expiresAt:0};
    avatarPending=null;
    updateAvatarSlots();
  }
  // The live profile constraint accepts only dicebear, multiavatar, or upload.
  // Adventurer (illustrated) is a DiceBear style, identified by the preset seed.
  // Do not add an unsupported 'adventurer' avatar_source or change production SQL.
  function avatarSourceUrl(source,seed){
    const safeSeed=cleanSeed(seed)||'WorldsGallery';
    const kind=source==='adventurer' || (source==='dicebear' && safeSeed.startsWith('WorldsGallery-Illustrated-'))
      ? 'adventurer' : (source==='upload' ? 'dicebear' : source);
    return imageUrl(kind,safeSeed);
  }
  function updateAvatarSlots(){
    const uid=currentAvatarUser();
    for (const el of document.querySelectorAll('[data-wg-avatar-slot], [data-wg-avatar-owner]')) {
      const owner=el.getAttribute('data-wg-avatar-owner');
      const eligible=Boolean(uid&&currentAvatar.uid===uid&&currentAvatar.src&&(!owner||owner===uid));
      const nextSrc=eligible?currentAvatar.src:'';
      if(el.dataset.wgAvatarRendered===nextSrc || (nextSrc&&el.dataset.wgAvatarFailed===nextSrc))continue;
      el.dataset.wgAvatarRendered=nextSrc;
      const fallback=el.dataset.wgAvatarFallback||'?';
      if(!nextSrc){el.replaceChildren(document.createTextNode(fallback));continue;}
      const image=document.createElement('img');image.alt='';image.loading='lazy';image.decoding='async';image.src=nextSrc;
      image.addEventListener('error',()=>{
        if(el.dataset.wgAvatarRendered!==nextSrc)return;
        el.dataset.wgAvatarFailed=nextSrc;el.dataset.wgAvatarRendered='';el.replaceChildren(document.createTextNode(fallback));
      },{once:true});
      el.replaceChildren(image);
    }
  }
  const avatarObserver=new MutationObserver(()=>updateAvatarSlots());
  function beginAvatarObserver(){
    const gallery=$('#gallery'),read=$('#readBody'),menu=$('#wgAccountMenu'),content=$('#wgAcContent');
    for(const root of [gallery,read,menu,content])if(root)avatarObserver.observe(root,{childList:true,subtree:true});
  }
  async function loadCurrentAvatar(force=false){
    const uid=currentAvatarUser(),client=avatarClient();
    if(!uid||!client){resetAvatarState();return;}
    if(!force&&currentAvatar.uid===uid&&currentAvatar.src &&
      (currentAvatar.source!=='upload'||Date.now()<currentAvatar.expiresAt-90000)){
      updateAvatarSlots();return;
    }
    if(!force&&avatarPending===uid)return;
    avatarPending=uid;
    const revision=++avatarRevision;
    try{
      const result=await avatarSafeRequest(()=>client.from('wg_profiles').select('avatar_source,avatar_seed,avatar_path').eq('user_id',uid).maybeSingle(),uid);
      if(revision!==avatarRevision||uid!==currentAvatarUser())return;
      const source=['dicebear','adventurer','multiavatar','upload'].includes(result.data?.avatar_source)?result.data.avatar_source:'dicebear';
      const seed=cleanSeed(result.data?.avatar_seed)||'WorldsGallery';
      const path=result.data?.avatar_path||null;
      let src=avatarSourceUrl(source,seed),expiresAt=0;
      if(source==='upload'&&path){
        // Only an authenticated owner can request a signed URL to their own private avatar.
        const signed=await avatarSafeRequest(()=>client.storage.from(AVATAR_BUCKET).createSignedUrl(path,3600),uid);
        if(revision!==avatarRevision||uid!==currentAvatarUser())return;
        if(!signed.error&&signed.data?.signedUrl){src=signed.data.signedUrl;expiresAt=Date.now()+3600000;}
      }
      currentAvatar={uid,source,seed,path,src,expiresAt};
      updateAvatarSlots();
      document.dispatchEvent(new Event('wg:avatar-ready'));
    }catch(err){
      if(revision===avatarRevision&&uid===currentAvatarUser())console.warn('Profile avatar unavailable:',err?.message||err);
    }finally{if(avatarPending===uid)avatarPending=null;}
  }
  function closeActiveAvatarDialog(){
    const dialog=document.getElementById('wg-v2232-avatar-dialog');
    if(dialog?.open)dialog.close();
  }
  function avatarUUID(){
    if(typeof crypto.randomUUID==='function')return crypto.randomUUID();
    const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);
    bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
    const h=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
    return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
  }
  function avatarSeed(kind,index){return `WorldsGallery-${kind==='dicebear'?'Cartoon':'Illustrated'}-${String(index+1).padStart(3,'0')}`;}
  async function chooseAvatar(kind,section){
    if(!section.isConnected || document.getElementById('wg-v2232-avatar-dialog'))return;
    const uid=currentAvatarUser(),client=avatarClient();
    if(!uid||!client)return;
    const dialog=document.createElement('dialog');
    dialog.id='wg-v2232-avatar-dialog';dialog.className='wg-v2232-avatar-dialog';
    const isUpload=kind==='upload';
    const title=isUpload?'Upload a profile picture':kind==='dicebear'?'Choose a cartoon avatar':'Choose an illustrated avatar';
    dialog.innerHTML=`<div class="wg-v2232-modal-head"><div><span class="wg-v2232-eyebrow">YOUR WORLD / PROFILE</span><h3 id="wg-v2232-modal-title">${title}</h3><p>${isUpload?'JPG, PNG or WebP; up to 5 MB. Your image stays private.':'Select one design. More options are available as you scroll.'}</p></div><button type="button" class="wg-v2232-modal-x" aria-label="Close avatar picker" data-wg-close>${avatarGlyph('close')}</button></div>
      ${isUpload?`<div class="wg-v2232-upload-panel wg-v2233-upload-panel"><label for="wg-v2232-file">${avatarGlyph('camera')} Choose a photo from your device</label><input id="wg-v2232-file" type="file" accept="image/jpeg,image/png,image/webp"><div class="wg-v2232-upload-preview wg-v2233-upload-preview" id="wg-v2232-upload-preview"><p class="wg-v2233-no-photo">Choose a photo to crop and adjust.</p><div class="wg-v2233-crop-editor" hidden><div class="wg-v2233-crop-stage" tabindex="0" role="group" aria-label="Crop preview. Drag to move photo, or use arrow keys to reposition." aria-describedby="wg-v2233-crop-help"><canvas id="wg-v2233-crop-canvas" width="512" height="512" aria-label="Square preview of your cropped profile photo"></canvas></div><div class="wg-v2233-crop-controls"><label for="wg-v2233-crop-zoom">Zoom <output id="wg-v2233-zoom-value" for="wg-v2233-crop-zoom">100%</output></label><input id="wg-v2233-crop-zoom" type="range" min="1" max="3" value="1" step="0.05" aria-label="Photo crop zoom"><button type="button" id="wg-v2233-crop-reset">${avatarGlyph('face')} Recenter & reset zoom</button><p id="wg-v2233-crop-help">Drag the photo, use arrow keys, and zoom to choose exactly what appears in your profile circle. Only the cropped square is uploaded.</p></div></div></div></div>`:
        `<div class="wg-v2232-avatar-grid" role="group" aria-label="Avatar options"></div><button type="button" class="wg-v2232-more" id="wg-v2232-more">Show more designs</button>`}
      <p class="wg-v2232-modal-message" role="status" aria-live="polite"></p><div class="wg-v2232-modal-actions"><button type="button" class="wg-v2232-cancel" data-wg-close>Cancel</button><button type="button" class="wg-v2232-confirm" disabled>${avatarGlyph('check')} Confirm</button></div>`;
    dialog.setAttribute('aria-labelledby','wg-v2232-modal-title');
    document.body.append(dialog);
    let draftSeed=null,cropBitmap=null,cropPosition=null,dragStart=null,rendered=0,saving=false;
    const confirm=dialog.querySelector('.wg-v2232-confirm');
    const message=dialog.querySelector('.wg-v2232-modal-message');
    const grid=dialog.querySelector('.wg-v2232-avatar-grid');
    // Set the scroller height to an exact number of whole avatar rows.
    // This prevents a second row being cropped at its eyes or forehead.
    function fitCompleteAvatarRows(){
      if(!grid || !dialog.open)return;
      const first=grid.querySelector('.wg-v2232-avatar-option');
      if(!first)return;
      const css=getComputedStyle(grid),row=first.getBoundingClientRect().height;
      if(!(row>0))return;
      const gap=parseFloat(css.rowGap)||0;
      const padding=(parseFloat(css.paddingTop)||0)+(parseFloat(css.paddingBottom)||0);
      const budget=Math.max(row+padding,Math.min(window.innerHeight*.45,430));
      const rows=Math.max(1,Math.min(3,Math.floor((budget-padding+gap)/(row+gap))));
      const exact=Math.floor(rows*row+(rows-1)*gap+(parseFloat(css.paddingTop)||0));
      grid.style.height=`${exact}px`;
      grid.style.maxHeight=`${exact}px`;
    }
    function renderBatch(){
      if(!grid)return;
      for(let i=rendered;i<Math.min(rendered+AVATAR_SEEDS_PER_BATCH,MAX_AVATAR_PRESETS);i++){
        const seed=avatarSeed(kind,i);
        const tile=document.createElement('button');tile.type='button';tile.className='wg-v2232-avatar-option';
        tile.dataset.seed=seed;tile.setAttribute('aria-pressed','false');tile.setAttribute('aria-label',`${title}, option ${i+1}`);
        const img=document.createElement('img');img.src=avatarSourceUrl(kind,seed);img.alt='';img.loading='lazy';img.decoding='async';
        tile.append(img);tile.addEventListener('click',()=>{
          draftSeed=seed;confirm.disabled=false;
          grid.querySelectorAll('[aria-pressed="true"]').forEach(b=>b.setAttribute('aria-pressed','false'));
          tile.setAttribute('aria-pressed','true');message.textContent='';
        });grid.append(tile);
      }
      rendered=Math.min(rendered+AVATAR_SEEDS_PER_BATCH,MAX_AVATAR_PRESETS);
      const more=dialog.querySelector('#wg-v2232-more');if(more)more.hidden=rendered>=MAX_AVATAR_PRESETS;
      if(dialog.open)requestAnimationFrame(fitCompleteAvatarRows);
    }
    if(grid){renderBatch();dialog.querySelector('#wg-v2232-more')?.addEventListener('click',renderBatch);}
    if(isUpload){
      const fileInput=dialog.querySelector('#wg-v2232-file');
      const preview=dialog.querySelector('#wg-v2232-upload-preview');
      const editor=preview.querySelector('.wg-v2233-crop-editor');
      const empty=preview.querySelector('.wg-v2233-no-photo');
      const canvas=preview.querySelector('#wg-v2233-crop-canvas');
      const stage=preview.querySelector('.wg-v2233-crop-stage');
      const zoomSlider=preview.querySelector('#wg-v2233-crop-zoom');
      const zoomOutput=preview.querySelector('#wg-v2233-zoom-value');
      const reset=preview.querySelector('#wg-v2233-crop-reset');
      function draw(){
        if(!cropBitmap||!cropPosition)return;
        renderAvatarCrop(cropBitmap,cropPosition,canvas);
        zoomOutput.value=String(Math.round(cropPosition.zoom*100))+'%';
        zoomOutput.textContent=zoomOutput.value;
      }
      function clearCurrentCrop(){
        if(cropBitmap){cropBitmap.close?.();cropBitmap=null;}
        cropPosition=null;dragStart=null;
        confirm.disabled=true;
        editor.hidden=true;empty.hidden=false;
      }
      fileInput.addEventListener('change',async()=>{
        const file=fileInput.files?.[0];if(!file)return;
        const selectionRevision=(dialog._selectionRevision||0)+1;
        dialog._selectionRevision=selectionRevision;
        clearCurrentCrop();message.textContent='Preparing photo editor...';
        try{
          assertAvatarFile(file);
          const nextBitmap=await createImageBitmap(file);
          if(!dialog.isConnected||dialog._selectionRevision!==selectionRevision){nextBitmap.close?.();return;}
          if(!nextBitmap.width||!nextBitmap.height||nextBitmap.width*nextBitmap.height>36000000){
            nextBitmap.close?.();throw new Error('Photo dimensions are unsupported. Try a smaller picture.');
          }
          cropBitmap=nextBitmap;
          cropPosition={x:nextBitmap.width/2,y:nextBitmap.height/2,zoom:1};
          zoomSlider.value='1';editor.hidden=false;empty.hidden=true;
          draw();confirm.disabled=false;
          message.textContent='Move and zoom the photo, then Confirm to save your crop.';
        }catch(err){
          if(dialog._selectionRevision!==selectionRevision)return;
          clearCurrentCrop();message.textContent=err?.message||'Unable to open photo.';
        }finally{fileInput.value='';}
      });
      zoomSlider.addEventListener('input',()=>{
        if(saving||!cropPosition)return;
        cropPosition.zoom=clampAvatar(Number(zoomSlider.value)||1,1,3);
        draw();
      });
      reset.addEventListener('click',()=>{
        if(saving||!cropBitmap||!cropPosition)return;
        cropPosition={x:cropBitmap.width/2,y:cropBitmap.height/2,zoom:1};
        zoomSlider.value='1';draw();
      });
      stage.addEventListener('pointerdown',event=>{
        if(saving||!cropBitmap||!cropPosition||(event.pointerType==='mouse'&&event.button!==0))return;
        event.preventDefault();
        dragStart={id:event.pointerId,clientX:event.clientX,clientY:event.clientY,x:cropPosition.x,y:cropPosition.y};
        stage.setPointerCapture?.(event.pointerId);
      });
      stage.addEventListener('pointermove',event=>{
        if(saving||!dragStart||event.pointerId!==dragStart.id||!cropBitmap||!cropPosition)return;
        const width=stage.getBoundingClientRect().width;
        if(!width)return;
        const side=Math.min(cropBitmap.width,cropBitmap.height)/cropPosition.zoom;
        cropPosition.x=clampAvatar(dragStart.x-(event.clientX-dragStart.clientX)*side/width,side/2,cropBitmap.width-side/2);
        cropPosition.y=clampAvatar(dragStart.y-(event.clientY-dragStart.clientY)*side/width,side/2,cropBitmap.height-side/2);
        draw();
      });
      const stopDrag=event=>{if(dragStart?.id===event.pointerId)dragStart=null;};
      stage.addEventListener('pointerup',stopDrag);
      stage.addEventListener('pointercancel',stopDrag);
      stage.addEventListener('lostpointercapture',()=>{dragStart=null;});
      stage.addEventListener('keydown',event=>{
        if(saving||!cropBitmap||!cropPosition||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;
        event.preventDefault();
        const side=Math.min(cropBitmap.width,cropBitmap.height)/cropPosition.zoom;
        const pixels=(event.shiftKey?24:8)*side/(stage.getBoundingClientRect().width||280);
        if(event.key==='ArrowLeft')cropPosition.x+=pixels;
        if(event.key==='ArrowRight')cropPosition.x-=pixels;
        if(event.key==='ArrowUp')cropPosition.y+=pixels;
        if(event.key==='ArrowDown')cropPosition.y-=pixels;
        draw();
      });
      dialog.addEventListener('close',()=>{
        dialog._selectionRevision=(dialog._selectionRevision||0)+1;
        clearCurrentCrop();
      },{once:true});
      dialog._lockCropControls=value=>{
        fileInput.disabled=value;zoomSlider.disabled=value;reset.disabled=value;
        stage.style.pointerEvents=value?'none':'';
      };
    }
    dialog.querySelectorAll('[data-wg-close]').forEach(b=>b.addEventListener('click',()=>{if(!saving)dialog.close();}));
    dialog.addEventListener('cancel',e=>{if(saving)e.preventDefault();});
    dialog.addEventListener('close',()=>{
      dialog.remove();
    },{once:true});
    confirm.addEventListener('click',async()=>{
      if(saving||(!isUpload&&!draftSeed)||(isUpload&&!cropBitmap))return;
      if(uid!==currentAvatarUser()){message.textContent='Session changed. Please sign in again.';return;}
      saving=true;confirm.disabled=true;message.textContent='Saving your selection...';
      if(isUpload)dialog._lockCropControls?.(true);
      let newPath=null,committed=false,updateAttempted=false,previewUnavailable=false;
      try{
        const nextSource=isUpload?'upload':(kind==='adventurer'?'dicebear':kind);
        if(isUpload){
          const cropCanvas=dialog.querySelector('#wg-v2233-crop-canvas');
          const draftBlob=await avatarCropWebp(cropCanvas);
          if(uid!==currentAvatarUser())throw new Error('Account changed while cropping. Please sign in again.');
          newPath=`${uid}/avatars/${avatarUUID()}.webp`;
          const result=await client.storage.from(AVATAR_BUCKET).upload(newPath,draftBlob,{contentType:'image/webp',upsert:false});
          if(result.error)throw result.error;
        }
        if(uid!==currentAvatarUser())throw new Error('Account changed while saving. Please sign in again.');
        const values={avatar_source:nextSource,avatar_seed:isUpload?(currentAvatar.seed||'WorldsGallery'):draftSeed,avatar_path:isUpload?newPath:null};
        updateAttempted=true;
        const updated=await avatarSafeRequest(()=>client.from('wg_profiles').update(values).eq('user_id',uid).select('user_id').single(),uid,!isUpload);
        committed=true;
        if(uid!==currentAvatarUser()){dialog.close();return;}
        const priorPath=currentAvatar.uid===uid?currentAvatar.path:null;
        // Invalidate all previous pending signed-link fetches before updating the UI.
        avatarRevision++;
        currentAvatar={uid,source:nextSource,seed:values.avatar_seed,path:values.avatar_path,src:avatarSourceUrl(nextSource,values.avatar_seed),expiresAt:0};
        if(isUpload){
          try{
            const signed=await avatarSafeRequest(()=>client.storage.from(AVATAR_BUCKET).createSignedUrl(newPath,3600),uid);
            if(uid!==currentAvatarUser()){dialog.close();return;}
            if(signed.data?.signedUrl){currentAvatar.src=signed.data.signedUrl;currentAvatar.expiresAt=Date.now()+3600000;}
            else previewUnavailable=true;
          }catch(previewError){
            // Profile write succeeded; failure to generate a preview is not a save failure.
            previewUnavailable=true;
            console.warn('Avatar saved but private preview is temporarily unavailable:',avatarFriendlyError(previewError));
          }
        }
        updateAvatarSlots();document.dispatchEvent(new CustomEvent('wg:avatar-updated',{detail:{userId:uid,...values}}));
        const status=section.querySelector('#wg-v28-avatar-msg');if(status)status.textContent=previewUnavailable?'Profile saved. Private preview is temporarily unavailable; reconnect and reopen your profile.':'Profile picture updated.';
        dialog.close();
        // Remove only our previous avatar asset, never story photos or another user's files.
        if(priorPath&&priorPath!==newPath&&priorPath.startsWith(`${uid}/avatars/`)){
          client.storage.from(AVATAR_BUCKET).remove([priorPath]).catch(()=>{});
        }
      }catch(err){
        if(newPath&&!committed&&(!updateAttempted||!avatarNetworkError(err)))try{await client.storage.from(AVATAR_BUCKET).remove([newPath]);}catch{}
        message.textContent='Could not save avatar: '+avatarFriendlyError(err);
      }finally{
        saving=false;
        if(isUpload)dialog._lockCropControls?.(false);
        if(dialog.isConnected)confirm.disabled=isUpload?!cropBitmap:!draftSeed;
      }
    });
    dialog.showModal();
    if(grid){
      requestAnimationFrame(fitCompleteAvatarRows);
      window.addEventListener('resize',fitCompleteAvatarRows);
      dialog.addEventListener('close',()=>window.removeEventListener('resize',fitCompleteAvatarRows),{once:true});
    }
    dialog.querySelector('[data-wg-close]')?.focus();
  }
  async function profileAvatar(){
    const form=$('#wgAcProfileForm');
    if(!form||$('#wg-v28-avatar'))return;
    const uid=currentAvatarUser();
    if(!uid||!avatarClient())return;
    const section=document.createElement('section');section.id='wg-v28-avatar';section.className='wg-v28-avatar-card wg-v2232-avatar-card';
    section.innerHTML=`<div class="wg-v2232-avatar-head"><div class="wg-v2232-avatar-copy"><span class="wg-v2232-eyebrow">YOUR PROFILE / IDENTITY</span><h3>Profile picture</h3><p>Choose an avatar or use your own photo. Confirm inside each picker to save your selection.</p></div><div class="wg-v2232-preview-wrap"><span class="wg-v2232-preview-frame" data-wg-avatar-slot="profile" data-wg-avatar-fallback="?"></span><span>Current picture</span></div></div>
      <div class="wg-v2232-avatar-buttons"><button type="button" data-wg-picker="dicebear">${avatarGlyph('face')} Cartoon</button><button type="button" data-wg-picker="adventurer">${avatarGlyph('pen')} Illustrated</button><button type="button" data-wg-picker="upload">${avatarGlyph('camera')} Upload from device</button></div>
      <p class="wg-v2232-avatar-hint">Your chosen picture appears beside your account name and your own story author name.</p><small id="wg-v28-avatar-msg" role="status" aria-live="polite"></small>`;
    form.prepend(section);
    section.querySelectorAll('[data-wg-picker]').forEach(button=>button.addEventListener('click',()=>chooseAvatar(button.dataset.wgPicker,section)));
    await loadCurrentAvatar();
  }
  document.addEventListener('wg:authenticated',()=>{loadCurrentAvatar(true).catch(console.warn);});
  document.addEventListener('wg:menu-rendered',updateAvatarSlots);
  document.addEventListener('wg:account-page',()=>{closeActiveAvatarDialog();queueMicrotask(updateAvatarSlots);});
  document.addEventListener('wg:signedout',resetAvatarState);
  document.addEventListener('wg:guest-ready',()=>{if(!currentAvatarUser())resetAvatarState();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&currentAvatarUser())loadCurrentAvatar().catch(console.warn);});
  window.addEventListener('focus',()=>{if(currentAvatarUser())loadCurrentAvatar().catch(console.warn);});
  window.WorldsGalleryAvatar={refresh:()=>loadCurrentAvatar(true),currentUserId:currentAvatarUser};

  function profileAndSettings() {
    const form=$('#wgAcProfileForm');
    if(form && !form.querySelector('.wg-v28-profile-heading')){
      const heading=document.createElement('div');heading.className='wg-v28-profile-heading';
      heading.innerHTML='<strong>Account identity</strong><small>Visible name, username and verified account email</small>';
      form.insertBefore(heading,form.querySelector('.wg-ac-two'));
      const save=form.querySelector('.wg-ac-save');if(save)save.textContent='Save profile details';
    }
    const settings=$('#wgAcSettingsForm');
    if(settings && !settings.classList.contains('wg-v28-settings')) settings.classList.add('wg-v28-settings');
    profileAvatar().catch(console.warn);
  }

  function decorateSupport() {
    const compose=$('.wg-mail-compose');
    if (!compose || compose.classList.contains('wg-v28-letter')) return;
    compose.classList.add('wg-v28-letter');
    const form=compose.querySelector('#wgAcSupportForm');
    if(form){form.classList.add('wg-v28-letter-paper');const heading=compose.querySelector('.wg-mail-heading');if(heading)heading.insertAdjacentHTML('afterend','<p class="wg-v28-mail-instruction">Write your concern on the letter, then send it through the mailbox.</p>');}
  }

  let busy=false;
  function init() {
    if(busy)return;busy=true;
    try{initSort();profileAndSettings();decorateSupport();localePosition();if(currentAvatarUser())loadCurrentAvatar().catch(console.warn);}finally{busy=false;}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{beginAvatarObserver();init();},{once:true});else{beginAvatarObserver();init();}
  window.addEventListener('scroll',localePosition,{passive:true});
  window.addEventListener('resize',localePosition);
  for(const evt of ['wg:account-page','wg:menu-rendered','wg:authenticated','wg:guest-ready'])document.addEventListener(evt,()=>queueMicrotask(init));
  const drawer=$('#wgAccountDrawer');if(drawer)new MutationObserver(()=>queueMicrotask(init)).observe(drawer,{childList:true,subtree:false});
})();
