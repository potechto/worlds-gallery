/* Worlds Gallery localization V2.5: core interface translation; stories stay original. */
(() => {
 'use strict';
 const supported=['en','ko','ja','fr','de','es'];
 const byCountry={PH:'en',KR:'ko',JP:'ja',FR:'fr',DE:'de',ES:'es',US:'en',GB:'en',AU:'en',CA:'en'};
 const strings={
 en:['The world','Gallery','Our purpose','Tell your story','Every picture','has a','world','behind it.','Explore the','gallery.','Search names, titles, memories, places...','View mine only','Select themes','World region','Country or territory','Sort stories','All world regions','All countries / territories','Newest first','Most loved','Title A–Z','Country A–Z','Your window to the world','Where would you like to go?','Back to the top ↑','Post','Only me · Not publicly shared','Choose your photographs'],
 ko:['세계','갤러리','우리의 목적','이야기 나누기','모든 사진에는','하나의','세상이','담겨 있습니다.','갤러리','둘러보기','이름, 제목, 추억, 장소 검색...','내 이야기만 보기','주제 선택','세계 지역','국가 또는 지역','이야기 정렬','모든 지역','모든 국가 및 지역','최신순','인기순','제목순','국가순','세상을 향한 창','어디로 떠나고 싶나요?','맨 위로 ↑','게시','나만 보기 · 공개되지 않음','사진 선택'],
 ja:['世界','ギャラリー','私たちの目的','物語を共有','すべての写真には','ひとつの','世界が','あります。','ギャラリーを','探す','名前、タイトル、思い出、場所を検索...','自分の投稿のみ','テーマを選択','世界の地域','国または地域','並べ替え','すべての地域','すべての国と地域','新しい順','人気順','タイトル順','国順','世界への窓','どこへ行きたいですか？','トップへ戻る ↑','投稿','自分のみ · 非公開','写真を選択'],
 fr:['Le monde','Galerie','Notre mission','Racontez votre histoire','Chaque photo','contient','un monde','à découvrir.','Explorer la','galerie.','Rechercher des personnes, histoires, lieux...','Mes histoires uniquement','Choisir des thèmes','Région du monde','Pays ou territoire','Trier les histoires','Toutes les régions','Tous les pays','Plus récentes','Les plus aimées','Titre A–Z','Pays A–Z','Votre fenêtre sur le monde','Où souhaitez-vous aller ?','Retour en haut ↑','Publier','Moi uniquement · Non public','Choisir des photos'],
 de:['Die Welt','Galerie','Unser Ziel','Deine Geschichte teilen','Jedes Foto','enthält','eine Welt','voller Geschichten.','Galerie','entdecken','Namen, Titel, Erinnerungen, Orte suchen...','Nur meine Geschichten','Themen wählen','Weltregion','Land oder Gebiet','Geschichten sortieren','Alle Regionen','Alle Länder','Neueste zuerst','Beliebteste','Titel A–Z','Land A–Z','Dein Fenster zur Welt','Wohin möchtest du reisen?','Zurück nach oben ↑','Posten','Nur ich · Nicht öffentlich','Fotos auswählen'],
 es:['El mundo','Galería','Nuestro propósito','Comparte tu historia','Cada foto','guarda','un mundo','por descubrir.','Explora la','galería.','Buscar nombres, títulos, recuerdos, lugares...','Solo mis historias','Elegir temas','Región del mundo','País o territorio','Ordenar historias','Todas las regiones','Todos los países','Más recientes','Más queridas','Título A–Z','País A–Z','Tu ventana al mundo','¿Adónde te gustaría ir?','Publicar','Solo yo · No es público','Elegir fotografías']
 };
 const getSaved=()=>{try{return localStorage.getItem('wg_lang_override')||''}catch{return ''}};
 let locale=getSaved()||navigator.languages?.map(x=>x.slice(0,2).toLowerCase()).find(x=>supported.includes(x))||'en';
 function apply(){
  document.documentElement.lang=locale;
  const t=strings[locale]||strings.en;
  const selectors=['.nav-links a:nth-child(1)','.nav-links a:nth-child(2)','.nav-links a:nth-child(3)','.hero-actions [data-open-upload]'];
  for(let i=0;i<selectors.length;i++){const e=document.querySelector(selectors[i]);if(e){if(i===3){e.firstChild.textContent=t[i]+' ';}else e.textContent=t[i]}}
  const heading=document.querySelector('.hero-copy h1');if(heading){heading.innerHTML=`${escapeText(t[4])}<br>${escapeText(t[5])} <em>${escapeText(t[6])}</em><br>${escapeText(t[7])}`;}
  const gh=document.querySelector('.gallery-heading h2');if(gh)gh.innerHTML=escapeText(t[8])+' <em>'+escapeText(t[9])+'</em>';
  const search=document.getElementById('search');if(search)search.placeholder=t[10];
  const mine=document.querySelector('.wg-mine-toggle span');if(mine)mine.textContent=t[11];
  const choose=document.querySelector('#themeChoose span');if(choose)choose.textContent=t[12];
  const labels=document.querySelectorAll('.filter-field > span');for(const [i,txt] of [[0,t[13]],[1,t[14]],[3,t[15]]])if(labels[i])labels[i].textContent=txt;
  const continent=document.querySelector('#continentFilter option[value=""]');if(continent)continent.textContent=t[16];
  const country=document.querySelector('#countryFilter option[value=""]');if(country)country.textContent=t[17];
  const sort=document.getElementById('sortFilter');if(sort)for(const [key,label] of [['new',t[18]],['hearts',t[19]],['title',t[20]],['country',t[21]]]){const option=sort.querySelector(`option[value="${key}"]`);if(option)option.textContent=label;}
  const globeCaption=document.querySelector('.globe-top .eyebrow');if(globeCaption)globeCaption.textContent=t[22];
  const globeTitle=document.querySelector('.globe-title');if(globeTitle)globeTitle.textContent=t[23];
  const top=document.querySelector('.footrow a');if(top)top.textContent=t[24];
  const save=document.getElementById('submitStory');if(save&&!save.disabled)save.textContent=t[25];
  const foot=document.querySelector('.upload-footer > span');if(foot)foot.textContent=t[26];
  const photo=document.querySelector('.upload-zone > strong');if(photo)photo.textContent=t[27];
  const sel=document.getElementById('wgLanguageSelect');if(sel)sel.value=locale;
 }
 function escapeText(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function set(value,persist=true){if(!supported.includes(value))return;locale=value;if(persist){try{localStorage.setItem('wg_lang_override',value)}catch{}}apply();document.dispatchEvent(new CustomEvent('wg:locale',{detail:{language:locale}}));}
 async function savePreference(){const auth=window.WorldsGalleryAuth;const user=auth?.getCurrentUserId?.();if(!user)return;const result=await auth.getClient().from('wg_content_preferences').update({language_code:locale,language_auto:false}).eq('user_id',user);if(result.error)console.warn('Language preference was saved only in this browser:',result.error.message);}
 function mount(){const control=document.createElement('label');control.className='wg-locale-control';control.innerHTML='<span class="wg-locale-label">Language</span><select id="wgLanguageSelect" aria-label="Website language"><option value="en">English</option><option value="ko">한국어</option><option value="ja">日本語</option><option value="fr">Français</option><option value="de">Deutsch</option><option value="es">Español</option></select>';
  document.body.appendChild(control);control.querySelector('select').addEventListener('change',e=>{set(e.target.value);savePreference()});apply();
 }
 function positionLocale(){
  const control=document.querySelector('.wg-locale-control');if(!control)return;
  const footer=document.querySelector('.footrow');
  if(document.documentElement.classList.contains('wg-auth-ok')&&!document.body.classList.contains('portal-locked')&&footer){footer.appendChild(control);}else document.body.appendChild(control);
 }
 document.addEventListener('wg:authenticated',()=>queueMicrotask(positionLocale));
 document.addEventListener('wg:guest-ready',()=>queueMicrotask(positionLocale));
 new MutationObserver(positionLocale).observe(document.body,{attributes:true,attributeFilter:['class']});
 document.addEventListener('wg:authenticated',async e=>{if(getSaved())return;const user=e.detail?.user,profile=e.detail?.profile;if(!user)return;
  const client=window.WorldsGalleryAuth?.getClient?.();const result=await client.from('wg_content_preferences').select('language_code,language_auto').eq('user_id',user.id).maybeSingle();
  if(user.id!==window.WorldsGalleryAuth?.getCurrentUserId?.())return;
  const language=result.data?.language_auto===false?result.data?.language_code:(byCountry[profile?.home_country_code]||navigator.language.slice(0,2));set(supported.includes(language)?language:'en',false);
 });
 window.WorldsGalleryLocale={get:()=>locale,set};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
