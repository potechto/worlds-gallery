/* Worlds Gallery V1: accessible, licensed photo zoom. No network writes. */
(() => {
  'use strict';
  const root=document.getElementById('wg-discovery');
  if(!root)return;
  const dialog=document.createElement('dialog');
  dialog.id='wgV1MoodLightbox';
  dialog.setAttribute('aria-label','Enlarged destination photo');
  dialog.innerHTML='<div class="wg-v1-zoom-head"><strong>Destination photograph</strong><button class="wg-v1-zoom-close" type="button">Close</button></div><img alt=""><p class="wg-v1-zoom-caption"></p>';
  document.body.appendChild(dialog);
  const large=dialog.querySelector('img');
  const title=dialog.querySelector('strong');
  const caption=dialog.querySelector('.wg-v1-zoom-caption');
  const close=dialog.querySelector('button');
  let previousFocus=null;
  function decorate(){
    root.querySelectorAll('.wg-dsc-picture').forEach(wrap=>{
      const img=wrap.querySelector('img.wg-dsc-photo');
      if(!img||wrap.dataset.wgV1ZoomReady==='1')return;
      wrap.dataset.wgV1ZoomReady='1';
      wrap.setAttribute('role','button');
      wrap.tabIndex=0;
      wrap.setAttribute('aria-label','Enlarge '+img.alt);
      wrap.setAttribute('title','Click to enlarge photo');
    });
  }
  function show(wrap){
    if(dialog.open)return;
    const img=wrap?.querySelector('img.wg-dsc-photo');
    if(!img||img.hidden||!img.naturalWidth)return;
    // Source is taken from the already-loaded curated image, never user input.
    const url=img.currentSrc||img.src;
    if(!url||!/^https:\/\//i.test(url))return;
    previousFocus=document.activeElement;
    large.src=url;
    large.alt=img.alt;
    title.textContent=img.alt.replace(/^Licensed photograph of /,'');
    caption.textContent='Curated destination photograph. License details remain beside the original image.';
    dialog.showModal();close.focus({preventScroll:true});
  }
  root.addEventListener('click',event=>{
    const wrap=event.target.closest('.wg-dsc-picture');
    if(wrap&&root.contains(wrap))show(wrap);
  });
  root.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    const wrap=event.target.closest('.wg-dsc-picture');
    if(!wrap||event.target!==wrap)return;
    event.preventDefault();show(wrap);
  });
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>{
    large.removeAttribute('src');
    if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
    previousFocus=null;
  });
  const observer=new MutationObserver(decorate);
  observer.observe(root,{childList:true,subtree:true});
  decorate();
})();
