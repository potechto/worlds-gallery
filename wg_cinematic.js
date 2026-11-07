/* Worlds Gallery Auth V2 — native WebGL cinematic Earth/jet scene.
   Globe surface: existing NASA Blue Marble texture (see LICENSES_AND_SOURCES.md).
   Airliner is an original procedural 3D mesh; no emoji, external aircraft assets,
   or external rendering dependencies. The planet approach is illustrative.
*/
(() => {
  'use strict';
  const gate = document.getElementById('wgAuthGate');
  const canvas = document.getElementById('wgCinematicCanvas');
  if (!gate || !canvas) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const prefersStill = () => reduced.matches || document.documentElement.classList.contains('wg-reduce-motion') || (navigator.connection?.saveData ?? false);
  const gl = canvas.getContext('webgl2', {alpha:true,antialias:true,depth:true,premultipliedAlpha:false}) ||
    canvas.getContext('webgl', {alpha:true,antialias:true,depth:true,premultipliedAlpha:false});
  if (!gl) { gate.dataset.cinema = 'still'; return; }
  let stopped = false, textureReady = false, frameId = 0, lastFrame = 0, start = performance.now();

  const vs = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    attribute vec2 aUV;
    attribute vec3 aColor;
    uniform mat4 uMVP;
    uniform mat4 uModel;
    varying vec3 vNormal;
    varying vec2 vUV;
    varying vec3 vColor;
    void main(){
      vec4 world = uModel * vec4(aPosition,1.0);
      vNormal=normalize(mat3(uModel)*aNormal);
      vUV=aUV;
      vColor=aColor;
      gl_Position=uMVP*vec4(aPosition,1.0);
    }
  `;
  const fs = `
    precision highp float;
    uniform sampler2D uEarth;
    uniform int uMode;
    uniform float uOpacity;
    varying vec3 vNormal;
    varying vec2 vUV;
    varying vec3 vColor;
    void main(){
      vec3 normal=normalize(vNormal);
      vec3 sun=normalize(vec3(-0.5,0.7,0.9));
      float direct=max(dot(normal,sun),0.0);
      if(uMode == 0){
        vec3 tex=texture2D(uEarth,vUV).rgb;
        float shade=0.18+0.84*direct;
        vec3 ambient=vec3(0.018,0.044,0.10)*(1.0-direct);
        vec3 finalColor=tex*shade+ambient;
        float rim=pow(max(1.0-normal.z,0.0),3.5);
        finalColor+=vec3(0.015,0.055,0.1)*rim;
        gl_FragColor=vec4(finalColor,1.0);
      } else if(uMode == 1) {
        float rim=pow(1.0-abs(normal.z),3.6);
        float light=0.5+0.5*direct;
        gl_FragColor=vec4(vec3(0.09,0.43,0.72)*light, min(0.5,rim*0.48));
      } else {
        float diffuse=0.35+0.63*direct;
        float spec=pow(max(dot(reflect(-sun,normal),vec3(0.0,0.0,1.0)),0.0),20.0);
        gl_FragColor=vec4(vColor*diffuse+vec3(spec*0.33),uOpacity);
      }
    }
  `;
  function shader(type,src){
    const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  let program;
  try {
    program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  } catch(err) {gate.dataset.cinema='still';return;}
  gl.useProgram(program);
  const attr=['aPosition','aNormal','aUV','aColor'].map(n=>gl.getAttribLocation(program,n));
  const uMVP=gl.getUniformLocation(program,'uMVP');
  const uModel=gl.getUniformLocation(program,'uModel');
  const uMode=gl.getUniformLocation(program,'uMode');
  const uOpacity=gl.getUniformLocation(program,'uOpacity');
  const uEarth=gl.getUniformLocation(program,'uEarth');
  gl.uniform1i(uEarth,0);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0,0,0,0);
  function mesh(data,indices=null){
    const buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
    let ib=null;if(indices){ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);}
    return {buffer,index:ib,count:indices?indices.length:data.length/11};
  }
  function sphere(){
    const verts=[],idx=[],lon=96,lat=56;
    for(let y=0;y<=lat;y++)for(let x=0;x<=lon;x++){
      const th=Math.PI*y/lat,ph=2*Math.PI*x/lon;
      const px=Math.sin(th)*Math.cos(ph), py=Math.cos(th), pz=Math.sin(th)*Math.sin(ph);
      verts.push(px,py,pz,px,py,pz,x/lon,1-y/lat,1,1,1);
    }
    for(let y=0;y<lat;y++)for(let x=0;x<lon;x++){
      const a=y*(lon+1)+x,b=a+lon+1;
      idx.push(a,b,a+1,a+1,b,b+1);
    }
    return mesh(verts,idx);
  }
  const earth=sphere();
  function airplane(){
    const d=[];
    const aluminum=[0.91,0.95,0.98],white=[0.82,0.88,0.93],gray=[0.48,0.59,0.68];
    const blue=[0.06,0.16,0.24],dark=[0.014,0.05,0.08],shine=[0.97,0.99,1.0];
    const red=[0.85,0.22,0.19],green=[0.20,0.82,0.57];
    function triangle(a,b,c,col){
      const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2];
      const vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
      let n=[uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx];
      const m=Math.hypot(...n)||1;n=n.map(v=>v/m);
      for(const p of [a,b,c])d.push(...p,...n,0,0,...col);
    }
    function quad(a,b,c,e,col){triangle(a,b,c,col);triangle(a,c,e,col);}
    // Smooth tapered fuselage: nose points along the +X axis.
    const rings=[[-.41,.010],[-.35,.042],[-.24,.058],[.03,.063],[.25,.058],[.39,.038],[.51,.003]];
    const steps=18;
    for(let j=0;j<rings.length-1;j++)for(let k=0;k<steps;k++){
      const t0=k*Math.PI*2/steps,t1=(k+1)*Math.PI*2/steps;
      const p=(r,t)=>[r[0],Math.cos(t)*r[1]*.84,Math.sin(t)*r[1]];
      quad(p(rings[j],t0),p(rings[j],t1),p(rings[j+1],t1),p(rings[j+1],t0),j===rings.length-2?shine:aluminum);
    }
    for(const side of [-1,1]){
      function wing(root,tipl,tipt,rootback,color){
        // Wing surface has visible thickness and swept edges.
        const t=root.map((v,i)=>i===1?v+.009:v),l=tipl.map((v,i)=>i===1?v+.009:v),p=tipt.map((v,i)=>i===1?v+.009:v),b=rootback.map((v,i)=>i===1?v+.009:v);
        quad(t,l,p,b,color);
        const b0=root.map((v,i)=>i===1?v-.008:v),b1=tipl.map((v,i)=>i===1?v-.008:v),b2=tipt.map((v,i)=>i===1?v-.008:v),b3=rootback.map((v,i)=>i===1?v-.008:v);
        quad(b3,b2,b1,b0,gray);
        quad(t,l,b1,b0,white);quad(l,p,b2,b1,white);quad(p,b,b3,b2,white);
      }
      wing([.07,-.018,side*.042],[-.16,-.015,side*.43],[-.24,-.011,side*.43],[-.22,-.018,side*.06],white);
      wing([-.28,.004,side*.036],[-.38,.009,side*.21],[-.42,.010,side*.21],[-.39,.003,side*.035],aluminum);
      // Long nacelle, metallic skin and dark turbine intake.
      const z=side*.194,y=-.073;
      const rs=[[-.16,.034],[-.12,.045],[-.01,.041],[.067,.032]];
      for(let j=0;j<rs.length-1;j++)for(let k=0;k<12;k++){
        const p=(r,t)=>[r[0],y+Math.cos(t)*r[1],z+Math.sin(t)*r[1]];
        const t0=k*Math.PI/6,t1=(k+1)*Math.PI/6;
        quad(p(rs[j],t0),p(rs[j],t1),p(rs[j+1],t1),p(rs[j+1],t0),gray);
      }
      const front=[.067,y,z];
      for(let k=0;k<12;k++){
        const a=k*Math.PI/6,b=(k+1)*Math.PI/6;
        triangle(front,[.068,y+Math.cos(a)*.028,z+Math.sin(a)*.028],[.068,y+Math.cos(b)*.028,z+Math.sin(b)*.028],dark);
      }
      // Cabin windows; tiny but recognizable at approach distance.
      for(let i=0;i<7;i++){
        const x=-.245+i*.073, zz=side*.059;
        quad([x,.021,zz],[x+.024,.021,zz],[x+.024,.035,zz*.94],[x,.035,zz*.94],dark);
      }
      // Wingtip navigation markers (no brand insignia).
      const col=side===1?green:red, zt=side*.43;
      quad([-.17,-.003,zt],[ -.154,-.003,zt],[ -.154,.012,zt],[ -.17,.012,zt],col);
    }
    // Vertical stabilizer and its swept tail root.
    quad([-.38,.02,-.012],[-.30,.21,-.007],[-.37,.21,.007],[-.44,.02,.012],blue);
    quad([-.38,.02,.012],[-.30,.21,.007],[-.37,.21,-.007],[-.44,.02,-.012],white);
    // Cockpit glazing, a dark wraparound windshield near the nose.
    quad([.336,.034,-.034],[.415,.025,-.020],[.415,.025,.020],[.336,.034,.034],dark);
    quad([-.21,-.009,-.061],[.22,-.008,-.060],[.22,-.015,-.06],[-.21,-.015,-.06],blue);
    quad([-.21,-.009,.061],[.22,-.008,.060],[.22,-.015,.06],[-.21,-.015,.06],blue);
    return mesh(d);
  }
  const aircraft=airplane();
  const tex=gl.createTexture(); gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([22,59,89,255]));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const img=new Image();
  img.onload=()=>{
    if(stopped)return;
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
    textureReady=true;
    gate.dataset.cinema='live';
  };
  img.onerror=()=>{gate.dataset.cinema='still';};
  img.src='earth_bluemarble.jpg';
  // Column-major 4x4 matrix helpers.
  const I=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  const M=(a,b)=>{const c=new Float32Array(16);for(let x=0;x<4;x++)for(let y=0;y<4;y++)for(let k=0;k<4;k++)c[x*4+y]+=a[k*4+y]*b[x*4+k];return c;};
  const T=(x,y,z)=>{const a=I();a[12]=x;a[13]=y;a[14]=z;return a;};
  const S=(x,y,z)=>{const a=I();a[0]=x;a[5]=y;a[10]=z;return a;};
  const Ry=v=>{const a=I(),c=Math.cos(v),s=Math.sin(v);a[0]=c;a[2]=-s;a[8]=s;a[10]=c;return a;};
  const Rx=v=>{const a=I(),c=Math.cos(v),s=Math.sin(v);a[5]=c;a[6]=s;a[9]=-s;a[10]=c;return a;};
  const Rz=v=>{const a=I(),c=Math.cos(v),s=Math.sin(v);a[0]=c;a[1]=s;a[4]=-s;a[5]=c;return a;};
  function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),a=new Float32Array(16);a[0]=f/aspect;a[5]=f;a[10]=(far+near)/(near-far);a[11]=-1;a[14]=2*far*near/(near-far);return a;}
  let projection=I();let camera=T(0,0,-8.5); // View matrix for a stationary camera at Z=+8.5.
  function resize(){
    const w=canvas.clientWidth||innerWidth,h=canvas.clientHeight||innerHeight;
    const mobile=w<760;
    const dpr=Math.min(devicePixelRatio||1,mobile?1.25:1.7);
    const pw=Math.max(1,Math.round(w*dpr)),ph=Math.max(1,Math.round(h*dpr));
    if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;gl.viewport(0,0,pw,ph);}
    projection=perspective((mobile?54:45)*Math.PI/180,w/h,.1,100);
    camera=T(0,0,-(mobile?8.9:8.5));
  }
  const root=new ResizeObserver(resize);root.observe(canvas);resize();
  function draw(meshData,model,mode,opacity=1){
    const mvp=M(projection,M(camera,model));
    gl.uniformMatrix4fv(uMVP,false,mvp);gl.uniformMatrix4fv(uModel,false,model);
    gl.uniform1i(uMode,mode);gl.uniform1f(uOpacity,opacity);
    gl.bindBuffer(gl.ARRAY_BUFFER,meshData.buffer);
    const stride=11*4,offset=[0,3*4,6*4,8*4],sizes=[3,3,2,3];
    for(let i=0;i<4;i++){gl.enableVertexAttribArray(attr[i]);gl.vertexAttribPointer(attr[i],sizes[i],gl.FLOAT,false,stride,offset[i]);}
    if(meshData.index){gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,meshData.index);gl.drawElements(gl.TRIANGLES,meshData.count,gl.UNSIGNED_SHORT,0);}
    else gl.drawArrays(gl.TRIANGLES,0,meshData.count);
  }
  // WG CINEMATIC SMOOTH ORBIT V2.1
  // Constant-radius closed orbit. No approach/departure seam or altitude changes.
  // The aircraft periodically disappears behind the globe via depth testing.
  const tau = Math.PI * 2;
  let orbitElapsed = 0;
  let lastOrbitTime = 0;
  let galleryFlightBoost = 0;
  let galleryFlightSpeed = 0;
  let galleryFlightElapsed = 0;
  function loop(now) {
    if (stopped) return;
    frameId = requestAnimationFrame(loop);
    if (gate.hidden || document.hidden || !textureReady) {
      lastOrbitTime = now;
      return;
    }
    const still = prefersStill();
    const targetInterval = still ? 900 : (innerWidth < 760 ? 1000 / 45 : 1000 / 60);
    if (now - lastFrame < targetInterval) return;
    const dt = lastOrbitTime ? Math.max(0, Math.min(0.075, (now - lastOrbitTime) / 1000)) : 0;
    lastOrbitTime = now;
    lastFrame = now;
    if (!still) {
      orbitElapsed += dt;
      const targetSpeed = gate.classList.contains("wg-gallery-flight") ? 2.5 : 0;
      galleryFlightSpeed += (targetSpeed - galleryFlightSpeed) * Math.min(1, dt * 3.6);
      galleryFlightBoost += dt * galleryFlightSpeed;
    }
    resize();
    // V2.4: Move the 3D globe from the auth composition to the exact screen
    // center, then dolly the camera inward before the existing black fade.
    const isGalleryFlight = gate.classList.contains('wg-gallery-flight');
    galleryFlightElapsed = isGalleryFlight ? Math.min(2.3,galleryFlightElapsed+dt) : 0;
    const positionT = Math.min(1,galleryFlightElapsed / 1.6);
    const cinematicEase = positionT*positionT*(3-2*positionT);
    const normalDistance = innerWidth < 760 ? 8.9 : 8.5;
    camera=T(0,0,-(normalDistance - 4.3*cinematicEase));
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const originalCenter = innerWidth < 760 ? [-.40, -.32, 0] : [-1.45, -.30, 0];
    const center = [originalCenter[0]*(1-cinematicEase),originalCenter[1]*(1-cinematicEase),0];
    const rot = 2.55 + (still ? 0 : orbitElapsed * .012);
    const earthModel = M(T(...center), M(Ry(rot), S(1.79, 1.79, 1.79)));
    draw(earth, earthModel, 0);
    gl.depthMask(false);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    draw(earth, M(T(...center), M(Ry(rot), S(1.84, 1.84, 1.84))), 1);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(true);
    if (!still) {
      // 22-second seamless loop: one circular trajectory, gently inclined.
      const a = (orbitElapsed + galleryFlightBoost) * tau / 22 + .58;
      const r = 2.29;
      const tilt = .16;
      const x = center[0] + r * Math.cos(a);
      const y = center[1] + r * tilt * Math.sin(a);
      const z = center[2] + r * Math.sqrt(1 - tilt * tilt) * Math.sin(a);
      const dx = -r * Math.sin(a);
      const dy = r * tilt * Math.cos(a);
      const dz = r * Math.sqrt(1 - tilt * tilt) * Math.cos(a);
      const yaw = -Math.atan2(dz, dx);
      const pitch = Math.atan2(dy, Math.hypot(dx, dz));
      const gentleBank = .10 + .035 * Math.cos(a);
      const size = .66;
      const planeModel = M(T(x, y, z), M(Ry(yaw), M(Rz(pitch), M(Rx(gentleBank), S(size, size, size)))));
      draw(aircraft, planeModel, 2, 1);
    }
  }
  function shutdown(){stopped=true;cancelAnimationFrame(frameId);root.disconnect();gl.deleteTexture(tex);}
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();shutdown();gate.dataset.cinema='still';},{once:true});
  requestAnimationFrame(loop);
})();
