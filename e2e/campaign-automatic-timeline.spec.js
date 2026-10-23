import{test,expect}from'@playwright/test';

const cid='timeline-linked-campaign',a1='timeline-linked-adventure-1',a2='timeline-linked-adventure-2';
const campaign={
 id:cid,name:'Reinos de Prata',status:'active',members:[],
 timelineNodes:[{id:'manual-history',text:'Registro do Mestre',visibleToPlayers:true,children:[]}],
 sessions:[
  {id:'s-later',adventureId:a1,number:2,order:2,title:'O Banquete',status:'planned'},
  {id:'s-early',adventureId:a1,number:1,order:1,title:'A Chegada',status:'completed'},
  {id:'s-other',adventureId:a2,number:3,order:3,title:'A Travessia',status:'planned'},
  {id:'s-unlinked',number:4,order:4,title:'Sessão Avulsa',status:'planned'}
 ]
};
const adventures=[
 {id:a2,campaignId:cid,title:'O Vale',order:2,status:'planned'},
 {id:a1,campaignId:cid,title:'As Rainhas',order:1,status:'active'}
];
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({enabled:false,authMode:'username-password',playerAccounts:[]})
 }));
});
function asMaster(page){
 return page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'master',username:'rafael',isMaster:true,memberships:[]}));
  if(!localStorage.getItem('hub-rpg:campaigns:v1'))localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  if(!localStorage.getItem('hub-rpg:adventures:v1'))localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify(data.adventures));
 },{campaign,adventures});
}
test('Mestre: Aventuras no primeiro nível, Sessões no segundo e eventos editáveis preservados',async({page})=>{
 await asMaster(page);
 await page.goto('/mesa.html?id='+cid);
 const area=page.locator('#linha-tempo'),roots=area.locator('.timeline-tree > .timeline-item');
 await expect(roots).toHaveCount(3);
 await expect(roots.nth(0).locator('.campaign-linked-kind').first()).toHaveText('Aventura');
 await expect(roots.nth(0).locator('.campaign-linked-name').first()).toContainText('As Rainhas');
 await expect(roots.nth(1).locator('.campaign-linked-name').first()).toContainText('O Vale');
 await expect(roots.nth(0).locator(':scope > .timeline-children > .timeline-item')).toHaveCount(2);
 await expect(roots.nth(0).locator(':scope > .timeline-children > .timeline-item .campaign-linked-name')).toHaveText([
  'Sessão 1 · A Chegada','Sessão 2 · O Banquete'
 ]);
 await expect(roots.nth(1).locator(':scope > .timeline-children > .timeline-item .campaign-linked-name')).toHaveText(['Sessão 3 · A Travessia']);
 await expect(area).not.toContainText('Sessão Avulsa');
 await expect(roots.nth(0).locator('[data-timeline-text],[data-timeline-delete],[data-timeline-drag]')).toHaveCount(0);
 await expect(roots.nth(2).locator('[data-timeline-text="manual-history"]')).toBeVisible();
 await expect(roots.nth(0).locator(':scope > .campaign-flow-step [data-timeline-card-toggle]')).toHaveCount(1);
 await expect(roots.nth(0).locator('.timeline-children a.campaign-linked-link-card').first()).toHaveAttribute('href',`sessoes.html?campaign=${cid}&id=s-early`);
 await expect(area.locator('[data-new-timeline],[data-timeline-add-root],[data-timeline-add-child]')).toHaveCount(0);
 await expect(roots.nth(0).locator(':scope > .timeline-children')).toBeHidden();
 await expect(roots.nth(0).locator('.timeline-child-indicator')).toHaveCount(1);
 const toggle=roots.nth(0).locator(':scope > .campaign-flow-step [data-timeline-toggle]');
 await expect(toggle).toHaveAttribute('aria-expanded','false');
 await expect(toggle).toHaveText('');
 await roots.nth(0).locator('[data-timeline-card-toggle]').click();
 await expect(roots.nth(0).locator(':scope > .timeline-children')).toBeVisible();
 await expect(toggle).toHaveAttribute('aria-expanded','true');
 await roots.nth(0).locator('[data-timeline-card-toggle]').press('Enter');
 await expect(roots.nth(0).locator(':scope > .timeline-children')).toBeHidden();
 await toggle.click();
 await expect(roots.nth(0).locator(':scope > .timeline-children')).toBeVisible();
 await expect(roots.nth(0).locator(':scope > .timeline-children a.campaign-linked-link-card')).toHaveCount(2);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'))[0]);
 expect(stored.timelineNodes.map(n=>n.text)).toEqual(['Registro do Mestre']);
 expect(stored.timelineNodes.some(n=>String(n.id).startsWith('linked-'))).toBe(false);
 await page.reload();
 await expect(area.locator('.timeline-tree > .timeline-item')).toHaveCount(3);
 await expect(area.locator('.timeline-tree > .timeline-item').first().locator(':scope > .timeline-children')).toBeHidden();
});

test('A hierarquia acompanha alterações nas entidades sem duplicar dados e funciona no Fluxograma',async({page})=>{
 await asMaster(page);
 await page.goto('/mesa.html?id='+cid);
 const area=page.locator('#linha-tempo');
 await area.locator('[data-timeline-view="flowchart"]').click();
 const roots=area.locator('.hub-diagram-roots > .hub-diagram-root');
 await expect(roots).toHaveCount(3);
 await expect(roots.nth(0).locator('.hub-diagram-kind').first()).toHaveText('Aventura');
 await expect(roots.nth(0).locator('.hub-diagram-children > .hub-diagram-node-group')).toHaveCount(2);
 await expect(roots.nth(0).locator('.hub-diagram-children .hub-diagram-kind')).toHaveText(['Sessão','Sessão']);
 await expect(roots.nth(0).locator('[data-diagram-edit],[data-timeline-visibility]')).toHaveCount(0);
 const branch=roots.nth(0).locator('.hub-diagram-children');
 await expect(branch).toBeHidden();
 const parent=roots.nth(0).locator('.hub-diagram-node[data-diagram-toggle]');
 await parent.locator('strong').click();
 await expect(branch).toBeVisible();
 await parent.locator('strong').click();
 await expect(branch).toBeHidden();
 await expect(parent.locator('[data-timeline-toggle]')).toHaveText('');
 await parent.locator('[data-timeline-toggle]').click();
 await expect(branch).toBeVisible();
 await expect(roots.nth(0).locator('a.hub-diagram-node-link')).toHaveCount(2);
 await page.evaluate(ids=>{
  const list=JSON.parse(localStorage.getItem('hub-rpg:adventures:v1'));
  list.find(row=>row.id===ids.a1).title='As Rainhas Renomeadas';
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify(list));
  const campaigns=JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'));
  campaigns[0].sessions.find(row=>row.id==='s-early').title='A Nova Chegada';
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify(campaigns));
 },{a1});
 await page.reload();
 await expect(area.locator('.campaign-linked-name').first()).toContainText('As Rainhas Renomeadas');
 await expect(area.locator('.timeline-children .campaign-linked-name').first()).toContainText('A Nova Chegada');
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1'))[0]);
 expect(stored.timelineNodes).toHaveLength(1);
});

test('Jogador: árvore automática usa somente aventuras do pacote compartilhado e não exibe controles do Mestre',async({page})=>{
 const membership={id:'m1',campaignId:cid,uid:'p1',username:'ana',role:'player',active:true,
  adventureIds:[a1],sessionIds:['s-early']};
 const publicCampaign={...campaign,sessions:[campaign.sessions.find(s=>s.id==='s-early')]};
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({
   uid:'p1',username:'ana',isMaster:false,memberships:[data.membership]
  }));
  localStorage.setItem('hub-rpg:collaboration-cache:v1',JSON.stringify({
   schema:'hub-rpg/collaboration-cache/v1',
   campaigns:{[data.cid]:{
    membership:data.membership,
    payload:{campaign:data.publicCampaign,revealedAdventures:[data.adventure]},
    characters:[],characterIds:[]
   }}
  }));
 },{membership,cid,publicCampaign,adventure:adventures.find(a=>a.id===a1)});
 await page.goto('/mesa.html?id='+cid);
 const area=page.locator('#linha-tempo');
 await expect(area.locator('.timeline-tree > .timeline-item')).toHaveCount(2);
 await expect(area.locator('.timeline-item-linked .campaign-linked-name')).toHaveText([
  'Aventura 1 · As Rainhas','Sessão 1 · A Chegada'
 ]);
 await expect(area).not.toContainText('O Vale');
 await expect(area.locator('[data-new-timeline],[data-timeline-add-root],[data-timeline-delete]')).toHaveCount(0);
 await area.locator('[data-timeline-view="flowchart"]').click();
 await expect(area.locator('.hub-diagram-node-linked')).toHaveCount(2);
 await expect(area.locator('.hub-diagram-root').first().locator('.hub-diagram-children')).toBeHidden();
 await area.locator('.hub-diagram-root').first().locator('.hub-diagram-node[data-diagram-toggle]').click();
 await expect(area.locator('.hub-diagram-root').first().locator('.hub-diagram-children')).toBeVisible();
});
