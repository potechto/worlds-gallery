/* Worlds Gallery beta discovery: curated editorial content only.
   Never read private story data, auth tokens, or account metadata here.
   Browser-only personal Mosaic: no network writes or automatic sharing.
*/
(() => {
  'use strict';
  const data=window.WorldsGalleryDiscoveryData;
  const root=document.getElementById('wg-discovery');
  if(!data||!root)return;
  const {destinations,moods}=data;
  const byId=new Map(destinations.map(item=>[item.id,item]));
  const CATEGORIES=Object.freeze(['Special to Me',"I've Been Here",'Dream Destination','Discovered']);
  const STORAGE_KEY='wg_world_mosaic_v1';
  const $=(sel,base=root)=>base.querySelector(sel);
  const $$=(sel,base=root)=>Array.from(base.querySelectorAll(sel));
  const make=(tag,className,text)=>{
    const el=document.createElement(tag);
    if(className)el.className=className;
    if(text!==undefined)el.textContent=text;
    return el;
  };
  function button(text,cls,handler){
    const el=make('button',cls,text);
    el.type='button';
    if(handler)el.addEventListener('click',handler);
    return el;
  }
  function safeUrl(url){return typeof url==='string'&&url.startsWith('https://commons.wikimedia.org/wiki/')?url:'';}
  function credit(media){
    const span=make('span','wg-dsc-credit');
    span.append('Image: ',make('span','',media.author),` · ${media.license} · `);
    const link=make('a','', 'File & license');
    link.href=safeUrl(media.url)||'https://commons.wikimedia.org/';
    link.rel='noopener noreferrer';link.target='_blank';
    span.append(link);return span;
  }
  function picture(media,label){
    const wrap=make('div','wg-dsc-picture');
    const fallback=make('div','wg-dsc-picture-fallback');
    fallback.append(make('span','wg-dsc-fallback-icon','✦'),make('span','',label||'A world to discover'));
    const img=make('img','wg-dsc-photo');
    img.alt=`Licensed photograph of ${label||'this destination'}`;
    img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
    img.src=safeUrl(media.image)||'';
    img.addEventListener('error',()=>{img.hidden=true;wrap.classList.add('wg-dsc-picture-missing');});
    wrap.append(fallback,img);
    return wrap;
  }
  function select(name,choices,value,onChange,cls){
    const wrap=make('label',cls||'wg-dsc-select');
    wrap.append(make('span','',name));
    const el=make('select');
    el.setAttribute('aria-label',name);
    choices.forEach(([v,t])=>{const opt=make('option','',t);opt.value=v;el.append(opt);});
    el.value=value;
    el.addEventListener('change',()=>onChange(el.value));
    wrap.append(el);return wrap;
  }
  function globeLink(place){
    const btn=button('Explore on the globe','wg-dsc-button wg-dsc-outline',()=>{
      const portal=document.getElementById('worldPortal');
      if(!portal||!window.WorldsGalleryPortal?.searchCountry){
        notice('The interactive globe is not available in this browser.');return;
      }
      if(portal.hidden||!document.body.classList.contains('portal-locked')){
        document.getElementById('arrivalBackEarth')?.click();
      }
      try{window.WorldsGalleryPortal.searchCountry(place.iso);window.scrollTo({top:0,behavior:'instant'});}catch(e){notice('Could not open this country on the globe.');}
    });
    return btn;
  }
  let tab='mood',mood='peaceful',currentMoodPlace=null;
  let mosaicFilterCategory='',mosaicFilterCountry='',selectedMosaicCategory='Discovered';
  let mosaicItems=[];
  const header=$('.wg-dsc-tabs');
  const status=$('#wg-dsc-status');
  const panel=$('#wg-dsc-panel');
  const shareDialog=document.getElementById('wg-mosaic-export');
  let storageAvailable=true;
  function notice(msg){status.textContent=msg;}
  function loadMosaic(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      if(!raw)return [];
      const parsed=JSON.parse(raw);
      if(!Array.isArray(parsed))return [];
      const seen=new Set();
      return parsed.filter(obj=>{
        if(!obj||typeof obj.id!=='string'||!byId.has(obj.id)||!CATEGORIES.includes(obj.category)||seen.has(obj.id))return false;
        seen.add(obj.id);return true;
      }).slice(0,250).map(obj=>({id:obj.id,category:obj.category,at:Number.isFinite(obj.at)?obj.at:Date.now()}));
    }catch(e){storageAvailable=false;return []}
  }
  mosaicItems=loadMosaic();
  function persist(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(mosaicItems));storageAvailable=true;return true;}
    catch(e){storageAvailable=false;notice('Browser storage is unavailable or full. This collection may be lost on refresh.');return false;}
  }
  function save(place,category='Discovered'){
    if(!place||!byId.has(place.id))return;
    const previous=mosaicItems.find(item=>item.id===place.id);
    if(previous){notice(`${place.name} is already in your private World Mosaic. Use its category selector to change how you remember it.`);return;}
    mosaicItems.unshift({id:place.id,category,at:Date.now()});
    persist();
    notice(`${place.name} saved to your private World Mosaic.`);
    if(tab==='mosaic')renderMosaic();
  }
  function remove(place){
    mosaicItems=mosaicItems.filter(item=>item.id!==place.id);
    persist();notice(`${place.name} removed from your Mosaic.`);renderMosaic();
  }
  function cardActions(place,category='Discovered'){
    const actions=make('div','wg-dsc-actions');
    actions.append(globeLink(place),button('Save to My World','wg-dsc-button wg-dsc-primary',()=>save(place,category)));
    return actions;
  }
  function setTab(next){
    if(next!=='mood'&&next!=='mosaic')return;
    tab=next;
    header.hidden=true;
    root.classList.toggle('wg-dsc-album-view',next==='mosaic');
    notice('');
    if(next==='mood')renderMood();
    if(next==='mosaic')renderMosaic();
  }
  // Mood Compass remains the quiet discovery experience; the historical
  // comparison product was retired from the user interface by request.

  function renderMood(){
    panel.replaceChildren();
    const top=make('div','wg-dsc-panel-intro');
    top.append(make('div','wg-dsc-eyebrow','DISCOVER WHAT YOU FEEL'),make('h3','','How are you feeling today?'),make('p','','Somewhere in the world might match that feeling. Choose an atmosphere to explore.'));
    const choices=make('div','wg-dsc-moods');
    moods.forEach(item=>{
      const el=button('','wg-dsc-mood',()=>{mood=item.id;currentMoodPlace=null;renderMood();});
      el.classList.toggle('active',item.id===mood);
      el.setAttribute('aria-pressed',String(item.id===mood));
      const iconPaths={peaceful:'<path d="M3 16a5 5 0 0 1 5-5h1a6 6 0 0 1 11 3 4 4 0 0 1-2 7H7a4 4 0 0 1-4-5Z"/>',adventurous:'<path d="m2 20 7-12 4 6 2-4 7 10H2Z"/><path d="m7 11 2-3 2 3"/>',nostalgic:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',curious:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5M10 8h2m-1-1v4"/>',romantic:'<path d="M20.8 5a5.5 5.5 0 0 0-7.8 0L12 6l-1-1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.2a5.5 5.5 0 0 0 0-7.8Z"/>',inspired:'<path d="M9 18h6M10 22h4M9 14.5c-1.5-1-2.5-2.4-2.5-4.5a5.5 5.5 0 0 1 11 0c0 2.1-1 3.5-2.5 4.5-.7.5-1 1.2-1 2.5h-4c0-1.3-.3-2-1-2.5Z"/>'};
      const mark=make('span','wg-dsc-mood-icon');
      mark.innerHTML=`<svg viewBox="0 0 24 24" width="25" height="25" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none" aria-hidden="true">${iconPaths[item.id]||''}</svg>`;
      el.append(mark,make('span','',item.label));choices.append(el);
    });
    panel.append(top,choices);
    const selected=moods.find(item=>item.id===mood)||moods[0];
    const options=selected.places.map(id=>byId.get(id)).filter(Boolean);
    if(!options.length){panel.append(make('p','wg-dsc-empty','No destinations for this mood yet.'));return;}
    if(!currentMoodPlace||!options.some(p=>p.id===currentMoodPlace))currentMoodPlace=options[0].id;
    const place=byId.get(currentMoodPlace);
    const hero=make('div','wg-dsc-place-layout');
    const visual=make('div','wg-dsc-place-visual');visual.append(picture(place.media,place.name),credit(place.media));
    const info=make('div','wg-dsc-place-copy');
    info.append(make('div','wg-dsc-eyebrow',`${place.country} · ${place.region}`),make('h4','',place.name),make('p','wg-dsc-place-desc',place.description));
    const fact=make('p','wg-dsc-fact');fact.append(make('strong','','Discovery · '),document.createTextNode(place.discovery));info.append(fact);
    const actions=cardActions(place);
    actions.append(button('Another place','wg-dsc-button wg-dsc-outline',()=>{
      const other=options.find(x=>x.id!==place.id);
      currentMoodPlace=(other||options[0]).id;renderMood();
    }));
    info.append(actions);hero.append(visual,info);panel.append(hero);
  }

  function mosaicCard(place,item){
    const article=make('article','wg-dsc-mosaic-card');
    const photo=picture(place.media,place.name);photo.classList.add('wg-dsc-mosaic-image');
    const detail=make('div','wg-dsc-mosaic-card-body');
    detail.append(make('span','wg-dsc-card-tag',item.category),make('h4','',place.name),make('p','',place.country));
    detail.append(select('Category',CATEGORIES.map(x=>[x,x]),item.category,next=>{
      item.category=next;persist();notice('Your Mosaic category has been updated.');renderMosaic();
    },'wg-dsc-select wg-dsc-card-category'));
    const actions=make('div','wg-dsc-mosaic-controls');
    actions.append(globeLink(place));
    actions.append(button('Remove','wg-dsc-button wg-dsc-danger',()=>remove(place)));
    detail.append(actions,credit(place.media));article.append(photo,detail);return article;
  }
  function renderMosaic(){
    panel.replaceChildren();
    const top=make('div','wg-dsc-panel-intro');
    top.append(make('div','wg-dsc-eyebrow','MY ALBUM / MY WORLD MOSAIC'),make('h3','','The places you keep.'),make('p','','Your private collection of discoveries, memories and dream destinations—saved only in this browser.'));
    panel.append(top);
    const countries=new Set(mosaicItems.map(x=>byId.get(x.id)?.country).filter(Boolean));
    const tools=make('div','wg-dsc-mosaic-tools');
    const stats=make('div','wg-dsc-mosaic-stats');stats.append(make('strong','',`${mosaicItems.length} ${mosaicItems.length===1?'place':'places'}`),make('strong','',`${countries.size} ${countries.size===1?'country':'countries'}`));
    tools.append(stats);
    const controls=make('div','wg-dsc-filters');
    controls.append(select('Category',[['','All categories'],...CATEGORIES.map(x=>[x,x])],mosaicFilterCategory,value=>{mosaicFilterCategory=value;renderMosaic();}));
    controls.append(select('Country',[['','All countries'],...Array.from(countries).sort().map(x=>[x,x])],mosaicFilterCountry,value=>{mosaicFilterCountry=value;renderMosaic();}));
    const exportButton=button('Export mosaic','wg-dsc-button wg-dsc-primary',()=>openExport());
    exportButton.disabled=mosaicItems.length===0;controls.append(exportButton);tools.append(controls);panel.append(tools);
    const visible=mosaicItems.filter(x=>{
      const place=byId.get(x.id);
      return place&&(!mosaicFilterCategory||x.category===mosaicFilterCategory)&&(!mosaicFilterCountry||place.country===mosaicFilterCountry);
    });
    if(!mosaicItems.length){
      const empty=make('div','wg-dsc-empty');
      empty.append(make('span','wg-dsc-empty-symbol','✳'),make('h4','','Your world begins with one discovery.'),make('p','','Start with Mood Compass and save a place that means something to you.'),button('Discover a place','wg-dsc-button wg-dsc-primary',()=>setTab('mood')));panel.append(empty);
    }else if(!visible.length){panel.append(make('p','wg-dsc-empty','No places match these filters. Try changing a filter.'));}
    else{
      const grid=make('div','wg-dsc-mosaic-grid');
      for(const item of visible){const place=byId.get(item.id);grid.append(mosaicCard(place,item));}
      panel.append(grid);
    }
    const privacy=make('p','wg-dsc-private-note',storageAvailable?'Private by default · Stored only in this browser. Clearing browser data may erase your Mosaic. No automatic account sync or public profile.':'Private browser storage is unavailable. Saved places may not survive refresh.');
    panel.append(privacy);
  }

  function openExport(){
    if(!shareDialog||!mosaicItems.length)return;
    const list=shareDialog.querySelector('#wg-dsc-export-items');list.replaceChildren();
    mosaicItems.forEach(item=>{
      const place=byId.get(item.id);if(!place)return;
      const label=make('label','wg-dsc-export-item');
      const input=make('input');input.type='checkbox';input.value=place.id;input.checked=true;
      const thumb=make('img','wg-dsc-export-photo');thumb.alt='';thumb.loading='lazy';
      thumb.src=safeUrl(place.media.image)||'';thumb.addEventListener('error',()=>{thumb.hidden=true;});
      label.append(input,thumb,make('span','',`${place.name} · ${item.category}`));list.append(label);
    });
    shareDialog.querySelector('#wg-dsc-export-message').textContent='The export is a private, typographic scrapbook image; licensed web photographs are not copied into the PNG.';
    if(typeof shareDialog.showModal==='function')shareDialog.showModal();else shareDialog.hidden=false;
  }
  function rounded(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  function downloadCanvas(canvas){
    canvas.toBlob(blob=>{
      if(!blob){$('#wg-dsc-export-message',shareDialog).textContent='Could not create the export image.';return;}
      const url=URL.createObjectURL(blob);
      const a=make('a');a.href=url;a.download='My_World_Mosaic.png';document.body.append(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1500);
      $('#wg-dsc-export-message',shareDialog).textContent='Image created. Only the selected place names and categories are included.';
    },'image/png');
  }
  function exportMosaic(){
    const ids=$$('#wg-dsc-export-items input:checked',shareDialog).map(x=>x.value).filter(x=>byId.has(x));
    if(!ids.length){$('#wg-dsc-export-message',shareDialog).textContent='Choose at least one place to include.';return;}
    const width=1200;const cols=2;const rows=Math.ceil(ids.length/cols);
    const height=250+rows*220+115;
    const canvas=make('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');if(!ctx){$('#wg-dsc-export-message',shareDialog).textContent='Canvas export is not supported in this browser.';return;}
    ctx.fillStyle='#f6f7ef';ctx.fillRect(0,0,width,height);
    ctx.fillStyle='#235444';ctx.font='800 50px system-ui';ctx.fillText('My World Mosaic',60,96);
    ctx.fillStyle='#5e8070';ctx.font='26px system-ui';ctx.fillText('A little collection of the world · Worlds Gallery',60,140);
    ctx.fillStyle='#376855';ctx.fillRect(60,170,width-120,3);
    ids.forEach((id,i)=>{
      const item=mosaicItems.find(x=>x.id===id),place=byId.get(id);
      const col=i%cols,row=Math.floor(i/cols),x=60+col*550,y=205+row*220;
      ctx.fillStyle='#fff';rounded(ctx,x,y,525,195,22);
      const colors=[['#2d7861','#a7cec0'],['#365c85','#abb7dc'],['#846c9c','#d9beda'],['#568573','#c4d5bb']];
      const pair=colors[i%colors.length],gradient=ctx.createLinearGradient(x,y,x+195,y+195);
      gradient.addColorStop(0,pair[0]);gradient.addColorStop(1,pair[1]);
      ctx.fillStyle=gradient;rounded(ctx,x+12,y+12,168,171,14);
      ctx.fillStyle='#ffffff66';ctx.beginPath();ctx.arc(x+145,y+48,20,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#ffffffa8';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+27,y+157);ctx.lineTo(x+83,y+102);ctx.lineTo(x+115,y+134);ctx.lineTo(x+143,y+110);ctx.lineTo(x+170,y+151);ctx.stroke();
      ctx.fillStyle='#173e30';ctx.font='700 26px system-ui';
      ctx.fillText(place.name.length>23?place.name.slice(0,22)+'…':place.name,x+201,y+62,300);
      ctx.fillStyle='#49695a';ctx.font='21px system-ui';ctx.fillText(place.country,x+201,y+105,296);
      ctx.fillStyle='#32735a';ctx.font='600 17px system-ui';ctx.fillText(item.category,x+201,y+155,296);
    });
    ctx.fillStyle='#5f7867';ctx.font='20px system-ui';ctx.fillText('Shared intentionally · No account, private notes, or exact coordinates included',60,height-55);
    downloadCanvas(canvas);
  }
  if(shareDialog){
    const close=shareDialog.querySelector('[data-wg-dsc-export-close]');
    close?.addEventListener('click',()=>{shareDialog.close?.();});
    shareDialog.querySelector('[data-wg-dsc-export-confirm]')?.addEventListener('click',exportMosaic);

  }
  // The duplicate globe-suggestion save banner is intentionally removed.
  // Mood Compass keeps the single 'Save to My World' action.
  setTab('mood');
  window.WorldsGalleryDiscovery=Object.freeze({openMood:()=>setTab('mood'),openMosaic:()=>setTab('mosaic'),getSavedCount:()=>mosaicItems.length});
})();
