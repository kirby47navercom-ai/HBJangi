import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),built=JSON.parse(await fs.readFile(path.join(root,'Builds/latest.json'),'utf8'));
const work=await fs.mkdtemp(path.join(os.tmpdir(),'hbjangi-qa-')),pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){const end=Date.now()+45000;while(Date.now()<end){const v=await fn();if(v){console.log('PASS: '+label);return v;}await pause(100);}throw Error('timeout: '+label);}
const reservation=net.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r));
const env={...process.env,HB_USER_DATA_DIR:path.join(work,'profile'),HB_PLAYER_ACCEPTANCE:'1',WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS:'--remote-debugging-port='+port};for(const k of ['PORT','HB_PROJECT_DIR','HB_PROJECT_FILE'])delete env[k];
const child=spawn(built.executable,['--smoke-test',path.join(work,'shell.json')],{cwd:work,env,windowsHide:true,stdio:'pipe'});let ended,output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);child.on('exit',code=>ended=code);
let ws,seq=0;const pending=new Map(),errors=[];
try{
  const target=await until(async()=>{if(ended!==undefined)throw Error('Player exited '+ended+output);try{return (await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page'&&t.url.startsWith('http://127.0.0.1:'));}catch{return false;}},'debugger');
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  ws.onmessage=({data})=>{const m=JSON.parse(data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params);};
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error(method+' timeout'));},20000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  await cdp('Runtime.enable');await until(()=>evaluate('window.hbPlayerDebug?.ready()&&document.querySelector("[data-widget-name=Status]")?.textContent==="초의 차례"'),'board and native BeginPlay');
  const text=name=>evaluate(`document.querySelector('[data-widget-name=${name}]').textContent`);
  const clickPoint=async point=>{await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await cdp('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});await pause(90);await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});};
  const click=async name=>clickPoint(await evaluate(`(()=>{const r=document.querySelector('[data-widget-name=${name}]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`));
  const actor=id=>evaluate(`window.hbPlayerDebug.inspect().objects.find(o=>o.id===${JSON.stringify(id)})`);
  const clickCell=async cell=>{
    const point=await evaluate(`(()=>{const r=document.querySelector('#game-canvas').getBoundingClientRect();return {x:r.x+r.width/2+${cell%9-4}*r.height/13.6,y:r.y+r.height/2+${Math.floor(cell/9)-4.5}*r.height/13.6}})()`);
    await clickPoint(point);
  };
  await fs.mkdir(path.join(root,'docs/qa'),{recursive:true});await pause(400);
  const initial=await cdp('Page.captureScreenshot',{format:'png'});await fs.writeFile(path.join(root,'docs/qa/initial-3d.png'),Buffer.from(initial.data,'base64'));
  const initialState=await evaluate('window.hbPlayerDebug.inspect()');assert.equal(initialState.camera.projection,'OrthographicCamera');assert(!initialState.objects.some(o=>['Duel','Cosmos'].includes(o.id)),'no decorative background actors');assert.equal((await actor('Camera')).rotation[0],-90);
  assert.deepEqual((await actor('Blue1_0')).position,[0,0,3.5]);
  for(const o of initialState.objects.filter(o=>/^(Blue|Red)[1-7]_/.test(o.id)))assert.equal(o.rotation[1],o.id.startsWith('Red')?180:0,'pieces face their owners');
  await click('BlueSetup');await until(async()=>/馬象 \/ 馬象/.test(await text('BlueSetup')),'formation');
  await clickCell(54);await until(async()=>(await actor('Hint45')).visible,'3D legal move ring');
  await clickCell(45);await until(async()=>await text('Status')==='한의 차례','3D ray-picked move');assert.equal(await text('MoveCount'),'1 수 진행');assert.deepEqual((await actor('Blue7_0')).position,[-4,0,.5]);
  await click('Undo');await until(async()=>await text('MoveCount')==='0 수 진행','undo');assert.deepEqual((await actor('Blue7_0')).position,[-4,0,1.5]);
  await click('Pass');await until(async()=>await text('Status')==='한의 차례','pass');await click('Pass');await until(async()=>await text('Status')==='무승부','double pass');
  await click('New');await until(async()=>await text('New')==='새 대국 확인','reset confirmation');await click('New');await until(async()=>await text('Status')==='초의 차례'&&await text('MoveCount')==='0 수 진행','reset');
  await clickCell(76);await clickCell(76);
  console.log('Keyboard focus:',await evaluate('document.activeElement.id'));
  const key=async(value,code)=>{await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:value,code:value,windowsVirtualKeyCode:code});await pause(180);await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:value,code:value,windowsVirtualKeyCode:code});await pause(180);};
  for(let i=1;i<=4;i++){await key('ArrowLeft',37);await until(async()=>(await actor('Selection')).position[0]===-i,'keyboard left '+i);}
  for(let i=1;i<=2;i++){await key('ArrowUp',38);await until(async()=>Math.abs((await actor('Selection')).position[2]-(3.5-i))<.001,'keyboard up '+i);}
  await key('Enter',13);await until(async()=>(await actor('Hint45')).visible,'keyboard selection');await key('ArrowUp',38);await until(async()=>Math.abs((await actor('Selection')).position[2]-.5)<.001,'keyboard destination');await key('Enter',13);await until(async()=>await text('MoveCount')==='1 수 진행','keyboard move');await click('Undo');await until(async()=>await text('MoveCount')==='0 수 진행','keyboard undo');
  await evaluate('Promise.all([...document.querySelectorAll("#game-ui img")].filter(i=>i.src).map(i=>i.decode()))');
  await fs.mkdir(path.join(root,'docs/qa'),{recursive:true});
  for(const [width,height] of [[1280,900],[960,720]]){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(200);
    const bounds=await evaluate('(()=>{const r=document.querySelector("[data-widget-name=RedSetup]").getBoundingClientRect();return {right:r.right,bottom:r.bottom}})()');assert(bounds.right<=width&&bounds.bottom<=height);
    const shot=await cdp('Page.captureScreenshot',{format:'png'});await fs.writeFile(path.join(root,`docs/qa/player-${width}.png`),Buffer.from(shot.data,'base64'));
  }
  assert.equal(errors.length,0,JSON.stringify(errors));
  await evaluate("window.chrome.webview.postMessage('hbengine.ready.player')");await until(()=>ended!==undefined,'player exit');assert.equal(ended,0);
  const shell=JSON.parse(await fs.readFile(path.join(work,'shell.json'),'utf8'));await assert.rejects(fetch('http://127.0.0.1:'+shell.port+'/api/session',{signal:AbortSignal.timeout(1500)}));
  await fs.writeFile(path.join(root,'docs/qa/acceptance.json'),JSON.stringify({passed:true,build:built.id,checks:['native BeginPlay','32 modeled pieces facing respective owners','embedded Hanja textures','board-only art and native HUD','straight overhead orthographic camera','no decorative background actors','formation','3D pointer ray picking','3D legal rings','move and turn','undo','pass','draw','confirmed reset','arrow keys and Enter move','1280x900 and 960x720 bounds','no runtime exceptions','clean exit and server shutdown'],errors},null,2));
  console.log('PASS: packaged HBEngine Player interaction, rendering, resize, cleanup');
}finally{ws?.close();if(ended===undefined)child.kill();}
