import assert from 'node:assert/strict';
import{sanitizeCampaign,updateCampaign}from'../scripts/campaign-state.js';
import{
 entries,renderStructuredSection,renderTimeline,moveTimelineNode,addTimelineNode,
 renameTimelineNode,removeTimelineNode,countTimelineNodes,flattenTimeline,reorderLineValues
}from'../scripts/campaign-structured-ui.js';

const legacy=sanitizeCampaign({id:'c1',name:'Teste',importantLocations:'Sharn\nPontal',activeMissions:'Buscar coroa',timeline:'Chegada\nDescoberta'});
assert.equal(legacy.timelineNodes.length,2,'Eventos anteriores devem ser migrados em memória.');
assert.equal(legacy.timelineNodes[0].text,'Chegada');
assert.equal(legacy.timelineNodes[1].id,'legacy-timeline-2');
assert.equal(legacy.importantLocations,'Sharn\nPontal','Locais legados preservados.');
assert.equal(legacy.activeMissions,'Buscar coroa','Atos reutilizam os registros existentes.');
assert.ok(renderStructuredSection(legacy,[],'locais').includes('data-edit-line="importantLocations"'));
assert.ok(renderStructuredSection(legacy,[],'missoes').includes('<h2>Atos</h2>'));
assert.ok(renderTimeline(legacy).includes('data-timeline-drag'));
const before=structuredClone(legacy.timelineNodes);
const child=addTimelineNode(before,'Pista','legacy-timeline-1');
assert.ok(child,'Deve criar subevento.');
assert.equal(child.nodes[0].children.length,1);
assert.equal(countTimelineNodes(child.nodes),3);
assert.equal(before[0].children.length,0,'Operações não mutam o array original.');
let updated=renameTimelineNode(child.nodes,child.id,'Pista revisada');
assert.equal(updated[0].children[0].text,'Pista revisada');
assert.equal(renameTimelineNode(updated,child.id,'  '),null,'Nome vazio não pode ser salvo.');
assert.equal(moveTimelineNode(updated,'legacy-timeline-1',child.id,'child'),null,'Não pode mover pai para dentro do descendente.');
updated=moveTimelineNode(updated,child.id,'legacy-timeline-2','after');
assert.equal(updated.length,3,'Subevento pode voltar à raiz.');
assert.equal(updated[2].text,'Pista revisada');
updated=moveTimelineNode(updated,'legacy-timeline-2','legacy-timeline-1','before');
assert.deepEqual(updated.map(x=>x.text),['Descoberta','Chegada','Pista revisada']);
updated=removeTimelineNode(updated,'legacy-timeline-1');
assert.deepEqual(flattenTimeline(updated),['Descoberta','Pista revisada']);
assert.deepEqual(entries('• Lugar A\n- Lugar B\nLugar C'),['Lugar A','Lugar B','Lugar C']);
assert.equal(reorderLineValues('Ato 1\nAto 2\nAto 3',2,0,'before'),'Ato 3\nAto 1\nAto 2');
assert.equal(reorderLineValues('Fenda\nPortão\nCidade',0,2,'after'),'Portão\nCidade\nFenda');
assert.equal(reorderLineValues('Um\nDois',0,0),null,'Arrastar sobre o próprio item não altera dados.');
assert.equal(reorderLineValues('Um\nDois',-1,1),null,'Índices inválidos não alteram dados.');
assert.equal(reorderLineValues('Um\nDois',1,0,'child'),null,'Atos e Locais não aceitam aninhamento.');
const atosHtml=renderStructuredSection(legacy,[],'missoes'),locaisHtml=renderStructuredSection(legacy,[],'locais');
assert.ok(atosHtml.includes('data-line-drag="activeMissions"')&&atosHtml.includes('draggable="true"'));
assert.ok(locaisHtml.includes('data-line-drag="importantLocations"')&&locaisHtml.includes('draggable="true"'));
assert.ok(renderTimeline(legacy).includes('class="campaign-flow-step" draggable="true" data-timeline-drag'));
assert.equal(renderTimeline(legacy).includes('class="timeline-drag-handle"'),false,'Não deve depender de botão de arraste.');

const persisted=updateCampaign([legacy],'c1',{timelineNodes:updated,timeline:flattenTimeline(updated).join('\n')});
assert.equal(persisted.ok,true);
assert.deepEqual(persisted.campaign.timelineNodes,updated,'Hierarquia preservada na persistência.');
assert.equal(persisted.campaign.timeline,'Descoberta\nPista revisada');
const intentionallyEmpty=updateCampaign(persisted.list,'c1',{timelineNodes:[],timeline:''});
assert.equal(intentionallyEmpty.campaign.timelineNodes.length,0,'Apagar todos os eventos não os restaura.');
console.log('OK — Atos, Locais, migração, árvore, renomeação, reorganização e persistência da Campanha.');
