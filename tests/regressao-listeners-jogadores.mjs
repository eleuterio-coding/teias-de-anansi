import assert from 'node:assert/strict';
import fs from 'node:fs';

// Testa a implementação efetiva com Firebase simulado, sem gastar cota real.
const source=fs.readFileSync(new URL('../scripts/firebase-collaboration-provider.js',import.meta.url),'utf8');
const from=source.indexOf('subscribeRealtime(onChange,onError=()=>{}){');
const to=source.indexOf('\n  async signInUsername',from);
assert.ok(from>=0&&to>from,'Método subscribeRealtime presente.');
const method=source.slice(from,to).trim().replace(/,\s*$/,'');
const build=new Function('auth','accountFor','ownerUsername','f','db','normalizeMember','canonicalUsername','playerAccounts','unique',`return ({${method}}).subscribeRealtime`);
function simulate(username,master=false){
 const listeners=[];let opens=0,closes=0,signals=0;
 const f={
  collection:(db,...parts)=>'collection:'+parts.join('/'),
  doc:(db,...parts)=>'doc:'+parts.join('/'),
  where:(name,op,val)=>name+'='+val,
  query:(ref,where)=>'query:'+ref+':'+where,
  onSnapshot:(ref,cb)=>{const record={ref,cb,active:true};listeners.push(record);opens++;return()=>{if(record.active){record.active=false;closes++}}}
 };
 const login=master?'rafael':username,auth={currentUser:{uid:'user1',email:login+'@teias.invalid'}};
 const fn=build(auth,()=>({username:login}),'rafael',f,{},row=>row,val=>String(val||'').toLowerCase(),[{username:'bruno'},{username:'gustavo'},{username:'leo'},{username:'fernanda'}],rows=>[...new Set(rows||[])]);
 const stop=fn(()=>signals++),root=listeners[0],doc=(id,data)=>({id,data:()=>data});
 if(master){
  const campaigns={docs:[doc('campaign1',{ownerId:'user1'})],metadata:{}};
  root.cb(campaigns);const count=opens;root.cb(campaigns);
  assert.equal(opens,count,'Mestre não reabre watchers após snapshot equivalente.');
  const userWatcher=listeners.find(item=>item.active&&item.ref==='collection:users');
  const profiles={docs:[doc('uid2',{username:'fernanda'})],metadata:{}};
  userWatcher.cb(profiles);const now=opens;userWatcher.cb(profiles);
  assert.equal(opens,now,'Mestre não reabre watchers de fichas de jogadores sem alteração do elenco de perfis.');
 }else{
  const membership={campaignId:'campaign1',username,role:'player',active:true,sessionIds:['session1'],adventureIds:['adventure1']};
  const snapshot={docs:[doc('member1',membership)],metadata:{}};
  root.cb(snapshot);const first=opens;root.cb(snapshot);
  assert.equal(opens,first,username+' não reabre watchers ao receber membership inalterada.');
  root.cb({docs:[doc('member1',{...membership,sessionIds:['session1','session2']})],metadata:{}});
  assert.ok(opens>first&&closes>0,username+' atualiza watchers quando permissões de sessão mudam.');
 }
 stop();
 assert.ok(listeners.every(item=>!item.active),'Nenhum listener deve continuar ativo após logout.');
 assert.equal(opens,closes,'Cada listener deve ser liberado uma única vez.');
 assert.ok(signals>0,'Snapshots ainda disparam atualização do painel.');
}
for(const username of ['bruno','gustavo','leo','fernanda'])simulate(username);
simulate('rafael',true);
const realtime=fs.readFileSync(new URL('../scripts/collaboration-realtime.js',import.meta.url),'utf8');
assert.match(realtime,/retryAfter=Date\.now\(\)\+60000/,'HTTP 429 deve suspender novas consultas temporariamente.');
console.log('OK — Mestre e quatro jogadores mantêm listeners estáveis, respeitam novas permissões e encerram listeners no logout.');
