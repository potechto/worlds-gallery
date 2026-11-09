/* Worlds Gallery V2.14: in-place envelope insertion + original illustrated postal cyclist.
   Runs ONLY when wg_account.js renders a real support success/cooldown sequence.
   Does not create tickets, alter countdown data, touch email APIs, or create an overlay. */
(() => {
  'use strict';
  const drawer = document.getElementById('wgAccountDrawer');
  const content = document.getElementById('wgAcContent');
  if (!drawer || !content) return;

  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('wg-reduce-motion');

  // Original, custom vector illustration. Inspired by the user's postal cyclist reference.
  // Bike wheels and scenery are separate layers and animate independently.
  const cyclistSVG = `<svg xmlns="http://www.w3.org/2000/svg" class="wg-v214-cyclist" viewBox="0 0 370 210"
    role="img" aria-label="Illustrated blue-uniform postal worker riding a bicycle with mail bags and letters">
    <defs>
      <linearGradient id="wg214Blue" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#306c9f"/><stop offset="1" stop-color="#214e81"/></linearGradient>
      <linearGradient id="wg214Bag" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a56e3b"/><stop offset="1" stop-color="#764521"/></linearGradient>
      <linearGradient id="wg214Steel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#337a95"/><stop offset="1" stop-color="#224d69"/></linearGradient>
    </defs>
    <ellipse cx="184" cy="192" rx="160" ry="7" fill="#274d4730" />
    <g class="wg-v214-wheel" style="transform-origin:93px 162px">
      <circle cx="93" cy="162" r="39.5" fill="#f5f9f6" stroke="#24383b" stroke-width="8"/>
      <circle cx="93" cy="162" r="32.5" fill="none" stroke="#789397" stroke-width="1.8"/>
      <path d="M93 124v76M55 162h76M66 135l54 54M120 135l-54 54M74 128l38 68M111 128l-37 68M59 146l68 32M127 146l-68 32" stroke="#647f83" stroke-width="1.15"/>
      <circle cx="93" cy="162" r="6.5" fill="#2f5869" stroke="#183b46" stroke-width="2" />
    </g>
    <g class="wg-v214-wheel" style="transform-origin:285px 162px">
      <circle cx="285" cy="162" r="39.5" fill="#f5f9f6" stroke="#24383b" stroke-width="8"/>
      <circle cx="285" cy="162" r="32.5" fill="none" stroke="#789397" stroke-width="1.8"/>
      <path d="M285 124v76M247 162h76M258 135l54 54M312 135l-54 54M266 128l38 68M303 128l-37 68M251 146l68 32M319 146l-68 32" stroke="#647f83" stroke-width="1.15"/>
      <circle cx="285" cy="162" r="6.5" fill="#2f5869" stroke="#183b46" stroke-width="2" />
    </g>
    <!-- Postal parcels and back pannier -->
    <rect x="54" y="96" width="43" height="36" rx="3" fill="#c8995c" stroke="#815d34" stroke-width="1.8"/>
    <path d="M75 96v36M54 106h43" stroke="#e2bf89" stroke-width="2.2"/>
    <rect x="71" y="82" width="47" height="39" rx="3" fill="#d1a26b" stroke="#815d34" stroke-width="1.5"/>
    <path d="M95 82v39M72 94h46" stroke="#ebcc96" stroke-width="2"/>
    <path d="M66 116l-18 13 3 12 17-4" fill="#be8151" stroke="#8f5f3d" stroke-width="1"/>
    <!-- Rear carrier -->
    <path d="M69 128h60l8 13" fill="none" stroke="#304d58" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M70 132l-6 9" fill="none" stroke="#304d58" stroke-width="3.5"/>
    <!-- Functional bicycle geometry -->
    <path d="M93 162L146 102 197 162 93 162 163 121 285 162 235 108" fill="none" stroke="url(#wg214Steel)" stroke-width="5.7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M146 102l-10-15M121 88h39M231 106l-3-20M228 86h29" fill="none" stroke="#2b4551" stroke-width="5" stroke-linecap="round"/>
    <path d="M235 108L285 162" stroke="#2f637d" stroke-width="5.4"/>
    <path d="M183 159h29M197 162l13-15" stroke="#254857" stroke-width="5" stroke-linecap="round"/>
    <circle cx="197" cy="162" r="12" fill="#29627a" stroke="#20495a" stroke-width="3"/>
    <path d="M197 162l16 13" stroke="#27363d" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M208 175h22" stroke="#27363d" stroke-width="4.5" stroke-linecap="round"/>
    <!-- Front wire basket -->
    <path d="M257 92l17 8 25-3 -8 39-29-2z" fill="#f0dfb3" stroke="#2c4d56" stroke-width="2.4"/>
    <path d="M263 104l32-1M261 114l32-1M261 125l30-2M274 99l-4 34M283 99l-3 34" stroke="#63787a" stroke-width="1.65"/>
    <path d="M270 93l-1-15 20 2 1 16" fill="#fff9eb" stroke="#bc7259" stroke-width="1.4"/>
    <path d="M273 82h14M275 86h12" stroke="#aac5c1" stroke-width="1.4"/>
    <path d="M281 93l-1-14 11 2 2 14" fill="#dfc18d" stroke="#987451" stroke-width="1.2"/>
    <!-- A satchel over the back; original illustrative design -->
    <path d="M129 66L100 90l-6 32 37 12 19-50Z" fill="url(#wg214Bag)" stroke="#784824" stroke-width="2.1"/>
    <path d="M123 65L111 88l-8 35M103 105l30 9" fill="none" stroke="#c38a53" stroke-width="2"/>
    <rect x="102" y="109" width="14" height="11" rx="2" fill="#965a2c" stroke="#6f411f" stroke-width="1.5"/>
    <path d="M138 67L113 90" fill="none" stroke="#5a3b2b" stroke-width="3.3"/>
    <!-- Coat and body, limbs -->
    <path d="M168 96Q161 120 169 135l33 27" fill="none" stroke="#234b7b" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M162 114l-3 32 26 27" fill="none" stroke="#276093" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M196 161l11 4" stroke="#303b3b" stroke-width="10" stroke-linecap="round"/>
    <path d="M183 173h22" stroke="#303b3b" stroke-width="10" stroke-linecap="round"/>
    <path d="M132 57Q156 44 174 69l13 48-50 1 -18-34Z" fill="url(#wg214Blue)" stroke="#214b79" stroke-width="2.7"/>
    <path d="M139 68Q143 86 144 110" stroke="#5b96bc" stroke-width="2.3" fill="none"/>
    <path d="M158 69l33 30 47-2" fill="none" stroke="#285f91" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M157 72l35 26 46-2" fill="none" stroke="#427eaf" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M236 97l10-3" stroke="#e0a57d" stroke-width="9" stroke-linecap="round"/>
    <path d="M129 55l13 17" stroke="#9c613f" stroke-width="7"/>
    <!-- Friendly face and postal cap -->
    <path d="M130 36q-3-23 19-28 25-5 32 23v17q-2 18-24 21-23-3-27-22Z" fill="#edb68d" stroke="#cf8f6a" stroke-width="1.6"/>
    <path d="M132 35q-8-16 7-23 23-10 34 9l-1 14-8-7q-15 7-32 7" fill="#303632"/>
    <circle cx="169" cy="42" r="2" fill="#293531"/>
    <path d="M167 52q6 5 12-1" stroke="#b56e63" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M124 23l-3-9 38-7 21 12-1 12-57 0Z" fill="#d45e50" stroke="#9f3d36" stroke-width="2"/>
    <path d="M121 27q25 2 62-5l11 6q-35 9-69 4Z" fill="#263943"/>
    <circle cx="159" cy="20" r="3" fill="#f2d27f" />
    <!-- Mail badge -->
    <circle cx="147" cy="90" r="6" fill="#d9bb6c"/><path d="M143 90h8m-8-2 4 5 4-5" stroke="#6a6237" stroke-width="1" fill="none"/>
  </svg>`;

  const sceneHtml = `
    <div class="wg-v214-scene" aria-hidden="true">
      <div class="wg-v214-halo"></div>
      <div class="wg-v214-mailbox">
        <div class="wg-v214-post"></div>
        <div class="wg-v214-case">
          <div class="wg-v214-shine"></div>
          <span class="wg-v214-brand">WORLDS GALLERY</span>
          <div class="wg-v214-slot"><div class="wg-v214-slot-inner"></div></div>
          <div class="wg-v214-mail-label">MAIL</div>
        </div>
      </div>
      <div class="wg-v214-envelope" aria-hidden="true">
        <div class="wg-v214-env-back"></div>
        <div class="wg-v214-paper"><i></i><i></i><i></i></div>
        <div class="wg-v214-env-left"></div><div class="wg-v214-env-right"></div>
        <div class="wg-v214-env-front"></div>
        <div class="wg-v214-env-flap"></div>
        <div class="wg-v214-env-seal">WG</div>
      </div>
      <div class="wg-v214-slot-lip"></div>
    </div>`;

  const riderHtml = `
    <div class="wg-v214-ride" role="img" aria-label="Illustrated postal cyclist riding in place while scenery, roadway and wind pass by">
      <div class="wg-v214-clouds" aria-hidden="true"></div>
      <div class="wg-v214-hills wg-v214-hills-back" aria-hidden="true"></div>
      <div class="wg-v214-hills wg-v214-hills-front" aria-hidden="true"></div>
      <div class="wg-v214-grass" aria-hidden="true"></div>
      <div class="wg-v214-road" aria-hidden="true"><div class="wg-v214-lanes"></div></div>
      <div class="wg-v214-speed-lines" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <div class="wg-v214-rider-anchor">${cyclistSVG}</div>
      <div class="wg-v214-flying-letters" aria-hidden="true"><span>✉</span><span>✉</span><span>✉</span></div>
    </div>`;

  function clearPreviewButtons() {
    content.querySelectorAll('[data-wg-v211-preview],.wg-v211-preview-button,.wg-v211-back,#wg-v210-dev-btn')
      .forEach(el => el.remove());
    content.querySelectorAll('button').forEach(el => {
      if (/^(preview (delivery|support|mailbox)|replay (delivery|support|mailbox|animation))/i.test((el.textContent||'').trim())) el.remove();
    });
  }

  function decorateResult(result) {
    const title = result.querySelector('h2');
    const clock = result.querySelector('.wg-mail-clock');
    if (!title || !clock) return false;
    const originalSubtitle = result.querySelector('p');
    const originalDelivery = result.querySelector('.wg-mail-delivery');
    title.textContent = 'Thank you for contacting us';
    title.className = 'wg-v214-title';
    title.removeAttribute('aria-label');
    const icon = document.createElement('div');
    icon.className = 'wg-v214-letter-check';
    icon.innerHTML = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="9" y="15" width="46" height="32" rx="7" fill="#e7f2df" stroke="#205441" stroke-width="2.4"/><path d="M11 20l21 16 21-16" stroke="#205441" stroke-width="2.4" fill="none"/><circle cx="48" cy="46" r="11" fill="#43865b" stroke="white" stroke-width="3"/><path d="M43 46l4 4 7-8" stroke="white" stroke-width="2.8" fill="none" stroke-linecap="round"/></svg>`;
    const heading = document.createElement('div');
    heading.className = 'wg-v214-heading';
    const eyebrow = document.createElement('div');
    eyebrow.className = 'wg-v214-eyebrow';
    eyebrow.textContent = 'MESSAGE RECEIVED';
    const subtitle = document.createElement('p');
    subtitle.className = 'wg-v214-subtitle';
    subtitle.textContent = originalSubtitle?.textContent || 'Your message has been saved in our private support queue.';
    heading.append(icon,title,eyebrow,subtitle);

    const ride = document.createElement('div');
    ride.className = 'wg-v214-ride-wrap';
    ride.innerHTML = riderHtml;

    const timerBlock = document.createElement('div');
    timerBlock.className = 'wg-v214-timer-block';
    const label = document.createElement('p');
    label.className = 'wg-v214-timer-label';
    label.textContent = 'You can contact us again in';
    clock.className = 'wg-mail-clock wg-v214-timer'; // preserve authoritative clock node and timer updater
    const caption = document.createElement('small');
    caption.className = 'wg-v214-timer-caption';
    caption.textContent = 'Hours : Minutes : Seconds';
    timerBlock.append(label,clock,caption);
    const note = document.createElement('p');
    note.className = 'wg-v214-note';
    note.textContent = originalDelivery?.textContent || 'Email notification delivery is separate from ticket saving.';
    result.replaceChildren(heading,ride,timerBlock,note);
    return true;
  }

  // V2.15: Center the actual support scene inside its scrollable drawer.
  // The underlying page and server-side cooldown remain unchanged.
  function centerSupportScene(stage, showResult=false) {
    if (!stage?.isConnected || drawer.hidden) return;

    const target = stage.querySelector(
      showResult ? '.wg-mail-result' : '.wg-mail-stage'
    );

    if (!target) return;

    const panel = drawer.getBoundingClientRect();
    const rect = target.getBoundingClientRect();

    if (panel.height < 90 || rect.height < 10) return;

    const visibleTop = Math.max(0, panel.top + 8);
    const visibleBottom = Math.min(
      window.innerHeight,
      panel.bottom - 8
    );

    if (visibleBottom <= visibleTop) return;

    const center = (visibleTop + visibleBottom) / 2;
    const delta = rect.top + rect.height / 2 - center;

    if (Math.abs(delta) >= 8) {
      drawer.scrollTop = Math.max(
        0,
        Math.min(
          drawer.scrollHeight - drawer.clientHeight,
          drawer.scrollTop + delta
        )
      );
    }
  }

  function scheduleCenter(stage, showResult=false) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      centerSupportScene(stage, showResult);
    }));
  }
  function markComplete(stage) {
    if (!stage.isConnected) return;
    stage.classList.add('wg-v214-complete','wg-mail-done');
    stage.classList.remove('wg-mail-playing');
    scheduleCenter(stage,true);
  }

  // WAAPI follows the physical mailbox geometry. The envelope rotates edge-on,
  // then moves RIGHT into the horizontal mouth. Its visible right edge is clipped
  // to the stationary mouth as the left remainder moves forward: not an opacity fade.
  async function animateInsertion(stage) {
    const scene = stage.querySelector('.wg-v214-scene');
    const env = scene?.querySelector('.wg-v214-envelope');
    const slot = scene?.querySelector('.wg-v214-slot');
    const rim = scene?.querySelector('.wg-v214-slot-lip');
    const paper = scene?.querySelector('.wg-v214-paper');
    const flap = scene?.querySelector('.wg-v214-env-flap');
    if (!scene || !env || !slot || !rim || !paper || !flap || reduceMotion()) {markComplete(stage);return;}
    // Geometry is sampled after layout, including responsive postbox transforms.
    const eb=env.getBoundingClientRect(), sb=slot.getBoundingClientRect(), ab=scene.getBoundingClientRect();
    if (!eb.width || !sb.width) {markComplete(stage);return;}
    rim.style.left = (sb.left-ab.left-2)+'px';
    rim.style.top=(sb.top-ab.top-3)+'px';
    rim.style.width=(sb.width+4)+'px';
    rim.style.height=(sb.height+6)+'px';
    const envelopeWidth=env.offsetWidth;
    const SCALE=.86;
    const slotX=sb.left-ab.left+4;
    const slotY=sb.top-ab.top+sb.height/2;
    const cx=env.offsetLeft+env.offsetWidth/2;
    const cy=env.offsetTop+env.offsetHeight/2;
    const dx=slotX-(cx+envelopeWidth*SCALE/2);
    const dy=slotY-cy;
    const initial='translate(0px,0px) rotateZ(-9deg) rotateX(0deg) scale(1)';
    const aligned=`translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px) rotateZ(0deg) rotateX(83deg) scale(${SCALE})`;
    const mid=`translate(${(dx*.62).toFixed(2)}px,${(dy-19).toFixed(2)}px) rotateZ(-5deg) rotateX(42deg) scale(.93)`;
    const EASE='cubic-bezier(.32,.08,.22,1)';
    const play=async (el,frames,ms,easing='ease-in-out')=>{
      if (!stage.isConnected) return false;
      const a=el.animate(frames,{duration:ms,easing,fill:'forwards'});
      try{await a.finished;}catch{return false;}
      return stage.isConnected;
    };
    try {
      await play(paper,[{transform:'translateY(-15px) scale(1)',opacity:1},{transform:'translateY(16px) scale(.82)',opacity:1}],300);
      await play(flap,[{transform:'rotateX(0deg)'},{transform:'rotateX(179deg)'}],300,'cubic-bezier(.4,0,.1,1)');
      if (reduceMotion()) {markComplete(stage);return;}
      const approaching=await play(env,[
        {offset:0,transform:initial,clipPath:'inset(0 0px 0 0)'},
        {offset:.55,transform:mid,clipPath:'inset(0 0px 0 0)'},
        {offset:1,transform:aligned,clipPath:'inset(0 0px 0 0)'}
      ],660,EASE);
      if (!approaching) return;
      // Physical card insertion: the mouth remains stationary while the
      // clipped leading portion is now inside the box, frame-by-frame.
      const maxPush=envelopeWidth*SCALE+6;
      const entryFrames=[0,.20,.44,.67,.86,1].map(p=>({
        offset:p,
        transform:`translate(${(dx+maxPush*p).toFixed(2)}px,${dy.toFixed(2)}px) rotateZ(0deg) rotateX(83deg) scale(${SCALE})`,
        clipPath:`inset(0 ${(envelopeWidth*p).toFixed(2)}px 0 0)`
      }));
      const inserted=await play(env,entryFrames,790,'cubic-bezier(.27,.1,.5,1)');
      if (!inserted) return;
      // The envelope is fully hidden behind the slot BEFORE any dissolve.
      env.style.visibility='hidden';
      stage.classList.add('wg-v214-dissolve');
      await new Promise(resolve=>setTimeout(resolve,120));
      markComplete(stage);
    } catch(error){
      // The ticket was already saved. Prefer showing its real countdown if
      // animation APIs fail instead of leaving a blocked screen.
      console.warn('Worlds Gallery support animation fallback:', String(error).slice(0,120));
      markComplete(stage);
    }
  }

  function enhance(stage) {
    if (!stage || stage.dataset.wgV214) return;
    const area=stage.querySelector('.wg-mail-stage');
    const result=stage.querySelector('.wg-mail-result');
    if (!area || !result || !result.querySelector('.wg-mail-clock')) return;
    stage.dataset.wgV214='ready';
    stage.classList.add('wg-v214-inline');
    area.innerHTML=sceneHtml;
    decorateResult(result);
    clearPreviewButtons();
    scheduleCenter(stage,false);
    if (!stage.classList.contains('wg-mail-playing') || reduceMotion()) {markComplete(stage);return;}
    requestAnimationFrame(()=>requestAnimationFrame(()=>{if(stage.isConnected)animateInsertion(stage);}));
  }

  let pending=false;
  function scan() {
    if (pending) return;
    pending=true;
    queueMicrotask(()=>{
      pending=false;
      if (drawer.hidden) return;
      clearPreviewButtons();
      const scene=content.querySelector('.wg-mail-sequence:not([data-wg-v214])');
      if (scene) enhance(scene);
    });
  }
  const mo = new MutationObserver(scan);
  mo.observe(content,{subtree:true,childList:true});
  scan();
})();
