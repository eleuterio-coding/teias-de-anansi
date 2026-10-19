import assert from 'node:assert/strict';
import {
 createCampaign,addCampaignMember,assignCharacterToMember,updateCampaignMember,
 unassignCharacterFromMember
} from '../scripts/campaign-state.js';

let rows=[],result;
result=createCampaign(rows,{id:'c1',name:'Mesa Um'});rows=result.list;
result=createCampaign(rows,{id:'c2',name:'Mesa Dois'});rows=result.list;
const add=(campaignId,username,name,extra={})=>{
 const created=addCampaignMember(rows,campaignId,{username,name,role:'player',...extra});
 if(created.ok)rows=created.list;
 return created
};
const fernanda=add('c1','fernanda','Fernanda').member;
const bruno=add('c1','bruno','Bruno').member;
const fernandaOtherCampaign=add('c2','fernanda','Fernanda').member;
const gustavoOtherCampaign=add('c2','gustavo','Gustavo').member;

result=assignCharacterToMember(rows,'c1',fernanda.id,'pc-exclusivo');
assert.equal(result.ok,true);rows=result.list;

result=assignCharacterToMember(rows,'c1',bruno.id,'pc-exclusivo');
assert.equal(result.ok,false,'Não permite duplicar ficha na mesma campanha.');
assert.match(result.reason,/outro jogador nesta campanha/i);
assert.equal(result.list.find(c=>c.id==='c1').members.find(m=>m.id===fernanda.id).characterId,'pc-exclusivo');

result=updateCampaignMember(rows,'c1',bruno.id,{characterId:'pc-exclusivo'});
assert.equal(result.ok,false,'Atualização direta não pode duplicar ficha dentro da campanha.');

result=addCampaignMember(rows,'c2',{username:'gustavo2',name:'Gustavo 2',characterId:'pc-exclusivo'});
assert.equal(result.ok,false,'Inclusão direta não pode usar personagem de outra campanha.');
assert.match(result.reason,/outra campanha/i);
assert.equal(result.list.find(c=>c.id==='c2').members.some(m=>m.username==='gustavo2'),false);

result=assignCharacterToMember(rows,'c2',fernandaOtherCampaign.id,'pc-exclusivo');
assert.equal(result.ok,false,'Nem o mesmo jogador pode usar a ficha simultaneamente em duas campanhas.');
assert.match(result.reason,/outra campanha/i);
assert.equal(rows.find(c=>c.id==='c1').members.find(m=>m.id===fernanda.id).characterId,'pc-exclusivo','Vínculo anterior nunca deve ser removido automaticamente.');
assert.equal(rows.find(c=>c.id==='c2').members.find(m=>m.id===fernandaOtherCampaign.id).characterId,null);

result=assignCharacterToMember(rows,'c2',gustavoOtherCampaign.id,'pc-exclusivo');
assert.equal(result.ok,false,'Outro jogador em campanha diferente também não pode receber a ficha.');

result=updateCampaignMember(rows,'c2',fernandaOtherCampaign.id,{characterId:'pc-exclusivo'});
assert.equal(result.ok,false,'Atualização direta deve respeitar campanha original.');
assert.match(result.reason,/outra campanha/i);

result=unassignCharacterFromMember(rows,'c1',fernanda.id);
assert.equal(result.ok,true);rows=result.list;
result=assignCharacterToMember(rows,'c2',fernandaOtherCampaign.id,'pc-exclusivo');
assert.equal(result.ok,true,'A ficha liberada pode ser atribuída explicitamente em outra campanha.');
rows=result.list;
assert.equal(rows.find(c=>c.id==='c2').members.find(m=>m.id===fernandaOtherCampaign.id).characterId,'pc-exclusivo');
assert.equal(rows.find(c=>c.id==='c1').members.find(m=>m.id===fernanda.id).characterId,null);

result=unassignCharacterFromMember(rows,'c2',fernandaOtherCampaign.id);
assert.equal(result.ok,true);rows=result.list;
result=assignCharacterToMember(rows,'c1',bruno.id,'pc-exclusivo');
assert.equal(result.ok,true,'Após desvincular, outra campanha pode receber o personagem.');
rows=result.list;

const duplicateSameCampaign=addCampaignMember(rows,'c1',{username:'novo',name:'Novo',characterId:'pc-exclusivo'});
assert.equal(duplicateSameCampaign.ok,false,'Uma ficha não pode aparecer em dois registros da mesma campanha.');

result=assignCharacterToMember(rows,'c1',bruno.id,'pc-exclusivo');
assert.equal(result.ok,true,'Reafirmar o próprio vínculo deve ser idempotente.');

console.log('OK — personagem vinculado a uma campanha por vez, sem transferência automática.');
