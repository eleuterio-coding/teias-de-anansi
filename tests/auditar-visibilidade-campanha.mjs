import assert from'node:assert/strict';
import{sanitizeCampaign,updateCampaign}from'../scripts/campaign-state.js';
import{campaignSharedProjection,campaignSharedCoreProjection}from'../scripts/collaboration-model.js';

const source={
 id:'campaign-disclosure',name:'Reinos de Prata',
 importantNpcs:'TEXTO PRIVADO NPC',
 importantNpcIds:['npc-1','npc-2'],
 importantNpcPublicNames:{'npc-1':'Arauto Revelado','npc-2':'Vilão Oculto'},
 importantNpcVisibility:{'npc-1':true,'npc-2':false},
 importantLocations:'Portal Antigo\nFortaleza Secreta',
 importantLocationEntries:[
  {id:'loc-1',name:'Portal Antigo',visibleToPlayers:true,image:{id:'image-1',campaignId:'campaign-disclosure',entityType:'campaign',entityId:'campaign-disclosure',mime:'image/webp'}},
  {id:'loc-2',name:'Fortaleza Secreta',visibleToPlayers:false,image:{id:'image-2',campaignId:'campaign-disclosure',entityType:'campaign',entityId:'campaign-disclosure'}}
 ],
 timeline:'TEXTO PRIVADO CRONOLOGIA',
 timelineNodes:[
  {id:'t-1',text:'A chegada',visibleToPlayers:true,children:[
   {id:'t-1a',text:'Segredo da torre',visibleToPlayers:false,children:[]},
   {id:'t-1b',text:'Visita à cidade',visibleToPlayers:true,children:[]}
  ]},
  {id:'t-2',text:'Plano secreto',visibleToPlayers:false,children:[
   {id:'t-2a',text:'Subevento proibido',visibleToPlayers:true,children:[]}
  ]}
 ]
};
const c=sanitizeCampaign(source),shared=campaignSharedProjection(c),core=campaignSharedCoreProjection(c);
assert.equal(c.importantLocationEntries[0].image.id,'image-1');
assert.equal(c.importantLocationEntries[1].image.id,'image-2');
assert.deepEqual(shared.importantNpcEntries,[{id:'npc-1',name:'Arauto Revelado'}]);
assert.equal(shared.importantNpcs,'');
assert.equal(shared.importantLocations,'Portal Antigo');
assert.deepEqual(shared.importantLocationEntries.map(item=>item.name),['Portal Antigo']);
assert.equal(shared.importantLocationEntries[0].image.id,'image-1');
assert.deepEqual(shared.timelineNodes,[{id:'t-1',text:'A chegada',children:[{id:'t-1b',text:'Visita à cidade',children:[]}]}]);
assert.equal(shared.timeline,'A chegada\nVisita à cidade');
for(const privateText of ['Fortaleza Secreta','Vilão Oculto','Segredo da torre','Plano secreto','Subevento proibido','TEXTO PRIVADO']){
 assert.equal(JSON.stringify(shared).includes(privateText),false,'Compartilhamento contém conteúdo oculto: '+privateText);
 assert.equal(JSON.stringify(core).includes(privateText),false,'Core remoto contém conteúdo oculto: '+privateText);
}
const legacy=sanitizeCampaign({id:'legacy',importantLocations:'Cidade Antiga',importantNpcIds:['npc-2'],timeline:'Segredo Legado'});
const legacyProjection=campaignSharedProjection(legacy);
assert.deepEqual(legacyProjection.importantLocationEntries,[]);
assert.deepEqual(legacyProjection.importantNpcEntries,[]);
assert.deepEqual(legacyProjection.timelineNodes,[]);
assert.equal(legacyProjection.importantLocations,'');
assert.equal(legacyProjection.timeline,'');
const enabled=updateCampaign([legacy],legacy.id,{importantLocationEntries:[{...legacy.importantLocationEntries[0],visibleToPlayers:true}],timelineNodes:[{...legacy.timelineNodes[0],visibleToPlayers:true}]});
assert.equal(enabled.ok,true);
assert.equal(campaignSharedProjection(enabled.campaign).importantLocations,'Cidade Antiga');
assert.equal(campaignSharedProjection(enabled.campaign).timeline,'Segredo Legado');
console.log('Visibilidade da Campanha: projeção restrita e dados legados validados.');
