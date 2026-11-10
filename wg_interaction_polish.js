/* Worlds Gallery V2.23.5 — Local, presentation-only interaction and guest prompt.
 * No account creation, Supabase writes, storage changes, or network requests.
 */
(() => {
  'use strict';
  const tapTarget='button:not(:disabled), a[href], [role="button"]:not([aria-disabled="true"])';
  const isGuest=()=>document.documentElement.classList.contains('wg-guest-explore') &&
    !window.WorldsGalleryAuth?.getCurrentUserId?.();
  const getTarget=event=>event.target instanceof Element?event.target.closest(tapTarget):null;
  // Pointer-down response AND a short after-click confirmation on mouse, touch, and keyboard.
  document.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    const target=getTarget(event);
    if(!target)return;
    target.classList.add('wg-is-pressing');
  },true);
  for(const name of ['pointerup','pointercancel']){
    document.addEventListener(name,event=>{
      const target=getTarget(event);
      target?.classList.remove('wg-is-pressing');
    },true);
  }
  const running=new WeakMap();
  document.addEventListener('click',event=>{
    const target=getTarget(event);
    if(!target)return;
    target.classList.remove('wg-was-clicked');
    // Force a fresh confirmation even for rapid successive taps.
    void target.offsetWidth;
    target.classList.add('wg-was-clicked');
    const old=running.get(target);
    if(old)clearTimeout(old);
    running.set(target,setTimeout(()=>{target.classList.remove('wg-was-clicked');running.delete(target);},340));
  },true);

  const dialog=document.createElement('dialog');
  dialog.id='wgGuestRequiredDialog';
  dialog.className='wg-guest-required';
  dialog.setAttribute('aria-labelledby','wgGuestPromptTitle');
  dialog.setAttribute('aria-describedby','wgGuestPromptDesc');
  dialog.innerHTML=`<div class="wg-guest-prompt">
    <div class="wg-guest-prompt-top">
      <span class="wg-guest-prompt-kicker">YOUR PERSONAL SPACE</span>
      <button type="button" class="wg-guest-prompt-close" data-wg-guest-close aria-label="Close sign-in invitation">
        <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <h2 id="wgGuestPromptTitle">Please sign in to complete this action.</h2>
    <p id="wgGuestPromptDesc">Create a free account or sign in to use personal features. You can keep exploring without an account.</p>
    <div class="wg-guest-prompt-actions">
      <button type="button" class="wg-guest-prompt-primary" data-wg-auth-intent="signin">Sign in</button>
      <button type="button" class="wg-guest-prompt-secondary" data-wg-auth-intent="signup">Create account</button>
      <button type="button" class="wg-guest-prompt-plain" data-wg-guest-close>Continue as guest</button>
    </div>
    <small>No account is required for globe exploration or your browser-local World Mosaic. My Album requires sign-in.</small>
  </div>`;
  document.body.append(dialog);
  const description=dialog.querySelector('#wgGuestPromptDesc');
  const safeActions=new Map([
    ['share your story','To share a story, you need an account. You can still discover places and build a private, browser-local World Mosaic as a guest.'],
    ['view your private stories','Your private stories belong to your account. Please sign in to see them. Guest exploration is still available.'],
    ['open your account settings','Sign in to access your profile and settings. Guest discovery does not require an account.'],
    ['access your personal space','Sign in to continue to your personal space, or keep exploring as a guest.'],
    ['open your personal album','My Album is for signed-in members. Sign in or create a free account to open your scrapbook; you can still explore the world as a guest.']
  ]);
  const close=()=>{if(dialog.open)dialog.close();};
  dialog.querySelectorAll('[data-wg-guest-close]').forEach(button=>button.addEventListener('click',close));
  dialog.querySelectorAll('[data-wg-auth-intent]').forEach(button=>button.addEventListener('click',()=>{
    const mode=button.dataset.wgAuthIntent;
    close();
    if(!isGuest())return;
    document.dispatchEvent(new CustomEvent('wg:guest-auth-request',{detail:{mode}}));
  }));
  dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  document.addEventListener('wg:require-account',event=>{
    if(!isGuest())return;
    description.textContent=safeActions.get(event.detail?.action)||'Sign in to use account-only features, or continue exploring as a guest.';
    if(!dialog.open){dialog.showModal();dialog.querySelector('[data-wg-auth-intent="signin"]')?.focus();}
  });
  document.addEventListener('wg:authenticated',close);

  // Only icon-only controls should rely on an accessible name/tooltip.
  // Keep already clear action labels free of decorative arrow/star glyphs.
  const cleanControls=()=>{
    const themeButton=document.getElementById('themeChoose')?.querySelector('span');
    if(themeButton && themeButton.textContent.includes('Select themes'))themeButton.textContent='Select themes';
    const earth=document.getElementById('arrivalBackEarth');
    if(earth && /Return to Earth/.test(earth.textContent))earth.textContent='Return to Earth';
  };
  cleanControls();
  document.addEventListener('wg:locale',cleanControls);
  window.WorldsGalleryUIPolish=Object.freeze({isGuest,showAccountPrompt:action=>{
    if(isGuest())document.dispatchEvent(new CustomEvent('wg:require-account',{detail:{action}}));
  }});
})();
