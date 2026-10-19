import{test,expect}from'@playwright/test';

const campaign={
 id:'timeline-flow-cmp',name:'Reinos de Prata',status:'active',system:'D&D 5.5e',
 members:[],sessions:[],timelineNodes:[
  {id:'root-1',text:'Chegada à cidade',children:[
   {id:'child-1',text:'Descoberta da pista',children:[]},
   {id:'child-2',text:'Encontro com o guarda',children:[]}]},
  {id:'root-2',text:'Partida do grupo',children:[]}
 ]
};
const adventure={
 id:'timeline-flow-adv',campaignId:'timeline-flow-cmp',title:'As Rainhas',
 timelineEvents:[
  {id:'evt-new',title:'O Conselho',text:'Uma nova decisão foi tomada.',at:'2026-10-18T16:00:00Z',automatic:true},
  {id:'evt-old',title:'O Chamado',text:'A jornada começou.',at:'2026-10-17T16:00:00Z',automatic:false}
 ]
};
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'master',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([data.adventure]));
 },{campaign,adventure});
});
test('campanha alterna lista e fluxograma e preserva os subeventos ao editar',async({page})=>{
 await page.goto('/mesa.html?id=timeline-flow-cmp');
 const area=page.locator('#linha-tempo');
 await expect(area.locator('[data-timeline-view="list"]')).toHaveAttribute('aria-pressed','true');
 await expect(area.locator('.timeline-tree > .timeline-item')).toHaveCount(2);
 await area.locator('[data-timeline-view="flowchart"]').click();
 await expect(area.locator('[data-timeline-view="flowchart"]')).toHaveAttribute('aria-pressed','true');
 await expect(area.locator('.hub-diagram-node')).toHaveCount(4);
 await expect(area.locator('.hub-diagram-children > .hub-diagram-node-group')).toHaveCount(2);
 await expect(area.locator('.hub-diagram-node').first()).toContainText('Chegada à cidade');
 await area.locator('[data-diagram-edit="child-1"]').click();
 const input=area.locator('[data-timeline-text="child-1"]');
 await expect(input).toBeFocused();
 await input.fill('Pista recuperada');
 await input.press('Tab');
 await area.locator('[data-timeline-view="flowchart"]').click();
 await expect(area.locator('[data-diagram-event="child-1"]')).toContainText('Pista recuperada');
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'))[0]);
 expect(stored.timelineNodes).toHaveLength(2);
 expect(stored.timelineNodes[0].children[0].id).toBe('child-1');
 expect(stored.timelineNodes[0].children[0].text).toBe('Pista recuperada');
});
test('aventura alterna lista e fluxograma cronológico sem duplicar registros',async({page})=>{
 await page.goto('/aventuras.html?campaign=timeline-flow-cmp&id=timeline-flow-adv');
 const area=page.locator('#linha-tempo');
 await expect(area.locator('.timeline-row')).toHaveCount(2);
 await area.locator('[data-timeline-view="flowchart"]').click();
 await expect(area.locator('.hub-diagram-sequence-step')).toHaveCount(2);
 await expect(area.locator('.hub-diagram-sequence-step').first()).toContainText('O Chamado');
 await expect(area.locator('.hub-diagram-sequence-step').last()).toContainText('O Conselho');
 await area.locator('[data-diagram-edit="evt-old"]').click();
 await expect(area.locator('.timeline-row[data-entity-row="evt-old"]')).toHaveCount(1);
 await area.locator('#new-timeline-title').fill('Novo acontecimento');
 await area.locator('#new-timeline-text').fill('Outro registro narrativo');
 await area.locator('#add-timeline').click();
 await area.locator('[data-timeline-view="flowchart"]').click();
 await expect(area.locator('.hub-diagram-sequence-step')).toHaveCount(3);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:adventures:v1'))[0]);
 expect(stored.timelineEvents).toHaveLength(3);
});

test('eventos principais são cartões independentes em Lista e Fluxograma',async({page},testInfo)=>{
 await page.goto('/mesa.html?id=timeline-flow-cmp');
 const area=page.locator('#linha-tempo');
 const roots=area.locator('.timeline-tree > .timeline-item');
 await expect(roots).toHaveCount(2);
 const list=await roots.evaluateAll(items=>{
  const a=items[0].getBoundingClientRect(),b=items[1].getBoundingClientRect();
  return {gap:b.top-a.bottom,firstBorder:getComputedStyle(items[0]).borderTopWidth,
    rootConnector:getComputedStyle(items[1],'::before').content};
 });
 expect(list.gap).toBeGreaterThan(4);
 expect(parseFloat(list.firstBorder)).toBeGreaterThanOrEqual(1);
 expect(list.rootConnector).toBe('none');
 await area.locator('[data-timeline-view="flowchart"]').click();
 const diagram=area.locator('.hub-diagram-roots');
 await expect(diagram.locator(':scope > .hub-diagram-root')).toHaveCount(2);
 const geometry=await diagram.evaluate(el=>{
  const roots=[...el.querySelectorAll(':scope > .hub-diagram-root')];
  const first=roots[0].getBoundingClientRect(),second=roots[1].getBoundingClientRect();
  const parent=roots[0].querySelector(':scope > .hub-diagram-node-group > .hub-diagram-node').getBoundingClientRect();
  const children=roots[0].querySelector(':scope > .hub-diagram-node-group > .hub-diagram-children').getBoundingClientRect();
  return {separate:second.left>=first.right-2||second.top>=first.bottom-2,
    parent:parent.toJSON(),children:children.toJSON(),
    connector:getComputedStyle(roots[1],'::before').content};
 });
 expect(geometry.separate).toBe(true);
 expect(geometry.connector).toBe('none');
 if(testInfo.project.name==='desktop-chromium'){
  expect(geometry.children.left).toBeGreaterThan(geometry.parent.left);
 }
});

test('recolher e revelar ramificações funciona nas duas visualizações sem alterar dados',async({page})=>{
 await page.goto('/mesa.html?id=timeline-flow-cmp');
 const area=page.locator('#linha-tempo'),toggle=area.locator('[data-timeline-toggle="root-1"]');
 await expect(toggle).toHaveAttribute('aria-expanded','true');
 await toggle.click();
 await expect(toggle).toHaveAttribute('aria-expanded','false');
 await expect(area.locator('#timeline-list-children-root-1')).toBeHidden();
 await expect(toggle).toBeFocused();
 await area.locator('[data-timeline-view="flowchart"]').click();
 const flowToggle=area.locator('.hub-diagram-collapse[data-timeline-toggle="root-1"]');
 await expect(flowToggle).toHaveAttribute('aria-expanded','false');
 await expect(area.locator('#timeline-diagram-children-root-1')).toBeHidden();
 await flowToggle.click();
 await expect(flowToggle).toHaveAttribute('aria-expanded','true');
 await expect(area.locator('#timeline-diagram-children-root-1')).toBeVisible();
 await area.locator('[data-timeline-view="list"]').click();
 await expect(area.locator('#timeline-list-children-root-1')).toBeVisible();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'))[0]);
 expect(stored.timelineNodes[0].children).toHaveLength(2);
});

test('subeventos podem ter seus próprios subeventos e controles de revelação independentes',async({page})=>{
 await page.goto('/mesa.html?id=timeline-flow-cmp');
 const area=page.locator('#linha-tempo');
 page.once('dialog',dialog=>dialog.accept('Passagem secreta'));
 await area.locator('[data-timeline-add-child="child-1"]').click();
 await expect(area.locator('#timeline-list-children-child-1 > .timeline-item')).toHaveCount(1);
 const childToggle=area.locator('[data-timeline-toggle="child-1"]');
 await childToggle.click();
 await expect(area.locator('#timeline-list-children-child-1')).toBeHidden();
 await expect(area.locator('#timeline-list-children-root-1')).toBeVisible();
 await area.locator('[data-timeline-view="flowchart"]').click();
 await expect(area.locator('#timeline-diagram-children-child-1')).toBeHidden();
 await area.locator('.hub-diagram-collapse[data-timeline-toggle="child-1"]').click();
 await expect(area.locator('#timeline-diagram-children-child-1')).toBeVisible();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'))[0]);
 expect(stored.timelineNodes[0].children[0].children[0].text).toBe('Passagem secreta');
});

test('fluxograma móvel não transborda e subeventos ficam abaixo do pai',async({page},testInfo)=>{
 test.skip(testInfo.project.name!=='mobile-chromium','layout móvel');
 await page.goto('/mesa.html?id=timeline-flow-cmp');
 await page.locator('#linha-tempo [data-timeline-view="flowchart"]').click();
 const bounds=await page.locator('#linha-tempo .hub-diagram-scroll--campaign').evaluate(el=>{
  const parent=el.querySelector('.hub-diagram-root .hub-diagram-node').getBoundingClientRect();
  const children=el.querySelector('.hub-diagram-root .hub-diagram-children').getBoundingClientRect();
  return {parentBottom:parent.bottom,childrenTop:children.top,
   scroll:el.scrollWidth,visible:el.clientWidth};
 });
 expect(bounds.childrenTop).toBeGreaterThan(bounds.parentBottom);
 expect(bounds.scroll).toBeLessThanOrEqual(bounds.visible+2);
});
