/* Worlds Gallery Auth V2 Cinematic Hybrid. Public/publishable browser key only.
   Visual redesign; Supabase RLS remains the real data access boundary. */
(() => {
  'use strict';
  const URL = 'https://xmhnmosrwlqxwiizywsa.supabase.co';
  const KEY = 'sb_publishable_E4PUABR6_iOd6xCtbVMhwQ_ltTCSvX1';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const countries = typeof COUNTRIES !== 'undefined' ? COUNTRIES : [];
  const countryOptions = '<option value="">Select your country</option>' + countries.map(([code,name]) => `<option value="${esc(code)}">${esc(name)}</option>`).join('');
  const gate = document.createElement('section');
  gate.id = 'wgAuthGate';
  gate.setAttribute('role', 'dialog');
  gate.setAttribute('aria-label', 'Worlds Gallery account access');
  gate.setAttribute('aria-modal', 'true');
  gate.innerHTML = `
    <div class="wg-auth-cinema" aria-hidden="true">
      <div class="wg-auth-nebula"></div>
      <div class="wg-auth-static-earth"></div>
      <canvas id="wgCinematicCanvas"></canvas>
      <div class="wg-auth-cinema-shading"></div>
      <div class="wg-auth-cinema-grain"></div>
    </div>
    <div class="wg-auth-frame">
      <section class="wg-auth-editorial" aria-label="Worlds Gallery introduction">
        <div class="wg-auth-brand"><span class="wg-auth-brand-symbol" aria-hidden="true"><i></i></span><span>WORLDS<span class="wg-auth-brand-dot">.</span>GALLERY</span></div>
        <div class="wg-auth-intro">
          <span class="wg-auth-kicker"><span class="wg-auth-dot"></span> FROM ONE PLACE TO EVERY PLACE</span>
          <h1>The world is<br><em>worth remembering.</em></h1>
          <p>Explore places. Discover the stories behind them.<br>Keep your own moments in the world they belong to.</p>
        </div>
        <div class="wg-auth-flightline" aria-hidden="true"><div class="wg-auth-flightline-mark"></div><span>WORLD ATLAS / CINEMATIC JOURNEY</span></div>
      </section>
      <section class="wg-auth-panel" aria-label="Worlds Gallery account access">
        <header class="wg-auth-panel-header"><span>WORLD ACCESS <span aria-hidden="true">/</span> 01</span><span class="wg-auth-secure"><span aria-hidden="true">●</span> PERSONAL SPACE</span></header>
        <div class="wg-auth-panel-copy"><h2 id="wgAuthPanelTitle">Create your World.</h2><p id="wgAuthPanelSubtitle">Your perspective. Your places. A gallery of the world waiting to be explored.</p></div>
        <nav id="wgAuthTabs" class="wg-auth-tabs" aria-label="Account access">
          <button id="wgTabSignUp" type="button">Create Account</button>
          <button id="wgTabSignIn" type="button">Sign In</button>
        </nav>
        <form id="wgSignUpForm" class="wg-auth-form" autocomplete="on">
          <div class="wg-auth-form-row">
            <label>Username <input name="username" autocomplete="username" minlength="3" maxlength="10" pattern="[A-Za-z0-9_]{3,10}" required placeholder="yourusername"></label>
            <label>Display name <input name="display_name" maxlength="10" required autocomplete="nickname" placeholder="Your display name"></label>
          </div>
          <label>Email address <input name="email" type="email" autocomplete="email" required placeholder="you@example.com"></label>
          <div class="wg-auth-form-row">
            <label>Password <input name="password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required placeholder="8+ characters"></label>
            <label>Confirm password <input name="confirm_password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required placeholder="Repeat password"></label>
          </div>
          <label>Your home country <select name="country_code" required>${countryOptions}</select></label>
          <details class="wg-auth-location-more"><summary>Add your region, province or city <span>OPTIONAL</span></summary>
            <div class="wg-auth-location-fields">
              <label>Region / state <input name="home_region" maxlength="100" autocomplete="address-level1"></label>
              <label>Province <input name="home_province" maxlength="100"></label>
              <label>City / municipality <input name="home_city" maxlength="100" autocomplete="address-level2"></label>
            </div>
          </details>
          <button class="wg-auth-primary" type="submit">Create my World <span aria-hidden="true">↗</span></button>
          <p class="wg-auth-note">Verify your email to activate your account. Your profile and uploads begin private.</p>
        </form>
        <form id="wgSignInForm" class="wg-auth-form" hidden>
          <label>Email address <input name="email" type="email" autocomplete="email" required placeholder="you@example.com"></label>
          <label>Password <input name="password" type="password" autocomplete="current-password" required placeholder="Your password"></label>
          <button class="wg-auth-primary" type="submit">Enter Worlds Gallery <span aria-hidden="true">↗</span></button>
          <p class="wg-auth-note">New here? <button id="wgGoToSignup" type="button" class="wg-auth-text-button">Create an account</button></p>
        </form>
        <form id="wgSetupForm" class="wg-auth-form" hidden>
          <p class="wg-auth-note">Complete your private profile before entering the globe.</p>
          <label>Username <input name="username" minlength="3" maxlength="10" pattern="[A-Za-z0-9_]{3,10}" required></label>
          <label>Display name <input name="display_name" maxlength="10" required></label>
          <label>Home country <select name="country_code" required>${countryOptions}</select></label>
          <button class="wg-auth-primary" type="submit">Continue to my country <span aria-hidden="true">↗</span></button>
        </form>
        <p id="wgAuthStatus" class="wg-auth-status" role="status" aria-live="polite"></p>
        <div class="wg-auth-panel-footer"><span><span class="wg-auth-lock" aria-hidden="true">◈</span> SECURED WITH SUPABASE AUTH</span><span>PRIVATE BY DEFAULT</span></div>
      </section>
    </div>`;
  document.body.appendChild(gate);
  // Prevent keyboard and assistive-technology entry into hidden gallery content.
  const protectedAreas = [...document.querySelectorAll('#worldPortal, .site-header, main, footer')];
  function setProtectedAccess(allowed) {
    for (const area of protectedAreas) area.inert = !allowed;
  }
  setProtectedAccess(false);
  const logout = document.createElement('button');
  logout.id = 'wgLogout'; logout.type = 'button'; logout.textContent = 'Sign out'; logout.hidden = true;
  document.body.appendChild(logout);
  const byId = id => document.getElementById(id);
  const status = (value,kind='info') => { const el=byId('wgAuthStatus'); el.textContent=value||''; el.dataset.kind=kind; };
  let mode = 'signup'; let busy = false; let currentUser = null;
  let entryMode = 'signup';
  try {
    if (sessionStorage.getItem('wg-auth-after-logout') === 'signin') entryMode = 'signin';
    sessionStorage.removeItem('wg-auth-after-logout');
    if(entryMode!=='signin'){const prev=sessionStorage.getItem('wg-auth-mode');if(['signin','signup'].includes(prev))entryMode=prev;}
  } catch {}
  function setMode(next) {
    mode = next;
    if(next==='signin'||next==='signup'){try{sessionStorage.setItem('wg-auth-mode',next)}catch{}}
    byId('wgAuthTabs').hidden = next === 'setup';
    const title = byId('wgAuthPanelTitle');
    const subtitle = byId('wgAuthPanelSubtitle');
    if (title) title.textContent = next === 'signin' ? 'Welcome back.' : next === 'setup' ? 'Complete your World.' : 'Create your World.';
    if (subtitle) subtitle.textContent = next === 'signin' ? 'Pick up where your journey left off.' : next === 'setup' ? 'Set a home country to begin your journey.' : 'Your perspective. Your places. A gallery of the world waiting to be explored.';
    byId('wgSignInForm').hidden = next !== 'signin';
    byId('wgSignUpForm').hidden = next !== 'signup';
    byId('wgSetupForm').hidden = next !== 'setup';
    byId('wgTabSignIn').setAttribute('aria-pressed', String(next === 'signin'));
    byId('wgTabSignUp').setAttribute('aria-pressed', String(next === 'signup'));
    status('');
    document.dispatchEvent(new CustomEvent('wg:auth-mode',{detail:{mode:next}}));
  }
  setMode(entryMode);
  byId('wgTabSignIn').addEventListener('click', () => setMode('signin'));
  byId('wgTabSignUp').addEventListener('click', () => setMode('signup'));
  byId('wgGoToSignup')?.addEventListener('click', () => setMode('signup'));

  /* WG AUTH V2.2 — one eye controls BOTH signup password fields. */
  function installPasswordVisibility() {
    const showIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.2 12s3.5-6 9.8-6 9.8 6 9.8 6-3.5 6-9.8 6-9.8-6-9.8-6Z"/><circle cx="12" cy="12" r="3"/></svg>';
    const hideIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.8 6.1a9.7 9.7 0 0 1 1.2-.1c6.3 0 9.8 6 9.8 6a15.4 15.4 0 0 1-3.2 3.8M6.1 6.7A15.8 15.8 0 0 0 2.2 12s3.5 6 9.8 6c1.3 0 2.6-.3 3.8-.8"/><path d="M10.5 10.5a3 3 0 0 0 4 4"/></svg>';
    const signup = byId('wgSignUpForm');
    const signIn = byId('wgSignInForm');
    const left = signup.querySelector('input[name="password"]');
    const confirm = signup.querySelector('input[name="confirm_password"]');
    const signinInput = signIn.querySelector('input[name="password"]');
    const pairs = [
      {inputs:[left,confirm], host:confirm, label:'Show both passwords'},
      {inputs:[signinInput], host:signinInput, label:'Show sign-in password'}
    ];
    pairs.forEach(({inputs,host,label},index) => {
      inputs.forEach((input,i) => { input.id = `wgAuthPassword${index}_${i}`; });
      // Wrap only the input carrying the eye. The other password has no eye.
      const wrap = document.createElement('span');
      wrap.className='wg-password-wrap';
      host.parentNode.insertBefore(wrap,host);
      wrap.appendChild(host);
      const button=document.createElement('button');
      button.type='button';button.className='wg-password-toggle';
      button.setAttribute('aria-controls',inputs.map(i=>i.id).join(' '));
      button.setAttribute('aria-label',label);
      button.setAttribute('aria-pressed','false');
      button.innerHTML=showIcon;
      button.addEventListener('click',()=>{
        const visible=inputs[0].type==='password';
        inputs.forEach(i=>{i.type=visible?'text':'password';});
        button.setAttribute('aria-pressed',String(visible));
        button.setAttribute('aria-label',visible?(index===0?'Hide both passwords':'Hide sign-in password'):label);
        button.innerHTML=visible?hideIcon:showIcon;
      });
      wrap.appendChild(button);
    });
    return () => {
      [left,confirm,signinInput].forEach(input=>{input.type='password';});
      gate.querySelectorAll('.wg-password-toggle').forEach(button=>{
        button.setAttribute('aria-pressed','false');
        button.setAttribute('aria-label',button.getAttribute('aria-controls').includes('wgAuthPassword0')?'Show both passwords':'Show sign-in password');
        button.innerHTML=showIcon;
      });
    };
  }
  const resetPasswordEyes = installPasswordVisibility();

  function installDownwardCountryMenus() {
    // Native select menus may open upward at the OS's discretion. Keep the
    // original select for form values, but use a custom, always-below popover.
    let current = null;
    let activeIndex = 0;
    function closeMenu(focusTrigger=false) {
      if (!current) return;
      current.menu.hidden = true;
      current.trigger.setAttribute('aria-expanded', 'false');
      if (focusTrigger) current.trigger.focus({preventScroll:true});
      current = null;
    }
    function positionMenu() {
      if (!current || current.menu.hidden) return;
      const r = current.trigger.getBoundingClientRect();
      const free = window.innerHeight - r.bottom - 12;
      const left = Math.max(8, Math.min(r.left, window.innerWidth - r.width - 8));
      current.menu.style.left = left + 'px';
      current.menu.style.top = (r.bottom + 5) + 'px';
      current.menu.style.width = Math.min(r.width, window.innerWidth - 16) + 'px';
      current.menu.style.maxHeight = Math.min(290, Math.max(80, free)) + 'px';
    }
    function items() {
      return current ? [...current.list.querySelectorAll('[role="option"]')] : [];
    }
    function highlight(index) {
      const options = items();
      if (!options.length) return;
      activeIndex = (index + options.length) % options.length;
      options.forEach((option, i) => {
        option.dataset.active = String(i === activeIndex);
        if (i === activeIndex) {
          current.search.setAttribute('aria-activedescendant', option.id);
          option.scrollIntoView({block:'nearest'});
        }
      });
    }
    function choose(code) {
      if (!current) return;
      const chosen = countries.find(([value]) => value === code);
      if (!chosen) return;
      current.select.value = code;
      current.select.dispatchEvent(new Event('change', {bubbles:true}));
      current.trigger.querySelector('.wg-country-value').textContent = chosen[1];
      current.trigger.classList.add('wg-has-value');
      closeMenu(true);
    }
    function render(filter='') {
      if (!current) return;
      const matched = countries.filter(([code, name]) =>
        (code + ' ' + name).toLocaleLowerCase().includes(filter.toLocaleLowerCase().trim())
      );
      current.list.replaceChildren();
      if (!matched.length) {
        const empty = document.createElement('p');
        empty.className = 'wg-country-empty';
        empty.textContent = 'No matching countries';
        current.list.appendChild(empty);
      }
      matched.forEach(([code, name], i) => {
        const opt = document.createElement('button');
        opt.id = current.menu.id + '-option-' + i;
        opt.className = 'wg-country-option';
        opt.type = 'button';
        opt.setAttribute('role', 'option');
        opt.setAttribute('aria-selected', String(code === current.select.value));
        opt.textContent = name;
        opt.addEventListener('click', () => choose(code));
        current.list.appendChild(opt);
      });
      activeIndex = Math.max(0, matched.findIndex(([code]) => code === current.select.value));
      if (matched.length) highlight(activeIndex);
    }
    function openMenu(record) {
      if (current === record) {closeMenu(true);return;}
      closeMenu();
      current = record;
      record.menu.hidden = false;
      record.trigger.setAttribute('aria-expanded', 'true');
      record.search.value = '';
      // Give the popover enough vertical room *below* the control. Never flip it above.
      if (window.innerHeight - record.trigger.getBoundingClientRect().bottom < 180) {
        record.trigger.scrollIntoView({block:'start', behavior:'instant'});
      }
      render();
      requestAnimationFrame(() => {
        if (current !== record) return;
        positionMenu();
        record.search.focus({preventScroll:true});
      });
    }
    gate.querySelectorAll('.wg-auth-form select[name="country_code"]').forEach((select, index) => {
      select.removeAttribute('required'); // profileData checks the real select's value.
      select.tabIndex = -1;
      select.classList.add('wg-country-native');
      select.setAttribute('aria-hidden', 'true');
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'wg-country-trigger';
      trigger.setAttribute('role', 'combobox');
      trigger.setAttribute('aria-label', 'Select your home country');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.innerHTML = '<span class="wg-country-value">Select your country</span><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
      select.insertAdjacentElement('afterend', trigger);
      const menu = document.createElement('div');
      menu.className = 'wg-country-menu';
      menu.id = 'wg-country-menu-' + index;
      menu.hidden = true;
      trigger.setAttribute('aria-controls', menu.id + '-list');
      const search = document.createElement('input');
      search.type = 'search';
      search.className = 'wg-country-search';
      search.placeholder = 'Search countries';
      search.autocomplete = 'off';
      search.setAttribute('aria-label', 'Search countries');
      search.setAttribute('aria-controls', menu.id + '-list');
      menu.appendChild(search);
      const list = document.createElement('div');
      list.id = menu.id + '-list';
      list.className = 'wg-country-list';
      list.setAttribute('role', 'listbox');
      list.setAttribute('aria-label', 'Countries');
      menu.appendChild(list);
      gate.appendChild(menu); // Avoid clipping inside the scrolling auth panel.
      const record = {select,trigger,menu,search,list};
      if (select.value) {
        const match = countries.find(([code]) => code === select.value);
        if (match) {
          trigger.querySelector('.wg-country-value').textContent = match[1];
          trigger.classList.add('wg-has-value');
        }
      }
      trigger.addEventListener('click', () => openMenu(record));
      trigger.addEventListener('keydown', e => {
        if (['ArrowDown','ArrowUp','Enter',' '].includes(e.key)) {
          e.preventDefault();
          if (current !== record) openMenu(record);
        }
      });
      search.addEventListener('input', () => render(search.value));
      search.addEventListener('keydown', e => {
        if (e.key === 'Escape') {e.preventDefault();closeMenu(true);}
        else if (e.key === 'ArrowDown') {e.preventDefault();highlight(activeIndex+1);}
        else if (e.key === 'ArrowUp') {e.preventDefault();highlight(activeIndex-1);}
        else if (e.key === 'Enter') {
          e.preventDefault();
          const option = items()[activeIndex];
          if (option) option.click();
        } else if (e.key === 'Tab') closeMenu();
      });
    });
    document.addEventListener('pointerdown', e => {
      if (current && !current.menu.contains(e.target) && !current.trigger.contains(e.target)) closeMenu();
    });
    window.addEventListener('resize', positionMenu);
    gate.addEventListener('scroll', positionMenu, true);
  }
  installDownwardCountryMenus();
  function clearSignupFields() {
    const form=byId('wgSignUpForm');
    form.reset();
    form.querySelectorAll('input').forEach(el=>{el.value='';});
    form.querySelectorAll('select[name="country_code"]').forEach(el=>{el.value='';});
    form.querySelectorAll('.wg-country-trigger').forEach(button=>{
      const text=button.querySelector('.wg-country-value');
      if(text) text.textContent='Select your country';
      button.classList.remove('wg-has-value');
    });
    form.querySelectorAll('details').forEach(el=>{el.open=false;});
    resetPasswordEyes();
  }
  function lockBusy(on) {
    busy = on;
    gate.querySelectorAll('button[type=submit]').forEach(b => b.disabled = on);
  }
  if (!window.supabase?.createClient) {
    // WG_AUTH_CDN_FAILURE_GUARD_V216
    const message = 'Login service unavailable. Supabase could not load from either CDN. Check your network connection and refresh.';

    ['wgSignInForm', 'wgSignUpForm', 'wgSetupForm'].forEach(id => {
      byId(id)?.addEventListener('submit', event => {
        event.preventDefault();
        status(message, 'error');
      });
    });

    document.documentElement.classList.remove('wg-refresh-restore');
    status(message, 'error');
    document.dispatchEvent(new Event('wg:guest-ready'));
    return;
  }
  // WG_V2231_AUTH_NETWORK_GUARD_BEGIN - retry one transient transport failure on the login endpoint only.
  // The SDK still validates credentials and RLS. HTTP errors (including 400/401/429) are never retried.
  const authNetworkError = error => /failed to fetch|networkerror|network request failed|load failed/i.test(String(error?.message || ''));
  const authErrorText = error => authNetworkError(error)
    ? 'Could not reach the login service. Check your internet connection, browser shields or blockers, then try again. Your account has not been changed.'
    : String(error?.message || 'Could not sign in.');
  async function wgResilientFetch(input, options) {
    const nativeFetch = window.fetch.bind(window);
    const address = String(typeof input === 'string' ? input : input?.url || input || '');
    const method = String(options?.method || input?.method || 'GET').toUpperCase();
    const loginRequest = method === 'POST' && address.startsWith(URL + '/auth/v1/token');
    try {
      return await nativeFetch(input, options);
    } catch (error) {
      if (!loginRequest || !authNetworkError(error) || navigator.onLine === false) throw error;
      // A single bounded retry for intermittent transport problems, not for authentication failures.
      await new Promise(resolve => setTimeout(resolve, 650));
      return nativeFetch(input, options);
    }
  }
  // WG_V2231_AUTH_NETWORK_GUARD_END
  const db = window.supabase.createClient(URL, KEY, {global:{fetch:wgResilientFetch},auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});
  window.WorldsGalleryAuth = {getUser: () => db.auth.getUser(), getClient: () => db, getCurrentUserId: () => currentUser?.id || null};
  const profileData = form => {
    const data = new FormData(form);
    const code = String(data.get('country_code') || '').toUpperCase();
    const match = countries.find(([country]) => country === code);
    if (!match) throw new Error('Please select a valid country.');
    const username = String(data.get('username') || '').trim();
    const display_name = String(data.get('display_name') || '').trim();
    if (!/^[A-Za-z0-9_]{3,10}$/.test(username) || !display_name || display_name.length > 10) throw new Error('Please check your username and display name.');
    return {
      username, display_name,
      home_country_code: code, home_country_name: match[1],
      home_region: String(data.get('home_region') || '').trim() || null,
      home_province: String(data.get('home_province') || '').trim() || null,
      home_city: String(data.get('home_city') || '').trim() || null
    };
  };
  async function ensureProfile(user) {
    const result = await db.from('wg_profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (result.error) throw result.error;
    if (result.data) return result.data;
    const metadata = user.user_metadata || {};
    const match = countries.find(([code]) => code === metadata.home_country_code);
    if (!match || !/^[A-Za-z0-9_]{3,10}$/.test(metadata.username || '') || !metadata.display_name) {
      setMode('setup');
      return null;
    }
    const newProfile = {
      user_id: user.id,
      username: metadata.username,
      display_name: metadata.display_name,
      home_country_code: match[0], home_country_name: match[1],
      home_region: metadata.home_region || null,
      home_province: metadata.home_province || null,
      home_city: metadata.home_city || null
    };
    const inserted = await db.from('wg_profiles').insert(newProfile).select('*').single();
    if (inserted.error) {setMode('setup'); status('Choose a different username if yours is already used. ' + inserted.error.message); return null;}
    return inserted.data;
  }
  async function ensurePrivateDefaults(user) {
    for (const table of ['wg_privacy_settings', 'wg_content_preferences']) {
      const result = await db.from(table).upsert({user_id:user.id}, {onConflict:'user_id',ignoreDuplicates:true});
      if (result.error) throw result.error;
    }
  }
  async function enter(user) {
    if(!user.email_confirmed_at){
      status('Please confirm your email before signing in. Check your inbox and spam folder.','notice');
      setMode('signin');
      status('Please confirm your email before signing in. Check your inbox and spam folder.','notice');
      return;
    }
    currentUser = user;
    const profile = await ensureProfile(user);
    if (!profile) return;
    await ensurePrivateDefaults(user);
    // Honour saved accessibility preferences on every sign-in and reload.
    try {
      const pref = await db.from('wg_content_preferences').select('reduce_motion').eq('user_id', user.id).maybeSingle();
      if (!pref.error) document.documentElement.classList.toggle('wg-reduce-motion', !!pref.data?.reduce_motion);
    } catch {}
    setProtectedAccess(true);
    document.documentElement.classList.add('wg-auth-ok');
    gate.hidden = true;
    logout.hidden = false;
    document.dispatchEvent(new CustomEvent('wg:authenticated',{detail:{user,profile}}));
    document.body.classList.add('portal-locked');
    const resumed=window.WorldsGalleryViewState?.restoreForUser?.(user.id)===true;
    if(!resumed&&window.WorldsGalleryPortal?.faceHomeCountry)window.WorldsGalleryPortal.faceHomeCountry(profile.home_country_code);
    document.documentElement.classList.remove('wg-refresh-restore');
  }
  // V2.23.2: Enter from either sign-in credential field submits once,
  // via native validation and the existing guarded submit handler.
  byId('wgSignInForm').addEventListener('keydown', event => {
    if(event.key!=='Enter'||event.isComposing||event.repeat||busy)return;
    if(!event.target.matches('input[name="email"],input[name="password"]'))return;
    event.preventDefault();
    if(typeof event.currentTarget.requestSubmit==='function')event.currentTarget.requestSubmit();
    else event.currentTarget.querySelector('button[type="submit"]')?.click();
  });
  byId('wgSignInForm').addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return;
    lockBusy(true); status('Signing in...');
    let signedIn = false;
    try {
      const data = new FormData(event.target);
      const result = await db.auth.signInWithPassword({email:String(data.get('email') || '').trim(), password:String(data.get('password') || '')});
      if (result.error) throw result.error;
      if (!result.data.user) throw new Error('Account session is not available.');
      if (!result.data.user.email_confirmed_at) {
        await db.auth.signOut();
        throw new Error('Your email is not confirmed yet. Check your inbox and spam folder first.');
      }
      signedIn = true;
      await enter(result.data.user);
      if (document.documentElement.classList.contains('wg-auth-ok')) {
        event.target.reset();
        resetPasswordEyes();
      }
    } catch (err) {
      status(signedIn ? 'Signed in, but your profile could not load. ' + authErrorText(err) : authErrorText(err), 'error');
    }
    finally {lockBusy(false);}
  });
  byId('wgSignUpForm').addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return;
    lockBusy(true); status('Creating your account...');
    try {
      const values = profileData(event.target);
      const data = new FormData(event.target);
      const password = String(data.get('password') || '');
      const confirmPassword = String(data.get('confirm_password') || '');
      if (password !== confirmPassword) throw new Error('Passwords do not match. Please try again.');
      if (password.length < 8 || password.length > 128) throw new Error('Choose a password between 8 and 128 characters. Longer passphrases are safer.');
      const result = await db.auth.signUp({
        email:String(data.get('email') || '').trim(), password,
        options:{emailRedirectTo:location.origin + location.pathname, data:values}
      });
      if (result.error) throw result.error;
      // Keep the form clean on every successful registration, even if the
      // project accidentally allows immediate sessions without verification.
      clearSignupFields();
      byId('wgSignInForm').reset();
      byId('wgSignInForm').querySelectorAll('input').forEach(el=>{el.value='';});
      setMode('signin');
      if(result.data.session){
        await db.auth.signOut();
        status('Account created. Email confirmation appears disabled in Supabase settings. Enable it before launch. Sign in only after confirming your address.','notice');
      } else {
        status('Account created. Please confirm the email sent to your inbox (check Spam too) before signing in.','success');
      }
    } catch (err) {status(err.message || 'Could not create account.');}
    finally {lockBusy(false);}
  });
  byId('wgSetupForm').addEventListener('submit', async event => {
    event.preventDefault(); if (busy || !currentUser) return;
    lockBusy(true); status('Saving your profile...');
    try {
      const values = profileData(event.target);
      const result = await db.from('wg_profiles').insert({...values,user_id:currentUser.id}).select('*').single();
      if (result.error) throw result.error;
      await enter(currentUser);
    } catch (err) {status(err.message || 'Could not save your profile.');}
    finally {lockBusy(false);}
  });
  logout.addEventListener('click', async () => {
    logout.disabled = true;
    try {
      const result = await db.auth.signOut();
      if (result.error) throw result.error;
      setProtectedAccess(false);
      document.documentElement.classList.remove('wg-auth-ok');
      window.WorldsGalleryViewState?.clear?.();
      try { sessionStorage.setItem('wg-auth-after-logout', 'signin');sessionStorage.setItem('wg-auth-mode','signin'); } catch {}
      location.replace(location.pathname);
    } catch (err) {alert('Sign out failed: ' + (err.message || 'Unknown error')); logout.disabled = false;}
  });
  db.auth.onAuthStateChange(event => {
    if (event === 'SIGNED_OUT' && document.documentElement.classList.contains('wg-auth-ok')) {
      setProtectedAccess(false);
      document.documentElement.classList.remove('wg-auth-ok');
      window.WorldsGalleryViewState?.clear?.();
      try { sessionStorage.setItem('wg-auth-after-logout', 'signin');sessionStorage.setItem('wg-auth-mode','signin'); } catch {}
      location.replace(location.pathname);
    }
  });
  (async () => {
    status('Checking your account...');
    try {
      const {data,error} = await db.auth.getUser();
      if (data?.user) await enter(data.user);
      else {status(error && error.name !== 'AuthSessionMissingError' ? 'Could not verify session: ' + error.message : 'Create an account to begin, or sign in if you already have one.');document.dispatchEvent(new Event('wg:guest-ready'));document.documentElement.classList.remove('wg-refresh-restore');}
    } catch (err) {status('Could not verify your session: ' + authErrorText(err), 'error');document.documentElement.classList.remove('wg-refresh-restore');}
  })();
})();
