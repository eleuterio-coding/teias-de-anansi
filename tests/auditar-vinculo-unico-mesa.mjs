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

result=assignCharacterToMember(rows,'c1',fernanda.id,'pc-exclusivo');
assert.equal(result.ok,true);rows=result.list;

result=assignCharacterToMember(rows,'c1',bruno.id,'pc-exclusivo');
assert.equal(result.ok,false,'Personagem de Fernanda não pode ser tomado por Bruno.');
assert.match(result.reason,/outro jogador/i);
assert.equal(result.list.find(c=>c.id==='c1').members.find(m=>m.id===fernanda.id).characterId,'pc-exclusivo');

result=updateCampaignMember(rows,'c1',bruno.id,{characterId:'pc-exclusivo'});
assert.equal(result.ok,false,'Atualização direta não deve burlar a exclusividade.');

result=addCampaignMember(rows,'c2',{username:'gustavo',name:'Gustavo',characterId:'pc-exclusivo'});
assert.equal(result.ok,false,'Inclusão direta de membro não deve duplicar vínculo.');
assert.equal(result.list.find(c=>c.id==='c2').members.some(m=>m.username==='gustavo'),false);

result=assignCharacterToMember(rows,'c2',fernandaOtherCampaign.id,'pc-exclusivo');
assert.equal(result.ok,true,'O próprio jogador pode mover sua ficha entre campanhas.');
assert.equal(result.movedFrom.campaignId,'c1');
rows=result.list;
assert.equal(rows.find(c=>c.id==='c1').members.find(m=>m.id===fernanda.id).characterId,null);
assert.equal(rows.find(c=>c.id==='c2').members.find(m=>m.id===fernandaOtherCampaign.id).characterId,'pc-exclusivo');

result=unassignCharacterFromMember(rows,'c2',fernandaOtherCampaign.id);
assert.equal(result.ok,true);rows=result.list;
result=assignCharacterToMember(rows,'c1',bruno.id,'pc-exclusivo');
assert.equal(result.ok,true,'Após desvincular, outra pessoa pode receber o personagem.');
rows=result.list;
assert.equal(rows.find(c=>c.id==='c1').members.find(m=>m.id===bruno.id).characterId,'pc-exclusivo');

const duplicateSameCampaign=addCampaignMember(rows,'c1',{username:'bruno',name:'Bruno',characterId:'pc-exclusivo'});
assert.equal(duplicateSameCampaign.ok,false,'Uma ficha não pode aparecer em dois registros da mesma campanha.');
console.log('OK — exclusividade de personagem por jogador e transferência controlada.');
