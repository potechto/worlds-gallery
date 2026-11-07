/* Worlds Gallery V2.2 — account drawer, protected settings, support intake,
   and a cinematic gallery handoff. Public Supabase key only; RLS authorizes. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const countryList = typeof COUNTRIES !== 'undefined' ? COUNTRIES : [];
  const countryName = code => countryList.find(c=>c[0]===code)?.[1] || code || 'Unknown';
  const api = () => window.WorldsGalleryAuth?.getClient?.();
  let user = null, profile = null, activePage = 'menu';
  let open = false, loading = false, lastFocus = null, flightBusy = false, bypassFlight = false;
  const styles = {
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M5 5l14 14M19 5L5 19"/>',
    arrow: '<path d="m9 18 6-6-6-6"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    settings: '<path d="M4 7h16M7 7v10M4 17h16M17 7v10"/>',
    support: '<path d="M4 10a8 8 0 0 1 16 0v7M4 15h3v5H5a2 2 0 0 1-2-2v-1a2 2 0 0 1 1-2ZM20 15h-3v5h2a2 2 0 0 0 2-2v-1a2 2 0 0 0-1-2Z"/>',
    exit: '<path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 16l4-4-4-4M8 12h11"/>',
    earth: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 4.5 6 4.5 9s-1.5 6-4.5 9M12 3c-3 3-4.5 6-4.5 9s1.5 6 4.5 9"/>',
    story: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="m7 16 4-5 3 3 2-2 2 4"/><circle cx="9" cy="9" r="1"/>'
  };
  const icon = (n,size=21) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${styles[n]}</svg>`;

  const trigger = document.createElement('button');
  trigger.type='button';trigger.id='wgAccountTrigger';trigger.hidden=true;
  trigger.className='wg-account-trigger';trigger.innerHTML=icon('menu');
  trigger.setAttribute('aria-label','Open account menu');trigger.setAttribute('aria-expanded','false');
  trigger.setAttribute('aria-controls','wgAccountDrawer');
  // Put the single account control in the gallery navigation, never on the globe.
  const galleryNav = document.querySelector('.site-header .nav-bar');
  const originalShare = galleryNav?.querySelector('.nav-share[data-open-upload]');
  if (!galleryNav || !originalShare) {
    console.warn('Worlds Gallery: gallery navigation not found. Account menu was not installed.');
    return;
  }
  originalShare.insertAdjacentElement('afterend', trigger);

  const shade = document.createElement('div');shade.id='wgAccountShade';shade.hidden=true;
  document.body.appendChild(shade);
  const drawer = document.createElement('aside');
  drawer.id='wgAccountDrawer';drawer.hidden=true;drawer.setAttribute('role','dialog');
  drawer.setAttribute('aria-modal','true');drawer.setAttribute('aria-label','Worlds Gallery account menu');
  drawer.innerHTML=`<header class="wg-ac-header"><span class="wg-ac-mark">WORLDS.GALLERY <span>/ ACCOUNT</span></span></header><div id="wgAcContent" class="wg-ac-content"></div>`;
  document.body.appendChild(drawer);
  const drawerHeader = drawer.querySelector('.wg-ac-header');
  const isGallery = () => !!user &&
    document.documentElement.classList.contains('wg-auth-ok') &&
    !document.body.classList.contains('portal-locked');
  function syncTrigger() {
    if (open) return;
    trigger.hidden = !isGallery() || flightBusy;
  }
  // The portal changes its body class when entering or leaving the gallery.
  new MutationObserver(syncTrigger).observe(document.body, {
    attributes: true, attributeFilter: ['class']
  });

  // Available even on the signed-out Create Account and Sign In screens.
  const guest = document.createElement('button');
  guest.id='wgGuestSupport';guest.type='button';guest.textContent='Customer support / feedback';
  guest.className='wg-auth-text-button wg-ac-guest-help';
  const panel=byId('wgAuthGate')?.querySelector('.wg-auth-panel');
  if(panel) panel.appendChild(guest);

  const black = document.createElement('div');black.id='wgGalleryBlackout';black.hidden=true;
  black.setAttribute('aria-hidden','true');document.body.appendChild(black);

  const content = byId('wgAcContent');
  const action = (label,key,ic) => `<button class="wg-ac-menu-row" type="button" data-ac="${key}">${icon(ic)}<span>${label}</span>${icon('arrow',17)}</button>`;
  function flash(msg,good=true) {
    const el=byId('wgAcMessage');if(!el)return;
    el.textContent=msg;
    el.dataset.good=good?'true':'false';
    el.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  function title(text,sub,back=true) {
    return `<div class="wg-ac-page-head">${back?`<button class="wg-ac-back" id="wgAcBack" type="button" aria-label="Back to account menu">${icon('back',19)}</button>`:''}<div><span class="wg-ac-overline">PERSONAL SPACE</span><h2>${esc(text)}</h2><p>${esc(sub)}</p></div></div><p id="wgAcMessage" class="wg-ac-message" role="status" aria-live="polite"></p>`;
  }
  function renderMenu() {
    activePage='menu';
    const name=profile?.display_name || user?.email?.split('@')[0] || 'Your account';
    content.innerHTML=`<div class="wg-ac-intro"><span class="wg-ac-overline">YOUR WORLD</span><h2>${esc(name)}</h2><p>${user?`@${esc(profile?.username||'member')} · ${esc(profile?.home_country_name||'Worlds Gallery')}`:'Help and support are available from here.'}</p></div><div class="wg-ac-menu-items">${user?action('My profile','profile','user')+action('Share your story','share','story')+action('Return to Earth','earth','earth')+action('Settings & privacy','settings','settings'):''}${action('Support & feedback','support','support')}${user?action('Sign out','signout','exit'):''}</div><div class="wg-ac-footnote">Your profile and uploaded content remain protected by your account privacy settings.</div>`;
    content.querySelectorAll('[data-ac]').forEach(button=>button.addEventListener('click',()=>{
      if(button.dataset.ac==='signout') {closeDrawer();byId('wgLogout')?.click();return;}
      if(button.dataset.ac==='share') {
        closeDrawer();originalShare.click();return;
      }
      if(button.dataset.ac==='earth') {
        closeDrawer();byId('arrivalBackEarth')?.click();syncTrigger();return;
      }
      renderPage(button.dataset.ac);
    }));
  }
  function renderPage(page) {
    activePage=page;
    if(page==='profile') renderProfile();
    else if(page==='settings') renderSettings();
    else if(page==='support') renderSupport();
    else renderMenu();
    byId('wgAcBack')?.addEventListener('click',renderMenu);
    drawer.querySelector('h2')?.setAttribute('tabindex','-1');
    requestAnimationFrame(()=>drawer.querySelector('h2')?.focus({preventScroll:true}));
  }
  function setMenuOpen(show) {
    if (show === open) return;
    if (show) lastFocus = document.activeElement;
    open = show;
    shade.hidden = !show;
    drawer.hidden = !show;
    drawer.classList.toggle('wg-ac-outside',!user);
    document.documentElement.classList.toggle('wg-ac-open',show);
    trigger.setAttribute('aria-expanded', String(show));
    trigger.setAttribute('aria-label', show ? 'Close account menu' : 'Open account menu');
    trigger.innerHTML = icon(show ? 'close' : 'menu');
    if (show) {
      // Move the SAME hamburger/X into the drawer header so it never floats
      // over 'Sign out' or crosses into the Earth screen.
      drawerHeader.appendChild(trigger);
      trigger.hidden = false;
      renderMenu();
      trigger.focus({preventScroll:true});
    } else {
      originalShare.insertAdjacentElement('afterend',trigger);
      syncTrigger();
      const focus = lastFocus;
      lastFocus = null;
      if (focus?.isConnected && !focus.hidden && focus.getClientRects().length) {
        focus.focus({preventScroll:true});
      }
    }
  }
  function closeDrawer(){setMenuOpen(false);}
  trigger.addEventListener('click',()=>setMenuOpen(!open));
  shade.addEventListener('click',closeDrawer);
  guest.addEventListener('click',()=>{setMenuOpen(true);renderPage('support');});
  // The old gallery footer links to a non-sending demo envelope.
  // Redirect that control to the real, private support form instead.
  document.addEventListener('click',e=>{
    if(!e.target.closest?.('#feedbackOpen'))return;
    e.preventDefault();e.stopImmediatePropagation();
    setMenuOpen(true);renderPage('support');
  },true);
  document.addEventListener('keydown',e=>{
    if(!open)return;
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeDrawer();return;}
    if(e.key==='Tab'){
      const controls=[...drawer.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')].filter(el=>el.offsetParent!==null);
      const focusables=[...controls,trigger];if(!focusables.length)return;
      const first=focusables[0],last=focusables[focusables.length-1];
      if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
    }
  },true);

  // Reuse the user's saved country but allow choosing a new one with a
  // controlled, always-below searchable list inside the drawer.
  function bindHomeCountryPicker() {
    const input=byId('wgAcCountryCode'),button=byId('wgAcCountryPicker'),popup=byId('wgAcCountryList');
    if(!input || !button || !popup)return;
    let filter='';
    const close=()=>{popup.hidden=true;button.setAttribute('aria-expanded','false');};
    function paint(){
      popup.replaceChildren();
      const search=document.createElement('input');search.type='search';search.autocomplete='off';
      search.className='wg-ac-country-search';search.placeholder='Search countries';search.value=filter;
      search.setAttribute('aria-label','Search countries');popup.appendChild(search);
      const list=document.createElement('div');list.className='wg-ac-country-scroll';list.setAttribute('role','listbox');popup.appendChild(list);
      const options=countryList.filter(([code,name])=>(code+' '+name).toLowerCase().includes(filter.toLowerCase())).slice(0,245);
      for(const [code,name] of options){
        const opt=document.createElement('button');opt.type='button';opt.setAttribute('role','option');opt.textContent=name;opt.dataset.code=code;
        opt.setAttribute('aria-selected',String(code===input.value));
        opt.addEventListener('click',()=>{input.value=code;button.querySelector('span').textContent=name;close();button.focus();});
        list.appendChild(opt);
      }
      if(!options.length)list.textContent='No matches';
      search.addEventListener('input',()=>{filter=search.value;paint();});
      search.addEventListener('keydown',e=>{
        if(e.key==='Escape'){e.preventDefault();close();button.focus();}
        if(e.key==='Enter'){e.preventDefault();list.querySelector('button')?.click();}
        if(e.key==='ArrowDown'){e.preventDefault();list.querySelector('button')?.focus();}
      });
      list.addEventListener('keydown',e=>{
        if(e.key==='Escape'){e.preventDefault();close();button.focus();}
        if(e.key==='ArrowDown'||e.key==='ArrowUp'){
          e.preventDefault();
          const opts=[...list.querySelectorAll('button')],i=opts.indexOf(document.activeElement);
          opts[Math.max(0,Math.min(opts.length-1,i+(e.key==='ArrowDown'?1:-1)))]?.focus();
        }
      });
    }
    button.addEventListener('click',()=>{
      if(!popup.hidden){close();return;}
      popup.hidden=false;button.setAttribute('aria-expanded','true');
      // If near the bottom of the drawer, scroll the control upward first.
      button.scrollIntoView({block:'center',behavior:'instant'});
      filter='';paint();popup.querySelector('input')?.focus();
    });
    drawer.addEventListener('click',e=>{if(!popup.hidden && !popup.contains(e.target) && !button.contains(e.target))close();});
  }
  function renderProfile(){
    if(!user)return renderSupport();
    const a=profile||{};
    content.innerHTML=title('My profile','Manage your identity and saved starting place.')+`
      <form id="wgAcProfileForm" class="wg-ac-form">
        <div class="wg-ac-two">
          <label>Username <input name="username" value="${esc(a.username||'')}" minlength="3" maxlength="10" ${String(a.username||'').length>10?'':'pattern="[A-Za-z0-9_]{3,10}"'} autocomplete="username" required><small>3–10 characters · A–Z, 0–9, _</small></label>
          <label>Display name <input name="display_name" value="${esc(a.display_name||'')}" maxlength="10" required><small>Up to 10 characters</small></label>
        </div>
        <label>Email (account address)<input value="${esc(user.email||'')}" type="email" readonly></label>
        <label>My home country <input type="hidden" id="wgAcCountryCode" name="home_country_code" value="${esc(a.home_country_code||'')}"><button class="wg-ac-country-picker" id="wgAcCountryPicker" type="button" aria-expanded="false" aria-controls="wgAcCountryList"><span>${esc(countryName(a.home_country_code))}</span>${icon('arrow',15)}</button><div id="wgAcCountryList" class="wg-ac-country-popup" hidden></div></label>
        <div class="wg-ac-two"><label>Region / state <input name="home_region" value="${esc(a.home_region||'')}" maxlength="100"></label><label>Province <input name="home_province" value="${esc(a.home_province||'')}" maxlength="100"></label></div>
        <label>City / municipality <input name="home_city" value="${esc(a.home_city||'')}" maxlength="100"></label>
        <p class="wg-ac-muted">Your saved home country determines the first place you see when you sign in.</p>
        <button class="wg-ac-save" type="submit">Save profile</button>
      </form>`;
    bindHomeCountryPicker();
    const form=byId('wgAcProfileForm');
    form.addEventListener('submit',async e=>{
      e.preventDefault();if(loading)return;
      const values=new FormData(form);
      const username=String(values.get('username')||'').trim();
      const display_name=String(values.get('display_name')||'').trim();
      const code=String(values.get('home_country_code')||'').trim();
      const grandfatherUsername=username===profile?.username && username.length>10;
      const grandfatherDisplay=display_name===profile?.display_name && display_name.length>10;
      if((!/^[A-Za-z0-9_]{3,10}$/.test(username) && !grandfatherUsername)||!display_name||(display_name.length>10 && !grandfatherDisplay)){
        flash('New usernames must be 3–10 characters, and new display names up to 10. Existing longer names can remain unchanged.',false);return;
      }
      if(!countryList.find(([id])=>id===code)){flash('Select a valid home country.',false);return;}
      const data={username,display_name,home_country_code:code,home_country_name:countryName(code),home_region:String(values.get('home_region')||'').trim()||null,home_province:String(values.get('home_province')||'').trim()||null,home_city:String(values.get('home_city')||'').trim()||null};
      loading=true;form.querySelector('[type=submit]').disabled=true;
      const result=await api().from('wg_profiles').update(data).eq('user_id',user.id).select('*').single();
      loading=false;form.querySelector('[type=submit]').disabled=false;
      if(result.error){flash(result.error.message||'Could not save profile.',false);return;}
      profile=result.data;flash('Profile saved. Your new home country applies on your next sign-in.');
    });
  }
  // A deliberate downward-only menu, including settings and support forms.
  // Keep the native select as the FormData value source (hidden, not disabled).
  function enhanceSelects(form) {
    form.querySelectorAll('select').forEach((select,index)=>{
      select.removeAttribute('required'); // Validated explicitly during submission.
      select.classList.add('wg-ac-native-select');
      select.tabIndex=-1;
      select.setAttribute('aria-hidden','true');
      const outer=document.createElement('div');outer.className='wg-ac-select-wrap';
      select.parentNode.insertBefore(outer,select);outer.appendChild(select);
      const button=document.createElement('button');button.type='button';button.className='wg-ac-select-trigger';
      button.setAttribute('aria-expanded','false');button.setAttribute('aria-haspopup','listbox');
      button.innerHTML='<span></span><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
      outer.appendChild(button);
      const popup=document.createElement('div');popup.className='wg-ac-select-popup';popup.hidden=true;outer.appendChild(popup);
      function sync(){button.querySelector('span').textContent=select.selectedOptions[0]?.textContent||'Choose one';}
      function close(){popup.hidden=true;button.setAttribute('aria-expanded','false');}
      function open(){
        popup.replaceChildren();
        for(const option of select.options){
          if(!option.value)continue;
          const item=document.createElement('button');item.type='button';item.textContent=option.textContent;
          item.setAttribute('role','option');item.setAttribute('aria-selected',String(option.value===select.value));
          item.addEventListener('click',()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));sync();close();button.focus();});
          popup.appendChild(item);
        }
        popup.hidden=false;button.setAttribute('aria-expanded','true');
        button.scrollIntoView({block:'center',behavior:'instant'});
      }
      button.addEventListener('click',()=>popup.hidden?open():close());
      select.addEventListener('change',sync);
      popup.addEventListener('keydown',e=>{
        const list=[...popup.querySelectorAll('button')],i=list.indexOf(document.activeElement);
        if(e.key==='Escape'){e.preventDefault();close();button.focus();}
        else if(e.key==='ArrowDown'||e.key==='ArrowUp'){
          e.preventDefault();list[Math.max(0,Math.min(list.length-1,i+(e.key==='ArrowDown'?1:-1)))]?.focus();
        }
      });
      button.addEventListener('keydown',e=>{
        if(['Enter',' ','ArrowDown'].includes(e.key)){
          e.preventDefault();if(popup.hidden)open();popup.querySelector('button')?.focus();
        }
      });
      outer.addEventListener('focusout',e=>{if(!outer.contains(e.relatedTarget))close();});
      sync();
    });
  }
  function renderSettings(){
    if(!user)return renderSupport();
    content.innerHTML=title('Settings & privacy','Control how your information may appear, and choose how the world moves.')+`
      <form class="wg-ac-form" id="wgAcSettingsForm"><div class="wg-ac-section-label">PRIVACY PREFERENCES</div>
        <label>Profile visibility preference<select name="profile_visibility"><option value="private">Private</option><option value="public">Public — future publishing</option></select></label>
        <label>Default photo visibility preference<select name="default_photo_visibility"><option value="private">Private</option><option value="public">Public — future publishing</option></select></label>
        <label class="wg-ac-switch"><input name="discoverable" type="checkbox"> <span>Allow discovery of my profile (when published)</span></label>
        <label class="wg-ac-switch"><input name="show_country" type="checkbox"> <span>Display my country (when published)</span></label>
        <label class="wg-ac-switch"><input name="show_detailed_location" type="checkbox"> <span>Display my detailed locality (when published)</span></label>
        <label class="wg-ac-switch"><input name="allow_comments" type="checkbox"> <span>Allow comments (future feature)</span></label>
        <div class="wg-ac-section-label">CONTENT & ACCESSIBILITY</div>
        <label>Sensitive content filter<select name="sensitive_content_filter"><option value="strict">Strict — recommended</option><option value="standard">Standard</option></select></label>
        <label class="wg-ac-switch"><input name="reduce_motion" type="checkbox"> <span>Reduce animations and motion</span></label>
        <p class="wg-ac-muted">Saving a public preference does not publish photos or profile data yet. All protected records remain restricted by Supabase security rules until the moderated gallery is built.</p>
        <button class="wg-ac-save" type="submit">Save settings</button>
      </form>`;
    const form=byId('wgAcSettingsForm');
    enhanceSelects(form);
    (async()=>{
      const [pr,co]=await Promise.all([api().from('wg_privacy_settings').select('*').eq('user_id',user.id).maybeSingle(),api().from('wg_content_preferences').select('*').eq('user_id',user.id).maybeSingle()]);
      if(activePage!=='settings')return;
      if(pr.error||co.error){flash('Could not load settings. Check your connection.',false);return;}
      for(const [key,value] of Object.entries({...pr.data,...co.data})){
        const el=form.elements.namedItem(key);if(!el)continue;
        if(el.type==='checkbox')el.checked=Boolean(value);
        else if(value!=null){el.value=String(value);el.dispatchEvent(new Event('change',{bubbles:true}));}
      }
    })();
    form.addEventListener('submit',async e=>{
      e.preventDefault();if(loading)return;
      loading=true;form.querySelector('[type=submit]').disabled=true;
      const d=new FormData(form);
      const privacy={user_id:user.id,profile_visibility:d.get('profile_visibility'),default_photo_visibility:d.get('default_photo_visibility'),discoverable:d.has('discoverable'),show_country:d.has('show_country'),show_detailed_location:d.has('show_detailed_location'),allow_comments:d.has('allow_comments'),sensitive_content_filter:d.get('sensitive_content_filter')};
      const pref={user_id:user.id,reduce_motion:d.has('reduce_motion')};
      const [p,c]=await Promise.all([api().from('wg_privacy_settings').upsert(privacy,{onConflict:'user_id'}),api().from('wg_content_preferences').upsert(pref,{onConflict:'user_id'})]);
      loading=false;form.querySelector('[type=submit]').disabled=false;
      if(p.error||c.error){flash((p.error||c.error).message||'Could not save settings.',false);return;}
      document.documentElement.classList.toggle('wg-reduce-motion',pref.reduce_motion);
      flash('Your settings have been saved privately.');
    });
  }
  // V2.4: Guest and member support share this existing drawer form.
  // Guests write ONLY through the public Edge Function. No direct anonymous table grant.
  function renderSupport(){
    const isGuest = !user;
    drawer.classList.toggle('wg-ac-outside',isGuest);
    content.innerHTML=title('Support & feedback',isGuest
      ? 'Contact Worlds Gallery without signing in.'
      : 'Tell us what needs attention. This goes into a private support queue.')+`
      <form class="wg-ac-form" id="wgAcSupportForm">
        ${isGuest?`<div class="wg-ac-two">
          <label>Email address (required)<input name="submitter_email" type="email" autocomplete="email" maxlength="254" placeholder="you@example.com" required></label>
          <label>Phone (optional)<input name="submitter_phone" type="tel" autocomplete="tel" maxlength="40" placeholder="Optional contact number"></label>
        </div><label class="wg-ac-trap" aria-hidden="true">Website<input name="website" type="text" autocomplete="off" tabindex="-1"></label>`:''}
        <label>Concern Type<select name="concern_type" required><option value="">Choose one</option><option>Accounts</option><option>Profile</option><option>Posting/Contents</option><option>Suggestions</option></select></label>
        <label>Concern Details<textarea name="details" id="wgAcSupportDetails" maxlength="1000" minlength="10" rows="7" required placeholder="Describe what happened or what you'd like us to improve."></textarea><small><span id="wgAcSupportCount">0</span> / 1,000 characters</small></label>
        <p class="wg-ac-muted">${isGuest
          ? 'Your email is used only to respond about this concern. Phone is optional. We store the request privately; email forwarding is not yet enabled.'
          : 'Your request is stored privately. Email notifications are not active yet.'}</p>
        <button class="wg-ac-save" type="submit">Submit concern</button>
      </form>`;
    const form=byId('wgAcSupportForm'),details=byId('wgAcSupportDetails');
    enhanceSelects(form);
    details.addEventListener('input',()=>byId('wgAcSupportCount').textContent=String(details.value.length));
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(loading)return;
      const data=new FormData(form);
      const type=String(data.get('concern_type')||'').trim();
      const body=String(data.get('details')||'').trim();
      if(!['Accounts','Profile','Posting/Contents','Suggestions'].includes(type)||body.length<10||body.length>1000){
        flash('Choose a concern type and enter 10–1,000 characters.',false);return;
      }
      const email=String(data.get('submitter_email')||'').trim();
      const phone=String(data.get('submitter_phone')||'').trim();
      if(isGuest && (!form.reportValidity()||email.length>254||phone.length>40))return;
      loading=true;
      const submit=form.querySelector('[type=submit]');submit.disabled=true;
      try {
        if(isGuest){
          // Edge Function has its own origin, field, honeypot and rate-limit checks.
          const result=await api().functions.invoke('wg-guest-support',{
            body:{email,phone,concern_type:type,details:body,website:String(data.get('website')||'')}
          });
          if(result.error || !result.data?.ok){
            flash(result.data?.error||'Guest support is unavailable or rate-limited. Please try again later.',false);
            return;
          }
        } else {
          const result=await api().from('wg_support_tickets').insert({
            user_id:user.id,source:'member',concern_type:type,details:body,
            submitter_email:user.email||null
          }).select('id').single();
          if(result.error){flash('Support request could not be submitted: '+result.error.message,false);return;}
        }
        form.reset();
        form.querySelectorAll('select').forEach(el=>el.dispatchEvent(new Event('change',{bubbles:true})));
        byId('wgAcSupportCount').textContent='0';
        flash('Your concern was saved to the private Worlds Gallery support queue. Email forwarding is not active yet.');
      } catch(error) {
        flash('Could not submit the concern. Please check your connection and try again.',false);
      } finally {
        loading=false;submit.disabled=false;
      }
    });
  }
  document.addEventListener('wg:authenticated',e=>{
    user=e.detail?.user||null;profile=e.detail?.profile||null;
    syncTrigger();
    guest.hidden=!!user;
  });
  // A session can be restored before this file's listener is registered.
  const client=api();
  if(client?.auth?.getUser){client.auth.getUser().then(async({data})=>{
    if(!data?.user || user)return;
    const r=await client.from('wg_profiles').select('*').eq('user_id',data.user.id).maybeSingle();
    if(!r.error && r.data && document.documentElement.classList.contains('wg-auth-ok')){
      user=data.user;profile=r.data;syncTrigger();guest.hidden=true;
    }
  }).catch(()=>{});}

  // An actual cinematic handoff, reusing the live WebGL Earth and 3D aircraft.
  // Capture the gallery CTA before the existing portal's direct click handler.
  document.addEventListener('click',e=>{
    const button=e.target.closest?.('#portalDrill [data-choice="enter"]');
    if(!button || bypassFlight || !user)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(flightBusy)return;
    const gate=byId('wgAuthGate'),portal=byId('worldPortal');
    if(!gate || !portal)return;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('wg-reduce-motion')){
      bypassFlight=true;button.click();bypassFlight=false;return;
    }
    flightBusy=true;
    trigger.disabled=true;trigger.hidden=true;
    gate.hidden=false;
    gate.classList.add('wg-gallery-flight');
    black.hidden=false;
    window.setTimeout(()=>black.classList.add('wg-black-in'),1750); // Flight first.
    window.setTimeout(()=>{
      // Existing portal button remains the only source of gallery navigation.
      bypassFlight=true;
      gate.hidden=true;gate.classList.remove('wg-gallery-flight');
      button.click();
      bypassFlight=false;
    },2450);
    // Hold the black frame for about two seconds, then reveal the gallery.
    window.setTimeout(()=>black.classList.remove('wg-black-in'),4250);
    window.setTimeout(()=>{black.hidden=true;flightBusy=false;trigger.disabled=false;syncTrigger();},4850);
  },true);
})();
