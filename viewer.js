import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const canvas=document.getElementById('scene');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.background=new THREE.Color('#f5f6f8');
const camera=new THREE.PerspectiveCamera(38,1,.1,2000);camera.position.set(145,-175,155);
const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=70;controls.maxDistance=700;
scene.add(new THREE.HemisphereLight(0xffffff,0x9ca9c1,2.6));const light=new THREE.DirectionalLight(0xffffff,2.7);light.position.set(-80,-110,240);light.castShadow=true;light.shadow.mapSize.set(2048,2048);light.shadow.camera.left=-300;light.shadow.camera.right=300;light.shadow.camera.top=300;light.shadow.camera.bottom=-300;scene.add(light);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(1500,1500),new THREE.ShadowMaterial({opacity:.13}));ground.receiveShadow=true;ground.position.z=-6;scene.add(ground);
let root=new THREE.Group();scene.add(root);let coverPivot=null,modelPieces=[],lastSignature='',targetOpen=0,actualOpen=0,rotating=false,exploded=false;
const material=(hex)=>new THREE.MeshStandardMaterial({color:hex,roughness:.7,metalness:0});
function addBox(parent,name,x,y,z,w,h,t,color,exportable=true){let mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,t),material(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;mesh.name=name;parent.add(mesh);if(exportable)modelPieces.push({name,mesh,color});return mesh}
function build(){const s=window.bookAPI.state,d=window.bookAPI.dims;scene.remove(root);root=new THREE.Group();scene.add(root);modelPieces=[];let W=d.w,H=d.h,th=2.2,pg=2.7,wall=2.6,clear=.5;const cw=W-5,ch=H-5;const total=th*2+s.pages*pg;
// Back plate and flexible-looking spine representation; all exported as separate solid pieces.
addBox(root,'Back cover',0,0,th/2,W,H,th,s.cover);
for(let i=0;i<s.pages;i++){let group=new THREE.Group();root.add(group);let z=th+i*pg+pg/2;let edgeW=(cw-2*wall)/2,edgeH=(ch-2*wall)/2;
// Four frame rails make a real, open photo cavity, accessible from the short edge.
addBox(group,`Page ${i+1} left rail`,-cw/2+wall/2,0,z,wall,ch,pg,s.page);
addBox(group,`Page ${i+1} right rail`,cw/2-wall/2,0,z,wall,ch,pg,s.page);
addBox(group,`Page ${i+1} bottom rail`,0,-ch/2+wall/2,z,cw-2*wall,wall,pg,s.page);
// Backing sheet at the bottom of the pocket. A thin top lip is visual only; open upper end for photos.
addBox(group,`Page ${i+1} backing`,0,0,z-pg*.37,cw-2*wall,ch-2*wall,.55,s.page);
}
// Front cover is pivoted around the left or upper edge, so opening changes the actual 3D geometry.
coverPivot=new THREE.Group();let horizontal=s.direction==='horizontal';coverPivot.position.set(horizontal?0:-W/2,horizontal?H/2:0,total);root.add(coverPivot);
addBox(coverPivot,'Front cover',horizontal?0:W/2,horizontal?-H/2:0,th/2,W,H,th,s.cover);
if(s.coverType!=='blank'){addBox(coverPivot,'Photo cover pocket',horizontal?0:W/2,horizontal?-H/2:0,th+.22,W*.66,H*.7,.45,'#ffffff',false)}
addBox(root,'Spine',horizontal?0:-W/2+1.1,horizontal?H/2-1.1:0,total/2,horizontal?W:2.2,horizontal?2.2: H,total,s.cover);
root.position.z=0;targetOpen=window.bookAPI.step===3||window.bookAPI.step===5?1:targetOpen;
const radius=Math.max(W,H,total);controls.target.set(0,0,total/2);camera.position.set(radius*1.65,-radius*1.85,radius*1.5);controls.update();}
function resize(){const r=canvas.getBoundingClientRect();let w=Math.max(1,r.width),h=Math.max(1,r.height);if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio())){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}}
function loop(){resize();let s=window.bookAPI.state;let sig=JSON.stringify(s)+':'+window.bookAPI.step;if(sig!==lastSignature){lastSignature=sig;build()}actualOpen+=(targetOpen-actualOpen)*.085;if(coverPivot){if(s.direction==='horizontal')coverPivot.rotation.x=-actualOpen*Math.PI*.92;else coverPivot.rotation.y=-actualOpen*Math.PI*.92;}if(rotating)root.rotation.z+=.004;controls.update();renderer.render(scene,camera);requestAnimationFrame(loop)}
// Existing toolbar buttons now control the WebGL geometry.
document.getElementById('toggleBook').onclick=()=>{targetOpen=1-targetOpen;document.getElementById('toggleBook').textContent=targetOpen?'Close book':'Open book'};
document.getElementById('spin').onclick=()=>{rotating=!rotating;document.getElementById('spin').textContent=rotating?'Stop rotation':'Auto rotate'};
document.getElementById('view').onclick=()=>{root.rotation.set(0,0,0);camera.position.set(145,-175,155);controls.target.set(0,0,20);controls.update()};
document.getElementById('explode').onclick=()=>{exploded=!exploded;document.getElementById('explode').textContent=exploded?'Assemble':'Explode parts';root.children.forEach((c,i)=>{if(c!==coverPivot)c.position.x=exploded?(i%2?1:-1)*Math.floor(i/2)*2:0})};
function meshXml(mesh){mesh.updateWorldMatrix(true,false);let g=mesh.geometry.clone();g.applyMatrix4(mesh.matrixWorld);const pos=g.getAttribute('position');const index=g.getIndex();let vertices=[],triangles=[];if(index){for(let i=0;i<pos.count;i++)vertices.push(`<vertex x="${pos.getX(i).toFixed(5)}" y="${pos.getY(i).toFixed(5)}" z="${pos.getZ(i).toFixed(5)}"/>`);for(let i=0;i<index.count;i+=3)triangles.push(`<triangle v1="${index.getX(i)}" v2="${index.getX(i+1)}" v3="${index.getX(i+2)}"/>`)}else{for(let i=0;i<pos.count;i++)vertices.push(`<vertex x="${pos.getX(i).toFixed(5)}" y="${pos.getY(i).toFixed(5)}" z="${pos.getZ(i).toFixed(5)}"/>`);for(let i=0;i<pos.count;i+=3)triangles.push(`<triangle v1="${i}" v2="${i+1}" v3="${i+2}"/>`)}g.dispose();return `<mesh><vertices>${vertices.join('')}</vertices><triangles>${triangles.join('')}</triangles></mesh>`}
// Export the exact same scene meshes used in the preview. Each print plate is a separate 3MF.
function exportPlates(){
 const s=window.bookAPI.state,d=window.bookAPI.dims;
 const groups=[];
 for(let i=1;i<=s.pages;i++)groups.push({name:`Page_${String(i).padStart(2,'0')}`,meshes:modelPieces.filter(p=>p.name.startsWith(`Page ${i} `))});
 groups.push({name:'Back_cover',meshes:modelPieces.filter(p=>p.name==='Back cover')});
 groups.push({name:'Front_cover',meshes:modelPieces.filter(p=>p.name==='Front cover')});
 groups.push({name:'Spine',meshes:modelPieces.filter(p=>p.name==='Spine')});
 const maxW=240,maxH=240,margin=8,spacing=7;
 const plates=[];let plate=[],x=margin,y=margin,rowH=0;
 for(const group of groups){
   // The spine is printed flat in its own plate; all other groups have one object footprint.
   const bw=group.name==='Spine'?Math.max(6,d.depth):d.w;
   const bh=d.h;
   if(x+bw+margin>maxW){x=margin;y+=rowH+spacing;rowH=0}
   if(y+bh+margin>maxH){plates.push(plate);plate=[];x=margin;y=margin;rowH=0}
   plate.push({...group,x,y,bw,bh});x+=bw+spacing;rowH=Math.max(rowH,bh);
 }
 if(plate.length)plates.push(plate);
 const xmlEsc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 const encoder=new TextEncoder();
 const contentTypes=`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>`;
 const rels=`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`;
 const result=[];
 for(let pi=0;pi<plates.length;pi++){
  let id=2,objects=[],build=[];
  for(const group of plates[pi]){
   // Geometry is authored around the book origin. The build transform moves each part into a print plate.
   for(const item of group.meshes){
    const mesh=item.mesh;
    mesh.updateWorldMatrix(true,false);
    let geometry=mesh.geometry.clone();geometry.applyMatrix4(mesh.matrixWorld);
    // Convert from assembled book to print-flat XY plane, and put every object at Z>=0.
    const pos=geometry.getAttribute('position');
    let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
    for(let j=0;j<pos.count;j++){let a=pos.getX(j),b=pos.getY(j),c=pos.getZ(j);minX=Math.min(minX,a);maxX=Math.max(maxX,a);minY=Math.min(minY,b);maxY=Math.max(maxY,b);minZ=Math.min(minZ,c);maxZ=Math.max(maxZ,c)}
    // All rails of a page share the same assembled origin, so their relative positions are preserved.
    let shiftX=group.x+d.w/2,shiftY=group.y+d.h/2;
    let baseZ=group.name.startsWith('Page_')?2.2+(parseInt(group.name.split('_')[1])-1)*2.7:group.name==='Front_cover'?2.2+s.pages*2.7:0;
    // Spine is laid flat independently rather than standing upright.
    if(group.name==='Spine'){
      for(let j=0;j<pos.count;j++){const xx=pos.getX(j),yy=pos.getY(j),zz=pos.getZ(j);pos.setXYZ(j,group.x+zz,group.y+yy,xx-minX)}
    }else{
      for(let j=0;j<pos.count;j++)pos.setXYZ(j,pos.getX(j)+shiftX,pos.getY(j)+shiftY,pos.getZ(j)-baseZ);
    }
    let vs=[],ts=[];for(let j=0;j<pos.count;j++)vs.push(`<vertex x="${pos.getX(j).toFixed(4)}" y="${pos.getY(j).toFixed(4)}" z="${Math.max(0,pos.getZ(j)).toFixed(4)}"/>`);
    const ix=geometry.getIndex();if(ix){for(let j=0;j<ix.count;j+=3)ts.push(`<triangle v1="${ix.getX(j)}" v2="${ix.getX(j+1)}" v3="${ix.getX(j+2)}"/>`)}else{for(let j=0;j<pos.count;j+=3)ts.push(`<triangle v1="${j}" v2="${j+1}" v3="${j+2}"/>`)}
    const color=item.color===s.cover?0:1;
    objects.push(`<object id="${id}" type="model" name="${xmlEsc(item.name)}" pid="1" pindex="${color}"><mesh><vertices>${vs.join('')}</vertices><triangles>${ts.join('')}</triangles></mesh></object>`);
    build.push(`<item objectid="${id}"/>`);id++;geometry.dispose();
   }
  }
  const model=`<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Title">PhotoBook Studio plate ${pi+1}</metadata><resources><basematerials id="1"><base name="Cover" displaycolor="${s.cover.toUpperCase()}FF"/><base name="Pages" displaycolor="${s.page.toUpperCase()}FF"/></basematerials>${objects.join('')}</resources><build>${build.join('')}</build></model>`;
  result.push({name:`Plate_${String(pi+1).padStart(2,'0')}.3mf`,blob:window.makeBookZip([['[Content_Types].xml',contentTypes],['_rels/.rels',rels],['3D/3dmodel.model',model]])});
 }
 return result;
}
window.exportReal3mf=async()=>{try{
 const plates=exportPlates();const name=(document.getElementById('filename').value||'PhotoBook').replace(/[^a-z0-9_-]/gi,'_');
 const download=(blob,filename)=>{const a=document.createElement('a');const u=URL.createObjectURL(blob);a.href=u;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000)};
 if(plates.length===1)download(plates[0].blob,name+'.3mf');
 else {const files=[];for(const p of plates)files.push([p.name,new Uint8Array(await p.blob.arrayBuffer())]);files.push(['READ_ME_FIRST.txt',`PhotoBook Studio - ${plates.length} build plates. Open each 3MF individually in Bambu Studio.\nIMPORTANT: This is a geometric prototype, NOT a validated working hinge design. Do not print all plates until a sample page has been tested.\nThe cover artwork is preview-only and is not included as printable geometry.\n`]);download(window.makeBookZip(files),name+'_print_plates.zip')}
 document.getElementById('message').textContent=`Exported ${plates.length} plate(s). Prototype only: test the photo fit and hinge mechanism before printing the full book.`;
 }catch(err){console.error(err);document.getElementById('message').textContent='Export error: '+err.message}}
loop();
