import{test,expect}from'@playwright/test';

const initialCampaign={
 id:'full-drag-campaign',name:'Reinos de Prata',status:'current',members:[],sessions:[],
 activeMissions:'Ato 1\nAto 2\nAto 3',
 importantLocations:'Fenda do Carvalho\nPortão de Baldur\nCidade Sem Sol',
 timelineNodes:[
  {id:'t-1',text:'A chegada',children:[]},
  {id:'t-2',text:'A descoberta',children:[]},
  {id:'t-3',text:'A decisão',children:[]}
 ]
};
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(campaign=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'master',username:'rafael',isMaster:true,memberships:[]}));
  if(!localStorage.getItem('hub-rpg:campaigns:v1'))localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([campaign]));
 },initialCampaign);
});
const read=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'))[0]);

test('arrastar pelo bullet inteiro reordena Atos e Locais e conserva os dados',async({page})=>{
 await page.goto('/mesa.html?id=full-drag-campaign');
 const atos=page.locator('#missoes .campaign-bullet-entry'),locais=page.locator('#locais .campaign-bullet-entry');
 await expect(atos).toHaveCount(3);
 await expect(atos.nth(2)).toHaveAttribute('draggable','true');
 await atos.nth(2).dragTo(atos.nth(0),{
  sourcePosition:{x:18,y:28},targetPosition:{x:18,y:3}
 });
 await expect.poll(()=>page.locator('#missoes [data-edit-line]').evaluateAll(nodes=>nodes.map(node=>node.value))).toEqual(['Ato 3','Ato 1','Ato 2']);
 await locais.nth(0).dragTo(locais.nth(2),{
  sourcePosition:{x:18,y:28},targetPosition:{x:18,y:62}
 });
 await expect.poll(()=>page.locator('#locais [data-edit-line]').evaluateAll(nodes=>nodes.map(node=>node.value))).toEqual(['Portão de Baldur','Cidade Sem Sol','Fenda do Carvalho']);
 const saved=await read(page);
 expect(saved.activeMissions).toBe('Ato 3\nAto 1\nAto 2');
 expect(saved.importantLocations).toBe('Portão de Baldur\nCidade Sem Sol\nFenda do Carvalho');
 await page.reload();
 await expect.poll(()=>page.locator('#missoes [data-edit-line]').evaluateAll(nodes=>nodes.map(node=>node.value))).toEqual(['Ato 3','Ato 1','Ato 2']);
 await expect.poll(()=>page.locator('#locais [data-edit-line]').evaluateAll(nodes=>nodes.map(node=>node.value))).toEqual(['Portão de Baldur','Cidade Sem Sol','Fenda do Carvalho']);
 await page.locator('#missoes [data-edit-line]').first().fill('Ato Final');
 await page.locator('#missoes [data-edit-line]').first().press('Tab');
 expect((await read(page)).activeMissions.split('\n')[0]).toBe('Ato Final');
});

test('toda a linha do evento é arrastável, com subeventos e histórico preservados',async({page})=>{
 await page.goto('/mesa.html?id=full-drag-campaign');
 const rows=page.locator('#linha-tempo .timeline-tree > .timeline-item');
 const first=rows.nth(0).locator(':scope > .campaign-flow-step');
 await expect(first).toHaveAttribute('draggable','true');
 await expect(first).toHaveAttribute('data-timeline-drag','t-1');
 await expect(page.locator('#linha-tempo .timeline-drag-handle')).toHaveCount(0);
 await rows.nth(2).locator(':scope > .campaign-flow-step').dragTo(rows.nth(0).locator('.campaign-flow-card').first(),{
  sourcePosition:{x:17,y:25},targetPosition:{x:24,y:3}
 });
 await expect(rows.first().locator('[data-timeline-text]').first()).toHaveValue('A decisão');
 let saved=await read(page);
 expect(saved.timelineNodes.map(row=>row.id)).toEqual(['t-3','t-1','t-2']);
 await page.reload();
 await expect(page.locator('#linha-tempo .timeline-tree > .timeline-item').first().locator('[data-timeline-text]').first()).toHaveValue('A decisão');
 const section=page.locator('#linha-tempo');
 await section.locator('[data-timeline-view="flowchart"]').click();
 await expect(section.locator('.hub-diagram-root').first()).toContainText('A decisão');
 await section.locator('[data-timeline-view="list"]').click();
 await expect(section.locator('.timeline-tree > .timeline-item')).toHaveCount(3);
});

test('no celular o arraste por toque longo reordena o bullet inteiro',async({page})=>{
 test.skip(test.info().project.name!=='mobile-chromium','Validação específica de toque');
 await page.goto('/mesa.html?id=full-drag-campaign');
 const rows=page.locator('#missoes .campaign-bullet-entry');
 await rows.nth(2).scrollIntoViewIfNeeded();
 const start=await rows.nth(0).boundingBox(),end=await rows.nth(2).boundingBox();
 expect(start&&end).toBeTruthy();
 const client=await page.context().newCDPSession(page);
 const x=start.x+18,from=start.y+start.height/2,to=end.y+end.height-4;
 await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:from}]});
 await page.waitForTimeout(360);
 await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:(from+to)/2}]});
 await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:to}]});
 await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect.poll(()=>page.locator('#missoes [data-edit-line]').evaluateAll(nodes=>nodes.map(node=>node.value))).toEqual(['Ato 2','Ato 3','Ato 1']);
 expect((await read(page)).activeMissions).toBe('Ato 2\nAto 3\nAto 1');
});
