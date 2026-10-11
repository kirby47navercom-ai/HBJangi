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
const {readProjectManifest}=await load('tools/project-manifest.mjs');
const write=async(file,data)=>{await fs.mkdir(path.dirname(path.join(root,file)),{recursive:true});await fs.writeFile(path.join(root,file),typeof data==='string'?data:JSON.stringify(data,null,2)+'\n');};
if(process.argv.includes('--generate')){
  const widget=createWidgetAsset('W_Janggi');widget.referenceSize=[1280,900];widget.scaleMode='scale';widget.scaleRule='fit';
  const add=(type,name,x,y,w,h,props={},event)=>{
    const n=createWidgetNode(type,name);n.name=name;n.slot.offset=[x,y,w,h];Object.assign(n.properties,{color:'#e7dbc4',fontSize:20},props);if(event)n.events.click=event;widget.nodes.push(n);return n;
  };
  add('Panel','Backdrop',0,0,1280,900,{background:'#182927',radius:0});
  add('Text','Eyebrow',78,32,580,24,{text:'HB ENGINE  /  LOCAL TWO PLAYER',fontSize:14,color:'#a6b7ad'});
  add('Text','Title',76,61,560,60,{text:'장기',fontSize:48,color:'#f5e9ce'});
  add('Text','Subtitle',180,79,540,28,{text:'한 수에 담긴, 다음 수.',fontSize:18,color:'#b5bfb4'});
  add('Image','Board',56,146,680,724,{texture:'Assets/Art/Board.svg'});
  for(let i=0;i<90;i++){
    const x=104+(i%9)*72,y=186+Math.floor(i/9)*72;
    add('Image','Art'+i,x-27,y-27,54,54,{texture:'Assets/Art/Empty.svg'});
    const n=add('Button','Cell'+i,x-27,y-27,54,54,{text:'',texture:'Assets/Art/Empty.svg',background:'#00000000',hover:'#ffffff22',pressed:'#b88a4440',radius:28,fontSize:29,align:'center',tooltip:`${i%9+1}열 ${Math.floor(i/9)+1}행`},'Cell'+i);n.slot.zIndex=2;
  }
  const selection=add('Image','Selection',72,154,64,64,{texture:'Assets/Art/Selection.svg',visible:false});selection.slot.zIndex=1;
  add('Panel','Sidebar',780,146,434,724,{background:'#203532',borderColor:'#42514a',borderWidth:1,radius:18,padding:0});
  add('Text','Status',814,177,360,48,{text:'초의 차례',fontSize:34,color:'#f4dfaa'});
  add('Text','MoveCount',814,232,350,28,{text:'0 수 진행',fontSize:17,color:'#a9b7aa'});
  add('Text','RedScore',814,286,350,32,{text:'한',color:'#efaaa0'});
  add('Text','BlueScore',814,327,350,32,{text:'초',color:'#93c5ce'});
  add('Text','Notice',814,388,348,78,{text:'',fontSize:20,color:'#ddd5c1'});
  const button=(name,text,x,y,w,h,event)=>add('Button',name,x,y,w,h,{text,fontSize:18,align:'center',background:'#344a42',hover:'#496454',pressed:'#253a32',borderColor:'#647360',borderWidth:1,radius:8},event);
  button('Undo','한 수 무르기',814,489,169,46,'Undo');button('Pass','한 수 쉼',999,489,179,46,'Pass');
  button('New','새 대국',814,549,169,46,'New');button('Draw','빅장 무승부',999,549,179,46,'Draw');
  button('RedSetup','한 배치',814,625,364,42,'RedSetup');button('BlueSetup','초 배치',814,679,364,42,'BlueSetup');
  add('Text','Help',814,748,360,85,{text:'초가 먼저 둬요.  ·  기물 → 이동할 곳\n배치는 첫 수를 두기 전에 바꿀 수 있어요.\n두 번 연속 쉬면 무승부예요.',fontSize:16,color:'#a9b7aa'});
  assert(validWidgetAsset(widget),'widget validation');await write('Assets/UI/W_Janggi.hbwidget.json',widget);
  const header=await fs.readFile(path.join(root,'Source/JanggiGame.h'),'utf8'),source=await fs.readFile(path.join(root,'Source/JanggiGame.cpp'),'utf8');
  const bp=createAsset('blueprint','BP_Janggi');bp.components=[];bp.variables=[];bp.settings.parentClass='JanggiGame';bp.native={...parseNativeHeader(header),header,source,headerPath:'Source/JanggiGame.h',sourcePath:'Source/JanggiGame.cpp'};bp.nodes=[];bp.edges=[];
  const connect=(event,method,inputValues={})=>{const e=makeNode(event==='beginPlay'?'beginPlay':'customEvent');if(event!=='beginPlay')e.options={eventName:event};const n=makeNode('nativeCall');n.nativeId='JanggiGame.'+method;n.inputValues=inputValues;bp.nodes.push(e,n);bp.edges.push({from:{node:e.id,pin:'then'},to:{node:n.id,pin:'exec'}});};
  connect('beginPlay','Start');for(let i=0;i<90;i++)connect('Cell'+i,'Click',{cell:i});
  ['Undo','New','Pass','Draw','BlueSetup','RedSetup'].forEach((e,i)=>connect(e,'Action',{command:i}));
  assert(validAsset('blueprint',bp),'blueprint validation');await write('Assets/Blueprints/BP_Janggi.hbblueprint.json',bp);
  const scene=makeStarterScene('HBJangi','2d');scene.objects=[{id:'Janggi',name:'장기 대국',kind:'empty',visible:true,position:[0,0,0],rotation:[0,0,0],scale:[1,1,1],blueprintAsset:'Assets/Blueprints/BP_Janggi.hbblueprint.json'}];await write('Assets/Scenes/Board.hbscene.json',scene);
  let id=randomUUID();try{id=JSON.parse(await fs.readFile(path.join(root,'HBJangi.hbproject'),'utf8')).id;}catch(e){if(e.code!=='ENOENT')throw e;}
  await write('HBJangi.hbproject',{version:1,engine:'HBEngine',engineVersion:'0.1.0',id,name:'HBJangi',startupScene:'Assets/Scenes/Board.hbscene.json',startupBlueprint:'Assets/Blueprints/BP_Janggi.hbblueprint.json'});
  await write('Settings/BuildProfiles.json',{version:1,profiles:[{id:'windows',name:'Windows',configuration:'release',productName:'HBJangi',width:1280,height:900,targetFrameRate:60,scenes:[{path:'Assets/Scenes/Board.hbscene.json',enabled:true}]}]});
  const svg=body=>`<svg xmlns="http://www.w3.org/2000/svg" width="680" height="724" viewBox="0 0 680 724">${body}</svg>`;
  let art='<defs><linearGradient id="wood" x2="1" y2="1"><stop stop-color="#ead1a0"/><stop offset="1" stop-color="#cda573"/></linearGradient></defs><rect width="680" height="724" rx="18" fill="#0d1917"/><rect x="6" y="6" width="668" height="712" rx="15" fill="url(#wood)" stroke="#b68951" stroke-width="3"/>';
  for(let i=0;i<40;i++)art+=`<path d="M10 ${i*19} Q340 ${i*19+16} 670 ${i*19+3}" stroke="#866039" opacity=".055" fill="none"/>`;
  for(let x=0;x<9;x++)art+=`<path d="M${48+x*72} 40V688" stroke="#765535" stroke-width="1.4"/>`;
  for(let y=0;y<10;y++)art+=`<path d="M48 ${40+y*72}H624" stroke="#765535" stroke-width="1.4"/>`;
  for(let y of [40,544])art+=`<path d="M264 ${y}L408 ${y+144}M408 ${y}L264 ${y+144}" stroke="#765535" stroke-width="1.4"/>`;
  await write('Assets/Art/Board.svg',svg(art));
  await write('Assets/Art/Empty.svg','<svg xmlns="http://www.w3.org/2000/svg" width="54" height="54"/>');
  await write('Assets/Art/Selection.svg','<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="30" fill="none" stroke="#b87718" stroke-width="3"/></svg>');
  for(const color of ['Blue','Red']){
    const ink=color==='Blue'?'#285864':'#a04436';
    await write(`Assets/Art/${color}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="54" height="54" viewBox="0 0 54 54"><defs><linearGradient id="ivory" x2="0" y2="1"><stop stop-color="#fff2d1"/><stop offset="1" stop-color="#e3c691"/></linearGradient></defs><path d="M17 3H37L51 17V37L37 51H17L3 37V17Z" fill="#543d2b" opacity=".25" transform="translate(0 2)"/><path d="M17 1H37L51 15V35L37 51H17L3 35V15Z" fill="url(#ivory)" stroke="${ink}" stroke-width="1.6"/><path d="M18 5H36L47 16V34L36 45H18L7 34V16Z" fill="none" stroke="${ink}" opacity=".4"/></svg>`);
  }
  console.log('PASS: generated HBEngine project, validated UI and Blueprint');
}
if(process.argv.includes('--build')){
  const {buildGame,readBuildProfiles}=await load('tools/build-game.mjs');const record=await readProjectManifest(path.join(root,'HBJangi.hbproject'));
  const result=await buildGame(record,(await readBuildProfiles(record)).profiles[0],{onProgress:s=>console.log(s)});
  await write('Builds/latest.json',result);console.log(result.executable);
}
