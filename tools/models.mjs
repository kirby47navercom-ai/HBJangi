import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const engine=process.env.HB_ENGINE_DIR||path.resolve(root,'../engineCreate');
const THREE=await import(pathToFileURL(path.join(engine,'node_modules/three/build/three.module.js')).href);
const modelDir=path.join(root,'Assets/Models');await fs.mkdir(modelDir,{recursive:true});
// Minimal glTF writer for static geometry using the engine's installed Three.js.
async function save(name,parts,materials){
  const chunks=[],views=[],accessors=[],images=[],textures=[];let bytes=0;
  const append=(data,target)=>{const buffer=Buffer.from(data.buffer||data,data.byteOffset||0,data.byteLength);const view={buffer:0,byteOffset:bytes,byteLength:buffer.length,...target?{target}:{}};const id=views.push(view)-1;chunks.push(buffer);bytes+=buffer.length;if(bytes%4){const padding=Buffer.alloc(4-bytes%4);chunks.push(padding);bytes+=padding.length;}return id;};
  for(const m of materials)if(m.texture){const data=await fs.readFile(path.join(root,m.texture));const image=images.push({bufferView:append(data),mimeType:'image/png'})-1;const texture=textures.push({source:image})-1;m.pbrMetallicRoughness.baseColorTexture={index:texture};delete m.texture;}
  const primitives=parts.map(({geometry,material=0})=>{
    const attributes={};for(const [key,gltf] of [['position','POSITION'],['normal','NORMAL'],['uv','TEXCOORD_0']]){
      const a=geometry.getAttribute(key);if(!a)continue;const accessor={bufferView:append(a.array,34962),componentType:5126,count:a.count,type:a.itemSize===2?'VEC2':'VEC3'};
      if(key==='position'){geometry.computeBoundingBox();accessor.min=geometry.boundingBox.min.toArray();accessor.max=geometry.boundingBox.max.toArray();}
      attributes[gltf]=accessors.push(accessor)-1;
    }
    const p={attributes,material};if(geometry.index){const a=geometry.index;p.indices=accessors.push({bufferView:append(a.array,34963),componentType:a.array.BYTES_PER_ELEMENT===2?5123:5125,count:a.count,type:'SCALAR'})-1;}return p;
  });
  const json={asset:{version:'2.0',generator:'HBJangi original static meshes'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0,name}],meshes:[{primitives}],buffers:[{byteLength:bytes}],bufferViews:views,accessors,materials,...images.length?{images,textures}:{},...materials.some(m=>m.extensions)?{extensionsUsed:['KHR_materials_unlit']}:{}};
  let text=Buffer.from(JSON.stringify(json));if(text.length%4)text=Buffer.concat([text,Buffer.alloc(4-text.length%4,32)]);
  const binary=Buffer.concat(chunks),header=Buffer.alloc(12),jhead=Buffer.alloc(8),bhead=Buffer.alloc(8);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+text.length+binary.length,8);jhead.writeUInt32LE(text.length);jhead.writeUInt32LE(0x4e4f534a,4);bhead.writeUInt32LE(binary.length);bhead.writeUInt32LE(0x004e4942,4);
  assert(binary.length===bytes&&parts.length);await fs.writeFile(path.join(modelDir,name+'.glb'),Buffer.concat([header,jhead,text,bhead,binary]));
}
const material=(color,metal=.5,rough=.35,texture)=>({pbrMetallicRoughness:{baseColorFactor:[...new THREE.Color(color).toArray(),1],metallicFactor:metal,roughnessFactor:rough},...texture?{texture}:{}});
const cylinder=(rt,rb,h,y)=>{const g=new THREE.CylinderGeometry(rt,rb,h,8,1);g.rotateY(Math.PI/8);g.translate(0,y,0);return g;};
for(const team of ['Blue','Red'])for(let k=1;k<=7;k++){
  const r=k===1?.43:k===7?.32:.38;
  const shell=team==='Blue'?'#456e70':'#956653';
  const body=cylinder(r,r+.025,.42,.25),rim=cylinder(r+.015,r+.025,.055,.49),foot=cylinder(r+.02,r+.035,.07,.06),face=new THREE.CircleGeometry(r-.028,8);face.rotateZ(Math.PI/8);face.rotateX(-Math.PI/2);face.translate(0,.522,0);
  // glTF image V starts at the top: map the glyph toward the far side of the board.
  const positions=face.getAttribute('position'),uv=face.getAttribute('uv');for(let i=0;i<positions.count;i++)uv.setXY(i,.5+positions.getX(i)/(2*r),.5+positions.getZ(i)/(2*r));
  await save(team+k,[{geometry:body},{geometry:rim,material:1},{geometry:foot,material:1},{geometry:face,material:2}],[material(shell,.12,.45),material(team==='Blue'?'#9bb0bb':'#cbaa70',.65,.25),material('#ffffff',.12,.58,`Assets/Art/${team}${k}.png`)]);
}
const base=new THREE.BoxGeometry(9.6,.65,10.6);base.translate(0,-.405,0);
const bevel=new THREE.BoxGeometry(9.35,.12,10.35);bevel.translate(0,-.055,0);
const board=new THREE.PlaneGeometry(9.2,10.2);board.rotateX(-Math.PI/2);board.translate(0,.012,0);
await save('Board',[{geometry:base},{geometry:bevel,material:1},{geometry:board,material:2}],[material('#35433f',.15,.4),material('#8d7957',.72,.28),material('#ffffff',.25,.63,'Assets/Art/BoardMetal.png')]);
for(const [name,radius,tube] of [['Selection',.49,.025],['Hint',.11,.024]]){
  const g=new THREE.TorusGeometry(radius,tube,8,32);g.rotateX(-Math.PI/2);
  const m=material('#dcbb72',.25,.3);m.emissiveFactor=[.3,.2,.05];await save(name,[{geometry:g}],[m]);
}
console.log('PASS: 17 original board and piece GLB meshes with embedded textures');
