/* Approximate country defaults. User override always wins. No precise location is requested. */
(() => {'use strict';
 const map={PH:'en',KR:'ko',JP:'ja',FR:'fr',DE:'de',ES:'es',US:'en',GB:'en',AU:'en',NZ:'en',CA:'en',SG:'en',IE:'en',MX:'es',AR:'es',CL:'es',CO:'es',PE:'es',UY:'es',EC:'es',DO:'es',VE:'es',GT:'es',CR:'es',BO:'es',PY:'es',HN:'es',SV:'es',NI:'es',CU:'es',AT:'de',CH:'de',LI:'de',LU:'fr',BE:'fr',MC:'fr'};
 const supported=new Set(['en','ko','ja','fr','de','es']);
 const defaultLang=()=>navigator.languages?.map(x=>x.split('-')[0]).find(x=>supported.has(x))||'en';
 let detected='',accountCountry='',choice='';
 const saved=()=>{try{return localStorage.getItem('wg_lang_override')||''}catch{return ''}};
 function choose(code,kind){
  code=String(code||'').toUpperCase();if(!/^[A-Z]{2}$/.test(code))return;
  if(kind==='detected')detected=code;else if(kind==='account')accountCountry=code;else choice=code;
  if(saved())return;
  window.WorldsGalleryLocale?.set?.(map[code]||defaultLang(),false);
 }
 function manualAuto(){
  const btn=document.getElementById('wgLocaleAuto');if(btn)btn.setAttribute('aria-pressed',String(!saved()));
 }
 function applyAuth(){
  const lang=window.WorldsGalleryLocale?.get?.()||'en';
  const t={en:['Create Account','Sign In','Create your World.','Welcome back.','Complete your World.','Email address','Password','Your home country','Create my World','Enter Worlds Gallery','Customer support / feedback','Language','My profile','Settings & privacy','Support & feedback','My stories','Share your story','Sign out'],
   ko:['계정 만들기','로그인','나만의 세계 만들기','다시 오신 것을 환영합니다.','내 세계 완성하기','이메일 주소','비밀번호','거주 국가','내 세계 만들기','월드 갤러리 입장','고객 지원 및 의견','언어','내 프로필','설정 및 개인정보','지원 및 의견','내 이야기','이야기 공유','로그아웃'],
   ja:['アカウント作成','ログイン','あなたの世界を作る','おかえりなさい。','世界を完成させましょう','メールアドレス','パスワード','居住国','マイワールドを作成','ギャラリーに入る','サポート・フィードバック','言語','マイプロフィール','設定とプライバシー','サポート','マイストーリー','物語を共有','ログアウト'],
   fr:['Créer un compte','Se connecter','Créez votre monde.','Bon retour.','Complétez votre monde.','Adresse e-mail','Mot de passe','Pays de résidence','Créer mon monde','Entrer dans la galerie','Assistance et avis','Langue','Mon profil','Paramètres et confidentialité','Assistance et avis','Mes histoires','Partager une histoire','Déconnexion'],
   de:['Konto erstellen','Anmelden','Erschaffe deine Welt.','Willkommen zurück.','Vervollständige deine Welt.','E-Mail-Adresse','Passwort','Heimatland','Meine Welt erstellen','Worlds Gallery betreten','Hilfe und Feedback','Sprache','Mein Profil','Einstellungen und Datenschutz','Hilfe und Feedback','Meine Geschichten','Geschichte teilen','Abmelden'],
   es:['Crear cuenta','Iniciar sesión','Crea tu mundo.','Bienvenido de nuevo.','Completa tu mundo.','Correo electrónico','Contraseña','País de origen','Crear mi mundo','Entrar a Worlds Gallery','Ayuda y comentarios','Idioma','Mi perfil','Configuración y privacidad','Ayuda y comentarios','Mis historias','Compartir historia','Cerrar sesión']}[lang];
  if(!t)return;
  const text=(q,v)=>{const n=document.querySelector(q);if(n)n.textContent=v};
  const leading=(q,v)=>{const el=document.querySelector(q);if(!el)return;const node=[...el.childNodes].find(x=>x.nodeType===3&&x.textContent.trim());if(node)node.textContent=v+' '};
  text('#wgTabSignUp',t[0]);text('#wgTabSignIn',t[1]);
  const mode=!document.getElementById('wgSetupForm')?.hidden?'setup':!document.getElementById('wgSignInForm')?.hidden?'signin':'signup';
  text('#wgAuthPanelTitle',t[mode==='signin'?3:mode==='setup'?4:2]);
  leading('#wgSignInForm label:nth-of-type(1)',t[5]);leading('#wgSignInForm label:nth-of-type(2)',t[6]);
  leading('#wgSignUpForm > label:nth-child(2)',t[5]);leading('#wgSignUpForm > label:nth-child(4)',t[7]);
  leading('#wgSignUpForm button[type="submit"]',t[8]);leading('#wgSignInForm button[type="submit"]',t[9]);
  text('#wgGuestSupport',t[10]);text('.wg-locale-label',t[11]);
  const extra={
   en:['Username','Display name','Confirm password','Your home country','Concern Type','Concern Details','Submit concern'],
   ko:['사용자 이름','표시 이름','비밀번호 확인','거주 국가','문의 유형','문의 내용','문의 보내기'],
   ja:['ユーザー名','表示名','パスワードを確認','居住国','お問い合わせの種類','お問い合わせ内容','送信する'],
   fr:['Nom d’utilisateur','Nom affiché','Confirmer le mot de passe','Pays de résidence','Type de demande','Détails','Envoyer'],
   de:['Benutzername','Anzeigename','Passwort bestätigen','Heimatland','Art der Anfrage','Beschreibung','Senden'],
   es:['Usuario','Nombre visible','Confirmar contraseña','País de origen','Tipo de consulta','Detalles','Enviar']
  }[lang];
  const named=(form,name,value)=>leading(form+' [name="'+name+'"]',value);
  for(const [selector,name,index] of [['#wgSignUpForm','username',0],['#wgSignUpForm','display_name',1],['#wgSetupForm','username',0],['#wgSetupForm','display_name',1]]){
   const e=document.querySelector(selector+' [name="'+name+'"]');if(e)leading(selector+' label:has([name="'+name+'"])',extra[index]);
  }
  leading('#wgSignUpForm label:has(input[name="confirm_password"])',extra[2]);
  leading('#wgSetupForm label:has(select[name="country_code"])',extra[3]);
  const support=document.getElementById('wgAcSupportForm');if(support){
   for(const [selector,i] of [['select[name="concern_type"]',4],['textarea[name="details"]',5]]){
    const element=support.querySelector(selector);if(element){const label=element.closest('label');const node=[...label.childNodes].find(x=>x.nodeType===3&&x.textContent.trim());if(node)node.textContent=extra[i]+' ';}
   }
   const b=support.querySelector('button[type="submit"]');if(b)b.textContent=extra[6];
  }

  const menuKeys={profile:12,settings:13,support:14,'my-stories':15,share:16,signout:17};
  document.querySelectorAll('[data-ac]').forEach(b=>{const i=menuKeys[b.dataset.ac],label=b.querySelector('span');if(i!==undefined&&label)label.textContent=t[i]});
 }
 function installAuto(){const root=document.querySelector('.wg-locale-control');if(!root||document.getElementById('wgLocaleAuto'))return;
  const b=document.createElement('button');b.type='button';b.id='wgLocaleAuto';b.className='wg-locale-auto';b.textContent='Auto';b.title='Use automatic country language';root.appendChild(b);
  b.addEventListener('click',async()=>{try{localStorage.removeItem('wg_lang_override')}catch{}
   const uid=window.WorldsGalleryAuth?.getCurrentUserId?.();if(uid){try{await window.WorldsGalleryAuth.getClient().from('wg_content_preferences').update({language_auto:true}).eq('user_id',uid)}catch{}}
   const c=choice||accountCountry||detected;if(c)choose(c,'reset');else window.WorldsGalleryLocale?.set?.(defaultLang(),false);manualAuto();
  });manualAuto();
 }
 async function lookupCountry(){
  if(saved())return;
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),3500);
  try{const r=await fetch('https://get.geojs.io/v1/ip/country.json',{signal:c.signal,credentials:'omit',cache:'no-store'});
    if(!r.ok)return;const data=await r.json();if(/^[A-Z]{2}$/.test(data.country||'')){detected=data.country;if(!accountCountry&&!choice&&!saved())choose(detected,'detected');}
  }catch{}finally{clearTimeout(timer)}
 }
 document.addEventListener('change',e=>{if(e.target.matches('#wgSignUpForm select[name="country_code"],#wgSetupForm select[name="country_code"]'))choose(e.target.value,'selected')});
 document.addEventListener('wg:country-selected',e=>choose(e.detail?.code,'selected'));
 document.addEventListener('wg:authenticated',e=>{accountCountry=e.detail?.profile?.home_country_code||'';choice='';if(!saved()&&accountCountry)choose(accountCountry,'account')});
 document.addEventListener('wg:locale',()=>{manualAuto();applyAuth()});
 document.addEventListener('wg:auth-mode',()=>queueMicrotask(applyAuth));
 document.addEventListener('wg:account-page',()=>queueMicrotask(applyAuth));
 document.addEventListener('wg:menu-rendered',()=>queueMicrotask(applyAuth));
 const mount=()=>{installAuto();applyAuth();lookupCountry()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
