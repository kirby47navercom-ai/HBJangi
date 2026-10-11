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
  add('Text','BlueSeal',72,103,90,95,{text:'楚',fontSize:64,color:'#547f7d'});
  add('Text','RedSeal',1115,103,90,95,{text:'漢',fontSize:64,color:'#a36560'});
  add('Text','BlueName',75,213,140,36,{text:'청 연',fontSize:23,color:'#345d59'});
  add('Text','RedName',1066,213,140,36,{text:'홍 련',fontSize:23,color:'#985e58',align:'right'});
  add('Text','BlueScore',76,255,140,24,{text:'楚',fontSize:15,color:'#456b65'});
  add('Text','RedScore',1066,255,140,24,{text:'漢',fontSize:15,color:'#886e60',align:'right'});
  add('Text','Title',490,20,300,42,{text:'청연 · 홍련',fontSize:29,color:'#365c58',align:'center'});
  add('Text','Status',440,69,400,30,{text:'초의 차례',fontSize:19,color:'#456c62',align:'center'});
  add('Text','MoveCount',1000,854,230,22,{text:'0 수 진행',fontSize:14,color:'#526e66',align:'right'});
  add('Text','Notice',40,595,210,100,{text:'',fontSize:16,color:'#526e66'});
  const button=(name,text,x,y,w,h,event)=>{
    add('Image',name+'Frame',x,y,w,h,{texture:'Assets/Art/PorcelainButton.png',imageFit:'fill'});
    return add('Button',name,x,y,w,h,{text,fontSize:14,color:'#345957',align:'center',background:'#00000000',hover:'#ffffff30',pressed:'#547f7d30',borderWidth:0,radius:0},event);
  };
  button('Undo','무르기',365,809,130,48,'Undo');button('Pass','한 수 쉼',505,809,130,48,'Pass');
  button('Draw','빅장 무승부',645,809,140,48,'Draw');button('New','새 대국',795,809,130,48,'New');
  button('BlueSetup','초 배치',32,716,225,44,'BlueSetup');button('RedSetup','한 배치',1023,716,225,44,'RedSetup');
  add('Text','Help',410,877,460,18,{text:'방향키 · Enter 또는 마우스로 두세요.',fontSize:12,color:'#526e66',align:'center'});
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
  // A constant environment color, without sky gradients, scenery, or illustrations.
  scene.environment.mode='actors';
  const matte=object('ScreenColor','skyAtmosphere');Object.assign(matte.components.find(c=>c.type==='SkyAtmosphere').properties,{topColor:[.61,.71,.66,1],horizonColor:[.61,.71,.66,1],groundColor:[.61,.71,.66,1],sunDiskScale:0,sunHeightTint:false,exposure:1});
  const ambient=object('SoftFill','skyLight');Object.assign(ambient.components.find(c=>c.type==='SkyLight').properties,{color:[1,1,1,1],groundColor:[.8,.85,.8,1],intensity:.8,indirectIntensity:.25,realTimeCapture:false});
  const camera=object('Camera','camera',[0,16,7.4609]);camera.rotation=[-65,0,0];Object.assign(camera.components.find(c=>c.type==='Camera').properties,{main:true,projection:'orthographic',orthographicSize:6.8});
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
  console.log('PASS: generated HBEngine project, validated UI and Blueprint');
}
if(process.argv.includes('--build')){
  const {buildGame,readBuildProfiles}=await load('tools/build-game.mjs');const record=await readProjectManifest(path.join(root,'HBJangi.hbproject'));
  const result=await buildGame(record,(await readBuildProfiles(record)).profiles[0],{onProgress:s=>console.log(s)});
  await write('Builds/latest.json',result);console.log(result.executable);
}
