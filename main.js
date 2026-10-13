import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const $=id=>document.getElementById(id),rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,400);
scene.background=new THREE.Color(0x9bbdbb);scene.fog=new THREE.FogExp2(0x9bbdbb,.012);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;$('game').appendChild(renderer.domElement);
const hemi=new THREE.HemisphereLight(0xc9e9ef,0x465044,2),sun=new THREE.DirectionalLight(0xffe0ad,3);
sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-42,right:42,top:42,bottom:-42,far:220});
sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.0006;scene.add(hemi,sun,sun.target);

// ---------- Texturas procedurales (sin descargas, 100% offline) ----------
function tex(base,specks,n,rep,o={}){const sz=256,c=document.createElement('canvas');c.width=c.height=sz;const g=c.getContext('2d');
  g.fillStyle=base;g.fillRect(0,0,sz,sz);
  for(let i=0;i<n;i++){const x=Math.random()*sz,y=Math.random()*sz,r=1+Math.random()*(o.r||5);g.fillStyle=specks[i%specks.length];g.globalAlpha=.08+Math.random()*.28;
    for(const ox of[-sz,0,sz])for(const oy of[-sz,0,sz]){if(o.line)g.fillRect(x+ox,y+oy,r*.5,r*8);else{g.beginPath();g.arc(x+ox,y+oy,r,0,7);g.fill()}}}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep,rep);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
const T={ground:tex('#9c9c9c',['#7a7a7a','#bdbdbd','#8a8a8a','#d0d0d0'],3500,40,{r:3}),
  bark:tex('#5e4332',['#3b2a1e','#7b5a42','#2c2018'],1800,1,{line:1}),
  rock:tex('#8d908d',['#5f6361','#aeb1ae','#767a78','#4c4f4e'],2200,1,{r:6}),
  leaf:tex('#9fcf8f',['#6fa05f','#c4e8a8','#7fb36f'],2500,1,{r:4}),
  bush:tex('#8fc07a',['#6a9a58','#b7e0a0','#a0467a','#6a9a58'],2500,1,{r:3}),
  water:tex('#3f9aab',['#6cc3d1','#2f7d90','#ffffff'],1500,70,{r:4})};
const std=(o)=>new THREE.MeshStandardMaterial(o);

// ---------- Terreno ----------
const hash=(x,z)=>{const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s)};
function vn(x,z){const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi,u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);
  return hash(xi,zi)*(1-u)*(1-v)+hash(xi+1,zi)*u*(1-v)+hash(xi,zi+1)*(1-u)*v+hash(xi+1,zi+1)*u*v}
function H(x,z){const e=Math.max(0,1-Math.hypot(x,z)/76),n=vn(x*.05,z*.05)+vn(x*.11,z*.11)*.5+vn(x*.25,z*.25)*.25,
  m=clamp(Math.min(x-12,z-12)/18,0,1);return -2.4+Math.min(1,e*4.5)*2.6+e*e*6+(n-.9)*3.2*Math.min(1,e*3)+m*e*7}
function biomeAt(x,z){if(x>20&&z>18)return'mountain';if(z<-22&&x<12)return'desert';if(x<-18&&z>5)return'swamp';if(x>8&&z<8)return'forest';return'meadow'}
const BC={meadow:0x7fae58,forest:0x4f7d47,swamp:0x5a6e45,desert:0xc9aa66,mountain:0x8a8f8b},beachC=new THREE.Color(0xd8c28b),rockC=new THREE.Color(0x7d817d),deepC=new THREE.Color(0x56706a);
const tg=new THREE.PlaneGeometry(150,150,140,140);tg.rotateX(-Math.PI/2);const PA=tg.attributes.position;
for(let i=0;i<PA.count;i++)PA.setY(i,H(PA.getX(i),PA.getZ(i)));tg.computeVertexNormals();
const NA=tg.attributes.normal,col=new Float32Array(PA.count*3),c1=new THREE.Color(),c2=new THREE.Color();
for(let i=0;i<PA.count;i++){const x=PA.getX(i),z=PA.getZ(i),h=PA.getY(i);c1.setRGB(0,0,0);
  for(const[dx,dz]of[[0,0],[6,0],[-6,0],[0,6],[0,-6]])c1.add(c2.set(BC[biomeAt(x+dx,z+dz)]));c1.multiplyScalar(.2);
  const ny=NA.getY(i);if(ny<.8)c1.lerp(rockC,clamp((.8-ny)*5,0,1));c1.lerp(beachC,clamp((1.1-h)/.7,0,1));c1.lerp(deepC,clamp((-.6-h)/.8,0,1));
  const v=1+(hash(x,z)-.5)*.14;col[i*3]=c1.r*v;col[i*3+1]=c1.g*v;col[i*3+2]=c1.b*v}
tg.setAttribute('color',new THREE.BufferAttribute(col,3));
const land=new THREE.Mesh(tg,std({vertexColors:true,map:T.ground,bumpMap:T.ground,bumpScale:2,roughness:1}));land.receiveShadow=true;scene.add(land);
const ocean=new THREE.Mesh(new THREE.PlaneGeometry(900,900),std({map:T.water,color:0x4aa6b8,roughness:.25,metalness:.1,transparent:true,opacity:.92}));
ocean.rotation.x=-Math.PI/2;ocean.position.y=-1.5;scene.add(ocean);

// ---------- Vegetación instanciada con viento ----------
const uT={value:0};
function sway(m,a){m.onBeforeCompile=s=>{s.uniforms.uT=uT;s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nuniform float uT;')
  .replace('#include <begin_vertex>','#include <begin_vertex>\nfloat w=sin(uT*1.6+instanceMatrix[3].x*.4+instanceMatrix[3].z*.3);float hh=max(position.y-1.6,0.);transformed.x+=w*'+a+'*hh;transformed.z+=w*'+a+'*.5*hh;')}}
const D=new THREE.Object3D(),nodes=[];
function mk(geo,mat,n){const m=new THREE.InstancedMesh(geo,mat,n);m.count=0;m.castShadow=m.receiveShadow=true;m.frustumCulled=false;scene.add(m);return m}
const leafM=std({map:T.leaf,roughness:.9});sway(leafM,.07);
const trunks=mk(new THREE.CylinderGeometry(.22,.34,2.4,7).translate(0,1.2,0),std({map:T.bark,bumpMap:T.bark,bumpScale:2,roughness:1}),300),
 crowns=mk(mergeGeometries([0,1,2].map(i=>new THREE.ConeGeometry(1.55-i*.3,2.6-i*.3,7).translate(0,2+i*1.15,0))),leafM,300),
 rocks=mk(new THREE.DodecahedronGeometry(1,1),std({map:T.rock,bumpMap:T.rock,bumpScale:3,roughness:.95,flatShading:true}),100),
 bushes=mk(new THREE.IcosahedronGeometry(.75,1),std({map:T.bush,roughness:.9}),80);
function show(n,on){for(const[m,dy,sy]of n.parts){D.position.set(n.x,n.y+dy,n.z);D.rotation.set(0,n.ry,0);const k=on?n.s:.0001;D.scale.set(k,k*sy,k);D.updateMatrix();m.setMatrixAt(n.k,D.matrix);m.instanceMatrix.needsUpdate=true}}
function addNode(type,x,z,s,dark){const n={type,x,z,y:H(x,z),s,ry:rnd(0,6.3),alive:true,rs:0},c=new THREE.Color();
  if(type==='wood'){n.hp=n.max=4;n.k=trunks.count;n.parts=[[trunks,0,1],[crowns,0,1]];c.setHex(dark?0x3f6a5a:0x5e9a55).offsetHSL(rnd(-.03,.03),0,rnd(-.06,.06));crowns.setColorAt(n.k,c);trunks.count++;crowns.count++}
  else if(type==='stone'){n.hp=n.max=4;n.k=rocks.count;n.parts=[[rocks,s*.45,.7]];c.setScalar(rnd(.6,1));rocks.setColorAt(n.k,c);rocks.count++}
  else{n.hp=n.max=1;n.k=bushes.count;n.parts=[[bushes,.3*s,.75]];c.setScalar(rnd(.7,1));bushes.setColorAt(n.k,c);bushes.count++}
  show(n,1);nodes.push(n)}
for(let t=0;t<1800;t++){const x=rnd(-64,64),z=rnd(-64,64),d=Math.hypot(x,z);if(d>64||d<5||H(x,z)<.9)continue;const b=biomeAt(x,z),r=Math.random(),tr=trunks.count<300,rk=rocks.count<100,bu=bushes.count<80;
  if(b==='mountain'){if(r<.6&&rk)addNode('stone',x,z,rnd(1,2.6))}
  else if(b==='desert'){if(r<.08&&tr)addNode('wood',x,z,rnd(.4,.7));else if(r<.18&&rk)addNode('stone',x,z,rnd(.5,1.2))}
  else if(b==='swamp'){if(r<.3&&tr)addNode('wood',x,z,rnd(.5,.9),1);else if(r<.4&&bu)addNode('berry',x,z,rnd(.8,1.2))}
  else if(b==='forest'){if(r<.62&&tr)addNode('wood',x,z,rnd(.8,1.4),1);else if(r<.68&&bu)addNode('berry',x,z,1);else if(r<.74&&rk)addNode('stone',x,z,rnd(.5,1.1))}
  else{if(r<.3&&tr)addNode('wood',x,z,rnd(.65,1.3));else if(r<.38&&bu)addNode('berry',x,z,rnd(.8,1.2));else if(r<.43&&rk)addNode('stone',x,z,rnd(.5,1.1))}}

// ---------- Jugador ----------
const S={wood:0,stone:0,berry:0,fiber:0,meat:0,hp:100,st:100,t:.28,day:1,axe:0,sword:0,armor:0,won:0};
try{Object.assign(S,JSON.parse(localStorage.getItem('bruma3')||'{}'));S.hp=Math.max(S.hp,40)}catch(e){}
setInterval(()=>{try{localStorage.setItem('bruma3',JSON.stringify(S))}catch(e){}},4000);
const player=new THREE.Group(),skin=std({color:0xd7a77c,roughness:.8}),cloth=std({color:0x385c51,roughness:.9}),pants=std({color:0x343e42,roughness:.9}),pack=std({color:0x8a6139,roughness:.9});
function part(g,m,x,y,z){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;player.add(o);return o}
part(new THREE.CapsuleGeometry(.42,.85,4,8),cloth,0,1.25,0);part(new THREE.SphereGeometry(.31,12,10),skin,0,2.05,0);part(new THREE.BoxGeometry(.45,.52,.26),pack,0,1.35,-.39);
const legL=part(new THREE.CylinderGeometry(.14,.17,.7,8),pants,-.22,.42,0),legR=part(new THREE.CylinderGeometry(.14,.17,.7,8),pants,.22,.42,0),
 armL=part(new THREE.CylinderGeometry(.12,.13,.62,8),skin,-.52,1.42,0),armR=part(new THREE.CylinderGeometry(.12,.13,.62,8),skin,.52,1.42,0);
const swordM=new THREE.Group();swordM.add(new THREE.Mesh(new THREE.BoxGeometry(.08,1,.16),std({color:0xc8ced0,metalness:.7,roughness:.35})).translateY(-.95),new THREE.Mesh(new THREE.BoxGeometry(.4,.07,.1),std({color:0x6b4a2b})).translateY(-.42));
const axeM=new THREE.Group();axeM.add(new THREE.Mesh(new THREE.BoxGeometry(.07,.9,.07),std({color:0x6b4a2b})).translateY(-.6),new THREE.Mesh(new THREE.BoxGeometry(.5,.28,.07),std({color:0x9aa0a0,metalness:.5,roughness:.5})).translate(.18,-1,0));
swordM.rotation.x=axeM.rotation.x=Math.PI/2;armR.add(swordM,axeM);
function gear(){swordM.visible=!!S.sword;axeM.visible=!S.sword&&!!S.axe;cloth.color.setHex(S.armor?0x7a5a3a:0x385c51)}gear();
const P=player.position;P.set(0,H(0,0),0);scene.add(player);

// ---------- Enemigos ----------
const enemies=[];
function spawn(type,x,z,night){const boss=type==='boss',g=new THREE.Group(),em=std({color:boss?0x3a3040:0x2c3a33,map:T.rock,roughness:.85,emissive:0x000000}),
  eyeM=new THREE.MeshStandardMaterial({color:0xe3a34e,emissive:0xb04a08,emissiveIntensity:1.4}),body=new THREE.Mesh(new THREE.IcosahedronGeometry(.9,1),em);
  body.position.y=1.15;body.scale.set(1,.85,1.25);body.castShadow=true;g.add(body);
  for(const s of[-1,1]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.12,8,8),eyeM);eye.position.set(s*.3,1.4,.8);g.add(eye);
    const horn=new THREE.Mesh(new THREE.ConeGeometry(.18,.6,6),em);horn.position.set(s*.45,2,.1);horn.rotation.z=-s*.35;g.add(horn);
    const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.17,.8,3,6),em);arm.position.set(s*1.0,1,.2);arm.rotation.z=s*.5;arm.castShadow=true;g.add(arm)}
  g.scale.setScalar(boss?2.4:1);g.position.set(x,H(x,z),z);scene.add(g);
  enemies.push({g,em,boss,night,hp:boss?18:4,cd:1,tele:0,flash:0,kx:0,kz:0})}
function removeEnemy(e){scene.remove(e.g);enemies.splice(enemies.indexOf(e),1)}
for(const[x,z]of[[18,-8],[26,-14],[-30,22],[-38,30],[-6,-40]])spawn('brute',x,z);
if(!S.won)spawn('boss',44,44);

// ---------- UI ----------
const res=document.querySelector('.resources');for(const[id,ic]of[['meat','🥩'],['tools','🛠']]){const p=document.createElement('div');p.className='pill';p.innerHTML=ic+' <span id="'+id+'">0</span>';res.append(p)}
const hurtEl=document.createElement('div');hurtEl.style.cssText='position:fixed;inset:0;z-index:7;pointer-events:none;background:radial-gradient(transparent 40%,rgba(200,20,20,.7));opacity:0;transition:opacity .5s';document.body.append(hurtEl);
const sub=document.querySelector('.sub');const setSub=()=>{sub.textContent='SUPERVIVENCIA · DÍA '+S.day};setSub();
function updateUI(){for(const k of['wood','stone','berry','fiber','meat'])$(k).textContent=S[k];$('tools').textContent=(S.axe?'🪓':'')+(S.sword?'🗡':'')+(S.armor?'🛡':'')||'—';
  $('hptext').textContent=Math.round(S.hp);$('sttext').textContent=Math.round(S.st);$('hpbar').style.width=S.hp+'%';$('stbar').style.width=S.st+'%'}
let mt;function msg(t){$('msg').textContent=t;$('msg').style.opacity=1;clearTimeout(mt);mt=setTimeout(()=>$('msg').style.opacity=0,1800)}
const box=$('gather').parentElement;box.style.gridTemplateColumns='repeat(3,54px)';
function btn(ic,label,fn,cls){const b=document.createElement('button');b.className='act '+(cls||'');b.innerHTML=ic+'<small>'+label+'</small>';b.onclick=fn;box.append(b)}
let joyX=0,joyY=0,joyId=null;const joy=$('joy'),knob=$('knob');
function setJoy(e){const r=joy.getBoundingClientRect(),dx0=e.clientX-r.left-r.width/2,dy0=e.clientY-r.top-r.height/2,max=r.width*.33,len=Math.hypot(dx0,dy0)||1,k=len>max?max/len:1,dx=dx0*k,dy=dy0*k;joyX=dx/max;joyY=dy/max;knob.style.transform=`translate(${dx}px,${dy}px)`}
joy.addEventListener('pointerdown',e=>{joyId=e.pointerId;joy.setPointerCapture(joyId);setJoy(e)});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)setJoy(e)});
const rj=()=>{joyId=null;joyX=joyY=0;knob.style.transform='translate(0,0)'};joy.addEventListener('pointerup',rj);joy.addEventListener('pointercancel',rj);
let yaw=0,pitch=.5,drag=false,lx=0,ly=0;
renderer.domElement.addEventListener('pointerdown',e=>{if(e.clientX>innerWidth*.28&&e.clientY<innerHeight*.78){drag=true;lx=e.clientX;ly=e.clientY}});
addEventListener('pointerup',()=>drag=false);addEventListener('pointermove',e=>{if(drag){yaw-=(e.clientX-lx)*.006;pitch=clamp(pitch+(e.clientY-ly)*.004,.15,1.1);lx=e.clientX;ly=e.clientY}});

// ---------- Acciones ----------
let atkT=0,roll=0,inv=0;const lastDir={x:0,z:1};
function hurt(d){if(inv>0||S.hp<=0)return;S.hp-=d*(S.armor?.6:1);hurtEl.style.opacity=1;setTimeout(()=>hurtEl.style.opacity=0,200);try{navigator.vibrate(40)}catch(e){}
  if(S.hp<=0){S.hp=100;S.st=100;P.set(0,H(0,0),0);S.wood=S.stone=0;msg('Caíste... despertaste en el centro y perdiste madera y piedra')}updateUI()}
function gather(){let b=null,bd=3.8;for(const n of nodes){if(!n.alive)continue;const d=Math.hypot(n.x-P.x,n.z-P.z);if(d<bd){bd=d;b=n}}
  if(!b){msg('Acércate a un árbol, roca o arbusto');return}if(S.st<4){msg('Sin energía');return}S.st-=4;atkT=.3;b.hp-=b.type==='wood'&&S.axe?2.5:1;
  if(b.hp>0){msg('¡Golpe!');updateUI();return}
  b.alive=false;b.rs=120;show(b,0);
  if(b.type==='wood'){S.wood+=3;S.fiber+=Math.random()<.5?1:0;msg('+3 madera')}else if(b.type==='stone'){S.stone+=2;msg('+2 piedra')}else{S.berry+=2;S.fiber++;msg('+2 bayas, +1 fibra')}updateUI()}
function swing(){if(atkT>0)return;if(S.st<10){msg('Sin energía');return}S.st-=10;atkT=.35;const fx=Math.sin(player.rotation.y),fz=Math.cos(player.rotation.y);let hit=0;
  for(const e of[...enemies]){const dx=e.g.position.x-P.x,dz=e.g.position.z-P.z,d=Math.hypot(dx,dz)||1;
    if(d<(e.boss?5:3.4)&&(dx*fx+dz*fz)/d>.2){hit=1;e.hp-=S.sword?2.2:1;e.flash=.12;e.kx=dx/d*(e.boss?2:6);e.kz=dz/d*(e.boss?2:6);
      if(e.hp<=0){removeEnemy(e);S.meat+=e.boss?5:1;if(e.boss){S.won=1;msg('¡Derrotaste al Coloso de la Niebla! La isla es libre')}else msg('Criatura derrotada +1 carne')}else msg('¡Golpe acertado!')}}
  if(!hit)msg('Golpeaste el aire');updateUI()}
function heal(){if(S.hp>=100){msg('Tu vida está completa');return}if(S.meat>0){S.meat--;S.hp=Math.min(100,S.hp+35);msg('Comiste carne +35')}else if(S.berry>0){S.berry--;S.hp=Math.min(100,S.hp+18);msg('Comiste bayas +18')}else msg('Necesitas carne o bayas');updateUI()}
const homes=[],fires=[];
function ahead(){return[P.x+Math.sin(player.rotation.y)*3.4,P.z+Math.cos(player.rotation.y)*3.4]}
function shelter(){if(S.wood<5||S.fiber<2){msg('Refugio: 5 madera y 2 fibra');return}S.wood-=5;S.fiber-=2;const[x,z]=ahead(),g=new THREE.Group(),m=std({color:0x76523a,map:T.bark,roughness:1});
  const roof=new THREE.Mesh(new THREE.ConeGeometry(2.6,2.1,4),m);roof.position.y=2.2;roof.rotation.y=Math.PI/4;const base=new THREE.Mesh(new THREE.BoxGeometry(3.1,.18,2.7),std({color:0x8b6944,map:T.bark}));base.position.y=.12;g.add(roof,base);
  g.position.set(x,H(x,z),z);g.traverse(o=>{if(o.isMesh)o.castShadow=true});scene.add(g);homes.push({x,z});updateUI();msg('¡Refugio construido! Cerca de él te recuperas')}
function campfire(){if(fires.length>=3){msg('Máximo 3 fogatas');return}if(S.wood<4||S.stone<3){msg('Fogata: 4 madera y 3 piedra');return}S.wood-=4;S.stone-=3;const[x,z]=ahead(),g=new THREE.Group();
  for(let i=0;i<3;i++){const l=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.9,6),std({color:0x4a3524,map:T.bark}));l.rotation.set(Math.PI/2,0,i*1.05);l.position.y=.12;g.add(l)}
  const fl=new THREE.Mesh(new THREE.ConeGeometry(.3,.85,6),new THREE.MeshBasicMaterial({color:0xffa94a}));fl.position.y=.55;g.add(fl);
  const light=new THREE.PointLight(0xff9a45,36,22,2);light.position.y=1.1;g.add(light);g.position.set(x,H(x,z),z);scene.add(g);fires.push({x,z,light});updateUI();msg('Fogata encendida: luz y calor')}
function craft(){const c=[['axe','Hacha',{wood:3,stone:2}],['sword','Espada',{wood:4,stone:3,fiber:2}],['armor','Armadura',{fiber:8,meat:2}]].find(a=>!S[a[0]]);
  if(!c){msg('Ya tienes todo el equipo');return}const[k,name,cost]=c;for(const r in cost)if(S[r]<cost[r]){msg(name+': '+Object.entries(cost).map(([a,b])=>b+' '+({wood:'madera',stone:'piedra',fiber:'fibra',meat:'carne'})[a]).join(', '));return}
  for(const r in cost)S[r]-=cost[r];S[k]=1;gear();updateUI();msg('¡Fabricaste: '+name+'!')}
function dodge(){if(S.st<18||roll>0){if(S.st<18)msg('Sin energía');return}S.st-=18;roll=.4;inv=.5}
$('gather').onclick=gather;$('attack').onclick=swing;$('heal').onclick=heal;$('build').onclick=shelter;
btn('🔥','FOGATA',campfire);btn('🛠','FABRICAR',craft);btn('💨','ESQUIVAR',dodge);

// ---------- Ciclo día/noche ----------
const dayC=new THREE.Color(0x9bbdbb),duskC=new THREE.Color(0xd38a5e),nightC=new THREE.Color(0x070d1a),skyC=new THREE.Color(),warmC=new THREE.Color(0xffa870),whiteC=new THREE.Color(0xffe0ad);
let time=0,last=performance.now(),walkT=0,spawnT=10,uiT=0,k=1;const tmp=new THREE.Vector3();
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;time+=dt;uT.value=time;
  S.t+=dt/300;if(S.t>=1){S.t-=1;S.day++;setSub()}
  const a=S.t*Math.PI*2,sn=Math.sin(a);k=clamp(sn*2.2+.35,0,1);
  skyC.copy(nightC).lerp(duskC,clamp(k*3,0,1)).lerp(dayC,clamp((k-.35)*1.6,0,1));scene.background.copy(skyC);scene.fog.color.copy(skyC);scene.fog.density=.012+(1-k)*.007;
  hemi.intensity=.3+1.7*k;sun.intensity=.05+3.1*k;sun.color.copy(warmC).lerp(whiteC,clamp(k*1.4,0,1));sun.position.set(P.x+Math.cos(a)*60,15+Math.abs(sn)*50,P.z+25);sun.target.position.copy(P);
  // movimiento
  const fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);let mx=fx*-joyY+rx*joyX,mz=fz*-joyY+rz*joyX;const ml=Math.hypot(mx,mz);if(ml>1){mx/=ml;mz/=ml}
  const moving=ml>.12;let sp=0;if(moving){const l=Math.hypot(mx,mz);lastDir.x=mx/l;lastDir.z=mz/l}
  if(roll>0){roll-=dt;sp=12;mx=lastDir.x;mz=lastDir.z}else if(moving){const run=ml>.88&&S.st>6;sp=run?8.4:5.2;if(run)S.st-=10*dt}
  if(sp<7)S.st=Math.min(100,S.st+(moving?4:10)*dt);inv-=dt;
  if(sp>0){P.x+=mx*sp*dt;P.z+=mz*sp*dt;player.rotation.y=Math.atan2(mx,mz)}
  const rad=Math.hypot(P.x,P.z);if(rad>68){P.x*=68/rad;P.z*=68/rad}
  for(const n of nodes){if(!n.alive){n.rs-=dt;if(n.rs<=0){n.alive=true;n.hp=n.max;show(n,1)}continue}if(n.type==='berry')continue;
    const dx=P.x-n.x,dz=P.z-n.z,d=Math.hypot(dx,dz)||1,r=(n.type==='wood'?.55*n.s:.9*n.s)+.45;if(d<r){P.x=n.x+dx/d*r;P.z=n.z+dz/d*r}}
  P.y+=(H(P.x,P.z)-P.y)*clamp(dt*16,0,1);
  walkT+=dt*sp*1.3;const sw=sp>0?Math.sin(walkT)*.7:0;legL.rotation.x=sw;legR.rotation.x=-sw;armL.rotation.x=-sw*.8;armR.rotation.x=atkT>0?-Math.sin(clamp(atkT/.35,0,1)*Math.PI)*1.7:sw*.8;atkT=Math.max(0,atkT-dt);player.scale.y=roll>0?.65:1;
  // cámara
  const cx=P.x+Math.sin(yaw)*Math.cos(pitch)*9,cz=P.z+Math.cos(yaw)*Math.cos(pitch)*9,cy=Math.max(P.y+1.6+Math.sin(pitch)*9,H(cx,cz)+1.2,-.5);
  camera.position.lerp(tmp.set(cx,cy,cz),.14);camera.lookAt(P.x,P.y+1.4,P.z);
  // enemigos
  for(const e of[...enemies]){const g=e.g,dx=P.x-g.position.x,dz=P.z-g.position.z,d=Math.hypot(dx,dz)||1,rg=e.boss?4.4:3,ag=e.boss?26:(e.night?40:18);
    if(d<ag){g.rotation.y=Math.atan2(dx,dz);if(d>rg-.6&&e.tele<=0){const s=(e.boss?2.6:e.night?4.2:3.3)*dt;g.position.x+=dx/d*s;g.position.z+=dz/d*s}}
    g.position.x+=e.kx*dt*4;g.position.z+=e.kz*dt*4;e.kx*=.88;e.kz*=.88;g.position.y=H(g.position.x,g.position.z);
    e.cd-=dt;e.flash-=dt;if(d<rg&&e.cd<=0&&e.tele<=0){e.tele=.7;e.cd=2.2}
    if(e.tele>0){e.tele-=dt;g.scale.setScalar((e.boss?2.4:1)*(1+Math.sin(e.tele*12)*.04));if(e.tele<=0&&d<rg+.6)hurt(e.boss?22:9)}
    e.em.emissive.setHex(e.tele>0?0xaa2200:e.flash>0?0x777777:0)}
  spawnT-=dt;if(spawnT<=0){spawnT=14;if(k<.3){if(enemies.filter(e=>e.night).length<5){const an=rnd(0,6.28),x=P.x+Math.cos(an)*26,z=P.z+Math.sin(an)*26;if(Math.hypot(x,z)<62&&H(x,z)>.9)spawn('brute',x,z,1)}}
    else if(k>.6)for(const e of enemies.filter(e=>e.night))removeEnemy(e)}
  // calor
  let warm=false;for(const f of fires){f.light.intensity=36+Math.sin(time*14+f.x)*6;if(Math.hypot(f.x-P.x,f.z-P.z)<6)warm=true}for(const h of homes)if(Math.hypot(h.x-P.x,h.z-P.z)<3.6)warm=true;
  if(warm&&S.hp<100)S.hp=Math.min(100,S.hp+2.5*dt);
  uiT-=dt;if(uiT<=0){uiT=.25;updateUI()}
  // pista
  let nn=null,nd=3.8;for(const n of nodes)if(n.alive){const d=Math.hypot(n.x-P.x,n.z-P.z);if(d<nd){nd=d;nn=n}}
  const be=enemies.find(e=>e.boss&&Math.hypot(e.g.position.x-P.x,e.g.position.z-P.z)<32),near=enemies.some(e=>Math.hypot(e.g.position.x-P.x,e.g.position.z-P.z)<6);
  $('hint').style.opacity=nn||near||be?'1':'0';$('hint').textContent=be?'¡Coloso de la Niebla! Vida: '+Math.max(0,Math.ceil(be.hp)):near?'¡Criatura cerca! Esquiva 💨 y golpea ⚔️':nn?'Recoger: '+({wood:'árbol',stone:'roca',berry:'arbusto'})[nn.type]:'';
  ocean.material.map.offset.set(time*.01,time*.007);ocean.position.y=-1.5+Math.sin(time*.8)*.06;
  renderer.render(scene,camera)}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
updateUI();msg('Explora, recoge, fabrica y sobrevive a la noche');requestAnimationFrame(animate);
