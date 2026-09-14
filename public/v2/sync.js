(function(root){
'use strict';
const DEFAULT_ENDPOINT='https://script.google.com/macros/s/AKfycbxWdgdgkv4UPskgzgaQWjWwq1cG8O1am6dwqjxR1CAuu9FgkSdpLwj00oT1vBCxYX5X/exec';
const META_KEY='tombolHadiahV2SyncMeta';
const statusText={idle:'Siap sinkron',syncing:'Menyinkronkan...',offline:'Offline, tersimpan lokal',conflict:'Data Sheet lebih baru',error:'Sinkron tertunda'};
function readMeta(){try{return JSON.parse(localStorage.getItem(META_KEY)||'{}')}catch{return {}}}
function writeMeta(meta){localStorage.setItem(META_KEY,JSON.stringify(meta))}
async function endpoint(){try{const text=await(await fetch('config.js',{cache:'no-store'})).text();return text.match(/TOMBOL_HADIAH_API_URL\s*=\s*"([^"]+)"/)?.[1]||DEFAULT_ENDPOINT}catch{return DEFAULT_ENDPOINT}}
async function rpc(path,method,body){
 const response=await fetch(await endpoint(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({path,method,body:body||{}}),signal:AbortSignal.timeout(20000)});
 const payload=await response.json();
 if(!payload.ok)throw Error(payload.error||'Sinkron gagal');
 return payload;
}
class SheetSync{
 constructor(repo,onStatus){this.repo=repo;this.onStatus=onStatus||(()=>{});this.timer=null;this.running=false;this.meta=readMeta()}
 status(kind,extra){this.onStatus(statusText[kind]||kind,extra)}
 async pull(){
  this.status('syncing');
  const payload=await rpc('/api/v2/state','GET',{});
  if(payload.state){const remote=Hadiah.validate(payload.state);const localStamp=this.repo.state?.updatedAt||'';if(!this.repo.state||payload.updatedAt>localStamp){this.repo.adapter.backup(this.repo.state||remote);this.repo.adapter.write(remote);this.repo.state=remote;this.meta.revision=payload.revision;this.meta.updatedAt=payload.updatedAt;writeMeta(this.meta);this.status('idle','Data terbaru dari Sheet');return 'remote'}}
  if(!this.repo.state&&payload.legacy){this.repo.init(payload.legacy);await this.push(true);return 'legacy'}
  this.status('idle');
  return 'same';
 }
 async push(force){
  if(!this.repo.state||this.running)return;
  this.running=true;this.status('syncing');
  try{
   const state=structuredClone(this.repo.state);state.updatedAt=new Date().toISOString();
   state.sync={provider:'google-sheet',spreadsheetId:'1JPmK5LsYCMfdM8S0a94OTIlg0waRuOFYTYO_0T4SG98',revision:this.meta.revision||0,updatedAt:state.updatedAt};
   Hadiah.validate(state);
   const payload=await rpc('/api/v2/state','PUT',{state,baseRevision:force?null:this.meta.revision||null});
   this.repo.adapter.write(state);this.repo.state=state;this.meta={revision:payload.revision,updatedAt:payload.updatedAt};writeMeta(this.meta);this.status('idle','Tersimpan di Sheet');
  }catch(error){
   if(/conflict/i.test(error.message)){this.status('conflict');await this.pull()}else{this.status('error',error.message)}
  }finally{this.running=false}
 }
 saveSoon(){clearTimeout(this.timer);this.timer=setTimeout(()=>this.push(false),700)}
 start(){this.pull().catch(e=>this.status('offline',e.message));setInterval(()=>this.pull().catch(e=>this.status('offline',e.message)),30000)}
}
root.HadiahSync={SheetSync,rpc};
})(globalThis);
