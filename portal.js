/* Worlds Gallery V4 — full-screen cosmic gate, independent of any cloud service.
   NASA Blue Marble-derived map texture (bundled); Natural Earth public-domain simplified boundaries.
   Time shown is REPRESENTATIVE for each country; larger countries span several time zones. */
(()=>{'use strict';
 const gate=document.getElementById('worldPortal'); if(!gate)return; const EARTH_SOURCE='earth_bluemarble.jpg';
 const $p=id=>document.getElementById(id); const DEG=Math.PI/180;
 const groups={
  Luzon:{'Ilocos Region':['Ilocos Norte','Ilocos Sur','La Union','Pangasinan'],
   'Cagayan Valley':['Batanes','Cagayan','Isabela','Nueva Vizcaya','Quirino'],
   'Cordillera Administrative Region':['Abra','Apayao','Benguet','Ifugao','Kalinga','Mountain Province'],
   'Central Luzon':['Aurora','Bataan','Bulacan','Nueva Ecija','Pampanga','Tarlac','Zambales'],
   'National Capital Region':['Metro Manila'],
   'CALABARZON':['Batangas','Cavite','Laguna','Quezon','Rizal'],
   'MIMAROPA':['Marinduque','Occidental Mindoro','Oriental Mindoro','Palawan','Romblon'],
   'Bicol Region':['Albay','Camarines Norte','Camarines Sur','Catanduanes','Masbate','Sorsogon']},
  Visayas:{'Western Visayas':['Aklan','Antique','Capiz','Guimaras','Iloilo'],
   'Central Visayas':['Bohol','Cebu'],
   'Eastern Visayas':['Biliran','Eastern Samar','Leyte','Northern Samar','Samar','Southern Leyte'],
   'Negros Island Region':['Negros Occidental','Negros Oriental','Siquijor']},
  Mindanao:{'Zamboanga Peninsula':['Zamboanga del Norte','Zamboanga del Sur','Zamboanga Sibugay'],
   'Northern Mindanao':['Bukidnon','Camiguin','Lanao del Norte','Misamis Occidental','Misamis Oriental'],
   'Davao Region':['Davao de Oro','Davao del Norte','Davao del Sur','Davao Occidental','Davao Oriental'],
   'SOCCSKSARGEN':['Cotabato','Sarangani','South Cotabato','Sultan Kudarat'],
   'Caraga':['Agusan del Norte','Agusan del Sur','Dinagat Islands','Surigao del Norte','Surigao del Sur'],
   'Bangsamoro Autonomous Region':['Basilan','Lanao del Sur','Maguindanao del Norte','Maguindanao del Sur','Sulu','Tawi-Tawi']}
 };
 // Representative city samples, never asserted to be a comprehensive locality directory.
 const sampleCities={
  Bataan:['Balanga','Hermosa','Dinalupihan','Orani','Samal','Abucay','Pilar','Limay','Mariveles','Bagac','Morong','Orion'],
  Pampanga:['Angeles','San Fernando','Mabalacat','Porac','Guagua','Floridablanca'],
  Bulacan:['Malolos','Meycauayan','San Jose del Monte','Baliwag','Plaridel'],
  Cebu:['Cebu City','Mandaue','Lapu-Lapu','Carcar','Danao'],
  Iloilo:['Iloilo City','Oton','Pavia','Leganes','Passi'],
  'Metro Manila':['Manila','Quezon City','Makati','Taguig','Pasig','Caloocan'],
  'Davao del Sur':['Davao City','Digos','Bansalan','Hagonoy']
 };
 const knownMeta=typeof COUNTRY_META==='object'?COUNTRY_META:{};
 const world=typeof WORLD_GEOMETRY==='object'?WORLD_GEOMETRY:[];
 const countries=typeof COUNTRIES==='object'?COUNTRIES:[];
 const byIso=new Map(world.map(c=>[c.c,c]));
 const byName=new Map(countries.map(c=>[c[0],c[1]]));
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pos={lon:120.8,lat:15.6,scale:1.0};
 const target={lon:120.8,lat:15.6,scale:1.0};
 let dragging=false,dragged=false,pointerStart=null,pointerLast=null,velocityLon=0,velocityLat=0;
 let phase='globe',stage='country',selectedCode='',group='',region='',province='',city='',otherRegion='';
 let lastFacing='',lastClockAt=0,lastStars=0,lastEarth=0,skyLevel=.75,starOffsetX=0,starOffsetY=0,starKick=0,searchOpen=false;
 let delayedPanel=null;
 const globeCanvas=$p('portalEarth'),starCanvas=$p('portalStars');
 const cgl=globeCanvas.getContext('webgl',{alpha:true,antialias:true,depth:false,stencil:false,premultipliedAlpha:false})||globeCanvas.getContext('experimental-webgl',{alpha:true});
 let shader=null,shaderProgram=null,texture=null,glReady=false;
 function compile(gl,type,source){const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh}
 function initGl(){if(!cgl)return false;
  try{
   const vert=`attribute vec2 aPos; void main(){gl_Position=vec4(aPos,0.0,1.0);}`;
   const frag=`precision highp float;
    uniform vec2 uRes;uniform vec2 uRot;uniform sampler2D uEarth;uniform float uScale;uniform float uMood;uniform float uSpin;
    const float PI=3.141592653589793;
    void main(){vec2 frag=gl_FragCoord.xy;vec2 p=(frag-uRes*.5)/ (min(uRes.x*.435,uRes.y*.438)*uScale);float r2=dot(p,p);
     if(r2>1.42){gl_FragColor=vec4(0.0);return;}
     if(r2>1.0){float rr=sqrt(r2)-1.0;float atmo=exp(-rr*26.0)*.30+exp(-rr*95.0)*.22;gl_FragColor=vec4(.19,.52,.94,atmo*(.78+uMood*.38));return;}
     vec3 n=vec3(p.x,p.y,sqrt(max(.00001,1.0-r2)));
     float latitude=asin(clamp(n.y*cos(uRot.y)+n.z*sin(uRot.y),-1.0,1.0));
     float longitude=uRot.x+atan(n.x,n.z*cos(uRot.y)-n.y*sin(uRot.y));
     vec2 uv=vec2(fract(longitude/(2.0*PI)+.5),latitude/PI+.5);
     vec3 surface=texture2D(uEarth,uv).rgb;
     float diffuse=max(dot(n,normalize(vec3(-.52,.39,.78))),0.0);
     float shade=.38+.79*diffuse;
     vec3 world=surface*shade*(.50+.50*uMood);
     float ocean=clamp((surface.b-surface.r)*2.0,0.0,1.0);
     world+=vec3(.01,.065,.13)*ocean*diffuse;
     float ring=pow(1.0-n.z,3.1);world+=vec3(.05,.33,.70)*ring*(.28+uMood*.13);
     float glint=pow(max(dot(reflect(-normalize(vec3(-.52,.39,.78)),n),vec3(0.,0.,1.)),0.),25.0)*ocean;
     world+=vec3(.12,.28,.41)*glint*.22;
     gl_FragColor=vec4(world,1.0);
    }`;
   const gl=cgl;shaderProgram=gl.createProgram();gl.attachShader(shaderProgram,compile(gl,gl.VERTEX_SHADER,vert));gl.attachShader(shaderProgram,compile(gl,gl.FRAGMENT_SHADER,frag));gl.linkProgram(shaderProgram);
   if(!gl.getProgramParameter(shaderProgram,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(shaderProgram));gl.useProgram(shaderProgram);
   const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
   const loc=gl.getAttribLocation(shaderProgram,'aPos');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
   shader={uRes:gl.getUniformLocation(shaderProgram,'uRes'),uRot:gl.getUniformLocation(shaderProgram,'uRot'),uEarth:gl.getUniformLocation(shaderProgram,'uEarth'),uScale:gl.getUniformLocation(shaderProgram,'uScale'),uMood:gl.getUniformLocation(shaderProgram,'uMood'),uSpin:gl.getUniformLocation(shaderProgram,'uSpin')};
   texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
   const placeholder=new Uint8Array([45,98,145,255]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,placeholder);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.uniform1i(shader.uEarth,0);gl.clearColor(0,0,0,0);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
   const img=new Image();window.WGTextureLoaded='pending';img.onload=()=>{window.WGTextureLoaded='loaded '+img.width+'x'+img.height+' /gl '+gl.getError();gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,img);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);glReady=true;window.WGTextureLoaded+=' / post '+gl.getError()};img.onerror=()=>{window.WGTextureLoaded='error';glReady=false};img.src=EARTH_SOURCE;glReady=true;return true;
  }catch(err){console.warn('WebGL globe unavailable; fallback mode:',err);return false}
 }
 const hasGL=initGl();let ctxFallback=null,earthFallback=null;
 if(!hasGL){ctxFallback=globeCanvas.getContext('2d');earthFallback=new Image();earthFallback.src=EARTH_SOURCE;}
 function canvasResize(){const dpr=Math.max(.45,Math.min(window.devicePixelRatio||1,1.15,1070/window.innerWidth,720/window.innerHeight));for(const can of [globeCanvas,starCanvas]){can.width=Math.floor(window.innerWidth*dpr);can.height=Math.floor(window.innerHeight*dpr);can.style.width=window.innerWidth+'px';can.style.height=window.innerHeight+'px';}if(hasGL)cgl.viewport(0,0,globeCanvas.width,globeCanvas.height);}
 canvasResize();window.addEventListener('resize',canvasResize);
 function renderEarth(){if(!hasGL){if(ctxFallback){
   const w=globeCanvas.width,h=globeCanvas.height,r=Math.min(w*.435,h*.438)*pos.scale,cx=w/2,cy=h/2;
   const ctx=ctxFallback;ctx.clearRect(0,0,w,h);
   const halo=ctx.createRadialGradient(cx,cy,r*.78,cx,cy,r*1.18);halo.addColorStop(0,'rgba(70,158,229,.08)');halo.addColorStop(.69,'rgba(63,163,247,.13)');halo.addColorStop(1,'rgba(63,163,247,0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(cx,cy,r*1.19,0,Math.PI*2);ctx.fill();
   ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
   if(earthFallback&&earthFallback.complete&&earthFallback.naturalWidth){
     const iw=earthFallback.naturalWidth,ih=earthFallback.naturalHeight,sxw=2.8;
     const north=Math.min(90,pos.lat+82),south=Math.max(-90,pos.lat-82),sy=(90-north)/180*ih,sh=Math.max(50,(north-south)/180*ih);
     for(let xx=-r;xx<r;xx+=sxw){const nx=Math.max(-.9999,Math.min(.9999,(xx+sxw*.5)/r)),yd=r*Math.sqrt(Math.max(0,1-nx*nx));
       const lon=(((pos.lon+Math.asin(nx)/DEG)+540)%360)-180;
       const srcX=(lon+180)/360*iw;
       ctx.drawImage(earthFallback,srcX,sy,Math.max(1,iw*.0009),sh,cx+xx,cy-yd,sxw+1,yd*2);
     }
   } else {const g=ctx.createRadialGradient(cx-r*.24,cy-r*.3,10,cx,cy,r);g.addColorStop(0,'#66b7d3');g.addColorStop(.65,'#2a6e9c');g.addColorStop(1,'#102b54');ctx.fillStyle=g;ctx.fillRect(cx-r,cy-r,r*2,r*2);}
   const shine=ctx.createLinearGradient(cx-r,cy-r*.8,cx+r*.6,cy+r*.9);shine.addColorStop(0,'rgba(198,236,250,.22)');shine.addColorStop(.50,'rgba(31,60,84,.05)');shine.addColorStop(1,`rgba(2,9,22,${.50+(1-skyLevel)*.30})`);ctx.fillStyle=shine;ctx.fillRect(cx-r,cy-r,r*2,r*2);
   const edge=ctx.createRadialGradient(cx,cy,r*.45,cx,cy,r);edge.addColorStop(0,'rgba(0,0,0,0)');edge.addColorStop(.72,'rgba(0,0,0,.03)');edge.addColorStop(1,'rgba(3,17,32,.64)');ctx.fillStyle=edge;ctx.fillRect(cx-r,cy-r,r*2,r*2);
   ctx.restore();ctx.strokeStyle='rgba(118,213,251,.44)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
 }}else{const gl=cgl;gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(shaderProgram);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform2f(shader.uRes,globeCanvas.width,globeCanvas.height);gl.uniform2f(shader.uRot,pos.lon*DEG,pos.lat*DEG);gl.uniform1f(shader.uScale,pos.scale);gl.uniform1f(shader.uMood,skyLevel);gl.uniform1f(shader.uSpin,0);gl.drawArrays(gl.TRIANGLE_STRIP,0,4)}}

 const starCtx=starCanvas.getContext('2d');let starSeed=14;function rand(){starSeed=(starSeed*1664525+1013904223)>>>0;return starSeed/4294967295}
 const stars=Array.from({length:560},()=>({x:rand(),y:rand(),r:.2+rand()*1.25,a:.14+rand()*.8,depth:.2+rand()*1.8,p:rand()*6.28}));
 function renderStars(now){const w=starCanvas.width,h=starCanvas.height;starCtx.clearRect(0,0,w,h);const ratio=starCanvas.width/window.innerWidth;starCtx.save();
 for(const s of stars){let x=(s.x*w+starOffsetX*s.depth*ratio + w*2)%w,y=(s.y*h+starOffsetY*s.depth*ratio+h*2)%h;const tw=.70+.28*Math.sin(now*.0014+s.p);starCtx.beginPath();starCtx.arc(x,y,s.r*ratio*(1+starKick*.06),0,Math.PI*2);starCtx.fillStyle=`rgba(218,239,255,${Math.min(1,s.a*tw)})`;starCtx.fill();}
 starCtx.restore()}
 const metaFor=code=>knownMeta[code]||byIso.get(code)||{};
 function radiusPx(){return Math.min(window.innerWidth*.435,window.innerHeight*.438)*pos.scale}
 function screenToGeo(x,y){const r=radiusPx(),nx=(x-window.innerWidth*.5)/r,ny=(window.innerHeight*.5-y)/r;const rr=nx*nx+ny*ny;if(rr>1)return null;const z=Math.sqrt(1-rr),p=pos.lat*DEG;
  const lat=Math.asin(Math.max(-1,Math.min(1,ny*Math.cos(p)+z*Math.sin(p))))/DEG;
  const lon=(((pos.lon+Math.atan2(nx,z*Math.cos(p)-ny*Math.sin(p))/DEG)+540)%360)-180;
  return {lon,lat};}
 const geoByCode=new Map(world.map(c=>[c.c,c]));
 // Geographic point-in-polygon, sufficient for this demo's simplified borders.
 function pointInPoly(lon,lat,coords){let inside=false;for(let i=0,j=coords.length-1;i<coords.length;j=i++){const a=coords[i],b=coords[j];if((a[1]>lat)!==(b[1]>lat) && lon<(b[0]-a[0])*(lat-a[1])/(b[1]-a[1])+a[0])inside=!inside}return inside}
 function countryAt(lon,lat){for(const c of world){if(!c.c||c.c==='AQ')continue;for(const poly of c.p){if(poly.length>2&&pointInPoly(lon,lat,poly))return c.c}}return ''}
 function nearestCountry(lon,lat,maxDeg=6){let best='',bestDist=maxDeg;for(const c of world){if(!c.c||c.c==='AQ')continue;for(const polygon of c.p){const cx=polygon.reduce((a,p)=>a+p[0],0)/polygon.length,cy=polygon.reduce((a,p)=>a+p[1],0)/polygon.length;let dx=Math.abs(lon-cx);dx=Math.min(dx,360-dx);const d=Math.hypot(dx*Math.cos(lat*DEG),lat-cy);if(d<bestDist){best=c.c;bestDist=d}}}return best}
 const codeAt=(lon,lat,dist=5)=>countryAt(lon,lat)||nearestCountry(lon,lat,dist);
 function shortLon(a,b){return ((b-a+540)%360)-180}
 function interpol(current,to,t){return current+(to-current)*t}
 function currentCenterCountry(){return codeAt(pos.lon,pos.lat,3)}
 // Coarse geographic timezone hint for selected multi-zone countries; not a legal timezone boundary map.
 function zoneForCoordinate(code,lon,lat){
   if(code==='US')return lon<-153?'Pacific/Honolulu':lon<-130?'America/Anchorage':lon<-113?'America/Los_Angeles':lon<-100?'America/Denver':lon<-85?'America/Chicago':'America/New_York';
   if(code==='CA')return lon<-118?'America/Vancouver':lon<-104?'America/Edmonton':lon<-90?'America/Winnipeg':lon<-65?'America/Toronto':'America/Halifax';
   if(code==='AU')return lon<129?'Australia/Perth':lon<141?'Australia/Adelaide':'Australia/Sydney';
   if(code==='BR')return lon<-64?'America/Manaus':lon<-47?'America/Cuiaba':'America/Sao_Paulo';
   if(code==='RU')return lon<44?'Europe/Moscow':lon<64?'Asia/Yekaterinburg':lon<94?'Asia/Novosibirsk':lon<115?'Asia/Irkutsk':'Asia/Vladivostok';
   if(code==='ID')return lon<115?'Asia/Jakarta':lon<130?'Asia/Makassar':'Asia/Jayapura';
   if(code==='MX')return lon<-112?'America/Tijuana':lon<-100?'America/Hermosillo':'America/Mexico_City';
   return null;
 }
 function timeData(code,lon,now=new Date()){
  const regional=zoneForCoordinate(code,lon,0);
  const tz=regional||(typeof PORTAL_TIMEZONES==='object'&&PORTAL_TIMEZONES[code])||null;
  try{
   if(tz){const display=new Intl.DateTimeFormat('en-US',{timeZone:tz,hour:'2-digit',minute:'2-digit',hour12:true}).format(now);
     const hh=Number(new Intl.DateTimeFormat('en-US',{timeZone:tz,hour:'numeric',hourCycle:'h23'}).format(now))%24;
     return {display,hour:hh,zone:tz,representative:!regional};}
  }catch{}
  // Fallback for open ocean or territories with no IANA mapping: approximate solar time, clearly labeled.
  const utc=now.getUTCHours()+now.getUTCMinutes()/60,hrs=(utc+lon/15+24)%24,h=Math.floor(hrs),m=Math.floor(60*(hrs-h)),t=`${String(h%12||12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;
  return {display:t,hour:hrs,zone:'Solar time estimate',representative:false};
 }
 function updateClock(nowMs){if(nowMs-lastClockAt<500)return;lastClockAt=nowMs;const code=selectedCode||currentCenterCountry(),name=code?byName.get(code)||(geoByCode.get(code)?.n)||code:'Open ocean';
  const time=timeData(code,pos.lon),hour=time.hour;
  const sky=hour>=6&&hour<16?'day':(hour>=16&&hour<19)||(hour>=5&&hour<6)?'twilight':'night';
  gate.dataset.sky=sky;skyLevel=sky==='day'?1:sky==='twilight'?.77:.50;
  $p('clockTime').textContent=time.display;
  $p('clockPlace').textContent=name;
  $p('clockNote').textContent=time.zone==='Solar time estimate'?'Approximate local solar time':(time.representative?'Reference time · ':'Estimated regional time · ')+time.zone;
  $p('clockSymbol').textContent=sky==='day'?'☀':sky==='twilight'?'◒':'☾';
  if(phase==='globe'&&lastFacing!==name){lastFacing=name;$p('portalFacing').textContent=code?`FACING ${name.toUpperCase()}`:'EXPLORING THE OPEN OCEAN';}
 }
 function frame(now){if(document.hidden){requestAnimationFrame(frame);return;}
  if(!dragging){target.lon+=velocityLon;target.lat=Math.max(-68,Math.min(68,target.lat+velocityLat));velocityLon*=.90;velocityLat*=.88;if(Math.abs(velocityLon)<.0003)velocityLon=0;if(Math.abs(velocityLat)<.0003)velocityLat=0;}
  const w=phase==='zoom'?.090:.13;pos.lon+=shortLon(pos.lon,target.lon)*w;pos.lat=interpol(pos.lat,target.lat,w);pos.scale=interpol(pos.scale,target.scale,.095);
  if(Math.abs(shortLon(pos.lon,target.lon))<.0001)pos.lon=target.lon;
  starOffsetX=interpol(starOffsetX,Math.max(-100,Math.min(100,-shortLon(pos.lon,120)*.3)),.04);
  starOffsetY=interpol(starOffsetY,Math.max(-65,Math.min(65,pos.lat*.6)),.035);starKick*=.93;
  gate.style.setProperty('--px',(starOffsetX*.34).toFixed(1)+'px');gate.style.setProperty('--py',(starOffsetY*.32).toFixed(1)+'px');
  if(now-lastClockAt>=500)updateClock(now);
  if(now-lastStars>=55){renderStars(now);lastStars=now;}
  if(now-lastEarth>45){renderEarth();lastEarth=now;}requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
 function eventXY(e){const rect=globeCanvas.getBoundingClientRect();return {x:e.clientX-rect.left,y:e.clientY-rect.top}}
 globeCanvas.addEventListener('pointerdown',e=>{if(phase!=='globe'||searchOpen)return;pointerStart=eventXY(e);pointerLast=pointerStart;dragging=true;dragged=false;velocityLon=0;velocityLat=0;globeCanvas.setPointerCapture(e.pointerId)});
 globeCanvas.addEventListener('pointermove',e=>{if(phase!=='globe'||searchOpen)return;const pt=eventXY(e);
  if(!dragging){const g=screenToGeo(pt.x,pt.y);const code=g?codeAt(g.lon,g.lat,2):'';const tip=$p('portalHover');if(code){tip.hidden=false;tip.textContent=byName.get(code)||code;tip.style.left=Math.max(8,Math.min(window.innerWidth-190,pt.x+15))+'px';tip.style.top=Math.max(10,pt.y-34)+'px';}else tip.hidden=true;return;}
  const dx=pt.x-pointerLast.x,dy=pt.y-pointerLast.y;if(Math.hypot(pt.x-pointerStart.x,pt.y-pointerStart.y)>7)dragged=true;
  if(dragged){target.lon-=dx*.28;target.lat=Math.max(-68,Math.min(68,target.lat+dy*.22));velocityLon=-dx*.12;velocityLat=dy*.09;starKick=Math.min(3,starKick+.1);lastClockAt=0;}
  pointerLast=pt;
 });
 globeCanvas.addEventListener('pointerup',e=>{if(!dragging)return;dragging=false;const pt=eventXY(e);if(!dragged){const g=screenToGeo(pt.x,pt.y);if(g){const code=codeAt(g.lon,g.lat,5);if(code)selectCountry(code);else showTip('Open ocean — keep spinning to find land.',pt.x,pt.y)}}try{globeCanvas.releasePointerCapture(e.pointerId)}catch{}});
 globeCanvas.addEventListener('pointercancel',()=>dragging=false);
 globeCanvas.addEventListener('pointerleave',()=>{$p('portalHover').hidden=true});
 globeCanvas.addEventListener('wheel',e=>{if(phase!=='globe')return;e.preventDefault();target.scale=Math.max(.77,Math.min(1.48,target.scale+(e.deltaY<0?.11:-.11)));starKick=3;}, {passive:false});
 function showTip(message,x=window.innerWidth/2,y=window.innerHeight*.78){const tip=$p('portalHover');tip.hidden=false;tip.textContent=message;tip.style.left=Math.min(window.innerWidth-280,Math.max(8,x))+'px';tip.style.top=Math.min(window.innerHeight-48,Math.max(12,y))+'px';setTimeout(()=>{tip.hidden=true},1600)}
 function selectCountry(code){if(!code||!byName.has(code))return;document.dispatchEvent(new CustomEvent('wg:country-selected',{detail:{code,source:'portal'}}));selectedCode=code;group='';region='';province='';city='';otherRegion='';stage='country';phase='zoom';gate.dataset.phase='zoom';$p('portalHover').hidden=true;$p('portalSearchPane').hidden=true;searchOpen=false;
  const place=metaFor(code);target.lon=place.lon??byIso.get(code)?.lon??0;target.lat=Math.max(-52,Math.min(52,place.lat??byIso.get(code)?.lat??0));target.scale=1.67;velocityLon=velocityLat=0;lastClockAt=0;
  if(delayedPanel)clearTimeout(delayedPanel);delayedPanel=setTimeout(()=>{phase='drill';gate.dataset.phase='drill';renderDrill()},940);
 }
 function listButton(label,key,value,detail=''){return `<button type="button" class="choice-btn" data-choice="${esc(key)}" data-value="${esc(value)}"><div><strong>${esc(label)}</strong>${detail?`<div><span>${esc(detail)}</span></div>`:''}</div><div class="choice-arrow" aria-hidden="true">↗</div></button>`}
 function fmt(n){return Number(n).toFixed(2)}
 // Coastal outlines are derived from GSHHG (actual shoreline geometry). These ARE NOT political subdivisions.
 // Regional, provincial, municipal focus is by coordinates and OSM link; no invented administrative borders.
 const focusData={
 'Philippines':{lat:12.8797,lon:121.774,b:[115.5,128.5,4,21.4],z:5.7},
 'Luzon':{lat:16.18,lon:121.0,b:[118,126.0,11.7,21.5],z:6.6},
 'Visayas':{lat:11.2,lon:123.5,b:[121,126.3,9.0,13.6],z:7},
 'Mindanao':{lat:7.6,lon:124.5,b:[121.0,127.2,5.3,10.7],z:7},
 'Central Luzon':{lat:15.42,lon:120.8,b:[119.55,122.3,13.9,16.8],z:8},
 'Bataan':{lat:14.69,lon:120.42,b:[120.05,120.83,14.13,15.1],z:10},
 'Hermosa':{lat:14.829738,lon:120.508208,b:[120.40,120.62,14.72,14.92],z:13}
 };
 function activePlace(){return city||province||region||group||'Philippines'}
 function geoFocus(name){return focusData[name]||focusData[group]||focusData.Philippines}
 function verifiedAdminBoundary(name){
  const level=stage==='region'?'ADM1':stage==='province'?'ADM2':stage==='city'?'ADM3':'';
  if(!level || !window.PH_ADMIN_GEO || !window.PH_ADMIN_GEO[level])return null;
  const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
  const matches=window.PH_ADMIN_GEO[level].features.filter(f=>{
   const n=norm(f.properties?.shapeName||f.properties?.name||'');
   return n && (n===norm(name) || n===norm('Region III '+name) || n.endsWith(norm(name)));
  });
  if(matches.length!==1)return null; // Avoid wrong localities sharing a name across provinces; verify in production.
  const f=matches[0],geometry=f.geometry;if(!geometry || !['Polygon','MultiPolygon'].includes(geometry.type))return null;
  const polys=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;
  const pts=polys.flatMap(poly=>poly.flat());if(!pts.length)return null;
  const bounds=[Math.min(...pts.map(q=>q[0])),Math.max(...pts.map(q=>q[0])),Math.min(...pts.map(q=>q[1])),Math.max(...pts.map(q=>q[1]))];
  return {polys,bounds,level};
 }
 function coastlineSvg(name,showGroups=false){
  const focus=geoFocus(name),admin=verifiedAdminBoundary(name),rawBounds=admin?admin.bounds:focus.b;
  const [aa,bb,cc,dd]=rawBounds,wx=bb-aa,hy=dd-cc,margin=Math.max(wx,hy)*.19;
  const bounds=admin?[aa-margin,bb+margin,cc-margin,dd+margin]:rawBounds,[a,b,c,d]=bounds,ww=500,hh=480;
  const sx=x=>((x-a)/(b-a)*ww),sy=y=>((d-y)/(d-c)*hh);
  const polygons=admin?admin.polys.map(poly=>poly.map(ring=>{
   const path=ring.map((pt,i)=>(i?'L':'M')+fmt(sx(pt[0]))+' '+fmt(sy(pt[1]))).join(' ')+' Z';
   return `<path d="${path}" class="wg-admin-shape"/>`;
  }).join('')).join(''):(window.PH_COASTLINE||[]).map(poly=>{
    if(!poly.some(pt=>pt[0]>=a-.6&&pt[0]<=b+.6&&pt[1]>=c-.6&&pt[1]<=d+.6))return '';
    const path=poly.map((pt,i)=>(i?'L':'M')+fmt(sx(pt[0]))+' '+fmt(sy(pt[1]))).join(' ')+' Z';
    return `<path d="${path}" class="wg-real-coast"/>`;
  }).join('');
  const pin=focusData[name],marker=(pin&&!showGroups&&!admin)?`<g transform="translate(${fmt(sx(pin.lon))},${fmt(sy(pin.lat))})"><circle r="22" fill="#7de5e8" opacity=".13"/><circle r="9" fill="none" stroke="#e7f5dc" stroke-width="2"/><circle r="3.5" fill="#ffde96"/></g>`:'';
  const groupLocations=[['Luzon',121,16.1],['Visayas',123.4,11.0],['Mindanao',124.4,7.4]];
  const labelButtons=showGroups?groupLocations.map(([n,lon,lat])=>`<button type="button" data-choice="group" data-value="${esc(n)}" class="wg-map-button" style="left:${fmt(sx(lon)/5)}%;top:${fmt(sy(lat)/4.8)}%">${esc(n)}</button>`).join(''):'';
  const label=admin?`${name.toUpperCase()} · GEOboundaries ${admin.level} · SEE CREDITS`:showGroups?'PHILIPPINE COASTLINES · GSHHG':`${name.toUpperCase()} · COASTLINE CONTEXT · NOT AN ADMIN BOUNDARY`;
  return `<div class="wg-geo-map"><svg viewBox="0 0 500 480" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${admin?'Administrative boundary':'Coastline context'} near ${esc(name)}"><defs><linearGradient id="seaPaint" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0e3553"/><stop offset="1" stop-color="#061c36"/></linearGradient></defs><rect width="500" height="480" fill="url(#seaPaint)"/>${polygons}${marker}</svg>${labelButtons}<span class="wg-map-caption">${esc(label)}</span></div>`;
 }
 function mapLinks(name){const f=geoFocus(name),lat=f.lat,lon=f.lon;
  const ext=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name+", Philippines")}`;
  return `<a href="${esc(ext)}" target="_blank" rel="noopener noreferrer" class="wg-explore-map">Open in Google Maps ↗</a>`;
 }
 function realHighlight(name){const data=(window.WG_HIGHLIGHTS||{})[name];if(!data)return `<div class="wg-edu-fallback"><strong>${esc(name)}</strong><span>Curated photo highlight not yet added. The map above shows a geographic focus only; it does not pretend to draw official province or city boundaries.</span></div>`;
  return `<section class="wg-highlight"><div class="wg-highlight-photo"><img src="${esc(data.url)}" alt="${esc(data.title)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.parentElement.classList.add('offline')"><span class="wg-photo-fallback">Image is online-only · geographic map remains available</span></div><div class="wg-highlight-content"><div class="wg-highlight-label">PLACE HIGHLIGHT</div><strong>${esc(data.title)}</strong><p>${esc(data.description)}</p><small>Photo: <a target="_blank" rel="noopener noreferrer" href="${esc(data.source)}">${esc(data.author)}</a> · <a target="_blank" rel="noopener noreferrer" href="${esc(data.license_url)}">${esc(data.license)}</a></small></div></section>`;
 }
 function placeMap(name,showGroupPills=false){return `<aside class="wg-place-panel"><div class="wg-place-map-shell">${coastlineSvg(name,showGroupPills)}${mapLinks(name)}</div>${realHighlight(name)}</aside>`}
 function groupMap(){return placeMap(stage==='country'?'Philippines':group,stage==='country')}
 function sidePanel(){return placeMap(activePlace())}
 function currentTrail(){return [byName.get(selectedCode)||'',group,region,province,city||otherRegion].filter(Boolean)}
 function breadcrumb(){return ['EARTH',...currentTrail()].map(esc).join('<span class="sep"> / </span>')}
 function generateDetail(){const country=byName.get(selectedCode)||selectedCode;
  let label=country,title=country,lead='',options='',right='',stageHint='';
  if(selectedCode==='PH'){
   if(stage==='country'){title='The Philippines';lead='From the mountains of Luzon to the islands of Visayas and Mindanao. Choose an island group, or explore every story from the Philippines.';stageHint='CHOOSE AN ISLAND GROUP';options='<div class="choice-list">'+['Luzon','Visayas','Mindanao'].map(s=>listButton(s,'group',s,'Explore its regions and stories')).join('')+'</div>';right=groupMap();}
   if(stage==='group'){title=group;lead=`Explore the regions of ${group}. Each stop brings you closer to the lives and memories shared there.`;stageHint='CHOOSE A REGION';options='<div class="choice-grid">'+Object.keys(groups[group]||{}).map(s=>listButton(s,'region',s)).join('')+'</div>';right=groupMap();}
   if(stage==='region'){title=region;lead=`One step closer. Select a province, or open the ${region} gallery directly.`;stageHint='CHOOSE A PROVINCE';options='<div class="choice-grid">'+(groups[group]?.[region]||[]).map(s=>listButton(s,'province',s)).join('')+'</div>';right=placeMap(region);}
   if(stage==='province'){title=province;lead=`Discover a local highlight and explore ${province} on a real map. Choose a city or municipality to continue.`;stageHint='SELECTED CITIES / MUNICIPALITIES (NOT A COMPLETE LIST)';const list=sampleCities[province]||[];options=list.length?'<div class="choice-grid">'+list.map(s=>listButton(s,'city',s)).join('')+'</div>':'<p style="color:#b3d3e3">A complete locality index is not available here yet. You can still open the provincial gallery.</p>';right=sidePanel();}
   if(stage==='city'){title=city;lead=`Welcome to ${city}, ${province}. Explore its local landmarks and stories, or open the gallery.`;stageHint='YOUR DESTINATION';options='<p style="color:#b9d7e7">Open the gallery to see the stories associated with your selected location. Only original, approved stories will be shown publicly when community publishing opens.</p>';right=sidePanel();}
  } else if(stage==='country'){title=country;lead=`You're facing ${country}. Explore stories from this country, or look deeper into its regions before opening the gallery.`;stageHint='EXPLORE A REGION OR STATE';const arr=(typeof SUBDIVISIONS==='object'?(SUBDIVISIONS[selectedCode]||[]):[]).filter(r=>!r.parent).slice(0,16);options=arr.length?'<div class="choice-grid">'+arr.map(r=>listButton(r.name,'other-region',r.code||r.name,r.type||'Region')).join('')+'</div>':'<p style="color:#b3d3e3">Country-level exploration is ready. Detailed geographic boundaries are planned for later versions.</p>';right=`<aside class="wg-other-country"><div class="wg-other-earth"></div><strong>${esc(country)}</strong><p>Country exploration is available. Verified local maps and photo highlights for this destination are awaiting curation; no fabricated shapes will be shown.</p></aside>`;}
  else{title=otherRegion||country;lead=`You've selected ${otherRegion} in ${country}. Open stories from here, or return to choose a different place.`;stageHint='YOUR DESTINATION';options='<p style="color:#b3d3e3">Detailed regional map outlines for this country are still being prepared. The gallery supports filtering by region name.</p>';right=`<aside class="wg-other-country"><div class="wg-other-earth"></div><strong>${esc(otherRegion||country)}</strong><p>Regional boundary data and local landmark photos have not yet been verified for this country.</p></aside>`;}
  const backLabel=stage==='country'?'Back to Earth':'Back one level';
  return `<button type="button" class="portal-back" data-choice="back">← ${backLabel}</button><div class="detail-shell"><div class="detail-copy"><div class="portal-breadcrumb">${breadcrumb()}</div><h2 class="portal-country-name">${esc(title)}</h2><p class="portal-lead">${esc(lead)}</p><div class="detail-section-label">${stageHint}</div>${options}<div class="detail-actions"><button type="button" class="portal-cta" data-choice="enter">Explore ${esc(country)} gallery →</button></div></div>${right}</div>`;
 }
 function renderDrill(){gate.dataset.stage=stage;$p('portalDrill').innerHTML=generateDetail();$p('portalDrill').hidden=false;$p('portalDrill').scrollTop=0;}
 function goBack(){if(delayedPanel){clearTimeout(delayedPanel);delayedPanel=null}
  if(stage==='city'){city='';stage='province'}else if(stage==='province'){province='';stage='region'}else if(stage==='region'){region='';stage='group'}else if(stage==='group'){group='';stage='country'}else if(stage==='other-region'){otherRegion='';stage='country'}else{resetToEarth();return}renderDrill()}
 $p('portalDrill').addEventListener('click',e=>{const btn=e.target.closest('[data-choice]');if(!btn)return;const cmd=btn.dataset.choice,value=btn.dataset.value||'';
  if(cmd==='enter'){enterGallery();return}if(cmd==='back'){goBack();return}
  if(cmd==='group'){group=value;stage='group';target.scale=1.78}
  if(cmd==='region'){region=value;stage='region';target.scale=1.85}
  if(cmd==='province'){province=value;stage='province';target.scale=1.90}
  if(cmd==='city'){city=value;stage='city';target.scale=1.95}
  if(cmd==='other-region'){otherRegion=((SUBDIVISIONS[selectedCode]||[]).find(x=>x.code===value)?.name)||value;stage='other-region'}
  renderDrill();});
 function resetToEarth(){if(delayedPanel)clearTimeout(delayedPanel);phase='globe';stage='country';selectedCode='';group='';region='';province='';city='';otherRegion='';target.scale=1;gate.dataset.phase='globe';$p('portalDrill').hidden=true;$p('portalDrill').innerHTML='';lastClockAt=0;}
 function enterGallery(){if(!selectedCode)return;
  const code=selectedCode,name=byName.get(code)||code;const current={group,region,province,city,otherRegion};
  try{setCountry(code,'portal');
    if(current.region||current.province||current.otherRegion){const picked=[current.province,current.region,current.otherRegion].filter(Boolean);const match=(SUBDIVISIONS[code]||[]).find(x=>picked.some(s=>x.name.toLowerCase()===s.toLowerCase()));if(match){state.selectedRegion={code:match.code,name:match.name,parent:match.parent};renderGallery();}}
    renderRegionLabel();
  }catch(e){console.warn('Gallery handoff:',e)}
  const banner=$p('arrivalRibbon');banner.hidden=false;$p('arrivalCountry').textContent=name;
  $p('arrivalLocality').textContent=[current.group,current.region,current.province,current.city,current.otherRegion].filter(Boolean).join(' · ')||'All stories and regions';
  let names=[];
  if(code==='PH'){
    if(current.province&&sampleCities[current.province]?.length)names=sampleCities[current.province];
    else if(current.region&&groups[current.group]?.[current.region]) names=groups[current.group][current.region];
    else if(current.group&&groups[current.group])names=Object.keys(groups[current.group]);
    else names=Object.values(groups).flatMap(r=>Object.keys(r));
  }else names=(SUBDIVISIONS[code]||[]).filter(x=>!x.parent).map(x=>x.name);
  const filtered=names.filter(Boolean);const suggest=()=>{$p('arrivalRandom').textContent=filtered.length?filtered[Math.floor(Math.random()*filtered.length)]:'Every corner has a story';};
  suggest();$p('arrivalShuffle').onclick=suggest;
  gate.classList.add('portal-exit');document.body.classList.remove('portal-locked');
  window.scrollTo({top:0,behavior:'instant'});
  setTimeout(()=>{gate.hidden=true;gate.classList.remove('portal-exit');gate.classList.add('portal-entered');},850);
 }
 $p('arrivalBackEarth').addEventListener('click',()=>{gate.classList.remove('portal-entered');gate.hidden=false;document.body.classList.add('portal-locked');resetToEarth();gate.style.opacity='';window.scrollTo({top:0,behavior:'instant'});});
 function showSearch(show){searchOpen=show;$p('portalSearchPane').hidden=!show;if(show){$p('portalSearchInput').value='';renderSearch('');$p('portalSearchInput').focus();}else globeCanvas.focus();}
 function renderSearch(q){const names=countries.filter(c=>c[1].toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a[1].localeCompare(b[1]));$p('portalSearchResults').innerHTML=names.slice(0,35).map(([code,name])=>`<button type="button" data-country-code="${esc(code)}">${esc(name)}</button>`).join('')+(names.length>35?`<small>${names.length-35} more countries — refine search.</small>`:'');}
 $p('portalSearchToggle').addEventListener('click',()=>showSearch(true));$p('portalCloseSearch').addEventListener('click',()=>showSearch(false));
 $p('portalSearchInput').addEventListener('input',e=>renderSearch(e.target.value));
 $p('portalSearchResults').addEventListener('click',e=>{const btn=e.target.closest('[data-country-code]');if(btn)selectCountry(btn.dataset.countryCode)});
 document.addEventListener('keydown',e=>{
  if(document.getElementById('lightboxDialog')?.open)return;
  if(gate.hidden||phase==='drill'&&e.key!=='Escape')return;
  if(searchOpen){if(e.key==='Escape'){showSearch(false);e.preventDefault()}return}
  if(e.key==='/'&&phase==='globe'){showSearch(true);e.preventDefault();return}
  if(phase==='drill'&&e.key==='Escape'){goBack();e.preventDefault();return}
  if(phase!=='globe')return;
  if(e.key==='ArrowLeft')target.lon-=9;else if(e.key==='ArrowRight')target.lon+=9;
  else if(e.key==='ArrowUp')target.lat=Math.min(68,target.lat+7);else if(e.key==='ArrowDown')target.lat=Math.max(-68,target.lat-7);
  else if(e.key==='+'||e.key==='=')target.scale=Math.min(1.48,target.scale+.13);
  else if(e.key==='-')target.scale=Math.max(.77,target.scale-.13);
  else if(e.key==='Enter'){const code=currentCenterCountry();if(code)selectCountry(code);else showTip('Rotate toward a country, or press / to search.');}
  else return;e.preventDefault();
 });
 // For automated tests or accessibility inspection, read-only diagnostic for current selection.
 function faceHomeCountry(code){
  if(!code||!byName.has(code))return;
  if(delayedPanel){clearTimeout(delayedPanel);delayedPanel=null;}
  const place=metaFor(code),longitude=place.lon??byIso.get(code)?.lon??0,latitude=Math.max(-52,Math.min(52,place.lat??byIso.get(code)?.lat??0));
  selectedCode='';group='';region='';province='';city='';otherRegion='';stage='country';phase='globe';
  gate.hidden=false;gate.dataset.phase='globe';$p('portalDrill').hidden=true;$p('portalDrill').innerHTML='';
  $p('portalSearchPane').hidden=true;searchOpen=false;$p('portalHover').hidden=true;
  pos.lon=target.lon=longitude;pos.lat=target.lat=latitude;pos.scale=target.scale=1;
  velocityLon=velocityLat=0;lastFacing='';lastClockAt=0;
  $p('portalFacing').textContent=`FACING ${byName.get(code).toUpperCase()}`;
 }
 function restoreView(saved, area){
  if(!saved || !['portal','gallery'].includes(area))return false;
  const code=String(saved.selectedCode||'');if(code&&!byName.has(code))return false;
  const limit=(v,lo,hi,def)=>Number.isFinite(Number(v))?Math.max(lo,Math.min(hi,Number(v))):def;
  if(delayedPanel){clearTimeout(delayedPanel);delayedPanel=null}
  velocityLon=velocityLat=0;dragging=false;
  pos.lon=target.lon=limit(saved.longitude,-180,180,120.8);
  pos.lat=target.lat=limit(saved.latitude,-68,68,15.6);
  pos.scale=target.scale=limit(saved.scale,.7,2.2,1);
  selectedCode=code;group=String(saved.group||'');region=String(saved.region||'');province=String(saved.province||'');city=String(saved.city||'');otherRegion=String(saved.otherRegion||'');
  stage=['country','group','region','province','city','other-region'].includes(saved.stage)?saved.stage:'country';
  $p('portalSearchPane').hidden=true;searchOpen=false;$p('portalHover').hidden=true;
  if(area==='gallery'){
   phase='drill';gate.hidden=true;gate.classList.remove('portal-exit');gate.classList.add('portal-entered');
   document.body.classList.remove('portal-locked');
   if(code){try{setCountry(code,'portal');renderRegionLabel()}catch(e){console.warn('Restore gallery country:',e)}
    $p('arrivalRibbon').hidden=false;$p('arrivalCountry').textContent=byName.get(code);
    $p('arrivalLocality').textContent=[group,region,province,city,otherRegion].filter(Boolean).join(' · ')||'All stories and regions';}
  }else{
   phase=code&&saved.phase!=='globe'?'drill':'globe';gate.hidden=false;gate.classList.remove('portal-exit','portal-entered');
   document.body.classList.add('portal-locked');gate.dataset.phase=phase;
   if(phase==='drill')renderDrill();else{$p('portalDrill').hidden=true;$p('portalDrill').innerHTML=''}
  }
  if(code)document.dispatchEvent(new CustomEvent('wg:country-selected',{detail:{code,source:'restored'}}));
  lastClockAt=0;lastFacing='';return true;
 }
 window.WorldsGalleryPortal={getState:()=>({phase,stage,selectedCode,group,region,province,city,otherRegion,longitude:pos.lon,latitude:pos.lat,scale:pos.scale,clock:$p('clockTime').textContent,mood:gate.dataset.sky}),searchCountry:code=>selectCountry(code),faceHomeCountry,reset:resetToEarth,restoreView};
})();
