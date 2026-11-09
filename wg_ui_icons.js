/* Inline SVG icons for the most prominent navigation and story controls. */
(() => {'use strict';
 const svg=path=>`<svg class="wg-v26-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
 const icons={arrow:svg('<path d="M7 17 17 7M8 7h9v9"/>'),up:svg('<path d="m6 13 6-6 6 6M12 7v13"/>'),reset:svg('<path d="M3 11a9 9 0 0 1 15.5-6L21 7M21 3v4h-4M21 13a9 9 0 0 1-15.5 6L3 17m0 4v-4h4"/>'),search:svg('<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>'),shuffle:svg('<path d="m18 14 4 4-4 4M2 6h3c6 0 8 12 14 12h3M18 2l4 4-4 4M2 18h3c2 0 3-1 4-3M15 9c1-2 2-3 4-3h3"/>')};
 function decorate(){
  document.querySelectorAll('[data-open-upload] > span').forEach(n=>{if(!n.querySelector('svg'))n.innerHTML=icons.arrow});
  const footer=document.querySelector('.footrow a[href="#home"]');if(footer&&!footer.querySelector('svg'))footer.insertAdjacentHTML('beforeend',icons.up);
  for(const [id,key] of [['globeReset','reset'],['arrivalShuffle','shuffle'],['portalSearchToggle','search']]){
   const b=document.getElementById(id);if(b&&!b.querySelector('svg')){b.innerHTML=icons[key];b.setAttribute('title',b.title||b.getAttribute('aria-label')||key)}
  }
  document.querySelectorAll('#portalDrill [data-choice="enter"] .choice-arrow,#portalDrill .choice-arrow').forEach(n=>{if(!n.querySelector('svg'))n.innerHTML=icons.arrow});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});else decorate();
 const portal=document.getElementById('portalDrill');if(portal)new MutationObserver(decorate).observe(portal,{childList:true});
 document.addEventListener('wg:locale',decorate);
})();
