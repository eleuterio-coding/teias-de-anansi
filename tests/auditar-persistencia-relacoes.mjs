import assert from'node:assert/strict';
import{validatePortableRelations}from'../scripts/backup-relations.js';
const pc={id:'pc-1'},session={id:'s1',encounters:[{id:'e1'}]},campaign={id:'c1',name:'Mesa 1',members:[{characterId:'pc-1'}],sessions:[session]},scene={title:'Cena',sessionId:'s1',encounterRef:{sessionId:'s1',encounterId:'e1'}},adventure={id:'a1',title:'Aventura',campaignId:'c1',scenes:[scene]};
assert.equal(validatePortableRelations({characters:[pc],campaigns:[campaign],adventures:[adventure]}),true);
assert.throws(()=>validatePortableRelations({characters:[pc],campaigns:[campaign,{...campaign,id:'c2',name:'Mesa 2'}],adventures:[adventure]}),/mais de uma Campanha/,'Um personagem não pode reaparecer vinculado a duas Mesas após merge/importação.');
assert.throws(()=>validatePortableRelations({characters:[pc],campaigns:[campaign],adventures:[{...adventure,scenes:[{...scene,sessionId:'ausente',encounterRef:{sessionId:'ausente',encounterId:'e1'}}]}]}),/Sessão vinculada ausente/);
assert.throws(()=>validatePortableRelations({characters:[pc],campaigns:[campaign],adventures:[{...adventure,scenes:[{...scene,encounterRef:{sessionId:'s1',encounterId:'ausente'}}]}]}),/Encontro vinculado ausente/);
assert.throws(()=>validatePortableRelations({characters:[],campaigns:[campaign],adventures:[]}),/personagem vinculado ausente/);
console.log('OK — Bloco 14: relações entre Personagens, Campanhas, Sessões, Encontros e Aventuras permanecem válidas no pacote portátil.');
