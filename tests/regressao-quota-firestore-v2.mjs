import assert from 'node:assert/strict';
import fs from 'node:fs';
import {canonicalJson,samePersistedFields,changedEntityIds} from '../scripts/collaboration-quota-utils.js';

assert.equal(canonicalJson({b:2,a:1}),canonicalJson({a:1,b:2}),'Ordenação de chaves não causa gravação.');
assert.equal(samePersistedFields({id:'a',payload:{b:2,a:1},serverUpdatedAt:{seconds:50}},{id:'a',payload:{a:1,b:2}}),true,'Timestamp de servidor é ignorado.');
assert.equal(samePersistedFields({id:'a',payload:{a:2}},{id:'a',payload:{a:3}}),false,'Alteração real é detectada.');
assert.deepEqual([...changedEntityIds([{id:'a',hp:10},{id:'b',hp:5}],[{id:'a',hp:10},{id:'b',hp:4}])],['b'],'Só a ficha modificada deve ser selecionada.');
assert.deepEqual([...changedEntityIds([{id:'a'},{id:'b'}],[{id:'a'},{id:'c'}])].sort(),['b','c'],'Inclusão e remoção são detectadas.');

const provider=fs.readFileSync(new URL('../scripts/firebase-collaboration-provider.js',import.meta.url),'utf8');
const start=provider.indexOf('const replaceCollection=async(ref,records)=>{');
const end=provider.indexOf('\n const bundleSignatures=',start);
assert.ok(start>=0&&end>start,'Reconciliação diferencial deve estar presente.');
const method=provider.slice(start,end).trim();
let reads=0,commits=0,writes=0;
const records=new Map([
 ['s1',{id:'s1',payload:{title:'Sessão 1'},updatedAt:'A'}],
 ['s2',{id:'s2',payload:{title:'Sessão 2'},updatedAt:'A'}]
]);
const f={
 getDocs:async()=>{reads++;return{docs:[...records.entries()].map(([id,data])=>({id,ref:{id},data:()=>structuredClone(data)}))}},
 doc:(ref,id)=>({id}),
 writeBatch:()=>{
  const ops=[];
  return{
   set:(ref,record)=>ops.push(['set',ref.id,record]),
   delete:ref=>ops.push(['delete',ref.id]),
   commit:async()=>{commits++;writes+=ops.length;for(const[type,id,record]of ops)if(type==='set')records.set(id,record);else records.delete(id)}
  };
 }
};
const replaceCollection=new Function('f','db','samePersistedFields',method+';return replaceCollection;')(f,{},samePersistedFields);
const snapshot=()=>[...records.values()].map(row=>structuredClone(row));
let result=await replaceCollection('sessions',snapshot());
assert.equal(result.changed,0,'Lista igual não deve causar escrita.');
assert.equal(writes,0,'Nenhum batch de escrita para lista igual.');
result=await replaceCollection('sessions',[{id:'s1',payload:{title:'Sessão 1'},updatedAt:'A'},{id:'s2',payload:{title:'Sessão alterada'},updatedAt:'B'}]);
assert.equal(result.changed,1,'Somente sessão alterada.');
assert.equal(writes,1);
result=await replaceCollection('sessions',snapshot());
assert.equal(result.changed,0,'Nova tentativa idempotente.');
assert.equal(writes,1);
result=await replaceCollection('sessions',[{id:'s2',payload:{title:'Sessão alterada'},updatedAt:'B'}]);
assert.equal(result.changed,1,'Sessão removida deve ser apagada.');
assert.equal(records.has('s1'),false);
assert.equal(writes,2);
assert.equal(reads,4,'Uma consulta da coleção por reconciliação.');
assert.equal(commits,2,'Somente dois batches por duas modificações reais.');

assert.match(provider,/if\(bundleSignatures\.get\(publicationKey\)===publicationSignature\)return\{campaignId:cid,unchanged:true\}/,'Campanha idêntica não deve republicar.');
assert.match(provider,/if\(characterSignatures\.get\(signatureKey\)===signature\)return/,'Ficha idêntica não deve republicar.');
assert.match(provider,/syncWatchers\(children,desired\)/,'Assinaturas devem ser reconciliadas, não recriadas em lote.');

const realtime=fs.readFileSync(new URL('../scripts/collaboration-realtime.js',import.meta.url),'utf8');
assert.match(realtime,/MIN_PULL_INTERVAL_MS=4000/,'Limite de frequência remota.');
assert.match(realtime,/if\(pushInFlight\)return pushInFlight\.then\(\(\)=>pushChanges\(\)\)/,'Envios sobrepostos devem ser serializados.');
assert.match(realtime,/setTimeout\(pushChanges,650\)/,'Edições rápidas devem ser agrupadas.');
assert.match(realtime,/pendingCharacterIds\.add\(id\)/,'Mudanças de ficha precisam ser rastreadas.');
assert.match(realtime,/pendingAdventureCampaignIds\.add\(oldCid\)/,'Aventura movida deve atualizar também a campanha de origem.');
assert.match(realtime,/selectiveCampaigns\|\|changedCampaignIds\.has/,'Alterar uma campanha não deve republicar todas as outras.');
assert.match(realtime,/selectiveCharacters&&!changedIds\.has/,'Fichas não modificadas não são reenviadas.');
assert.match(realtime,/retryAfter=Date\.now\(\)\+60000;schedulePull\(\)/,'Retentativa controlada após cota atingida.');

console.log('OK — reconciliação diferencial, idempotência, seleção de ficha e estabilidade de listeners testadas sem acessar Firebase.');
