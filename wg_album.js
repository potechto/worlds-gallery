/* Worlds Gallery V2.24.4 - immediate reverse fold, safe file chooser, transparent stickers and remove controls.
   Browser-local pages and stickers; external GIF search requires explicit user action. */
(() => {
  'use strict';
  const uid = () => window.WorldsGalleryAuth?.getCurrentUserId?.() || null;
  const scope = () => uid() || 'guest';
  const KEY = account => `wg_my_album_v2:${account}`;
  const OLD_KEY = account => `wg_my_album_intro_v1:${account}`;
  const MAX_SPREADS = 12;
  const MAX_STICKERS = 16;
  const COVER_CHOICES = [
    {id:'signature',name:'Travel journal',image:'assets/photos/wg_album_reference.webp'},
    {id:'sky',name:'Sky & dreams',image:'assets/photos/wg_album_scene_sky.webp'},
    {id:'city',name:'City at sunset',image:'assets/photos/wg_album_scene_city.webp'},
    {id:'garden',name:'Blooming streets',image:'assets/photos/wg_album_scene_garden.webp'}
  ];
  const SCENES = [
    {id:'sky',name:'Dreamy skies',image:'assets/photos/wg_album_scene_sky.webp'},
    {id:'city',name:'Golden city',image:'assets/photos/wg_album_scene_city.webp'},
    {id:'garden',name:'Garden walk',image:'assets/photos/wg_album_scene_garden.webp'},
    {id:'journey',name:'Travel memories',image:'assets/photos/wg_album_scene_journey.webp'}
  ];
  const FALLBACK_COUNTRIES = [['PH','Philippines'],['JP','Japan'],['IT','Italy'],['US','United States'],['FR','France'],['GB','United Kingdom'],['KR','South Korea'],['TH','Thailand'],['ID','Indonesia'],['AU','Australia'],['MA','Morocco'],['TR','Turkey'],['HR','Croatia'],['SG','Singapore'],['CA','Canada'],['BR','Brazil'],['ES','Spain'],['DE','Germany'],['CH','Switzerland'],['NZ','New Zealand']];
  const COUNTRY_OPTIONS = (() => {
    const choices = typeof COUNTRIES !== 'undefined' && Array.isArray(COUNTRIES) ? COUNTRIES : FALLBACK_COUNTRIES;
    return choices.filter(item => Array.isArray(item) && /^[A-Z]{2}$/.test(item[0]) && typeof item[1]==='string')
      .map(([code,name])=>({code,name})).sort((a,b)=>a.name.localeCompare(b.name));
  })();
  const flag = code => /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map(c=>127397+c.charCodeAt(0))) : '';
  const icon = name => {
    const paths={
      close:'<path d="M18 6 6 18M6 6l12 12"/>',
      next:'<path d="m9 18 6-6-6-6"/>', prev:'<path d="m15 18-6-6 6-6"/>',
      plus:'<path d="M12 5v14M5 12h14"/>',
      check:'<path d="m5 12 4 4L19 6"/>',
      photo:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="m4 17 5-5 4 4 3-3 4 4"/>',
      upload:'<path d="M12 16V4m-5 5 5-5 5 5M4 17v3h16v-3"/>',
      back:'<path d="m15 18-6-6 6-6M9 12h11"/>',
      book:'<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14"/>',
      sticker:'<path d="M20 13V5a2 2 0 0 0-2-2H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h7z"/><path d="M20 13h-5a2 2 0 0 0-2 2v6"/>',
      trash:'<path d="M4 7h16M10 4h4M7 7l1 13h8l1-13"/>',
      edit:'<path d="m4 20 4-.8L19 8l-3-3L5 16l-1 4Z"/>',
      map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15"/>'
    };
    return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${paths[name]||''}</svg>`;
  };
  const imageOK = value => typeof value==='string' && value.length<1350000 && /^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(value);
  const newSpread = () => ({title:'Timeline',photos:Array(6).fill(null),captions:Array(6).fill(''),photoStickers:Array(6).fill(null),stickers:[]});
  const freshState = () => ({cover:'signature',scene:'random',customCover:null,spreads:[newSpread()]});
  const bounded = (v,min,max) => Math.max(min,Math.min(max,v));
  const cleanString = (v,max=55) => typeof v==='string' ? v.replace(/[\u0000-\u001f]/g,'').slice(0,max) : '';
  const looksLikeURL = text => /^(?:https?:\/\/|www\.|media\.|\/\/)/i.test(String(text||'').trim());
  const cleanCaption = text => looksLikeURL(text) ? '' : cleanString(text,55);
  const safeID = () => typeof crypto.randomUUID==='function' ? crypto.randomUUID() : `wg${Date.now().toString(36)}${Math.random().toString(36).slice(2,9)}`;
  // Public HTTPS animated-image URLs from ANY domain, not a fixed host allowlist.
  // A link is user-initiated and loaded by the browser only; local/private hosts,
  // embedded credentials, nonstandard ports and clearly nonimage URLs are denied.
  const safeGifURL = raw => {
    if(typeof raw!=='string' || raw.length>2048)return '';
    try{
      const u=new URL(raw.trim());const host=u.hostname.toLowerCase().replace(/\.$/,'');
      if(u.protocol!=='https:' || u.username || u.password || (u.port && u.port!=='443'))return '';
      if(!host.includes('.')||host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal')||host.endsWith('.test')||host.endsWith('.invalid'))return '';
      // IP literals and internal/private network targets are not image CDN domains.
      if(/^[\d.]+$/.test(host)||host.includes(':')||host.startsWith('['))return '';
      if(/\.(?:svg|html?|js|json|xml|pdf|exe|zip|php)(?:$|[;?#])/i.test(u.pathname))return '';
      if(/(?:^|[\r\n])(?:javascript|data|file):/i.test(raw))return '';
      u.hash='';return u.href;
    }catch{return '';}
  };
  // The remote host must actually serve a browser-renderable image before
  // a pasted link is inserted. CORS is not required for a normal <img> load.
  const verifyRemoteImage = url => new Promise((resolve,reject)=>{
    const img=new Image();let done=false;
    const finish=(ok)=>{if(done)return;done=true;clearTimeout(kill);img.onload=null;img.onerror=null;ok?resolve():reject(new Error('Image unavailable'));};
    const kill=window.setTimeout(()=>finish(false),9000);
    img.referrerPolicy='no-referrer';img.onload=()=>finish(true);img.onerror=()=>finish(false);img.src=url;
  });
  const safeSourceURL = raw => {
    if(typeof raw!=='string'||raw.length>600)return '';
    try{const u=new URL(raw);if(u.protocol!=='https:')return '';
      if(!['commons.wikimedia.org','giphy.com','www.giphy.com','tenor.com','www.tenor.com'].includes(u.hostname.toLowerCase()))return '';
      return u.href;
    }catch{return '';}
  };
  const safeFlagCode=raw=>typeof raw==='string' && /^[A-Z]{2}$/.test(raw)?raw:'';
  const FLAG_CODES='AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW'.split(' ');
  const flagTile=code=>{
    const index=FLAG_CODES.indexOf(code);
    if(index<0){const fallback=document.createElement('span');fallback.className='wg-album-real-flag-fallback';fallback.textContent=flag(code);return fallback;}
    const el=document.createElement('span');el.className='wg-album-real-flag';el.setAttribute('role','img');
    el.setAttribute('aria-label',`Flag of ${code}`);
    el.style.backgroundPosition=`${(index%16)*100/15}% ${Math.floor(index/16)*100/15}%`;
    return el;
  };
  const validSticker = raw => {
    if (!raw || typeof raw!=='object')return null;
    const type=['country','travel','animal','symbol','animated','gif'].includes(raw.type)?raw.type:null;
    if(!type)return null;
    const code=type==='country'?safeFlagCode(raw.code):'';
    const label=cleanString(raw.label,64);
    if(!label)return null;
    const mode=type==='country' && ['flag','name','both'].includes(raw.mode)?raw.mode:'both';
    // Existing flag-only stickers stay flag-only. New ones default to editable name.
    const displayName=type==='country' ? (typeof raw.displayName==='string'?cleanString(raw.displayName,52):(mode==='flag'?'':label)) : '';
    const symbol=['animal','symbol','animated'].includes(type)?cleanString(raw.symbol,8):'';
    const url=type==='gif'?safeGifURL(raw.url):'';
    if(type==='gif'&&!url)return null;
    const scale=Number(raw.scale);
    const rotation=Number(raw.rotation);
    return {id:cleanString(raw.id,65)||safeID(),type,code,label,mode,displayName,symbol,url,scale:Number.isFinite(scale)&&scale>0?bounded(scale,.5,2.5):1,rotation:Number.isFinite(rotation)?bounded(rotation,-180,180):0,
      source:type==='gif'?safeSourceURL(raw.source):'',credit:type==='gif'?cleanString(raw.credit,90):'',
      x:bounded(Number.isFinite(Number(raw.x))?Number(raw.x):20,0,100),y:bounded(Number.isFinite(Number(raw.y))?Number(raw.y):20,0,100)};
  };
  const checkedSpread = raw => {
    const stickers=(Array.isArray(raw?.stickers)?raw.stickers:[]).slice(0,MAX_STICKERS).map(validSticker).filter(Boolean);
    const positions=[[18,43],[41,52],[26,74],[63,39],[83,49],[71,75]];
    const captions=Array.from({length:6},(_,i)=>{
      const text=String(raw?.captions?.[i]||'');
      if(looksLikeURL(text)){
        // A GIF URL pasted into a photo caption is not a caption. Preserve any
        // complete, supported media URL as a user-controlled movable sticker.
        const url=safeGifURL(text.trim());
        if(url && stickers.length<MAX_STICKERS && !stickers.some(item=>item.type==='gif'&&item.url===url)){
          const [x,y]=positions[i];
          stickers.push(validSticker({id:safeID(),type:'gif',label:'Saved GIF',url,x,y,scale:.72}));
        }
        return '';
      }
      return cleanCaption(text);
    });
    return {
      title:cleanString(raw?.title,42)||'Timeline',
      photos:Array.from({length:6},(_,i)=>imageOK(raw?.photos?.[i])?raw.photos[i]:null),
      captions,
      photoStickers:Array.from({length:6},(_,i)=>{
        const entry=raw?.photoStickers?.[i];
        if(!entry || typeof entry!=='object')return null;
        const type=entry.type==='country'?'country':entry.type==='travel'?'travel':null;
        const code=type==='country'&&/^[A-Z]{2}$/.test(entry.code||'')?entry.code:'';
        const label=cleanString(entry.label,48);
        return type&&label?{type,code,label}:null;
      }),
      stickers:stickers.filter(Boolean)
    };
  };
  const checkedState = raw => {
    const base=freshState();
    if (!raw || typeof raw!=='object') return base;
    base.cover=COVER_CHOICES.some(x=>x.id===raw.cover)||raw.cover==='custom' ? raw.cover : 'signature';
    base.scene=SCENES.some(x=>x.id===raw.scene)||raw.scene==='random' ? raw.scene : 'random';
    base.customCover=imageOK(raw.customCover)?raw.customCover:null;
    if(base.cover==='custom' && !base.customCover)base.cover='signature';
    base.spreads=Array.isArray(raw.spreads)&&raw.spreads.length ? raw.spreads.slice(0,MAX_SPREADS).map(checkedSpread) : [newSpread()];
    return base;
  };
  const dialog=document.createElement('dialog');
  dialog.id='wgAlbumPage';dialog.className='wg-album-page';dialog.setAttribute('aria-labelledby','wgAlbumHeading');
  dialog.innerHTML=`
    <div class="wg-album-ambient" aria-hidden="true"></div><div class="wg-album-ambient-overlay" aria-hidden="true"></div>
    <div class="wg-album-scroll"><header class="wg-album-header">
      <div class="wg-album-brand"><span class="wg-album-kicker">WORLDS GALLERY / PERSONAL KEEPSAKE</span><span>Every picture has a world behind it.</span></div>
      <button type="button" class="wg-album-icon-button" id="wgAlbumClose" aria-label="Close My Album">${icon('close')}</button>
    </header><main class="wg-album-main">
      <section id="wgAlbumClosedView" class="wg-album-closed-view" aria-label="Closed My Album book">
        <h1 id="wgAlbumHeading" class="wg-album-sr-only">My Album</h1>
        <p class="wg-album-kicker2">THE STORIES YOU KEEP</p>
        <p class="wg-album-closed-subtitle">A little book for the places that stay with you.</p>
        <div class="wg-album-stage">
          <button type="button" class="wg-album-book" id="wgAlbumBook" aria-label="Open your travel scrapbook" title="Open my album">
            <img class="wg-album-reference" src="assets/photos/wg_album_reference.webp" alt="" draggable="false">
            <span class="wg-album-custom-face" aria-hidden="true"><span class="wg-album-spine"></span><span class="wg-album-front-image"></span><span class="wg-album-front-frame"><span class="wg-album-corner-top">&#10086;</span><span class="wg-album-front-title">My Album</span><span class="wg-album-compass">&#10022;</span><span class="wg-album-front-subtitle">A WORLD OF MEMORIES</span><span class="wg-album-corner-bottom">&#10086;</span></span><span class="wg-album-strap"><span>&#10021;</span></span></span>
          </button>
          <p class="wg-album-book-caption">A world of memories, bound together.</p>
          <div class="wg-album-actions"><button type="button" class="wg-album-secondary-button" id="wgAlbumCustomize">${icon('edit')} Customize cover</button></div>
        </div>
        <p class="wg-album-private">Private to this browser. Clearing browser data can erase your scrapbook, and others using the same browser may see it.</p>
      </section>
      <section id="wgAlbumOpenView" class="wg-album-open-view" aria-label="Travel scrapbook pages" hidden>
        <div class="wg-album-toolbar"><button type="button" id="wgAlbumBack" class="wg-album-text-button">${icon('back')} Close book</button><div class="wg-album-spread-label"><span>TRAVEL SCRAPBOOK</span><strong id="wgAlbumPageNumber">Spread 1 / 1</strong></div></div>
        <div class="wg-album-spread-shell" id="wgAlbumSpreadShell">
          <button type="button" class="wg-album-page-arrow wg-album-page-arrow-prev" id="wgAlbumPrev" aria-label="Previous scrapbook spread" title="Previous pages">${icon('prev')}</button>
          <div class="wg-album-spread-frame" id="wgAlbumSpreadFrame"><div class="wg-album-paper-book" id="wgAlbumPaperBook">
            <section class="wg-album-leaf wg-album-leaf-left" aria-label="Left scrapbook page"><div class="wg-album-paper-art" aria-hidden="true"></div><div class="wg-album-left-heading"><span>THE JOURNEY SO FAR</span><h2 id="wgAlbumSpreadTitle">Timeline</h2></div><div id="wgAlbumSlotsLeft" class="wg-album-polaroid-layout"></div><div class="wg-album-stamp-mark" aria-hidden="true">EXPLORE <span>THE WORLD</span></div></section>
            <div class="wg-album-rings" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
            <section class="wg-album-leaf wg-album-leaf-right" aria-label="Right scrapbook page"><div class="wg-album-paper-art" aria-hidden="true"></div><div class="wg-album-right-note">Collect moments,<br>not things.</div><div id="wgAlbumSlotsRight" class="wg-album-polaroid-layout"></div><div class="wg-album-compass-mark" aria-hidden="true">&#10022;</div>
              <div class="wg-album-page-manage"><button type="button" id="wgAlbumDeleteSpread" title="Delete these two pages" aria-label="Delete current scrapbook pages">${icon('trash')}<span>Delete pages</span></button><button type="button" id="wgAlbumAddSpread" title="Add two more pages">${icon('plus')}<span>Add pages</span></button></div>
            </section>
            <div id="wgAlbumStickers" class="wg-album-sticker-layer" aria-label="Placed page stickers"></div>
          </div></div>
          <button type="button" class="wg-album-page-arrow wg-album-page-arrow-next" id="wgAlbumNext" aria-label="Next scrapbook spread" title="Next pages">${icon('next')}</button>
        </div>
        <div class="wg-album-page-controls"><span id="wgAlbumPageCount" aria-live="polite">1 / 1</span></div>
        <div class="wg-album-editor-tools"><button type="button" id="wgAlbumStickerPicker">${icon('sticker')} Stickers &amp; GIFs</button></div>
        <div class="wg-album-editor-note">Tap a photo frame to add or replace it. Decorate the spread from one sticker picker. Pages remain private to this browser.</div>
      </section>
      <p id="wgAlbumMessage" class="wg-album-message" role="status" aria-live="polite"></p>
    </main></div>
    <div id="wgAlbumFlipTheatre" class="wg-album-flip-theatre" aria-hidden="true"><div class="wg-album-anim-book"><div class="wg-album-anim-back"></div><div class="wg-album-anim-leaf leaf-a"></div><div class="wg-album-anim-leaf leaf-b"></div><div class="wg-album-anim-leaf leaf-c"></div><div class="wg-album-anim-leaf leaf-d"></div><div class="wg-album-anim-leaf leaf-e"></div><div class="wg-album-anim-leaf leaf-f"></div><div class="wg-album-anim-front"></div></div></div>
    <input type="file" id="wgAlbumImagePicker" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden aria-label="Select photos">
  `;
  document.body.appendChild(dialog);
  const $=id=>dialog.querySelector(`#${id}`);
  const ambient=dialog.querySelector('.wg-album-ambient');
  const book=$('wgAlbumBook');
  const picker=$('wgAlbumImagePicker');
  let data=freshState(),active=0,selectedSticker=null,currentScope=null,editing=false,processing=false;
  let lastScene=null,activeScene=null,uploadTarget=null,previousFocus=null,animationToken=0;
  let filePickerPending=false, filePickerDismissedAt=-Infinity;
  let coverDraft=null,coverReturnFocus=null,stickerReturnFocus=null,stickerTarget='page',flipBusy=false,flipTimer=null;
  const notice=text=>{$('wgAlbumMessage').textContent=text||'';};
  function load(){
    currentScope=scope();let raw=null;
    try{raw=JSON.parse(localStorage.getItem(KEY(currentScope))||'null');}catch{}
    if(!raw){
      try{
        const previous=JSON.parse(localStorage.getItem(OLD_KEY(currentScope))||'null');
        if(previous && typeof previous==='object'){
          const spread=newSpread();
          for(let i=0;i<3;i++)if(imageOK(previous.memories?.[i]))spread.photos[i]=previous.memories[i];
          raw={cover:previous.cover,scene:previous.scene,customCover:previous.customCover,spreads:[spread]};
        }
      }catch{}
    }
    data=checkedState(raw);active=0;selectedSticker=null;
  }
  function persist(){
    if(currentScope!==scope()) {notice('Your account changed. Reopen the album to use the correct private scrapbook.');return false;}
    try{localStorage.setItem(KEY(currentScope),JSON.stringify(data));return true;}
    catch(e){notice('Browser storage is full or blocked. The change is not saved. Remove an image or free browser storage.');return false;}
  }
  function sceneForOpen(scene){
    if(scene!=='random')return scene;
    const choices=SCENES.map(x=>x.id).filter(id=>id!==lastScene);
    const result=choices[Math.floor(Math.random()*choices.length)];lastScene=result;return result;
  }
  function displayScene(scene=activeScene){
    const item=SCENES.find(x=>x.id===scene)||SCENES[0];
    ambient.style.backgroundImage=`linear-gradient(140deg,rgba(9,21,26,.66),rgba(32,20,46,.14) 52%,rgba(13,31,24,.65)),url("${item.image}")`;
  }
  function coverURL(state=data){
    return state.cover==='custom'&&state.customCover?state.customCover:(COVER_CHOICES.find(x=>x.id===state.cover)||COVER_CHOICES[0]).image;
  }
  function renderCover(state=data){
    const signature=state.cover==='signature';
    book.classList.toggle('wg-album-signature',signature);
    book.classList.toggle('wg-album-other-cover',!signature);
    const face=dialog.querySelector('.wg-album-front-image');
    face.style.backgroundImage=signature?'':`linear-gradient(180deg,rgba(13,18,29,.05),rgba(14,19,26,.4)),url("${coverURL(state)}")`;
    $('wgAlbumFlipTheatre').style.setProperty('--album-cover',`url("${coverURL(state)}")`);
  }
  const THEATRE_MS=1650; // one-second shuffle + ~650ms centered morph
  const OPEN_SPREAD_AT_MS=1170;
  const CLOSE_COVER_AT_MS=1520;
  function syncTheatreGeometry(){
    // Both the original cover and final spread are measured in viewport space.
    // The animation uses their *centres*, never a spine-based x-offset.
    const closed=$('wgAlbumClosedView'),opened=$('wgAlbumOpenView');
    const wasClosed=closed.hidden,wasOpen=opened.hidden;
    const oldVisibility=opened.style.visibility;
    // Measure each view ALONE. Measuring both together pushes the spread below
    // the closed book and produces the infamous off-screen zoom jump.
    closed.hidden=false;opened.hidden=true;
    const cover=book.getBoundingClientRect();
    closed.hidden=true;opened.hidden=false;opened.style.visibility='hidden';
    const target=$('wgAlbumPaperBook').getBoundingClientRect();
    const viewport=$('wgAlbumSpreadFrame').getBoundingClientRect();
    opened.style.visibility=oldVisibility;opened.hidden=wasOpen;closed.hidden=wasClosed;
    if(cover.width<70 || target.width<100)return;
    const anim=dialog.querySelector('.wg-album-anim-book');
    const coverX=cover.left+cover.width/2-window.innerWidth/2;
    const coverY=cover.top+cover.height/2-window.innerHeight/2;
    // On narrow touch screens the paper is wider than the visible scroll area.
    // Morph into the VISIBLE first page, not the off-screen centre of both pages.
    const clipped=target.width>viewport.width+2;
    const visibleWidth=clipped?Math.max(1,viewport.width-14):target.width;
    const spreadX=(clipped?viewport.left+viewport.width/2:target.left+target.width/2)-window.innerWidth/2;
    const spreadY=target.top+target.height/2-window.innerHeight/2;
    anim.style.setProperty('--wg-closed-w',`${cover.width}px`);
    anim.style.setProperty('--wg-closed-h',`${cover.height}px`);
    anim.style.setProperty('--wg-center-cover-x',`${coverX.toFixed(2)}px`);
    anim.style.setProperty('--wg-center-cover-y',`${coverY.toFixed(2)}px`);
    anim.style.setProperty('--wg-center-spread-x',`${spreadX.toFixed(2)}px`);
    anim.style.setProperty('--wg-center-spread-y',`${spreadY.toFixed(2)}px`);
    anim.style.setProperty('--wg-center-expand-x',(visibleWidth/cover.width).toFixed(4));
    anim.style.setProperty('--wg-center-expand-y',(target.height/cover.height).toFixed(4));
  }
  function hardClose(){
    animationToken++;editing=false;clearFlip();filePickerPending=false;uploadTarget=null;
    dialog.classList.remove('wg-album-opening','wg-album-closing','wg-album-reveal');
    if(coverDialog.open)coverDialog.close();if(stickerDialog.open)stickerDialog.close();
    if(dialog.open)dialog.close();
  }
  function isPagesVisible(){return dialog.open&&!$('wgAlbumOpenView').hidden;}
  function animateClose(exit=false){
    if(!dialog.open)return;
    // A close request during a page turn should still use the reverse book
    // animation, not abruptly jump back to the cover.
    if(flipBusy){clearFlip();renderSpread();}
    if(reduceMotion()||!isPagesVisible()){
      if(exit){hardClose();return;}
      animationToken++;editing=false;clearFlip();dialog.classList.remove('wg-album-opening','wg-album-closing','wg-album-reveal');
      $('wgAlbumOpenView').hidden=true;$('wgAlbumClosedView').hidden=false;return;
    }
    if(editing)return;
    editing=true;const token=++animationToken;notice('');
    syncTheatreGeometry();
    dialog.classList.remove('wg-album-opening','wg-album-reveal');
    dialog.classList.add('wg-album-closing');
    window.setTimeout(()=>{
      if(token!==animationToken||!dialog.open)return;
      $('wgAlbumOpenView').hidden=true;$('wgAlbumClosedView').hidden=false;
    },CLOSE_COVER_AT_MS);
    window.setTimeout(()=>{
      if(token!==animationToken||!dialog.open)return;
      dialog.classList.remove('wg-album-closing');editing=false;
      if(exit){hardClose();return;}
      dialog.querySelector('.wg-album-scroll').scrollTop=0;
      $('wgAlbumBook').focus({preventScroll:true});
    },THEATRE_MS);
  }
  function close(){
    // Explicit Close Book/X remains responsive after the file chooser returns;
    // only an actual still-open native picker may suppress the close action.
    if(filePickerPending)return;
    if(editing || !isPagesVisible()){hardClose();return;}
    animateClose(true);
  }
  function open(){
    if(dialog.open)return;
    load();activeScene=sceneForOpen(data.scene);displayScene();renderCover();notice('');
    previousFocus=document.activeElement;
    $('wgAlbumClosedView').hidden=false;$('wgAlbumOpenView').hidden=true;
    if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');
    $('wgAlbumClose').focus({preventScroll:true});
  }
  function showCover(){animateClose(false);}
  const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function centerBookOnNarrowScreens(){
    // Open at the actual FIRST page on phones; users can pan right to page two.
    // The previous centered state clipped both pages simultaneously.
    const frame=$('wgAlbumSpreadFrame');
    if(window.innerWidth<=800 && frame?.scrollWidth>frame?.clientWidth){
      frame.scrollLeft=0;
    }
  }
  function animateOpen(){
    if(editing || processing || flipBusy)return;
    editing=true;const token=++animationToken;notice('');
    if(reduceMotion()){
      $('wgAlbumClosedView').hidden=true;$('wgAlbumOpenView').hidden=false;
      dialog.classList.remove('wg-album-opening','wg-album-closing');
      editing=false;renderSpread();centerBookOnNarrowScreens();$('wgAlbumNext').focus({preventScroll:true});return;
    }
    syncTheatreGeometry();
    dialog.classList.remove('wg-album-closing');dialog.classList.add('wg-album-opening');
    // One-second right-to-left page shuffle, then a continuous unfold/zoom into the first spread.
    window.setTimeout(()=>{
      if(token!==animationToken||!dialog.open)return;
      $('wgAlbumClosedView').hidden=true;$('wgAlbumOpenView').hidden=false;
      renderSpread();centerBookOnNarrowScreens();dialog.classList.add('wg-album-reveal');
      dialog.querySelector('.wg-album-scroll').scrollTop=0;
    },OPEN_SPREAD_AT_MS);
    window.setTimeout(()=>{
      if(token!==animationToken||!dialog.open)return;
      dialog.classList.remove('wg-album-opening','wg-album-reveal');
      editing=false;$('wgAlbumNext').focus({preventScroll:true});
    },THEATRE_MS);
  }
  function pick(target){
    if(processing || editing || filePickerPending)return;
    uploadTarget=target;
    const input=target.type==='cover'?c$('wgAlbumCoverFilePicker'):picker;
    input.value='';input.multiple=target.type==='batch';
    filePickerPending=true;
    try {input.click();}
    catch (e) {filePickerPending=false;uploadTarget=null;notice('Could not open the device gallery. Try again.');}
  }
  function finishFilePicker(cancelled=false){
    filePickerPending=false;filePickerDismissedAt=performance.now();
    if(cancelled)uploadTarget=null;
  }
  // Chromium dispatches 'cancel' when the operating-system picker is dismissed
  // with X/Escape. That MUST NOT dismiss the surrounding scrapbook dialog.
  picker.addEventListener('cancel',()=>finishFilePicker(true));
  async function shrinkToWebp(file,kind='photo'){
    if(!file||!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type))throw Error('Choose a JPG, PNG, WebP or AVIF image.');
    if(file.size>9*1024*1024)throw Error('Choose photos smaller than 9 MB each.');
    let source;
    try{source=await createImageBitmap(file,{imageOrientation:'from-image'});}catch{throw Error('Could not decode that image. Try JPG, PNG or WebP.');}
    try{
      if(source.width<1||source.height<1||source.width>18000||source.height>18000)throw Error('Photo dimensions are unsupported.');
      const size=kind==='cover'?900:680;
      const ratio=Math.min(1,size/Math.max(source.width,source.height));
      const canvas=document.createElement('canvas');canvas.width=Math.round(source.width*ratio);canvas.height=Math.round(source.height*ratio);
      const ctx=canvas.getContext('2d');if(!ctx)throw Error('Your browser cannot prepare this photo.');
      ctx.imageSmoothingQuality='high';ctx.drawImage(source,0,0,canvas.width,canvas.height);
      const blob=await new Promise((yes,no)=>canvas.toBlob(result=>result?yes(result):no(Error('Could not compress this photo.')),'image/webp',kind==='cover'?.75:.64));
      if(blob.type!=='image/webp')throw Error('WebP is not supported in this browser.');
      const result=await new Promise((yes,no)=>{const r=new FileReader();r.onerror=()=>no(Error('Could not read compressed photo.'));r.onload=()=>yes(String(r.result));r.readAsDataURL(blob);});
      if(!imageOK(result))throw Error('This photo remains too large for private browser storage.');
      return result;
    }finally{source.close?.();}
  }
  function locateFreePhoto(){
    for(let p=active;p<data.spreads.length;p++)for(let s=0;s<6;s++)if(!data.spreads[p].photos[s])return [p,s];
    if(data.spreads.length<MAX_SPREADS){data.spreads.push(newSpread());return [data.spreads.length-1,0];}
    return null;
  }
  async function processSelectedImages(input){
    const files=[...(input.files||[])],target=uploadTarget;
    finishFilePicker(!files.length);uploadTarget=null;
    if(!files.length||!target)return;
    processing=true;notice('Preparing photos privately in your browser...');
    try{
      const batch=target.type==='batch'?files.slice(0,30):files.slice(0,1);
      let added=0;
      for(const file of batch){
        const value=await shrinkToWebp(file,target.type==='cover'?'cover':'photo');
        if(currentScope!==scope())throw Error('Account changed while editing. Reopen the album.');
        if(target.type==='cover'){
          if(!coverDraft)throw Error('Cover editor is no longer open.');
          coverDraft.cover='custom';coverDraft.customCover=value;
          renderCoverOptions();
          notice('Custom cover preview ready. Choose Confirm to save.');
        }else{
          const spot=target.type==='slot'&&added===0?[active,target.slot]:locateFreePhoto();
          if(!spot)break;
          data.spreads[spot[0]].photos[spot[1]]=value;added++;
        }
      }
      if(target.type!=='cover'){
        if(!persist())return;
        renderSpread();notice(added?`${added} photo${added===1?'':'s'} added to your private scrapbook.`:'Your album has reached the 12-spread limit.');
      }
    }catch(e){notice(e?.message||'Could not add the photo.');}
    finally{processing=false;input.value='';}
  }
  picker.addEventListener('change',()=>processSelectedImages(picker));
  function photoSlot(slot){
    const spread=data.spreads[active];const src=spread.photos[slot];
    const frame=document.createElement('div');frame.className=`wg-album-polaroid wg-album-polaroid-${slot%3+1}`;
    const photo=document.createElement('button');photo.type='button';photo.className='wg-album-photo';
    photo.setAttribute('aria-label',src?`Replace photo ${slot+1}`:`Add photo ${slot+1}`);
    if(src){const img=document.createElement('img');img.src=src;img.alt=`Scrapbook photo ${slot+1}`;img.loading='lazy';photo.append(img);}
    else{const empty=document.createElement('span');empty.className='wg-album-photo-empty';empty.innerHTML=`${icon('photo')}<span>ADD PHOTO</span>`;photo.append(empty);}
    photo.addEventListener('click',()=>pick({type:'slot',slot}));
    const caption=document.createElement('input');caption.type='text';caption.maxLength=55;caption.className='wg-album-photo-caption';
    caption.placeholder='A place to remember';caption.value=spread.captions[slot]||'';caption.setAttribute('aria-label',`Caption for photo ${slot+1}`);
    const acceptCaption=raw=>{
      if(looksLikeURL(raw)){
        const url=safeGifURL(String(raw).trim());
        if(url && spread.stickers.length<MAX_STICKERS){
          const positions=[[18,43],[41,52],[26,74],[63,39],[83,49],[71,75]];
          const [x,y]=positions[slot];
          spread.stickers.push(validSticker({id:safeID(),type:'gif',label:'Personal GIF',url,x,y,scale:.72}));
          notice('GIF added as a movable sticker. Click it to resize or drag it.');
        }else{
          notice(url?'This spread has reached its sticker limit.':'GIF links do not belong in photo captions. Use Stickers & GIFs to add one.');
        }
        spread.captions[slot]='';caption.value='';persist();renderSpread();return;
      }
      spread.captions[slot]=cleanCaption(raw);caption.value=spread.captions[slot];persist();
    };
    caption.addEventListener('change',()=>acceptCaption(caption.value));
    caption.addEventListener('paste',event=>{
      const pasted=event.clipboardData?.getData('text/plain')?.trim();
      if(pasted && looksLikeURL(pasted)){event.preventDefault();acceptCaption(pasted);}
    });
    frame.append(photo,caption);
    const legacy=spread.photoStickers?.[slot];
    if(legacy){
      const oldChip=document.createElement('span');oldChip.className='wg-album-legacy-photo-sticker';
      if(legacy.type==='country'&&legacy.code)oldChip.append(flagTile(legacy.code));
      oldChip.append(document.createTextNode(legacy.label));frame.append(oldChip);
    }
    if(src){const rm=document.createElement('button');rm.type='button';rm.className='wg-album-photo-remove';rm.title=`Remove photo ${slot+1}`;rm.setAttribute('aria-label',`Remove photo ${slot+1}`);rm.innerHTML=icon('close');rm.addEventListener('click',()=>{spread.photos[slot]=null;spread.captions[slot]='';persist();renderSpread();notice('Photo removed from this page.');});frame.append(rm);}
    return frame;
  }
  function renderSpread(){
    const spread=data.spreads[active]||data.spreads[0];if(!spread)return;
    $('wgAlbumPageNumber').textContent=`Spread ${active+1} / ${data.spreads.length}`;
    $('wgAlbumPageCount').textContent=`${active+1} / ${data.spreads.length}`;
    $('wgAlbumPrev').disabled=flipBusy||active===0;
    $('wgAlbumNext').disabled=flipBusy||active>=data.spreads.length-1;
    $('wgAlbumDeleteSpread').disabled=flipBusy||data.spreads.length===1;
    $('wgAlbumAddSpread').disabled=flipBusy||data.spreads.length>=MAX_SPREADS;
    $('wgAlbumSpreadTitle').textContent=spread.title||'Timeline';
    const left=$('wgAlbumSlotsLeft'),right=$('wgAlbumSlotsRight');left.replaceChildren();right.replaceChildren();
    for(let i=0;i<6;i++)(i<3?left:right).append(photoSlot(i));
    renderStickers();
  }
  // Stable page transitions: the LIVE spread remains untransformed. A separate
  // decorative sheet turns above it; actual photos/stickers/captions switch only
  // at the paper's edge-on midpoint. Never rotate cloned typography or images.
  function clearFlip(){
    if(flipTimer!==null){clearTimeout(flipTimer);flipTimer=null;}
    const book=$('wgAlbumPaperBook');
    book?.querySelectorAll('.wg-album-flip-sheet,.wg-album-flip-oldstatic').forEach(el=>el.remove());
    book?.classList.remove('wg-album-turning','wg-album-turn-next','wg-album-turn-prev');
    flipBusy=false;
  }
  function moveSpread(next){
    if(flipBusy || editing || processing)return;
    const goal=bounded(next,0,data.spreads.length-1);if(goal===active)return;
    const paper=$('wgAlbumPaperBook');
    selectedSticker=null;
    if(reduceMotion()){active=goal;renderSpread();centerBookOnNarrowScreens();return;}
    const forward=goal>active;
    flipBusy=true;
    const sheet=document.createElement('div');
    sheet.className=`wg-album-flip-sheet ${forward?'turn-next':'turn-prev'}`;
    sheet.setAttribute('aria-hidden','true');
    const front=document.createElement('div');front.className='wg-album-flip-face wg-album-flip-front';
    const back=document.createElement('div');back.className='wg-album-flip-face wg-album-flip-back';
    sheet.append(front,back);paper.append(sheet);
    paper.classList.add('wg-album-turning',forward?'wg-album-turn-next':'wg-album-turn-prev');
    // Switch only after the sheet masks the centre; content on either side is
    // always rendered at its final native CSS size (no transient scaling).
    flipTimer=setTimeout(()=>{
      flipTimer=null;
      active=goal;
      renderSpread();
      centerBookOnNarrowScreens();
      flipTimer=setTimeout(()=>{flipTimer=null;clearFlip();renderSpread();},370);
    },320);
  }
  function stickerLabel(item){
    if(item.type==='country')return `${flag(item.code)} ${item.displayName||''}`.trim();
    return item.type==='gif'?'Animated GIF':(['animal','symbol','animated'].includes(item.type)?(item.symbol||item.label):item.label);
  }
  function appendStickerPreview(el,item){
    if(item.type==='country'){
      if(item.code){
        const image=flagTile(item.code);image.classList.add('wg-album-placed-flag');
        image.setAttribute('aria-label',`Flag of ${item.label}`);el.append(image);
      }
      if(item.displayName){const name=document.createElement('span');name.className='wg-album-country-caption';name.textContent=item.displayName;el.append(name);}
    }else if(item.type==='gif'){
      const image=document.createElement('img');image.className='wg-album-placed-gif';image.src=item.url;image.alt=item.label||'Animated GIF';
      image.loading='lazy';image.referrerPolicy='no-referrer';image.onerror=()=>image.replaceWith(document.createTextNode('GIF unavailable'));
      el.append(image);
    }else if(['animal','symbol','animated'].includes(item.type)){
      const sym=document.createElement('span');sym.className='wg-album-symbol-content';sym.textContent=item.symbol||item.label;el.append(sym);
    }else{el.textContent=item.label;}
  }
  // Country names are optional, editable and stored with the sticker. A blank
  // name leaves the flag only, without needing separate modes in the picker.
  const countryNameDialog=document.createElement('dialog');
  countryNameDialog.id='wgAlbumCountryNameModal';countryNameDialog.className='wg-album-chooser wg-album-name-chooser';
  countryNameDialog.innerHTML=`<form method="dialog" class="wg-album-name-form"><div class="wg-album-chooser-head"><div><span>EDIT COUNTRY STICKER</span><h2>Edit flag label</h2><p>Clear the name if you want a flag-only sticker.</p></div><button type="button" class="wg-album-chooser-x" data-wg-country-cancel aria-label="Close without saving">${icon('close')}</button></div><label for="wgAlbumCountryNameInput">Country label</label><input id="wgAlbumCountryNameInput" type="text" maxlength="52" autocomplete="off"><div class="wg-album-chooser-actions"><button type="button" class="wg-album-cancel" data-wg-country-clear>Remove name</button><button type="submit" class="wg-album-confirm">Save label</button></div></form>`;
  document.body.appendChild(countryNameDialog);
  let editingCountry=null;
  const countryNameInput=countryNameDialog.querySelector('#wgAlbumCountryNameInput');
  function editCountryName(item){
    editingCountry=item;countryNameInput.value=item.displayName||'';countryNameDialog.showModal();countryNameInput.focus();countryNameInput.select();
  }
  countryNameDialog.querySelector('[data-wg-country-cancel]').addEventListener('click',()=>countryNameDialog.close());
  countryNameDialog.querySelector('[data-wg-country-clear]').addEventListener('click',()=>{countryNameInput.value='';countryNameInput.focus();});
  countryNameDialog.querySelector('form').addEventListener('submit',event=>{
    event.preventDefault();
    if(editingCountry && currentScope===scope()){
      editingCountry.displayName=cleanString(countryNameInput.value.trim(),52);
      editingCountry.mode='both';persist();renderStickers();notice(editingCountry.displayName?'Country label updated.':'Flag-only sticker saved.');
    }
    countryNameDialog.close();
  });
  countryNameDialog.addEventListener('close',()=>{editingCountry=null;});
  // Item controls appear only on explicit selection. Page click deselects.
  // Drag body to move, lower-right handle to resize, lower-left to rotate.
  function renderStickers(){
    const layer=$('wgAlbumStickers');layer.replaceChildren();
    const spread=data.spreads[active];
    function updateSelection(){
      layer.querySelectorAll('.wg-album-sticker').forEach(st=>
        st.setAttribute('aria-pressed',String(st.dataset.id===selectedSticker)));
    }
    for(const item of spread.stickers){
      const el=document.createElement('div');el.className='wg-album-sticker';
      el.style.left=`${item.x}%`;el.style.top=`${item.y}%`;
      el.style.setProperty('--wg-sticker-scale',String(item.scale||1));
      el.style.setProperty('--wg-sticker-rotation',`${item.rotation||0}deg`);
      el.classList.add(`wg-album-sticker-${item.type}`);
      el.dataset.id=item.id;el.setAttribute('role','group');
      el.setAttribute('aria-label',`${item.label} sticker. Select to rotate or resize. Use arrow keys to move.`);
      el.setAttribute('aria-pressed',String(item.id===selectedSticker));el.tabIndex=0;
      el.title=(item.type==='gif'&&item.credit?`${item.credit}. `:'')+'Select to edit. Drag to move. Delete to remove.';
      appendStickerPreview(el,item);
      const resize=document.createElement('span');resize.className='wg-album-sticker-resize';
      resize.setAttribute('role','slider');resize.tabIndex=-1;
      resize.setAttribute('aria-label',`Resize ${item.label}`);resize.setAttribute('aria-valuemin','50');resize.setAttribute('aria-valuemax','250');
      resize.textContent='⤢';resize.title='Resize sticker';
      const rotate=document.createElement('span');rotate.className='wg-album-sticker-rotate';
      rotate.setAttribute('role','slider');rotate.tabIndex=-1;
      rotate.setAttribute('aria-label',`Rotate ${item.label}`);rotate.setAttribute('aria-valuemin','-180');rotate.setAttribute('aria-valuemax','180');
      rotate.textContent='⟳';rotate.title='Rotate sticker';
      const remove=document.createElement('button');
      remove.type='button';remove.className='wg-album-sticker-remove';
      remove.setAttribute('aria-label',`Remove ${item.label} sticker`);
      remove.title='Remove this sticker';remove.innerHTML=icon('close');remove.tabIndex=-1;
      const editName=document.createElement('button');editName.type='button';
      editName.className='wg-album-sticker-edit';editName.title='Edit country label';editName.tabIndex=-1;
      editName.setAttribute('aria-label',`Edit label for ${item.label}`);editName.innerHTML=icon('edit');
      if(item.type==='country')el.append(editName);
      el.append(resize,rotate,remove);
      editName.addEventListener('pointerdown',event=>event.stopPropagation());
      editName.addEventListener('click',event=>{event.stopPropagation();editCountryName(item);});
      function reflect(){
        el.style.setProperty('--wg-sticker-scale',String(item.scale||1));
        el.style.setProperty('--wg-sticker-rotation',`${item.rotation||0}deg`);
        resize.setAttribute('aria-valuenow',String(Math.round((item.scale||1)*100)));
        rotate.setAttribute('aria-valuenow',String(Math.round(item.rotation||0)));
      }
      function select(){selectedSticker=item.id;updateSelection();layer.querySelectorAll('.wg-album-sticker-resize,.wg-album-sticker-rotate,.wg-album-sticker-remove,.wg-album-sticker-edit').forEach(handle=>{handle.tabIndex=handle.closest('.wg-album-sticker')?.dataset.id===item.id?0:-1;});}
      function removeSticker(){
        spread.stickers=spread.stickers.filter(st=>st.id!==item.id);
        selectedSticker=null;persist();renderStickers();notice('Sticker removed.');
      }
      remove.addEventListener('pointerdown',e=>e.stopPropagation());
      remove.addEventListener('click',e=>{e.stopPropagation();removeSticker();});
      function place(x,y){
        const bounds=layer.getBoundingClientRect();
        const halfW=(el.offsetWidth*(item.scale||1)/Math.max(1,bounds.width))*50;
        const halfH=(el.offsetHeight*(item.scale||1)/Math.max(1,bounds.height))*50;
        item.x=bounded(x,Math.min(49,Math.max(1,halfW)),Math.max(51,100-halfW));
        item.y=bounded(y,Math.min(49,Math.max(1,halfH)),Math.max(51,100-halfH));
        el.style.left=`${item.x}%`;el.style.top=`${item.y}%`;
      }
      function setScale(scale){item.scale=bounded(Number(scale)||1,.5,2.5);reflect();place(item.x,item.y);}
      function setRotation(deg){item.rotation=bounded(Math.round(Number(deg)||0),-180,180);reflect();}
      function pointerAction(target,mode){
        target.addEventListener('pointerdown',e=>{
          if(e.button!==0 || flipBusy || editing)return;
          e.preventDefault();e.stopPropagation();select();target.setPointerCapture?.(e.pointerId);
          const bounds=layer.getBoundingClientRect();
          const cx=el.getBoundingClientRect().left+el.getBoundingClientRect().width/2;
          const cy=el.getBoundingClientRect().top+el.getBoundingClientRect().height/2;
          const angle0=Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI;
          const initial={x:e.clientX,y:e.clientY,px:item.x,py:item.y,scale:item.scale||1,rotation:item.rotation||0};
          const move=event=>{
            if(event.pointerId!==e.pointerId)return;
            if(mode==='resize')setScale(initial.scale+((event.clientX-initial.x)+(event.clientY-initial.y))/165);
            else if(mode==='rotate'){
              const angle1=Math.atan2(event.clientY-cy,event.clientX-cx)*180/Math.PI;
              let delta=angle1-angle0;
              // Normalize the -180/180 boundary so a small clockwise turn
              // cannot suddenly flip the sticker all the way around.
              if(delta>180)delta-=360;
              if(delta< -180)delta+=360;
              setRotation(initial.rotation+delta);
            }else place(initial.px+(event.clientX-initial.x)*100/Math.max(1,bounds.width),initial.py+(event.clientY-initial.y)*100/Math.max(1,bounds.height));
          };
          const end=event=>{
            if(event.pointerId!==e.pointerId)return;
            target.removeEventListener('pointermove',move);target.removeEventListener('pointerup',end);target.removeEventListener('pointercancel',end);
            persist();
          };
          target.addEventListener('pointermove',move);target.addEventListener('pointerup',end);target.addEventListener('pointercancel',end);
        });
      }
      pointerAction(el,'move');pointerAction(resize,'resize');pointerAction(rotate,'rotate');
      el.addEventListener('click',e=>{if(e.target===resize||e.target===rotate||e.target.closest('.wg-album-sticker-remove')||e.target.closest('.wg-album-sticker-edit'))return;select();});
      el.addEventListener('keydown',e=>{
        if(e.target!==el)return;
        const movement={ArrowLeft:[-2,0],ArrowRight:[2,0],ArrowUp:[0,-2],ArrowDown:[0,2]}[e.key];
        if(movement){e.preventDefault();select();
          if(e.shiftKey)setScale((item.scale||1)+(movement[0]||-movement[1])*.05);
          else place(item.x+movement[0],item.y+movement[1]);persist();
        }
        if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}
        if(e.key==='Escape'){e.preventDefault();selectedSticker=null;updateSelection();}
        if(e.key==='Delete'||e.key==='Backspace'){
          e.preventDefault();removeSticker();
        }
      });
      resize.addEventListener('keydown',e=>{
        const delta={ArrowRight:.1,ArrowUp:.1,ArrowLeft:-.1,ArrowDown:-.1,Home:-20,End:20}[e.key];
        if(delta===undefined)return;
        e.stopPropagation();e.preventDefault();select();
        setScale(e.key==='Home'?.5:e.key==='End'?2.5:(item.scale||1)+delta);persist();
      });
      rotate.addEventListener('keydown',e=>{
        const delta={ArrowRight:5,ArrowUp:5,ArrowLeft:-5,ArrowDown:-5}[e.key];
        if(delta===undefined&&e.key!=='Home')return;
        e.preventDefault();e.stopPropagation();select();setRotation(e.key==='Home'?0:(item.rotation||0)+delta*(e.shiftKey?3:1));persist();
      });
      reflect();layer.append(el);
    }
  }
  $('wgAlbumPaperBook').addEventListener('pointerdown',event=>{
    if(event.target.closest('.wg-album-sticker'))return;
    selectedSticker=null;
    const layer=$('wgAlbumStickers');
    layer.querySelectorAll('.wg-album-sticker').forEach(el=>el.setAttribute('aria-pressed','false'));
    layer.querySelectorAll('.wg-album-sticker-resize,.wg-album-sticker-rotate,.wg-album-sticker-remove,.wg-album-sticker-edit').forEach(el=>el.tabIndex=-1);
  });
  // Cover edit is a separate modal. Choices remain drafts until Confirm.
  const coverDialog=document.createElement('dialog');coverDialog.id='wgAlbumCoverModal';coverDialog.className='wg-album-chooser';
  coverDialog.innerHTML=`<div class="wg-album-chooser-head"><div><span>CUSTOMIZE MY ALBUM</span><h2>Choose your cover</h2><p>Pick a travel scene or choose your own photo.</p></div><button type="button" class="wg-album-chooser-x" aria-label="Close without saving" data-cover-cancel>${icon('close')}</button></div>
    <div class="wg-album-chooser-scroll"><h3>Book covers</h3><div id="wgAlbumCoverChoices" class="wg-album-picker"></div><button type="button" id="wgAlbumUploadCover" class="wg-album-upload-cover">${icon('upload')} Upload my own cover</button>
    <h3>Background scenery</h3><div id="wgAlbumSceneChoices" class="wg-album-picker"></div><p>Surprise me selects a different static scenic background when you open the album.</p></div>
    <div class="wg-album-chooser-actions"><button type="button" class="wg-album-cancel" data-cover-cancel>Cancel</button><button type="button" class="wg-album-confirm" id="wgAlbumCoverConfirm">${icon('check')} Confirm</button></div><input type="file" id="wgAlbumCoverFilePicker" accept="image/jpeg,image/png,image/webp,image/avif" hidden>`;
  document.body.appendChild(coverDialog);
  const c$=id=>coverDialog.querySelector(`#${id}`);
  function coverChoice(item,kind){
    const button=document.createElement('button');button.type='button';button.className='wg-album-option';
    button.setAttribute('aria-pressed',String((kind==='cover'?coverDraft.cover:coverDraft.scene)===item.id));
    const thumb=document.createElement('span');thumb.className='wg-album-option-photo';thumb.style.backgroundImage=`url("${item.image}")`;
    const label=document.createElement('span');label.textContent=item.name;button.append(thumb,label);
    button.addEventListener('click',()=>{
      if(kind==='cover')coverDraft.cover=item.id;
      else{coverDraft.scene=item.id;displayScene(coverDraft.scene==='random'?activeScene:coverDraft.scene);}
      renderCover(coverDraft);renderCoverOptions();
    });return button;
  }
  function renderCoverOptions(){
    if(!coverDraft)return;
    const covers=c$('wgAlbumCoverChoices');covers.replaceChildren();COVER_CHOICES.forEach(choice=>covers.append(coverChoice(choice,'cover')));
    if(coverDraft.customCover)covers.append(coverChoice({id:'custom',name:'My photo',image:coverDraft.customCover},'cover'));
    const scenes=c$('wgAlbumSceneChoices');scenes.replaceChildren();scenes.append(coverChoice({id:'random',name:'Surprise me',image:'assets/photos/wg_album_scene_journey.webp'},'scene'));
    SCENES.forEach(choice=>scenes.append(coverChoice(choice,'scene')));
  }
  function openCoverEditor(){
    if(editing)return;
    coverReturnFocus=document.activeElement;coverDraft={cover:data.cover,scene:data.scene,customCover:data.customCover};renderCoverOptions();
    coverDialog.showModal();coverDialog.querySelector('[data-cover-cancel]')?.focus();
  }
  function cancelCover(){if(coverDialog.open){renderCover();displayScene();coverDialog.close();}}
  coverDialog.addEventListener('close',()=>{coverDraft=null;renderCover();displayScene();if(coverReturnFocus?.isConnected)coverReturnFocus.focus({preventScroll:true});coverReturnFocus=null;});
  coverDialog.querySelectorAll('[data-cover-cancel]').forEach(btn=>btn.addEventListener('click',cancelCover));
  c$('wgAlbumUploadCover').addEventListener('click',()=>pick({type:'cover'}));
  c$('wgAlbumCoverFilePicker').addEventListener('change',()=>processSelectedImages(c$('wgAlbumCoverFilePicker')));
  c$('wgAlbumCoverFilePicker').addEventListener('cancel',()=>finishFilePicker(true));
  c$('wgAlbumCoverConfirm').addEventListener('click',()=>{
    if(!coverDraft)return;
    data.cover=coverDraft.cover;data.scene=coverDraft.scene;data.customCover=coverDraft.customCover;
    activeScene=sceneForOpen(data.scene);displayScene();renderCover();persist();coverDialog.close();notice('Your cover preferences were saved in this browser.');
  });
  // All sticker categories share one picker. Real flag images are used because many Windows browsers show emoji flags as text codes.
  const stickerDialog=document.createElement('dialog');stickerDialog.id='wgAlbumStickerModal';stickerDialog.className='wg-album-chooser wg-album-sticker-chooser';
  stickerDialog.innerHTML=`<div class="wg-album-chooser-head"><div><span>YOUR TRAVEL STICKERS</span><h2 id="wgAlbumStickerTitle">Decorate this page</h2><p>Flags, animals, travel keepsakes and animated GIFs.</p></div><button type="button" class="wg-album-chooser-x" id="wgAlbumStickerClose" aria-label="Close sticker picker">${icon('close')}</button></div>
    <div class="wg-album-sticker-tabs" role="tablist" aria-label="Sticker categories">
      <button type="button" data-sticker-tab="country" role="tab" aria-selected="true">Countries &amp; flags</button>
      <button type="button" data-sticker-tab="animal" role="tab" aria-selected="false">Animals</button>
      <button type="button" data-sticker-tab="travel" role="tab" aria-selected="false">Designs</button>
      <button type="button" data-sticker-tab="gif" role="tab" aria-selected="false">GIFs &amp; memes</button>
    </div>
    <div class="wg-album-chooser-scroll">
      <section class="wg-album-sticker-pane" id="wgStickerCountryPane">
        <p class="wg-album-pane-intro">Choose a flag with its country name. After placing it, tap the sticker and select the pencil to edit or remove the name.</p>
        <label class="wg-album-country-search">Search a country<input id="wgAlbumStickerSearch" type="search" placeholder="Philippines, Japan, Italy..." autocomplete="off"></label>
        <div class="wg-album-sticker-choices" id="wgAlbumCountryStickers" aria-label="Country stickers"></div>
      </section>
      <section class="wg-album-sticker-pane" id="wgStickerAnimalPane" hidden><p class="wg-album-pane-intro">Pick a simple animal sticker. Some are animated.</p><div class="wg-album-sticker-choices wg-album-emoji-grid" id="wgAlbumAnimalStickers"></div></section>
      <section class="wg-album-sticker-pane" id="wgStickerTravelPane" hidden><p class="wg-album-pane-intro">Decorative travel stamps and playful sticker designs.</p><div class="wg-album-sticker-choices wg-album-emoji-grid" id="wgAlbumTravelStickers"></div></section>
      <section class="wg-album-sticker-pane" id="wgStickerGifPane" hidden>
        <p class="wg-album-pane-intro">Search animated GIFs from Wikimedia Commons (no account needed). For a larger meme library, open GIPHY and paste a direct GIF link. GIFs are shown privately from their original provider.</p>
        <form id="wgAlbumGifSearchForm" class="wg-album-gif-search"><label for="wgAlbumGifQuery">Search GIFs</label><div><input type="search" id="wgAlbumGifQuery" maxlength="45" placeholder="Cats, travel, celebration, memes..."><button type="submit">Search</button></div></form>
        <div class="wg-album-gif-actions"><button id="wgAlbumGiphySearch" type="button">Search GIPHY website for more</button></div>
        <p id="wgAlbumGifStatus" class="wg-album-gif-status" role="status" aria-live="polite">Search to find animated media.</p>
        <div id="wgAlbumGifResults" class="wg-album-gif-results" aria-label="GIF search results"></div>
        <form id="wgAlbumGifPasteForm" class="wg-album-gif-search wg-album-gif-paste"><label for="wgAlbumGifPaste">Or paste any public HTTPS animated-image link</label><div><input type="url" id="wgAlbumGifPaste" placeholder="https://example-cdn.com/your-animation.gif" autocomplete="off"><button type="submit">Add GIF</button></div></form>
        <p class="wg-album-pane-intro">Public HTTPS GIF/WebP/APNG image links from any provider are supported when the image loads. Some sites block hotlinking. The remote host may see your IP; respect creators’ rights.</p>
      </section>
    </div>`;
  document.body.appendChild(stickerDialog);
  const s$=id=>stickerDialog.querySelector(`#${id}`);
  let activeStickerTab='country',gifSequence=0,gifAbort=null;
  const travelStamps=[
    ['✈','Airplane'],['🌍','Earth'],['🗺','Map'],['📍','Location pin'],['🧭','Compass'],['📸','Camera'],
    ['🎒','Backpack'],['🏖','Beach'],['⛰','Mountains'],['🌅','Sunset'],['🌊','Waves'],['🌸','Flowers'],
    ['✨','Sparkles'],['💖','Heart'],['🎟','Ticket'],['☁','Cloud'],['🌈','Rainbow'],['☀','Sun'],
    ['🛫','Taking off'],['🛬','Arriving'],['🚉','Train'],['🚲','Bicycle'],['🚗','Car'],['⛺','Camping'],
    ['🎡','Ferris wheel'],['🎆','Fireworks'],['💌','Love note'],['⭐','Star'],['☕','Coffee'],['🍜','Food trip'],
    ['🎶','Music'],['🏷','Tag'],['🌃','Night city'],['🚢','Cruise']
  ];
  const animalStamps=[
    ['🦋','Butterfly'],['🦊','Fox'],['🐈','Cat'],['🐕','Dog'],['🐼','Panda'],['🐻','Bear'],
    ['🦁','Lion'],['🐯','Tiger'],['🐰','Rabbit'],['🦄','Unicorn'],['🐘','Elephant'],['🦒','Giraffe'],
    ['🦓','Zebra'],['🐬','Dolphin'],['🐋','Whale'],['🦭','Seal'],['🦉','Owl'],['🦅','Eagle'],
    ['🦜','Parrot'],['🐢','Turtle'],['🐳','Whale spray'],['🐝','Bee'],['🐞','Ladybug'],['🦀','Crab'],
    ['🐠','Fish'],['🐧','Penguin'],['🐨','Koala'],['🐸','Frog'],['🐙','Octopus'],['🦕','Dinosaur']
  ];
  function insertSticker(type,label,code='',extras={}){
    if(currentScope!==scope())return;
    const spread=data.spreads[active];
    if(spread.stickers.length>=MAX_STICKERS){notice('This spread has reached its 16-sticker limit.');return;}
    const index=spread.stickers.length;
    const entry=validSticker({id:safeID(),type,label,code,mode:extras.mode||'both',displayName:extras.displayName,symbol:extras.symbol||'',url:extras.url||'',
      credit:extras.credit||'',source:extras.source||'',x:bounded(26+(index%4)*14,7,93),y:bounded(25+(index%3)*23,9,91)});
    if(!entry){s$('wgAlbumGifStatus').textContent='That GIF link is not a supported direct media URL.';return;}
    spread.stickers.push(entry);selectedSticker=null;persist();renderStickers();stickerDialog.close();
    notice(`${type==='gif'?'GIF':'Sticker'} added. Drag it anywhere on the spread; select it to reveal its resize handle.`);
  }
  function renderStickerOptions(filter=''){
    const box=s$('wgAlbumCountryStickers');box.replaceChildren();
    const q=filter.trim().toLowerCase();
    const matches=COUNTRY_OPTIONS.filter(c=>!q||c.name.toLowerCase().includes(q)||c.code.toLowerCase().includes(q)).slice(0,72);
    for(const country of matches){
      const button=document.createElement('button');button.type='button';button.className='wg-album-sticker-option wg-album-country-option';
      button.setAttribute('aria-label',`${country.name} flag and editable name`);
      const image=flagTile(country.code);image.classList.add('wg-album-flag-img');image.setAttribute('aria-label',`Flag of ${country.name}`);button.append(image);
      const name=document.createElement('span');name.textContent=country.name;button.append(name);
      button.addEventListener('click',()=>insertSticker('country',country.name,country.code,{mode:'both',displayName:country.name}));box.append(button);
    }
    if(!matches.length){const p=document.createElement('p');p.textContent='No matching country. Try another name.';box.append(p);}
  }
  function renderEmojiOptions(boxId,entries,tab){
    const box=s$(boxId);box.replaceChildren();
    entries.forEach(([symbol,label],index)=>{
      const button=document.createElement('button');button.type='button';button.className='wg-album-sticker-option wg-album-emoji-option';
      const image=document.createElement('span');image.className='wg-album-emoji-preview';image.textContent=symbol;
      const name=document.createElement('span');name.textContent=label;button.append(image,name);
      const type=tab; // only real GIF media should animate
      button.addEventListener('click',()=>insertSticker(type,label,'',{symbol}));box.append(button);
    });
  }
  function setStickerTab(tab){
    activeStickerTab=['country','animal','travel','gif'].includes(tab)?tab:'country';
    stickerDialog.querySelectorAll('[data-sticker-tab]').forEach(btn=>btn.setAttribute('aria-selected',String(btn.dataset.stickerTab===activeStickerTab)));
    for(const name of ['country','animal','travel','gif']){
      const pane=s$(`wgSticker${name[0].toUpperCase()}${name.slice(1)}Pane`);
      pane.hidden=name!==activeStickerTab;
    }
  }
  stickerDialog.querySelectorAll('[data-sticker-tab]').forEach(btn=>btn.addEventListener('click',()=>setStickerTab(btn.dataset.stickerTab)));
  function openStickers(){
    if(flipBusy||editing)return;
    stickerReturnFocus=document.activeElement;
    s$('wgAlbumStickerSearch').value='';
    renderStickerOptions();renderEmojiOptions('wgAlbumAnimalStickers',animalStamps,'animal');renderEmojiOptions('wgAlbumTravelStickers',travelStamps,'symbol');
    setStickerTab('country');stickerDialog.showModal();s$('wgAlbumStickerSearch').focus();
  }
  s$('wgAlbumStickerSearch').addEventListener('input',e=>renderStickerOptions(e.target.value));
  s$('wgAlbumStickerClose').addEventListener('click',()=>stickerDialog.close());
  stickerDialog.addEventListener('close',()=>{
    if(gifAbort){gifAbort.abort();gifAbort=null;}gifSequence++;
    if(stickerReturnFocus?.isConnected)stickerReturnFocus.focus({preventScroll:true});stickerReturnFocus=null;
  });
  const g$=id=>s$(id);
  async function searchGifs(query){
    const q=query.trim().slice(0,45);if(!q){g$('wgAlbumGifStatus').textContent='Type what you want to find first.';return;}
    if(gifAbort)gifAbort.abort();gifAbort=new AbortController();const sequence=++gifSequence;
    const results=g$('wgAlbumGifResults');results.replaceChildren();g$('wgAlbumGifStatus').textContent='Searching animated GIFs...';
    const controller=gifAbort;const kill=window.setTimeout(()=>controller.abort(),12000);
    try{
      let gifs=[];
      const key=typeof window.WorldsGalleryGiphyPublicKey==='string'?window.WorldsGalleryGiphyPublicKey.trim():'';
      if(key){
        const u=new URL('https://api.giphy.com/v1/gifs/search');u.searchParams.set('api_key',key);u.searchParams.set('q',q);u.searchParams.set('rating','g');u.searchParams.set('limit','24');
        const r=await fetch(u.href,{signal:gifAbort.signal,credentials:'omit'});if(!r.ok)throw Error(`GIF provider returned ${r.status}`);
        const response=await r.json();gifs=(Array.isArray(response.data)?response.data:[]).map(item=>({
          url:safeGifURL(item.images?.fixed_height?.url||item.images?.original?.url),label:cleanString(item.title||q,64),
          credit:'GIPHY',source:safeSourceURL(item.url)
        })).filter(item=>item.url);
      }else{
        const u=new URL('https://commons.wikimedia.org/w/api.php');
        for(const [k,v] of Object.entries({action:'query',format:'json',origin:'*',generator:'search',gsrsearch:`${q} filemime:"image/gif"`,gsrnamespace:'6',gsrlimit:'36',prop:'imageinfo',iiprop:'url|mime|size'}))u.searchParams.set(k,v);
        const r=await fetch(u.href,{signal:gifAbort.signal,credentials:'omit'});if(!r.ok)throw Error(`Media search returned ${r.status}`);
        const response=await r.json();gifs=Object.values(response.query?.pages||{}).map(page=>{
          const info=page.imageinfo?.[0]||{};
          return {url:(info.mime==='image/gif'&&Number(info.size)<10000000)?safeGifURL(info.url):'',
            label:cleanString(String(page.title||q).replace(/^File:/,'').replace(/\.gif$/i,''),64),
            credit:'Wikimedia Commons — check license before reuse',source:safeSourceURL(info.descriptionurl)};
        }).filter(item=>item.url).slice(0,24);
      }
      if(sequence!==gifSequence||!stickerDialog.open)return;
      if(!gifs.length){g$('wgAlbumGifStatus').textContent='No GIFs found in the open library. Try a different term or use GIPHY and paste a direct GIF URL.';return;}
      for(const gif of gifs){
        const button=document.createElement('button');button.type='button';button.className='wg-album-gif-result';
        const image=document.createElement('img');image.loading='lazy';image.decoding='async';image.referrerPolicy='no-referrer';image.alt=gif.label;image.src=gif.url;
        const label=document.createElement('span');label.textContent=gif.label;
        button.append(image,label);button.addEventListener('click',()=>insertSticker('gif',gif.label,'',gif));
        const wrapper=document.createElement('div');wrapper.className='wg-album-gif-card';wrapper.append(button);
        if(gif.source){const credit=document.createElement('a');credit.href=gif.source;credit.target='_blank';credit.rel='noopener noreferrer';credit.textContent='Source / license';credit.setAttribute('aria-label',`Source and license for ${gif.label}`);wrapper.append(credit);}
        results.append(wrapper);
      }
      g$('wgAlbumGifStatus').textContent=`${gifs.length} GIFs found. Select one to add it to your private scrapbook.`;
    }catch(e){if(sequence!==gifSequence||!stickerDialog.open)return;
      g$('wgAlbumGifStatus').textContent=e.name==='AbortError'?'GIF search timed out. Try again.':'GIF search is unavailable. Check internet access or paste a direct GIF URL.';
    }finally{window.clearTimeout(kill);if(sequence===gifSequence)gifAbort=null;}
  }
  g$('wgAlbumGifSearchForm').addEventListener('submit',e=>{e.preventDefault();searchGifs(g$('wgAlbumGifQuery').value);});
  g$('wgAlbumGiphySearch').addEventListener('click',()=>{
    const query=g$('wgAlbumGifQuery').value.trim()||'travel';
    window.open('https://giphy.com/search/'+encodeURIComponent(query),'_blank','noopener,noreferrer');
  });
  g$('wgAlbumGifPasteForm').addEventListener('submit',async e=>{
    e.preventDefault();const url=safeGifURL(g$('wgAlbumGifPaste').value.trim());
    const status=g$('wgAlbumGifStatus');
    if(!url){status.textContent='Use a public HTTPS image URL, not a webpage, private address or file link.';return;}
    const submit=g$('wgAlbumGifPasteForm').querySelector('button[type=submit]');
    if(submit.disabled)return;
    submit.disabled=true;status.textContent='Checking the animated image link...';
    try{
      await verifyRemoteImage(url);
      if(!stickerDialog.open||currentScope!==scope())return;
      insertSticker('gif','Custom GIF','',{url,credit:'User-supplied public image link'});
    }catch{if(stickerDialog.open)status.textContent='Image did not load. Use a direct public HTTPS GIF/WebP/APNG URL (not the provider page).';}
    finally{submit.disabled=false;}
  });
  $('wgAlbumBook').addEventListener('click',animateOpen);
  $('wgAlbumCustomize').addEventListener('click',openCoverEditor);
  $('wgAlbumBack').addEventListener('click',showCover);
  $('wgAlbumClose').addEventListener('click',close);
  $('wgAlbumPrev').addEventListener('click',()=>moveSpread(active-1));
  $('wgAlbumNext').addEventListener('click',()=>moveSpread(active+1));
  $('wgAlbumAddSpread').addEventListener('click',()=>{if(flipBusy||data.spreads.length>=MAX_SPREADS)return;data.spreads.push(newSpread());active=data.spreads.length-1;persist();renderSpread();notice('New scrapbook spread added.');});
  $('wgAlbumDeleteSpread').addEventListener('click',()=>{
    if(flipBusy||data.spreads.length<=1)return;
    if(!window.confirm('Remove this entire scrapbook spread, including its photos and stickers?'))return;
    data.spreads.splice(active,1);active=Math.min(active,data.spreads.length-1);selectedSticker=null;persist();renderSpread();notice('Spread removed from this browser.');
  });
  $('wgAlbumStickerPicker').addEventListener('click',openStickers);
  $('wgAlbumSpreadTitle').addEventListener('click',()=>{
    const old=data.spreads[active].title;
    const proposed=window.prompt('Title for this scrapbook spread (up to 42 characters)',old);
    if(proposed===null)return;
    data.spreads[active].title=cleanString(proposed,42)||'Timeline';persist();renderSpread();
  });
  $('wgAlbumSpreadTitle').setAttribute('title','Click or press Enter to rename this spread');
  $('wgAlbumSpreadTitle').setAttribute('tabindex','0');
  $('wgAlbumSpreadTitle').setAttribute('role','button');
  $('wgAlbumSpreadTitle').setAttribute('aria-label','Rename this scrapbook spread');
  $('wgAlbumSpreadTitle').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.currentTarget.click();}});
  dialog.addEventListener('cancel',event=>{
    event.preventDefault();
    // Escape is consumed by the native gallery when the file dialog is open.
    // Some desktop browsers echo that Escape to the parent <dialog>.
    if(filePickerPending || performance.now()-filePickerDismissedAt<1000){
      if(filePickerPending)finishFilePicker(true);
      return;
    }
    close();
  });
  dialog.addEventListener('close',()=>{
    if(countryNameDialog.open)countryNameDialog.close();
    animationToken++;editing=false;clearFlip();dialog.classList.remove('wg-album-opening','wg-album-closing','wg-album-reveal');
    if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});previousFocus=null;
  });
  dialog.addEventListener('click',e=>{if(e.target===dialog && !filePickerPending && performance.now()-filePickerDismissedAt>1000)close();});
  for(const eventName of ['wg:authenticated','wg:guest-ready','wg:guest-auth-request','wg:signedout']){
    document.addEventListener(eventName,()=>{if(dialog.open)hardClose();currentScope=null;data=freshState();});
  }
  window.WorldsGalleryAlbum=Object.freeze({open,close,isOpen:()=>dialog.open,showCover,openPages:animateOpen});
})();
