/* Per-tab refresh restoration. Saves route/location only: no form values, credentials or images. */
(() => {'use strict';
 const key='wg_view_v26';
 const reload=()=>performance.getEntriesByType('navigation')[0]?.type==='reload';
 const read=()=>{try{return JSON.parse(sessionStorage.getItem(key)||'null')}catch{return null}};
 const write=s=>{try{sessionStorage.setItem(key,JSON.stringify(s))}catch{}};
 function save(){
  const uid=window.WorldsGalleryAuth?.getCurrentUserId?.();
  if(!uid||!document.documentElement.classList.contains('wg-auth-ok')){
   try{sessionStorage.setItem('wg_guest_support_open',String(window.WorldsGalleryAccount?.getPage?.()==='support'))}catch{}
   return;
  }
  const world=document.getElementById('worldPortal');
  const area=(world?.hidden||world?.classList.contains('portal-entered'))?'gallery':'portal';
  const dialog=['readDialog','uploadDialog','lightboxDialog'].find(id=>document.getElementById(id)?.open)||'';
  write({uid,at:Date.now(),area,portal:window.WorldsGalleryPortal?.getState?.(),page:window.WorldsGalleryAccount?.getPage?.()||'home',dialog,storyId:window.WorldsGalleryReader?.getStoryId?.()||'',scrollY:Math.max(0,scrollY)});
 }
 function restoreForUser(uid){
  if(!reload())return false;
  const saved=read();if(!saved||saved.uid!==uid||Date.now()-saved.at>24*3600*1000)return false;
  if(!window.WorldsGalleryPortal?.restoreView?.(saved.portal,saved.area))return false;
  if(['profile','settings','support'].includes(saved.page))window.WorldsGalleryAccount?.restorePage?.(saved.page);
  if(saved.area==='gallery'){
   const y=Math.max(0,Math.min(150000,Number(saved.scrollY)||0));
   requestAnimationFrame(()=>scrollTo({top:y,behavior:'instant'}));
   setTimeout(()=>scrollTo({top:y,behavior:'instant'}),750);
   if(saved.dialog==='uploadDialog')setTimeout(()=>document.querySelector('[data-open-upload]')?.click(),220);
   if(saved.dialog==='readDialog'||saved.dialog==='lightboxDialog'){
    let attempts=0;const reopen=()=>{
     if(window.WorldsGalleryReader?.openStory?.(saved.storyId))return;
     if(++attempts<10)setTimeout(reopen,350);
    };setTimeout(reopen,250);
   }
  }
  return true;
 }
 function clear(){try{sessionStorage.removeItem(key);sessionStorage.removeItem('wg_guest_support_open')}catch{}}
 window.WorldsGalleryViewState={restoreForUser,clear,save};
 addEventListener('pagehide',save);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save()});
 document.addEventListener('wg:guest-ready',()=>{
  if(!reload()||document.documentElement.classList.contains('wg-auth-ok'))return;
  try{if(sessionStorage.getItem('wg_guest_support_open')==='true')window.WorldsGalleryAccount?.restorePage?.('support')}catch{}
 });
})();
