import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const engine=process.env.HB_ENGINE_DIR||path.resolve(root,'../engineCreate');
const load=rel=>import(pathToFileURL(path.join(engine,rel)).href);
const {createAsset,validAsset}=await load('prototype/asset-documents.js');
const {createWidgetAsset,createWidgetNode,validWidgetAsset}=await load('prototype/ui-assets.js');
const {makeNode}=await load('prototype/blueprint-model.js');
const {parseNativeHeader}=await load('prototype/native-model.js');
const {makeStarterScene}=await load('prototype/scene-templates.js');
const {defaultsForObject,addSceneComponent}=await load('prototype/scene-components.js');
const {readProjectManifest}=await load('tools/project-manifest.mjs');
const write=async(file,data)=>{await fs.mkdir(path.dirname(path.join(root,file)),{recursive:true});await fs.writeFile(path.join(root,file),typeof data==='string'?data:JSON.stringify(data,null,2)+'\n');};
if(process.argv.includes('--generate')){
  const widget=createWidgetAsset('W_Janggi');widget.referenceSize=[1280,900];widget.scaleMode='scale';widget.scaleRule='fit';
  const add=(type,name,x,y,w,h,props={},event)=>{
    const n=createWidgetNode(type,name);n.name=name;n.slot.offset=[x,y,w,h];Object.assign(n.properties,{color:'#deded6',fontSize:20},props);if(event)n.events.click=event;widget.nodes.push(n);return n;
  };
  add('Image','BlueBanner',35,27,252,82,{texture:'Assets/Art/Banner.svg'});
  add('Image','RedBanner',993,27,252,82,{texture:'Assets/Art/Banner.svg'});
  add('Text','BlueName',59,35,215,36,{text:'楚  ·  청연',fontSize:27,color:'#d0e7e6'});
  add('Text','RedName',1016,35,215,36,{text:'漢  ·  홍련',fontSize:27,color:'#f0d1bd'});
  add('Text','BlueScore',62,76,204,24,{text:'楚',fontSize:16,color:'#b8c9c4'});
  add('Text','RedScore',1019,76,204,24,{text:'漢',fontSize:16,color:'#c9b8a0'});
  add('Text','Title',480,13,320,34,{text:'將 棋',fontSize:26,color:'#ecdfbf',align:'center'});
  add('Image','TurnBanner',495,54,290,44,{texture:'Assets/Art/Turn.svg'});
  add('Text','Status',505,60,270,30,{text:'초의 차례',fontSize:22,color:'#ecdfbf',align:'center'});
  add('Text','MoveCount',1110,852,130,22,{text:'0 수 진행',fontSize:14,color:'#e6dac4',align:'right'});
  add('Image','NoticeBanner',35,687,245,94,{texture:'Assets/Art/Notice.svg'});
  add('Text','Notice',54,706,205,65,{text:'',fontSize:17,color:'#e6dfcf'});
  const button=(name,text,x,y,w,h,event)=>{
    add('Image',name+'Frame',x,y,w,h,{texture:'Assets/Art/Button.svg',imageFit:'fill'});
    return add('Button',name,x,y,w,h,{text,fontSize:16,color:'#e9dbbf',align:'center',background:'#00000000',hover:'#e5c98c22',pressed:'#e5c98c40',borderWidth:0,radius:0},event);
  };
  button('Undo','무르기',340,826,130,44,'Undo');button('Pass','한 수 쉼',483,826,146,44,'Pass');
  button('Draw','빅장 무승부',642,826,155,44,'Draw');button('New','새 대국',810,826,130,44,'New');
  button('BlueSetup','초 배치',40,801,240,40,'BlueSetup');button('RedSetup','한 배치',1000,801,240,40,'RedSetup');
  add('Text','Help',430,880,420,18,{text:'방향키 · Enter 또는 마우스로 두세요.',fontSize:13,color:'#d1c3a8',align:'center'});
  assert(validWidgetAsset(widget),'widget validation');await write('Assets/UI/W_Janggi.hbwidget.json',widget);
  const header=await fs.readFile(path.join(root,'Source/JanggiGame.h'),'utf8'),source=await fs.readFile(path.join(root,'Source/JanggiGame.cpp'),'utf8');
  const bp=createAsset('blueprint','BP_Janggi');bp.components=[];bp.variables=[];bp.settings.parentClass='JanggiGame';bp.native={...parseNativeHeader(header),header,source,headerPath:'Source/JanggiGame.h',sourcePath:'Source/JanggiGame.cpp'};bp.nodes=[];bp.edges=[];
  const connect=(event,method,inputValues={})=>{const e=makeNode(event==='beginPlay'?'beginPlay':'customEvent');if(event!=='beginPlay')e.options={eventName:event};const n=makeNode('nativeCall');n.nativeId='JanggiGame.'+method;n.inputValues=inputValues;bp.nodes.push(e,n);bp.edges.push({from:{node:e.id,pin:'then'},to:{node:n.id,pin:'exec'}});};
  connect('beginPlay','Start');
  ['Undo','New','Pass','Draw','BlueSetup','RedSetup'].forEach((e,i)=>connect(e,'Action',{command:i}));
  const input=(key,method,values={})=>{const event=makeNode('input'),call=makeNode('nativeCall');event.options={key};call.nativeId='JanggiGame.'+method;call.inputValues=values;bp.nodes.push(event,call);bp.edges.push({from:{node:event.id,pin:'then'},to:{node:call.id,pin:'exec'}});};
  input('LeftMouseButton','Pointer');['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter'].forEach((key,command)=>input(key,'Key',{command}));
  assert(validAsset('blueprint',bp),'blueprint validation');await write('Assets/Blueprints/BP_Janggi.hbblueprint.json',bp);
  const scene=makeStarterScene('HBJangi','3d');scene.environment={...scene.environment,skyEnabled:false,sunEnabled:false,cloudsEnabled:false,fogEnabled:false};scene.objects=[];
  const object=(id,kind,pos=[0,0,0],asset)=>{const o={id,name:id,kind,position:pos,rotation:[0,0,0],scale:[1,1,1],visible:true,components:defaultsForObject(kind),...asset?{asset}:{}};scene.objects.push(o);return o;};
  object('Janggi','empty').blueprintAsset='Assets/Blueprints/BP_Janggi.hbblueprint.json';
  object('Board','model',[0,0,0],'Assets/Models/Board.glb');
  const camera=object('Camera','camera',[0,18,0]);camera.rotation=[-90,0,0];Object.assign(camera.components.find(c=>c.type==='Camera').properties,{main:true,projection:'orthographic',orthographicSize:6.8});
  const key=object('KeyLight','directionalLight',[1,12,6]);key.rotation=[-55,-30,0];Object.assign(key.components.find(c=>c.type==='DirectionalLight').properties,{intensity:2.3,color:[1,.91,.78,1],castShadow:true});
  const fill=object('FillLight','directionalLight',[-5,7,-3]);fill.rotation=[-35,140,0];Object.assign(fill.components.find(c=>c.type==='DirectionalLight').properties,{intensity:1.3,color:[.66,.78,1,1],castShadow:false});
  const pooled=(o,active)=>{addSceneComponent(o,'PooledActor');o.components.find(c=>c.type==='PooledActor').properties.initiallyActive=active;return o;};
  const totals=[0,1,2,2,2,2,2,5];for(const team of ['Blue','Red'])for(let k=1;k<=7;k++)for(let j=0;j<totals[k];j++)pooled(object(`${team}${k}_${j}`,'model',[0,0,0],`Assets/Models/${team}${k}.glb`),true);
  for(let i=0;i<90;i++){const h=pooled(object('Hint'+i,'model',[i%9-4,.034,Math.floor(i/9)-4.5],'Assets/Models/Hint.glb'),false);Object.assign(h.components.find(c=>c.type==='MeshRenderer').properties,{castShadow:false});}
  pooled(object('Selection','model',[0,.04,0],'Assets/Models/Selection.glb'),false);
  await write('Assets/Scenes/Board.hbscene.json',scene);
  let id=randomUUID();try{id=JSON.parse(await fs.readFile(path.join(root,'HBJangi.hbproject'),'utf8')).id;}catch(e){if(e.code!=='ENOENT')throw e;}
  await write('HBJangi.hbproject',{version:1,engine:'HBEngine',engineVersion:'0.1.0',id,name:'HBJangi',startupScene:'Assets/Scenes/Board.hbscene.json',startupBlueprint:'Assets/Blueprints/BP_Janggi.hbblueprint.json'});
  await write('Settings/BuildProfiles.json',{version:1,profiles:[{id:'windows',name:'Windows',configuration:'release',productName:'HBJangi',width:1280,height:900,targetFrameRate:60,scenes:[{path:'Assets/Scenes/Board.hbscene.json',enabled:true}]}]});
  const frame=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="ink" x2="0" y2="1"><stop stop-color="#263c3b"/><stop offset="1" stop-color="#101a1c"/></linearGradient></defs>${body}</svg>`;
  await write('Assets/Art/Banner.svg',frame(252,82,'<path d="M0 9L14 0H240L252 12V70L240 82H0Z" fill="url(#ink)" stroke="#bca57a"/><path d="M9 14L20 7H234L244 16V65L235 74H9Z" fill="none" stroke="#bca57a" opacity=".45"/><path d="M18 58H232" stroke="#bca57a" opacity=".4"/>'));
  await write('Assets/Art/Turn.svg',frame(290,44,'<path d="M0 22L22 2H268L290 22L268 42H22Z" fill="url(#ink)" stroke="#c3ae83"/><path d="M11 22L29 7H261L279 22L261 37H29Z" fill="none" stroke="#c3ae83" opacity=".4"/>'));
  await write('Assets/Art/Button.svg',frame(240,44,'<path d="M0 22L12 2H228L240 22L228 42H12Z" fill="url(#ink)" stroke="#bca57a"/><path d="M8 22L17 7H223L232 22L223 37H17Z" fill="none" stroke="#bca57a" opacity=".45"/><path d="M4 22H18M222 22H236" stroke="#bca57a"/>'));
  await write('Assets/Art/Notice.svg',frame(245,94,'<path d="M0 9L12 0H233L245 12V82L233 94H12L0 82Z" fill="url(#ink)" opacity=".94" stroke="#bca57a"/><path d="M11 14H40M205 80H234" stroke="#bca57a"/>'));
  console.log('PASS: generated HBEngine project, validated UI and Blueprint');
}
if(process.argv.includes('--build')){
  const {buildGame,readBuildProfiles}=await load('tools/build-game.mjs');const record=await readProjectManifest(path.join(root,'HBJangi.hbproject'));
  const result=await buildGame(record,(await readBuildProfiles(record)).profiles[0],{onProgress:s=>console.log(s)});
  await write('Builds/latest.json',result);console.log(result.executable);
}
