import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),built=JSON.parse(await fs.readFile(path.join(root,'Builds/latest.json'),'utf8'));
const work=await fs.mkdtemp(path.join(os.tmpdir(),'hbjangi-qa-')),pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){const end=Date.now()+45000;while(Date.now()<end){const v=await fn();if(v)return v;await pause(100);}throw Error('timeout: '+label);}
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
  await cdp('Runtime.enable');await until(()=>evaluate('window.hbPlayerDebug?.ready()&&document.querySelector("[data-widget-name=Cell76]")?.textContent==="楚"'),'board and native BeginPlay');
  const text=name=>evaluate(`document.querySelector('[data-widget-name=${name}]').textContent`);
  const click=async name=>{const point=await evaluate(`(()=>{const r=document.querySelector('[data-widget-name=${name}]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await cdp('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});};
  await click('BlueSetup');await until(async()=>/마상 \/ 마상/.test(await text('BlueSetup')),'formation');
  await click('Cell54');await until(async()=>await text('Cell45')==='•','legal move hint');
  await click('Cell45');await until(async()=>await text('Status')==='한의 차례','move');assert.equal(await text('MoveCount'),'1 수 진행');assert.equal(await text('Cell45'),'졸');
  await click('Undo');await until(async()=>await text('Cell54')==='졸'&&await text('MoveCount')==='0 수 진행','undo');
  await click('Pass');await until(async()=>await text('Status')==='한의 차례','pass');await click('Pass');await until(async()=>await text('Status')==='무승부','double pass');
  await click('New');await until(async()=>await text('New')==='새 대국 확인','reset confirmation');await click('New');await until(async()=>await text('Status')==='초의 차례'&&await text('MoveCount')==='0 수 진행','reset');
  await evaluate('Promise.all([...document.querySelectorAll("#game-ui img")].filter(i=>i.src).map(i=>i.decode()))');
  await fs.mkdir(path.join(root,'docs/qa'),{recursive:true});
  for(const [width,height] of [[1280,900],[960,720]]){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(200);
    const bounds=await evaluate('(()=>{const r=document.querySelector("[data-widget-name=Sidebar]").getBoundingClientRect();return {right:r.right,bottom:r.bottom}})()');assert(bounds.right<=width&&bounds.bottom<=height);
    const shot=await cdp('Page.captureScreenshot',{format:'png'});await fs.writeFile(path.join(root,`docs/qa/player-${width}.png`),Buffer.from(shot.data,'base64'));
  }
  assert.equal(errors.length,0,JSON.stringify(errors));
  await evaluate("window.chrome.webview.postMessage('hbengine.ready.player')");await until(()=>ended!==undefined,'player exit');assert.equal(ended,0);
  const shell=JSON.parse(await fs.readFile(path.join(work,'shell.json'),'utf8'));await assert.rejects(fetch('http://127.0.0.1:'+shell.port+'/api/session',{signal:AbortSignal.timeout(1500)}));
  await fs.writeFile(path.join(root,'docs/qa/acceptance.json'),JSON.stringify({passed:true,build:built.id,checks:['native BeginPlay','formation','pointer selection','legal hints','move and turn','undo','pass','draw','confirmed reset','SVG loading','1280x900 and 960x720 bounds','no runtime exceptions','clean exit and server shutdown'],errors},null,2));
  console.log('PASS: packaged HBEngine Player interaction, rendering, resize, cleanup');
}finally{ws?.close();if(ended===undefined)child.kill();}
