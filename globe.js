/* Offline, stylized globe: real Natural Earth low-resolution country outlines (public domain).
   Country-level selection + rotation + zoom. It is NOT Google Earth imagery. */
(function(){'use strict';
window.createWorldGlobe=function(canvas,onPick){
 const ctx=canvas.getContext('2d'); const R=Math.PI/180;
 let width=460,height=460,dpr=1,spin=24,pitch=13,zoom=1.0,selected='',drag=false,moved=false,startX=0,startY=0,lastX=0,lastY=0,selectedAt=0;
 let hitPaths=[],frame=0,lastDraw=0,hover='',running=true,visible=true; const observer=('IntersectionObserver' in window)?new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting},{threshold:0.02}):null; if(observer)observer.observe(canvas); const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const colors={Asia:'#9abca4',Europe:'#b7cab2',Africa:'#acc49f',Americas:'#b2c1b2',Oceania:'#b5d0ba',Antarctica:'#cbdacb'};
 function resize(){const r=canvas.getBoundingClientRect();width=r.width||440;height=r.height||440;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.ceil(width*dpr);canvas.height=Math.ceil(height*dpr);}
 function project(lon,lat){
  const a=(lon-spin)*R,b=lat*R,p=pitch*R,c=Math.cos(b),z=Math.sin(p)*Math.sin(b)+Math.cos(p)*c*Math.cos(a);
  const rad=Math.min(width,height)*.37*zoom;
  return [width/2+rad*c*Math.sin(a),height/2-rad*(Math.cos(p)*Math.sin(b)-Math.sin(p)*c*Math.cos(a)),z];
 }
 function drawGraticules(radius){ctx.strokeStyle='rgba(225,244,231,.18)';ctx.lineWidth=.8;
  for(let lat=-60;lat<=60;lat+=30){ctx.beginPath();let started=false;for(let lon=-180;lon<=180;lon+=4){const [x,y,z]=project(lon,lat);if(z>0){if(!started){ctx.moveTo(x,y);started=true}else ctx.lineTo(x,y)}else{if(started)ctx.stroke();ctx.beginPath();started=false}}ctx.stroke()}
  for(let lon=-180;lon<180;lon+=30){ctx.beginPath();let started=false;for(let lat=-90;lat<=90;lat+=4){const [x,y,z]=project(lon,lat);if(z>0){if(!started){ctx.moveTo(x,y);started=true}else ctx.lineTo(x,y)}else{if(started)ctx.stroke();ctx.beginPath();started=false}}ctx.stroke()}
 }
 function paint(){if(!running)return;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
  const cx=width/2,cy=height/2,rad=Math.min(width,height)*.37*zoom;
  const halo=ctx.createRadialGradient(cx,cy,rad*.6,cx,cy,rad*1.33);halo.addColorStop(0,'rgba(80,124,111,.05)');halo.addColorStop(.58,'rgba(100,159,130,.12)');halo.addColorStop(1,'rgba(100,159,130,0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(cx,cy,rad*1.33,0,2*Math.PI);ctx.fill();
  const sea=ctx.createRadialGradient(cx-rad*.36,cy-rad*.5,rad*.08,cx+rad*.1,cy+rad*.08,rad*1.1);sea.addColorStop(0,'#9fc8bc');sea.addColorStop(.36,'#56958b');sea.addColorStop(.77,'#236b65');sea.addColorStop(1,'#154d49');ctx.beginPath();ctx.arc(cx,cy,rad,0,Math.PI*2);ctx.fillStyle=sea;ctx.fill();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,rad,0,Math.PI*2);ctx.clip();drawGraticules(rad);
  hitPaths=[];
  WORLD_GEOMETRY.forEach(country=>{
    const path=new Path2D();let drawn=false;
    for(const poly of country.p){let visible=false,segments=0;
      for(const coords of poly){const [x,y,z]=project(coords[0],coords[1]);if(z>-.005){if(!visible){path.moveTo(x,y);visible=true;segments++}else path.lineTo(x,y);drawn=true}else{if(visible){path.closePath();visible=false}}}
      if(visible)path.closePath();
    }
    if(!drawn)return;
    const isSelected=selected&&country.c===selected;
    ctx.fillStyle=isSelected?'#eac398':(colors[country.t]||'#afc9ad');ctx.strokeStyle=isSelected?'#fff1d6':'rgba(31,84,70,.44)';ctx.lineWidth=isSelected?1.4:.55;
    ctx.fill(path);ctx.stroke(path);
    if(country.c)hitPaths.push({path,iso:country.c,name:country.n});
  });
  // Approximate demo story markers, placed at country centroids for privacy.
  const seen=new Set();
  const entries=(typeof stories==='function'?stories():seeds).filter(s=>{const c=COUNTRIES.find(c=>c[1]===s.country);if(!c||seen.has(c[0]))return false;seen.add(c[0]);return true});
  for(const s of entries){const c=COUNTRIES.find(x=>x[1]===s.country), geo=WORLD_GEOMETRY.find(x=>x.c===c[0]);const meta=COUNTRY_META[c[0]];
   const lat=meta?meta.lat:(geo?geo.lat:0),lon=meta?meta.lon:(geo?geo.lon:0),[x,y,z]=project(lon,lat);if(z<.12)continue;
   ctx.beginPath();ctx.arc(x,y,5.5,0,2*Math.PI);ctx.fillStyle='rgba(255,248,220,.3)';ctx.fill();ctx.beginPath();ctx.arc(x,y,2.8,0,2*Math.PI);ctx.fillStyle='#fbd9a0';ctx.fill();
  }
  ctx.restore();ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(cx,cy,rad,0,2*Math.PI);ctx.stroke();
  const shine=ctx.createLinearGradient(cx-rad,cy-rad,cx+rad,cy+rad);shine.addColorStop(0,'rgba(255,255,255,.36)');shine.addColorStop(.47,'rgba(255,255,255,0)');shine.addColorStop(1,'rgba(4,42,36,.18)');ctx.fillStyle=shine;ctx.beginPath();ctx.arc(cx,cy,rad,0,2*Math.PI);ctx.fill();
 }
 function animate(now){if(!running)return; if(visible&&!document.hidden&&!document.querySelector('dialog[open]')&&now-lastDraw>95){if(!drag&&!selected&&!reduced&&now-selectedAt>2500){spin=(spin+.05)%360}paint();lastDraw=now}frame=requestAnimationFrame(animate)}
 function loc(e){const r=canvas.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top]}
 canvas.addEventListener('pointerdown',e=>{drag=true;moved=false;[startX,startY]=loc(e);lastX=startX;lastY=startY;canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging')});
 canvas.addEventListener('pointermove',e=>{const [x,y]=loc(e);if(!drag){let picked=null;for(let i=hitPaths.length-1;i>=0;i--)if(ctx.isPointInPath(hitPaths[i].path,x,y)){picked=hitPaths[i];break}canvas.title=picked?('Explore '+picked.name):'Drag to rotate the globe';return}
  const dx=x-lastX,dy=y-lastY;if(Math.hypot(x-startX,y-startY)>7)moved=true;if(moved){spin-=dx*.43;pitch=Math.max(-74,Math.min(74,pitch+dy*.32));selected='';selectedAt=performance.now()}lastX=x;lastY=y;
 });
 canvas.addEventListener('pointerup',e=>{if(!drag)return;drag=false;canvas.classList.remove('dragging');const [x,y]=loc(e);if(!moved){for(let i=hitPaths.length-1;i>=0;i--){if(ctx.isPointInPath(hitPaths[i].path,x,y)){const pick=hitPaths[i];selected=pick.iso;selectedAt=performance.now();onPick(pick.iso,pick.name);break}}}canvas.releasePointerCapture(e.pointerId)});
 canvas.addEventListener('pointercancel',()=>{drag=false;canvas.classList.remove('dragging')});
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.65,Math.min(1.65,zoom+(e.deltaY<0?.09:-.09)));selectedAt=performance.now()},{passive:false});
 window.addEventListener('resize',resize);resize();frame=requestAnimationFrame(animate);
 return {select:function(code){selected=code;selectedAt=performance.now();let place=WORLD_GEOMETRY.find(x=>x.c===code);let meta=COUNTRY_META[code];if(place||meta){spin=meta?.lon??place.lon;pitch=Math.max(-55,Math.min(55,meta?.lat??place.lat));zoom=1.18}},reset:function(){selected='';zoom=1;spin=24;pitch=13;selectedAt=performance.now()},zoomBy:function(delta){zoom=Math.max(.65,Math.min(1.65,zoom+delta));selectedAt=performance.now()},stop:function(){running=false;cancelAnimationFrame(frame);observer?.disconnect()},repaint:paint};
};})();
