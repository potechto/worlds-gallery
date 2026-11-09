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
    const select = $('#sortFilter');
    const field = select?.closest('.filter-field.sort');
    if (!select || !field || field.querySelector('.wg-v28-sort')) return;
    const toggle = $('.wg-mine-toggle');
    const component = document.createElement('div');
    component.className = 'wg-v28-sort';
    component.innerHTML = `<button type="button" class="wg-v28-sort-trigger" aria-expanded="false" aria-controls="wg-v28-sort-list">Newest first <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div id="wg-v28-sort-list" class="wg-v28-sort-popup" role="group" hidden></div>`;
    field.append(component);
    select.classList.add('wg-v28-native-sort');
    const trigger = component.querySelector('button');
    const popup = component.querySelector('.wg-v28-sort-popup');
    function label() {
      trigger.firstChild.textContent = toggle?.querySelector('input')?.checked ? 'View mine only' : (select.selectedOptions[0]?.textContent || 'Sort stories');
    }
    function close() { popup.hidden = true; trigger.setAttribute('aria-expanded', 'false'); }
    function paint() {
      popup.replaceChildren();
      for (const option of select.options) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'wg-v28-sort-option';
        button.textContent = option.textContent;
        button.setAttribute('aria-pressed', String(option.value === select.value && !toggle?.querySelector('input')?.checked));
        button.addEventListener('click', () => {
          const box = toggle?.querySelector('input');
          if (box?.checked) { box.checked = false; box.dispatchEvent(new Event('change', {bubbles:true})); }
          select.value = option.value;
          select.dispatchEvent(new Event('change', {bubbles:true}));
          label(); close();
        });
        popup.append(button);
      }
      if (toggle) {
        toggle.classList.add('wg-v28-mine');
        popup.append(toggle);
        const box = toggle.querySelector('input');
        box?.addEventListener('change', () => {label();close();}, {once:true});
      }
    }
    trigger.addEventListener('click', () => { if (popup.hidden) { paint();popup.hidden = false;trigger.setAttribute('aria-expanded','true'); } else close(); });
    component.addEventListener('keydown', e => { if (e.key === 'Escape') { close(); trigger.focus(); } });
    document.addEventListener('click', e => { if (!component.contains(e.target)) close(); });
    select.addEventListener('change', label);
    label();
  }

  async function makeWebp(file) {
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)
      throw new Error('Choose a JPG, PNG or WebP under 5 MB.');
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 512 / Math.max(bitmap.width,bitmap.height));
    const w = Math.max(1,Math.floor(bitmap.width*scale));
    const h = Math.max(1,Math.floor(bitmap.height*scale));
    const canvas = document.createElement('canvas'); canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d'); if (!ctx) throw new Error('Image conversion unavailable');
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);ctx.drawImage(bitmap,0,0,w,h);
    bitmap.close?.();
    return await new Promise((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(new Error('Image processing failed')),'image/webp',0.84));
  }

  async function profileAvatar() {
    const form=$('#wgAcProfileForm');
    if (!form || $('#wg-v28-avatar')) return;
    const auth=window.WorldsGalleryAuth;
    const client=auth?.getClient?.();
    const userId=auth?.getCurrentUserId?.();
    if (!client || !userId) return;
    const section=document.createElement('section');
    section.id='wg-v28-avatar';section.className='wg-v28-avatar-card';
    section.innerHTML=`<div class="wg-v28-avatar-head"><div class="wg-v28-avatar-picture"><img alt="Your selected profile avatar" id="wg-v28-avatar-preview"></div><div><strong>Profile picture</strong><p>Choose a style, generate a new face, or upload your own photo.</p></div></div><div class="wg-v28-avatar-choices"><button type="button" data-avatar="dicebear">Cartoon</button><button type="button" data-avatar="adventurer">Illustrated</button><button type="button" data-avatar="multiavatar">Special avatar</button></div><div class="wg-v28-avatar-actions"><button type="button" id="wg-v28-randomize">Shuffle avatar</button><label class="wg-v28-upload">Upload from device<input type="file" id="wg-v28-avatar-file" accept="image/jpeg,image/png,image/webp"></label></div><div class="wg-v28-avatar-save"><button type="button" id="wg-v28-avatar-save">Save avatar</button><small id="wg-v28-avatar-msg" role="status"></small></div>`;
    form.prepend(section);
    const preview=section.querySelector('#wg-v28-avatar-preview'),msg=section.querySelector('#wg-v28-avatar-msg');
    let kind='dicebear',seed=cleanSeed(crypto.randomUUID()),pending=null,path=null;
    const current=await client.from('wg_profiles').select('avatar_source,avatar_seed,avatar_path').eq('user_id',userId).maybeSingle();
    if (!section.isConnected) return;
    if (!current.error && current.data) {
      kind=current.data.avatar_source||kind;
      seed=cleanSeed(current.data.avatar_seed)||seed;
      path=current.data.avatar_path||null;
    }
    const show=async()=>{
      if (pending){preview.src=URL.createObjectURL(pending);return;}
      if (kind==='upload' && path){
        const signed=await client.storage.from('wg-private-photos').createSignedUrl(path,3600);
        if (!signed.error && signed.data?.signedUrl) {preview.src=signed.data.signedUrl;return;}
      }
      preview.src=imageUrl(kind==='upload'?'dicebear':kind,seed);
    };
    await show();
    section.addEventListener('click',async e=>{
      const choose=e.target.closest('[data-avatar]');
      if(choose){kind=choose.dataset.avatar;pending=null;path=null;seed=cleanSeed(crypto.randomUUID());await show();}
      if(e.target.closest('#wg-v28-randomize')){if(kind==='upload')kind='dicebear';pending=null;path=null;seed=cleanSeed(crypto.randomUUID());await show();}
      if(e.target.closest('#wg-v28-avatar-save')){
        const button=section.querySelector('#wg-v28-avatar-save');button.disabled=true;msg.textContent='Saving avatar...';
        try {
          let uploadPath=path;
          if(pending){
            uploadPath=`${userId}/avatars/${crypto.randomUUID()}.webp`;
            const uploaded=await client.storage.from('wg-private-photos').upload(uploadPath,pending,{contentType:'image/webp',upsert:false});
            if(uploaded.error)throw uploaded.error;
            kind='upload';
          }
          const values={avatar_source:kind,avatar_seed:seed,avatar_path:kind==='upload'?uploadPath:null};
          const result=await client.from('wg_profiles').update(values).eq('user_id',userId).select('user_id').single();
          if(result.error)throw result.error;
          path=values.avatar_path;pending=null;msg.textContent='Avatar saved to your account.';
          document.dispatchEvent(new CustomEvent('wg:avatar-updated',{detail:values}));
          await show();
        }catch(err){msg.textContent='Could not save: '+String(err?.message||err);}
        finally{button.disabled=false;}
      }
    });
    section.querySelector('#wg-v28-avatar-file').addEventListener('change',async e=>{
      const file=e.target.files?.[0]; if(!file)return;
      try{pending=await makeWebp(file);kind='upload';path=null;msg.textContent='Photo ready. Select Save avatar.';await show();}
      catch(err){msg.textContent=String(err.message||err);}
    });
  }

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
    try{initSort();profileAndSettings();decorateSupport();localePosition();}finally{busy=false;}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('scroll',localePosition,{passive:true});
  window.addEventListener('resize',localePosition);
  for(const evt of ['wg:account-page','wg:menu-rendered','wg:authenticated','wg:guest-ready'])document.addEventListener(evt,()=>queueMicrotask(init));
  const drawer=$('#wgAccountDrawer');if(drawer)new MutationObserver(()=>queueMicrotask(init)).observe(drawer,{childList:true,subtree:false});
})();
