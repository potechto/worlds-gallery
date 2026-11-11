/* Worlds Gallery V2.2 — account drawer, protected settings, support intake,
   and a cinematic gallery handoff. Public Supabase key only; RLS authorizes. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const countryList = typeof COUNTRIES !== 'undefined' ? COUNTRIES : [];
  const countryName = code => countryList.find(c=>c[0]===code)?.[1] || code || 'Unknown';
  const api = () => window.WorldsGalleryAuth?.getClient?.();
  let user = null, profile = null, activePage = 'home', previousPage = 'home';
  let open = false, loading = false, lastFocus = null, flightBusy = false, bypassFlight = false;
  const styles = {
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M5 5l14 14M19 5L5 19"/>',
    arrow: '<path d="m9 18 6-6-6-6"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-8h6v8"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    settings: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    support: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 11.5h8"/>',
    exit: '<path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 16l4-4-4-4M8 12h11"/>',
    earth: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 4.5 6 4.5 9s-1.5 6-4.5 9M12 3c-3 3-4.5 6-4.5 9s1.5 6 4.5 9"/>',
    story: '<path d="M4 4.5h6.4A3.6 3.6 0 0 1 12 5a3.6 3.6 0 0 1 1.6-.5H20v15h-6.4A3.6 3.6 0 0 0 12 20a3.6 3.6 0 0 0-1.6-.5H4Z"/><path d="M12 5v15"/>',
    album: '<path d="M5 3.5h11a3 3 0 0 1 3 3V21H6a3 3 0 0 1-3-3V6a2.5 2.5 0 0 1 2-2.5Z"/><path d="M6 3.5V21M10 8h6M10 12h6"/>',
    share: '<rect x="3" y="4" width="14" height="16" rx="2"/><path d="m6 16 3-4 2 2 2-2 2 3"/><circle cx="8" cy="9" r="1"/><path d="M20 8v7m-3.5-3.5H23"/>'
  };
  const icon = (n,size=21) => `<svg class=\"wg-v26-icon\" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${styles[n]}</svg>`;
  const trigger = document.createElement('button');
  trigger.type='button';trigger.id='wgAccountTrigger';trigger.hidden=true;
  trigger.className='wg-account-trigger';trigger.innerHTML=icon('menu');
  trigger.setAttribute('aria-label','Open account menu');trigger.setAttribute('aria-expanded','false');
  trigger.setAttribute('aria-controls','wgAccountMenu');
  const galleryNav = document.querySelector('.site-header .nav-bar');
  const originalShare = galleryNav?.querySelector('.nav-share[data-open-upload]');
  if (!galleryNav || !originalShare) {
    console.warn('Worlds Gallery: gallery navigation not found. Account menu was not installed.');
    return;
  }
  originalShare.insertAdjacentElement('afterend', trigger);

  // Menu is an independent lightweight floating surface, not a page drawer.
  const menu = document.createElement('div');
  menu.id='wgAccountMenu';menu.hidden=true;menu.setAttribute('role','group');
  menu.setAttribute('aria-label','Account navigation');document.body.appendChild(menu);

  // Account sections are full, independently navigable in-app views.
  const drawer = document.createElement('section');
  drawer.id='wgAccountDrawer';drawer.hidden=true;drawer.setAttribute('role','dialog');
  drawer.setAttribute('aria-modal','true');drawer.setAttribute('aria-label','Worlds Gallery personal space');
  drawer.innerHTML=`<header class="wg-ac-header"><span class="wg-ac-mark">WORLDS.GALLERY <span id="wgAcPageMark">/ PERSONAL SPACE</span></span><button type="button" id="wgAcPageClose" aria-label="Close this page and return to gallery" class="wg-ac-page-close">${icon('close',22)}</button></header><div id="wgAcContent" class="wg-ac-content"></div>`;
  document.body.appendChild(drawer);
  const drawerHeader = drawer.querySelector('.wg-ac-header');
  const pageClose = byId('wgAcPageClose');
  const content = byId('wgAcContent');
  const isGallery = () => (
    (!!user && document.documentElement.classList.contains('wg-auth-ok')) ||
    (!user && document.documentElement.classList.contains('wg-guest-explore'))
  ) && !document.body.classList.contains('portal-locked');
  function syncTrigger() {
    if(activePage!=='home')return;
    trigger.hidden = !isGallery() || flightBusy;
  }
  new MutationObserver(syncTrigger).observe(document.body, {attributes: true,attributeFilter: ['class']});

  const guest = document.createElement('button');
  guest.id='wgGuestSupport';guest.type='button';guest.textContent='Customer support / feedback';
  guest.className='wg-auth-text-button wg-ac-guest-help';
  const panel=byId('wgAuthGate')?.querySelector('.wg-auth-panel');
  if(panel)panel.appendChild(guest);

  const black = document.createElement('div');black.id='wgGalleryBlackout';black.hidden=true;
  black.setAttribute('aria-hidden','true');document.body.appendChild(black);
  const action = (label,key,ic) => `<button class="wg-ac-menu-row ${ic?'':'wg-ac-text-only'} ${key==='signout'?'wg-ac-menu-exit':''}" type="button" data-ac="${key}">${ic?icon(ic):''}<span>${label}</span>${key==='signout'?'':icon('arrow',16)}</button>`;
  const requireAccount=actionName=>document.dispatchEvent(new CustomEvent('wg:require-account',{detail:{action:actionName}}));
  const labels={home:'Home',profile:'My profile',settings:'Settings & privacy',support:'Support & feedback'};
  const pageIcons={home:'home',profile:'user',settings:'settings',support:'support'};
  function flash(msg,good=true) {
    const el=byId('wgAcMessage');if(!el)return;
    el.textContent=msg;el.dataset.good=good?'true':'false';
    el.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  // There is no nested previous screen inside a page. Close with X, or
  // switch pages using the floating hamburger (which includes the last view).
  function title(text,sub) {
    return `<div class="wg-ac-page-head"><div><span class="wg-ac-overline">PERSONAL SPACE</span><h2 tabindex="-1">${esc(text)}</h2><p>${esc(sub)}</p></div></div><p id="wgAcMessage" class="wg-ac-message" role="status" aria-live="polite"></p>`;
  }
  function positionMenu() {
    if(!open)return;
    const rect=trigger.getBoundingClientRect();
    const width=Math.min(340,window.innerWidth-24);
    menu.style.width=width+'px';
    menu.style.left=Math.max(12,Math.min(window.innerWidth-width-12,rect.right-width))+'px';
    menu.style.top=Math.min(window.innerHeight-80,rect.bottom+9)+'px';
  }
  function renderMenu() {
    const guestMode=!user;
    const name=guestMode?'Guest explorer':profile?.display_name || user?.email?.split('@')[0] || 'Your account';
    const identifier=guestMode?'Browse the world freely':`@${esc(profile?.username||'member')}`;
    const avatar=guestMode?`<span class="wg-ac-guest-avatar" aria-hidden="true">${icon('earth',27)}</span>`
      :`<span class="wg-v2232-menu-avatar" data-wg-avatar-slot="menu" data-wg-avatar-fallback="${esc(String(name).charAt(0).toUpperCase())}" aria-label="Your profile picture"></span>`;
    const back=activePage==='home'||guestMode?'':action(labels[previousPage]||'Home',previousPage,pageIcons[previousPage]||'home');
    const pages=guestMode?'':[['profile','My profile','user'],['settings','Settings & privacy','settings'],['support','Support & feedback','support']]
      .filter(([key])=>key!==activePage && key!==previousPage)
      .map(([key,label,ic])=>action(label,key,ic)).join('');
    const album=action('My Album','album','album');
    const items=guestMode
      ? `${album}${action('Share your story','share','share')}${action('Support & feedback','support','support')}${action('Return to Earth','earth','earth')}${action('Sign in','signin','')}`
      : `${back}${pages}${album}${action('Share your story','share','share')}${action('Return to Earth','earth','earth')}${action('Sign out','signout','')}`;
    menu.innerHTML=`<div class="wg-ac-floating-head"><div class="wg-v2232-menu-identity"><span class="wg-ac-overline">YOUR WORLD</span><strong>${esc(name)}</strong><small>${identifier}</small></div>${avatar}</div><div class="wg-ac-menu-items">${items}</div>`;
    menu.querySelectorAll('[data-ac]').forEach(button=>button.addEventListener('click',()=>{
      const choice=button.dataset.ac;
      if(choice==='album'){
        setMenuOpen(false);
        const verified=!!window.WorldsGalleryAuth?.getCurrentUserId?.() && document.documentElement.classList.contains('wg-auth-ok');
        if(!verified){requireAccount('open your personal album');return;}
        closePage();window.WorldsGalleryAlbum?.open?.();return;
      }
      setMenuOpen(false);
      if(choice==='signin'){requireAccount('access your personal space');return;}
      if(choice==='signout'){closePage();byId('wgLogout')?.click();return;}
      if(choice==='share'){closePage();originalShare.click();return;}
      if(choice==='earth'){closePage();byId('arrivalBackEarth')?.click();syncTrigger();return;}
      if(guestMode&&choice!=='support'){requireAccount('open your account settings');return;}
      renderPage(choice);
    }));
    document.dispatchEvent(new Event('wg:menu-rendered'));
  }

  function setMenuOpen(show) {
    if(activePage==='home' && !isGallery())show=false;
    open=show;menu.hidden=!show;
    trigger.setAttribute('aria-expanded',String(show));
    trigger.setAttribute('aria-label',show?'Close account menu':'Open account menu');
    if(show){renderMenu();positionMenu();menu.querySelector('[data-ac]')?.focus({preventScroll:true});}
  }
  function closePage() {
    setMenuOpen(false);
    drawer.hidden=true;
    document.documentElement.classList.remove('wg-ac-page-open');
    activePage='home';previousPage='home';
    originalShare.insertAdjacentElement('afterend',trigger);
    syncTrigger();
    if(lastFocus?.isConnected && lastFocus.getClientRects().length)lastFocus.focus({preventScroll:true});
    lastFocus=null;
  }
  function renderPage(page) {
    if(page==='home'){closePage();return;}
    if(!['profile','settings','support'].includes(page) || (!user && page!=='support'))return;
    if(activePage==='home')lastFocus=document.activeElement;
    if(page!==activePage)previousPage=activePage;
    activePage=page;setMenuOpen(false);
    drawer.hidden=false;drawer.scrollTop=0;
    drawer.classList.toggle('wg-ac-outside',!user);
    document.documentElement.classList.add('wg-ac-page-open');
    byId('wgAcPageMark').textContent='/ '+labels[page].toUpperCase();
    if(user){drawerHeader.insertBefore(trigger,pageClose);trigger.hidden=false;}
    else{originalShare.insertAdjacentElement('afterend',trigger);trigger.hidden=true;}
    if(page==='profile')renderProfile();
    else if(page==='settings')renderSettings();
    else renderSupport();
    document.dispatchEvent(new CustomEvent('wg:account-page',{detail:{page}}));
    requestAnimationFrame(()=>content.querySelector('h2')?.focus({preventScroll:true}));
  }
  trigger.addEventListener('click',()=>setMenuOpen(!open));
  pageClose.addEventListener('click',closePage);
  guest.addEventListener('click',()=>renderPage('support'));
  document.addEventListener('click',e=>{
    if(open&&!menu.contains(e.target)&&!trigger.contains(e.target))setMenuOpen(false);
  });
  window.addEventListener('resize',positionMenu);
  window.addEventListener('scroll',positionMenu,true);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      if(open){e.preventDefault();setMenuOpen(false);trigger.focus({preventScroll:true});}
      else if(activePage!=='home'){e.preventDefault();closePage();}
      return;
    }
    if(e.key==='Tab'&&activePage!=='home'){
      const elements=[...drawer.querySelectorAll('button:not(:disabled),input:not(:disabled):not([tabindex="-1"]),select:not(:disabled):not([tabindex="-1"]),textarea:not(:disabled)')]
        .filter(el=>el.getClientRects().length && !el.closest('[hidden]'));
      if(open)elements.push(...[...menu.querySelectorAll('button')].filter(el=>el.getClientRects().length));
      if(!elements.length)return;
      if(e.shiftKey&&document.activeElement===elements[0]){e.preventDefault();elements[elements.length-1].focus();}
      else if(!e.shiftKey&&document.activeElement===elements[elements.length-1]){e.preventDefault();elements[0].focus();}
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
        opt.addEventListener('click',()=>{input.value=code;button.querySelector('span').textContent=name;document.dispatchEvent(new CustomEvent('wg:country-selected',{detail:{code,source:'profile'}}));close();button.focus();});
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
          <label>Username <input name="username" value="${esc(a.username||'')}" minlength="3" maxlength="24" pattern="[A-Za-z0-9_]{3,24}" autocomplete="username" required><small>3–24 characters · A–Z, 0–9, _</small></label>
          <label>Display name <input name="display_name" value="${esc(a.display_name||'')}" maxlength="70" required><small>Up to 70 characters</small></label>
        </div>
        <label>Email (account address)<input name="account_email" value="${esc(user.email||'')}" type="email" autocomplete="email" maxlength="254" required><small>Changing your email requires verification through Supabase Auth.</small></label>
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
      if(!/^[A-Za-z0-9_]{3,24}$/.test(username)||!display_name||display_name.length>70){
        flash('Username: 3–24 characters (letters, numbers or _). Display name: 1–70 characters.',false);return;
      }
      if(!countryList.find(([id])=>id===code)){flash('Select a valid home country.',false);return;}
      const data={username,display_name,home_country_code:code,home_country_name:countryName(code),home_region:String(values.get('home_region')||'').trim()||null,home_province:String(values.get('home_province')||'').trim()||null,home_city:String(values.get('home_city')||'').trim()||null};
      loading=true;form.querySelector('[type=submit]').disabled=true;
      const result=await api().from('wg_profiles').update(data).eq('user_id',user.id).select('*').single();
      loading=false;form.querySelector('[type=submit]').disabled=false;
      if(result.error){flash(result.error.code==='23505'?'Username is already in use. Choose a different one.':'Could not save profile. Try again.',false);return;}
      profile=result.data;
      const email=String(values.get('account_email')||'').trim().toLowerCase();
      if(email && email!==String(user.email||'').toLowerCase()){
        const changed=await api().auth.updateUser({email},{emailRedirectTo:location.origin+location.pathname});
        if(changed.error){flash('Profile saved, but the email-change request failed: '+changed.error.message,false);return;}
        flash('Profile saved. Check your current and new inboxes for email-change verification. Your new address is not active until verified.');
      }else flash('Profile saved. Your new home country applies on your next sign-in.');
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
      <div class="wg-v2232-settings-summary"><div><span class="wg-ac-overline">YOUR SPACE, YOUR CHOICES</span><p>Review how your posts, location and profile may be shared when public publishing becomes available.</p></div><div class="wg-v2232-settings-avatar"><span data-wg-avatar-slot="settings" data-wg-avatar-fallback="${esc(String(profile?.display_name||'?').charAt(0).toUpperCase())}"></span><small>My picture</small></div></div>
      <form class="wg-ac-form wg-v2232-settings-form" id="wgAcSettingsForm">
        <section class="wg-v2232-settings-section"><div class="wg-ac-section-label">${icon('user',19)} <span>PRIVACY PREFERENCES</span></div>
          <p class="wg-v2232-settings-description">Choose who may discover your profile and future posts. Private content stays restricted until publication is enabled.</p>
          <div class="wg-v2232-settings-grid"><label>Profile visibility preference<select name="profile_visibility"><option value="private">Private</option><option value="public">Public — future publishing</option></select></label>
          <label>Default photo visibility preference<select name="default_photo_visibility"><option value="private">Private</option><option value="public">Public — future publishing</option></select></label></div>
          <div class="wg-v2232-settings-switches"><label class="wg-ac-switch"><input name="discoverable" type="checkbox"> <span>Allow discovery of my profile (when published)</span></label>
          <label class="wg-ac-switch"><input name="show_country" type="checkbox"> <span>Display my country (when published)</span></label>
          <label class="wg-ac-switch"><input name="show_detailed_location" type="checkbox"> <span>Display my detailed locality (when published)</span></label>
          <label class="wg-ac-switch"><input name="allow_comments" type="checkbox"> <span>Allow comments (future feature)</span></label></div>
        </section>
        <section class="wg-v2232-settings-section"><div class="wg-ac-section-label">${icon('settings',19)} <span>CONTENT & ACCESSIBILITY</span></div>
          <div class="wg-v2232-settings-grid"><label>Website language<select name="wg_interface_language" id="wgSettingsLanguage"><option value="en">English</option><option value="ko">한국어 (Korean)</option><option value="ja">日本語 (Japanese)</option><option value="fr">Français</option><option value="de">Deutsch</option><option value="es">Español</option></select></label>
          <label>Sensitive content filter<select name="sensitive_content_filter"><option value="strict">Strict — recommended</option><option value="standard">Standard</option></select></label></div>
          <p class="wg-ac-muted">Website language is saved for this browser and account; story text remains in the author's original language.</p>
          <div class="wg-v2232-settings-switches"><label class="wg-ac-switch"><input name="reduce_motion" type="checkbox"> <span>Reduce animations and motion</span></label></div>
        </section>
        <p class="wg-v2232-privacy-note">${icon('settings',17)} Saving a public preference never publishes content automatically. Your uploaded photos are private until the future moderated publishing service is enabled.</p>
        <button class="wg-ac-save" type="submit">Save settings</button>
      </form>`;
    const form=byId('wgAcSettingsForm');
    enhanceSelects(form);
    if(byId('wgSettingsLanguage'))byId('wgSettingsLanguage').value=window.WorldsGalleryLocale?.get?.()||'en';
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
      window.WorldsGalleryLocale?.set?.(String(d.get('wg_interface_language')||'en'));
      flash('Your settings have been saved privately.');
    });
  }
  // Private support transport; server-enforced three-hour cooldown.
  const cooldownMs=3*60*60*1000;
  const cooldownKey=()=>`wg-support-cooldown-v1:${user?.id||'guest'}`;
  let supportClock=0,supportEpoch=0;
  const clockStop=()=>{if(supportClock){clearInterval(supportClock);supportClock=0}};
  function localCooldown(){try{return Number(localStorage.getItem(cooldownKey())||0)||0}catch{return 0}}
  function rememberCooldown(until){if(!user){try{localStorage.setItem(cooldownKey(),String(until))}catch{}}}
  function humanClock(ms){const sec=Math.max(0,Math.ceil(ms/1000));const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
  async function authoritativeCooldown(){
    if(!user)return localCooldown();
    const client=api();if(!client)return localCooldown();
    const [tickets,reset]=await Promise.all([
      client.from('wg_support_tickets').select('created_at').eq('user_id',user.id).eq('source','member').order('created_at',{ascending:false}).limit(1),
      client.from('wg_support_cooldown_resets').select('reset_at').eq('user_id',user.id).maybeSingle()
    ]);
    if(tickets.error)throw tickets.error;
    const recent=tickets.data?.[0]?.created_at;
    if(!recent)return 0;
    const at=Date.parse(recent);
    const resetAt=reset.error?null:reset.data?.reset_at;
    if(resetAt&&at<=Date.parse(resetAt))return 0;
    return at+cooldownMs;
  }
  function supportArt(){return `<div class="wg-mail-art" aria-hidden="true"><span class="wg-mail-shadow"></span><span class="wg-mail-envelope"><span class="wg-mail-flap"></span><span class="wg-mail-letter"><i></i><i></i><i></i></span><span class="wg-mail-face"></span></span></div>`;}
  function showCooldown(until,animate=false){
    clockStop();supportEpoch++;
    const thanksWords='Thankyou for contacting us'.split(' ');
    let idx=0;
    const thanksLetters=thanksWords.map(word=>`<span class="wg-mail-word">${[...word].map(letter=>{const j=idx++;const dx=((j*47)%170)-85,dy=((j*71)%110)-55;return `<span class="wg-mail-char" style="--j:${j};--dx:${dx}px;--dy:${dy}px">${letter}</span>`}).join('')}</span>`).join(' ');
    const shell=`<div class="wg-mail-sequence ${animate?'wg-mail-playing':'wg-mail-finished'}" role="status" aria-live="polite">
      <div class="wg-mail-stage" aria-hidden="true"><div class="wg-mail-paper"><span></span><span></span><span></span></div><div class="wg-mail-send-envelope"><div class="wg-mail-send-flap"></div></div><div class="wg-mail-box"><div class="wg-mail-box-slot"></div><div class="wg-mail-box-front"></div></div><div class="wg-mail-particles">${Array.from({length:18},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div></div>
      <div class="wg-mail-result"><h2 tabindex="-1" aria-label="Thankyou for contacting us">${thanksLetters}</h2><p>Your message has been saved in our private support queue.</p><p class="wg-mail-cooldown-label">You can contact us again in</p><strong class="wg-mail-clock" role="timer" aria-label="Remaining cooldown">${humanClock(until-Date.now())}</strong><small>Hours : Minutes : Seconds</small><p class="wg-mail-delivery">Email notification delivery is separate from ticket saving.</p></div>
    </div>`;
    content.innerHTML=shell;
    const stage=content.querySelector('.wg-mail-sequence');
    const titleEl=content.querySelector('.wg-mail-result h2');
    if(animate&&!window.matchMedia('(prefers-reduced-motion:reduce)').matches&&!document.documentElement.classList.contains('wg-reduce-motion')){
      setTimeout(()=>{if(stage.isConnected)stage.classList.add('wg-mail-done')},2600);
    }else stage.classList.add('wg-mail-done');
    function update(){if(!stage.isConnected){clockStop();return}const remain=until-Date.now();stage.querySelector('.wg-mail-clock').textContent=humanClock(remain);if(remain<=0){clockStop();if(activePage==='support')renderSupport();}}
    update();supportClock=setInterval(update,1000);
    if(!animate)titleEl.focus({preventScroll:true});
    else setTimeout(()=>{if(titleEl.isConnected)titleEl.focus({preventScroll:true})},2600);
  }
  function supportForm(isGuest){
    content.innerHTML=title('Support & feedback',isGuest?'Contact Worlds Gallery without signing in.':'Tell us what needs attention. This goes into a private support queue.')+`
      <section class="wg-mail-compose" aria-label="Support letter">
        <div class="wg-mail-heading">${supportArt()}<div><span class="wg-ac-overline">A LETTER TO WORLDS GALLERY</span><h3>Write to us</h3><p>Send a question, suggestion, or concern.</p></div></div>
        <form class="wg-ac-form" id="wgAcSupportForm">
          ${isGuest?`<div class="wg-ac-two"><label>Email address (required)<input name="submitter_email" type="email" autocomplete="email" maxlength="254" required></label><label>Phone (optional)<input name="submitter_phone" type="tel" maxlength="40"></label></div><label class="wg-ac-trap" aria-hidden="true">Website<input name="website" type="text" autocomplete="off" tabindex="-1"></label>`:''}
          <label>Concern Type<select name="concern_type" required><option value="">Choose one</option><option>Accounts</option><option>Profile</option><option>Posting/Contents</option><option>Suggestions</option></select></label>
          <label>Concern Details<textarea name="details" id="wgAcSupportDetails" maxlength="1000" minlength="10" rows="7" required placeholder="Write your letter here..."></textarea><small><span id="wgAcSupportCount">0</span> / 1,000 characters</small></label>
          <p class="wg-ac-muted">Submissions are stored privately. Email alerts depend on sender configuration.</p><button class="wg-ac-save" type="submit">Send letter</button>
        </form></section>`;
    const form=byId('wgAcSupportForm'),details=byId('wgAcSupportDetails');
    enhanceSelects(form);
    details.addEventListener('input',()=>byId('wgAcSupportCount').textContent=String(details.value.length));
    form.addEventListener('submit',async event=>{
      event.preventDefault();if(loading)return;
      const data=new FormData(form),type=String(data.get('concern_type')||'').trim(),body=String(data.get('details')||'').trim();
      if(!['Accounts','Profile','Posting/Contents','Suggestions'].includes(type)||body.length<10||body.length>1000){flash('Choose a concern type and enter 10–1,000 characters.',false);return;}
      const email=String(data.get('submitter_email')||'').trim(),phone=String(data.get('submitter_phone')||'').trim();
      if(isGuest&&(!form.reportValidity()||email.length>254||phone.length>40))return;
      loading=true;const submit=form.querySelector('[type=submit]');submit.disabled=true;
      try{
        let saved=false,realTime=Date.now();
        if(isGuest){
          const result=await api().functions.invoke('wg-guest-support',{body:{email,phone,concern_type:type,details:body,website:String(data.get('website')||'')}});
          if(result.error||!result.data?.ok){flash(result.data?.error||'Guest support unavailable or rate-limited. Please try again later.',false);return;}
          saved=true;
        }else{
          const result=await api().from('wg_support_tickets').insert({user_id:user.id,source:'member',concern_type:type,details:body,submitter_email:user.email||null}).select('id,created_at').single();
          if(result.error){flash('Support request could not be submitted: '+result.error.message,false);return;}
          saved=true;realTime=Date.parse(result.data.created_at)||Date.now();
          Promise.resolve().then(()=>api().functions.invoke('wg-notify-support',{body:{ticket_id:result.data.id}})).then(notice=>{if(notice.error||!notice.data?.email_sent)console.info('Ticket saved, email notification pending.');}).catch(()=>console.info('Ticket saved, email notification pending.'));
        }
        if(saved){const until=realTime+cooldownMs;rememberCooldown(until);showCooldown(until,true);}
      }catch(error){flash('Could not submit the concern. Please check your connection and try again.',false);}
      finally{loading=false;submit.disabled=false;}
    });
  }
  async function renderSupport(){
    clockStop();const epoch=++supportEpoch,isGuest=!user;
    drawer.classList.toggle('wg-ac-outside',isGuest);
    content.innerHTML=title('Support & feedback','')+'<p class="wg-ac-muted" role="status">Checking support availability…</p>';
    try{
      const until=await authoritativeCooldown();
      if(epoch!==supportEpoch||activePage!=='support')return;
      if(until>Date.now())showCooldown(until,false);else supportForm(isGuest);
    }catch(err){if(epoch!==supportEpoch||activePage!=='support')return;content.innerHTML=title('Support & feedback','')+'<p role="alert">Unable to check your support cooldown. Please check your connection and reopen Support.</p>';}
  }
  document.addEventListener('wg:guest-explore',syncTrigger);
  document.addEventListener('wg:guest-auth-request',()=>{setMenuOpen(false);syncTrigger();});
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

  window.WorldsGalleryAccount={getPage:()=>activePage,restorePage:page=>renderPage(page)};
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
