import { test, expect } from '@playwright/test';

const campaignId='qa-adventure-cards-20261026', adventureId='qa-cards-adventure';
const campaign={
 id:campaignId,name:'Reinos de Prata',status:'active',npcs:[],locations:[],members:[],
 sessions:[{id:'qa-session-1',number:1,order:1,title:'O primeiro encontro',status:'planned',adventureId}]
};
const adventure={
 id:adventureId,campaignId,title:'As Rainhas',status:'active',npcIds:[],locationIds:[],
 monsters:[{id:'qa-monster-1',monsterId:'qa-library-monster',name:'Guarda monstruoso',source:'Biblioteca',order:1}],
 scenes:[{id:'qa-scene-1',title:'No salão',order:1,status:'planned',monsterIds:[]}],
 exploration:{
  levels:[{id:'qa-map-1',name:'Palácio das Rainhas',type:'Masmorra',order:1}],
  areas:[{id:'qa-area-1',code:'A01',name:'Salão do Conselho',levelId:'qa-map-1',type:'Salão',status:'discovered'}]
 }
};

const savedAdventure=page=>page.evaluate(id=>
 JSON.parse(localStorage.getItem('hub-rpg:adventures:v1')||'[]').find(item=>item.id===id),adventureId
);
const savedCampaign=page=>page.evaluate(id=>
 JSON.parse(localStorage.getItem('hub-rpg:campaigns:v1')||'[]').find(item=>item.id===id),campaignId
);
test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(({campaign,adventure})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'qa-master-cards',username:'rafael',isMaster:true,memberships:[]}));
  if(!localStorage.getItem('hub-rpg:campaigns:v1'))localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([campaign]));
  if(!localStorage.getItem('hub-rpg:adventures:v1'))localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([adventure]));
  if(!localStorage.getItem('hub-rpg:characters:v4'))localStorage.setItem('hub-rpg:characters:v4','[]');
  if(!localStorage.getItem('hub-rpg:npcs:v1'))localStorage.setItem('hub-rpg:npcs:v1','[]');
 },{campaign,adventure});
});

test('Locais, Mapas e Sessões têm a hierarquia solicitada no desktop e no celular',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/aventuras.html?campaign='+campaignId+'&id='+adventureId);
 await expect(page.locator('#exploracao .explore-area-card')).toHaveCount(1);
 const local=page.locator('#exploracao .explore-area-card');
 await expect(local.locator('.explore-area-code')).toHaveText('A01');
 await expect(local.locator('.explore-area-name')).toHaveText('Salão do Conselho');
 await expect(local.locator('.explore-area-context')).toContainText('Palácio das Rainhas');
 await expect(local.locator('.explore-area-context')).toContainText('Salão');
 await expect(local.locator('.explore-record-status')).toContainText('Descoberta');
 const dimensions=await local.evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}));
 expect(dimensions.height).toBeLessThan(dimensions.width-10);
 await expect(page.locator('#mapas')).not.toContainText('Organize os mapas e gerencie suas imagens em cada registro.');
 await expect(page.locator('#monstros')).not.toContainText('Selecione uma criatura da Biblioteca para consultar sua ficha ou adicioná-la à Aventura.');
 await expect(page.locator('#linha-tempo')).not.toContainText('As Cenas aparecem automaticamente e acompanham as alterações.');

 const session=page.locator('#sessoes .adventure-session-card-wrap').first();
 const card=session.locator('.campaign-player-story-card');
 await expect(card).toBeVisible();
 const publication=session.locator('.adventure-session-visibility [data-adventure-visible="sessions"]');
 await expect(publication).toBeVisible();
 const pos=await session.evaluate(el=>{
  const rect=sel=>{const b=el.querySelector(sel)?.getBoundingClientRect();return b?{left:b.left,right:b.right,top:b.top,bottom:b.bottom}:null};
  return {card:rect('.campaign-player-story-card'),title:rect('h3'),open:rect('.campaign-player-story-open'),badge:rect('.campaign-player-story-status'),visible:rect('.adventure-session-visibility')};
 });
 expect(pos.title).toBeTruthy();expect(pos.open).toBeTruthy();expect(pos.badge).toBeTruthy();expect(pos.visible).toBeTruthy();
 expect(pos.title.left).toBeLessThan(pos.card.left+pos.card.right-pos.card.left-20);
 expect(pos.title.top).toBeLessThan(pos.open.top);
 expect(pos.open.left).toBeLessThan(pos.badge.left);
 expect(pos.open.bottom).toBeGreaterThan(pos.title.bottom);
 expect(pos.visible.right).toBeGreaterThan(pos.card.left+(pos.card.right-pos.card.left)*.6);
 expect(pos.visible.top).toBeLessThan(pos.open.top);
 await publication.check();
 await expect.poll(async()=>(await savedAdventure(page)).sessionVisibility['qa-session-1']).toBe(true);
 await expect(page.locator('#sessoes .adventure-session-visibility [data-adventure-visible="sessions"]')).toBeChecked();
 expect(errors.filter(s=>/ReferenceError|SyntaxError/.test(s))).toEqual([]);
});

test('Monstros podem ser definidos em uma nova Cena e alterados em uma Cena existente',async({page})=>{
 await page.goto('/aventuras.html?campaign='+campaignId+'&id='+adventureId);
 await expect(page.locator('#new-scene-monster')).toContainText('Guarda monstruoso');
 await page.locator('#new-scene-title').fill('Defesa da torre');
 await page.locator('#new-scene-monster').selectOption('qa-monster-1');
 await page.locator('#add-scene').click();
 await expect.poll(async()=>(await savedAdventure(page)).scenes.find(s=>s.title==='Defesa da torre')?.monsterIds).toEqual(['qa-monster-1']);
 const first=page.locator('#cenas [data-scene-row="qa-scene-1"]');
 await first.locator('[data-scene-editor] summary').click();
 const checkbox=first.locator('[data-scene-link="monsterIds"][value="qa-monster-1"]');
 await checkbox.check();
 await expect.poll(async()=>(await savedAdventure(page)).scenes.find(s=>s.id==='qa-scene-1')?.monsterIds).toEqual(['qa-monster-1']);
 await page.reload();
 await page.locator('#cenas [data-scene-row="qa-scene-1"] [data-scene-editor] summary').click();
 await expect(page.locator('#cenas [data-scene-row="qa-scene-1"] [data-scene-link="monsterIds"]')).toBeChecked();
});

test('Adicionar NPC oferece Abrir ficha e vincula a ficha salva à Campanha',async({page})=>{
 await page.goto('/aventuras.html?campaign='+campaignId+'&id='+adventureId);
 await expect(page.locator('#npcs #add-campaign-npc')).toBeVisible();
 const controls=await page.locator('#npcs #add-campaign-npc,#npcs .form-grid>a.btn,#npcs #add-registered-npc')
  .evaluateAll(els=>els.map(el=>Math.round(el.getBoundingClientRect().height)));
 expect(controls).toHaveLength(3);
 expect(Math.max(...controls)-Math.min(...controls)).toBeLessThanOrEqual(2);
 await page.locator('#new-npc-name').fill('Guardião da biblioteca');
 await page.locator('#new-npc-role').fill('Sentinela');
 await page.locator('#add-campaign-npc').click();
 await expect.poll(async()=>(await savedCampaign(page)).npcs.length).toBe(1);
 const entry=(await savedCampaign(page)).npcs[0];
 const open=page.locator('#npcs [data-campaign-npc="'+entry.id+'"] a').filter({hasText:'Abrir ficha'});
 await expect(open).toHaveAttribute('href',/criacao-personagem\.html\?npc=1.*npcId=/);
 await open.click();
 await expect(page).toHaveURL(/criacao-personagem\.html\?npc=1/);
 await expect(page.locator('#nome')).toHaveValue('Guardião da biblioteca');
 await page.locator('#save').click();
 await expect.poll(async()=>Boolean((await savedCampaign(page)).npcs[0].sheetId)).toBe(true);
 const saved=(await savedCampaign(page)).npcs[0];
 expect(saved.name).toBe('Guardião da biblioteca');
 await page.goto('/aventuras.html?campaign='+campaignId+'&id='+adventureId);
 await expect(page.locator('#npcs [data-campaign-npc="'+entry.id+'"] a').filter({hasText:'Abrir ficha'}))
  .toHaveAttribute('href',new RegExp('ficha-personagem\\.html\\?npc=1&id='+saved.sheetId));
});


test('Cards de Locais compactos mantêm identificação, edição e publicação',async({page},testInfo)=>{
 await page.goto('/aventuras.html?campaign='+campaignId+'&id='+adventureId);
 await page.evaluate(()=>{
  const key='hub-rpg:adventures:v1',all=JSON.parse(localStorage.getItem(key)||'[]');
  const adventure=all.find(item=>item.id==='qa-cards-adventure');
  for(let i=2;i<=7;i++)adventure.exploration.areas.push({
   id:'qa-area-'+i,code:'A'+String(i).padStart(2,'0'),
   name:i===4?'Galeria dos retratos da antiga dinastia das Rainhas':'Local '+i,
   type:i===5?'Ala administrativa do palácio':'Sala',
   levelId:'qa-map-1',status:'discovered'
  });
  localStorage.setItem(key,JSON.stringify(all));
 });
 await page.reload();
 const grid=page.locator('#exploracao .explore-area-grid');
 const cards=grid.locator(':scope > .explore-area-card');
 await expect(cards).toHaveCount(7);
 const metrics=await cards.evaluateAll(nodes=>{
  const rect=el=>el.getBoundingClientRect();
  const rows=nodes.map(el=>{
   const box=rect(el),summary=el.querySelector('.explore-record-summary'),foot=el.querySelector('.explore-record-visibility-bar');
   const sr=rect(summary),fr=rect(foot);
   return {
    x:box.x,y:box.y,width:box.width,height:box.height,
    summaryHeight:sr.height,summaryScrollHeight:summary.scrollHeight,
    footerTop:fr.top,footerBottom:fr.bottom,cardBottom:box.bottom,
    codeVisible:!!el.querySelector('.explore-area-code'),
    nameVisible:!!el.querySelector('.explore-area-name'),
    mapVisible:!!el.querySelector('.explore-area-context'),
    statusVisible:!!el.querySelector('.explore-record-status'),
    editVisible:!!el.querySelector('.explore-record-toggle-label'),
    publishVisible:!!el.querySelector('[data-ex-area-visibility]')
   };
  });
  return{rows,documentWidth:document.documentElement.scrollWidth,viewportWidth:window.innerWidth};
 });
 console.log('LOCALS_COMPACT_METRICS '+JSON.stringify(metrics));
 expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth+2);
 const uniqueColumns=new Set(metrics.rows.map(row=>Math.round(row.x))).size;
 expect(uniqueColumns).toBeGreaterThanOrEqual(testInfo.project.name==='mobile-chromium'?2:4);
 for(const row of metrics.rows){
  expect(row.height).toBeLessThanOrEqual(testInfo.project.name==='mobile-chromium'?150:162);
  expect(row.width-row.height).toBeGreaterThanOrEqual(10);
  expect(row.width).toBeLessThanOrEqual(testInfo.project.name==='mobile-chromium'?185:235);
  expect(row.footerBottom).toBeLessThanOrEqual(row.cardBottom+2);
  expect(row.summaryScrollHeight).toBeLessThanOrEqual(row.summaryHeight+3);
  for(const key of ['codeVisible','nameVisible','mapVisible','statusVisible','editVisible','publishVisible'])expect(row[key]).toBe(true);
 }
 await page.screenshot({path:testInfo.outputPath('locais-compactos.png'),fullPage:true});
 const first=cards.first();
 await first.locator('[data-ex-area-visibility]').check();
 await expect.poll(async()=>page.evaluate(()=>
  JSON.parse(localStorage.getItem('hub-rpg:adventures:v1'))[0].exploration.areas[0].visibleToPlayers
 )).toBe(true);
 await first.locator('summary').click();
 await expect(first.locator('[data-ex-area-editor]')).toHaveAttribute('open','');
 const areaRect=await first.boundingBox(),gridRect=await grid.boundingBox();
 expect(areaRect.width).toBeGreaterThan(gridRect.width*.9);
 await first.locator('[data-ex-close-record="area"]').click();
 await expect(first.locator('[data-ex-area-editor]')).not.toHaveAttribute('open','');
});


async function seedReorderAreas(page){
 await page.goto('/aventuras.html?campaign='+campaignId+'&id='+adventureId);
 await page.evaluate(()=>{
  const key='hub-rpg:adventures:v1',rows=JSON.parse(localStorage.getItem(key)||'[]');
  const adventure=rows.find(row=>row.id==='qa-cards-adventure');
  adventure.exploration.areas=[
   {id:'qa-area-1',code:'A01',name:'Entrada',order:1,status:'discovered',levelId:'qa-map-1',visibleToPlayers:true,description:'Segredo preservado'},
   {id:'qa-area-2',code:'A02',name:'Pátio',order:2,status:'visited',levelId:'qa-map-1',xp:150},
   {id:'qa-area-3',code:'A03',name:'Torre',order:3,status:'unknown',levelId:'qa-map-1'},
   {id:'qa-area-4',code:'A04',name:'Salão',order:4,status:'blocked',levelId:'qa-map-1'}
  ];
  localStorage.setItem(key,JSON.stringify(rows));
 });
 await page.reload();
 await expect(page.locator('#exploracao [data-ex-area-grip]')).toHaveCount(4);
}
const areaOrder=page=>page.locator('#exploracao .explore-area-grid>.explore-area-card')
 .evaluateAll(nodes=>nodes.map(node=>node.dataset.exArea));

test('Locais podem ser reorganizados por teclado e mantêm vínculos, status e visibilidade',async({page})=>{
 await seedReorderAreas(page);
 const grip=page.locator('[data-ex-area-grip="qa-area-3"]');
 await grip.focus();
 await grip.press('ArrowLeft');
 await expect.poll(()=>areaOrder(page)).toEqual(['qa-area-1','qa-area-3','qa-area-2','qa-area-4']);
 await expect(page.locator('[data-ex-area-grip="qa-area-3"]')).toBeFocused();
 await page.locator('[data-ex-area-grip="qa-area-3"]').press('ArrowUp');
 await expect.poll(()=>areaOrder(page)).toEqual(['qa-area-3','qa-area-1','qa-area-2','qa-area-4']);
 await page.reload();
 await expect.poll(()=>areaOrder(page)).toEqual(['qa-area-3','qa-area-1','qa-area-2','qa-area-4']);
 const original=await savedAdventure(page);
 expect(original.exploration.areas.map(a=>a.order)).toEqual([1,2,3,4]);
 expect(original.exploration.areas.find(a=>a.id==='qa-area-1')).toMatchObject({description:'Segredo preservado',visibleToPlayers:true});
 expect(original.exploration.areas.find(a=>a.id==='qa-area-2')).toMatchObject({status:'visited',xp:150});
 await page.locator('#exploracao [data-ex-area="qa-area-1"] summary').click();
 await expect(page.locator('#exploracao [data-ex-area="qa-area-1"] [data-ex-area-editor]')).toHaveAttribute('open','');
 await expect(page.locator('#exploracao [data-ex-area="qa-area-1"] [data-ex-field="description"]')).toHaveValue('Segredo preservado');
});

test('Arrastar Local com mouse entre colunas salva a nova ordem',async({page},testInfo)=>{
 test.skip(testInfo.project.name==='mobile-chromium','O teste de toque cobre a versão mobile');
 await seedReorderAreas(page);
 const source=page.locator('[data-ex-area-grip="qa-area-4"]');
 const dest=page.locator('#exploracao [data-ex-area="qa-area-2"]');
 await source.scrollIntoViewIfNeeded();
 const from=await source.boundingBox(),to=await dest.boundingBox();
 await page.mouse.move(from.x+from.width/2,from.y+from.height/2);
 await page.mouse.down();
 await page.mouse.move(from.x+from.width/2+10,from.y+from.height/2,{steps:4});
 await page.mouse.move(to.x+to.width*.23,to.y+to.height*.5,{steps:12});
 await expect(dest).toHaveClass(/explore-area-drop-before/);
 await page.mouse.up();
 await expect.poll(()=>areaOrder(page)).toEqual(['qa-area-1','qa-area-4','qa-area-2','qa-area-3']);
 await page.reload();
 await expect.poll(()=>areaOrder(page)).toEqual(['qa-area-1','qa-area-4','qa-area-2','qa-area-3']);
});

test('Arrastar Local por toque no celular mantém a ordem',async({page},testInfo)=>{
 test.skip(testInfo.project.name!=='mobile-chromium','Este teste usa a entrada touch real do Chromium mobile');
 await seedReorderAreas(page);
 const source=page.locator('[data-ex-area-grip="qa-area-3"]');
 const dest=page.locator('#exploracao [data-ex-area="qa-area-1"]');
 await source.scrollIntoViewIfNeeded();
 const from=await source.boundingBox(),to=await dest.boundingBox();
 const sx=from.x+from.width/2,sy=from.y+from.height/2,tx=to.x+to.width*.25,ty=to.y+to.height/2;
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:sx,y:sy,id:1}]});
 await page.waitForTimeout(340); // Mesma ativação por pressão prolongada de Jogadores da Campanha.
 for(let i=1;i<=10;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sx+(tx-sx)*i/10,y:sy+(ty-sy)*i/10,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect.poll(()=>areaOrder(page)).toEqual(['qa-area-3','qa-area-1','qa-area-2','qa-area-4']);
 await page.reload();
 await expect.poll(()=>areaOrder(page)).toEqual(['qa-area-3','qa-area-1','qa-area-2','qa-area-4']);
});


async function seedAnimatedOrderData(page){
 await page.goto('/aventuras.html?campaign='+campaignId+'&id='+adventureId);
 await page.evaluate(()=>{
  const cKey='hub-rpg:campaigns:v1',aKey='hub-rpg:adventures:v1';
  const campaigns=JSON.parse(localStorage.getItem(cKey)),adventures=JSON.parse(localStorage.getItem(aKey));
  const c=campaigns.find(row=>row.id==='qa-adventure-cards-20261026');
  const a=adventures.find(row=>row.id==='qa-cards-adventure');
  c.members=[{username:'ana',name:'Ana',role:'player',active:true},{username:'beto',name:'Beto',role:'player',active:true}];
  c.npcs=[{id:'npc-1',name:'Capitã',role:'Aliada'},{id:'npc-2',name:'Escriba',role:'Conselheira'}];
  a.npcIds=['npc-1','npc-2'];
  a.participantUsernames=['ana','beto'];
  a.participantAssignments=[{username:'ana',characterId:null},{username:'beto',characterId:null}];
  a.missions=[{id:'mission-1',title:'Investigar',status:'active',order:1},{id:'mission-2',title:'Proteger',status:'active',order:2}];
  a.scenes=[{id:'scene-1',title:'Conselho',status:'planned',order:1},{id:'scene-2',title:'Torre',status:'planned',order:2}];
  a.monsters=[{id:'monster-1',name:'Golem',monsterId:'m1',source:'Biblioteca',order:1},{id:'monster-2',name:'Espectro',monsterId:'m2',source:'Biblioteca',order:2}];
  a.dmNoteEntries=[{id:'note-1',text:'Nota privada um',visibleToPlayers:false},{id:'note-2',text:'Nota privada dois',visibleToPlayers:false}];
  a.exploration.levels=[{id:'qa-map-1',name:'Castelo',order:1},{id:'qa-map-2',name:'Jardim',order:2}];
  a.exploration.factions=[{id:'faction-1',name:'Realeza',order:1},{id:'faction-2',name:'Guarda',order:2}];
  a.exploration.areas=[
   {id:'area-1',code:'A01',name:'Salão',order:1,levelId:'qa-map-1',status:'discovered'},
   {id:'area-2',code:'A02',name:'Pátio',order:2,levelId:'qa-map-1',status:'unknown'}
  ];
  localStorage.setItem(cKey,JSON.stringify(campaigns));
  localStorage.setItem(aKey,JSON.stringify(adventures));
 });
 await page.reload();
}
async function checkAnimatedMouseDrag(page,sourceSelector,destSelector){
 const source=page.locator(sourceSelector),destination=page.locator(destSelector);
 await source.scrollIntoViewIfNeeded();
 const a=await source.boundingBox(),b=await destination.boundingBox();
 expect(a).toBeTruthy();expect(b).toBeTruthy();
 const sx=a.x+a.width/2,sy=a.y+a.height/2,tx=b.x+b.width*.25,ty=b.y+b.height*.3;
 await page.mouse.move(sx,sy);await page.mouse.down();
 await page.mouse.move(sx+8,sy+8,{steps:5});
 await expect(page.locator('body>.adventure-floating-card.campaign-floating-card')).toHaveCount(1);
 await page.mouse.move(tx,ty,{steps:12});
 await expect(destination).toHaveClass(/adventure-sort-before/);
 await expect(page.locator('body>.adventure-floating-card')).toHaveCSS('pointer-events','none');
 await page.mouse.up();
 await expect(page.locator('body>.adventure-floating-card')).toHaveCount(0);
}
test('NPCs, Objetivos, Cenas e Monstros usam a cópia elevada e o marcador de soltura da Campanha',async({page})=>{
 await seedAnimatedOrderData(page);
 const sections=[
  {section:'#npcs',kind:'npcs',attr:'data-campaign-npc',first:'npc-1',second:'npc-2',get:a=>a.npcIds},
  {section:'#missoes',kind:'missions',attr:'data-entity-row',first:'mission-1',second:'mission-2',get:a=>a.missions.map(x=>x.id)},
  {section:'#cenas',kind:'scenes',attr:'data-scene-row',first:'scene-1',second:'scene-2',get:a=>a.scenes.map(x=>x.id)},
  {section:'#monstros',kind:'monsters',attr:'data-monster-row',first:'monster-1',second:'monster-2',get:a=>a.monsters.map(x=>x.id)}
 ];
 for(const section of sections){
  if(section.kind==='monsters')await page.locator('#monstros .adventure-monsters-attached summary').click();
  const src=section.section+' ['+section.attr+'="'+section.second+'"] [data-adventure-grip]';
  const dst=section.section+' ['+section.attr+'="'+section.first+'"]';
  await checkAnimatedMouseDrag(page,src,dst);
  await expect.poll(async()=>section.get(await savedAdventure(page))).toEqual([section.second,section.first]);
  await expect(page.locator(section.section+' .adventure-sort-feedback')).toContainText('Ordem atualizada');
 }
 await page.reload();
 for(const section of sections){
  await expect.poll(async()=>section.get(await savedAdventure(page))).toEqual([section.second,section.first]);
 }
});
test('Locais, Jogadores da Aventura e Notas do Mestre recebem a mesma animação',async({page})=>{
 await seedAnimatedOrderData(page);
 await checkAnimatedMouseDrag(page,'#exploracao [data-ex-area="area-2"] [data-ex-area-grip]','#exploracao [data-ex-area="area-1"]');
 await expect.poll(async()=>(await savedAdventure(page)).exploration.areas.map(x=>x.id)).toEqual(['area-2','area-1']);
 await checkAnimatedMouseDrag(page,'#participantes [data-member-row="beto"] .roster-grip','#participantes [data-member-row="ana"]');
 await expect.poll(async()=>(await savedAdventure(page)).participantAssignments.map(x=>x.username)).toEqual(['beto','ana']);
 await checkAnimatedMouseDrag(page,'#notas-mestre [data-note-id="note-2"] .hub-note-grip','#notas-mestre [data-note-id="note-1"]');
 await expect.poll(async()=>(await savedAdventure(page)).dmNoteEntries.map(x=>x.id)).toEqual(['note-2','note-1']);
 await page.reload();
 const state=await savedAdventure(page);
 expect(state.exploration.areas.map(x=>x.id)).toEqual(['area-2','area-1']);
 expect(state.participantAssignments.map(x=>x.username)).toEqual(['beto','ana']);
 expect(state.dmNoteEntries.map(x=>x.id)).toEqual(['note-2','note-1']);
});


test('Todo o card de Local pode ser arrastado com o mouse sem acionar Editar',async({page},testInfo)=>{
 test.skip(testInfo.project.name==='mobile-chromium','Teste de mouse no desktop');
 await seedAnimatedOrderData(page);
 await checkAnimatedMouseDrag(page,'#exploracao [data-ex-area="area-2"] .explore-record-summary','#exploracao [data-ex-area="area-1"]');
 await expect.poll(async()=>(await savedAdventure(page)).exploration.areas.map(x=>x.id)).toEqual(['area-2','area-1']);
 await expect(page.locator('#exploracao [data-ex-area="area-2"] details')).not.toHaveAttribute('open','');
 await page.locator('#exploracao [data-ex-area="area-2"] summary').click();
 await expect(page.locator('#exploracao [data-ex-area="area-2"] details')).toHaveAttribute('open','');
});

test('Mapas e Facções também aceitam arrastar e soltar no corpo do cartão',async({page},testInfo)=>{
 test.skip(testInfo.project.name==='mobile-chromium','Teste de mouse no desktop');
 await seedAnimatedOrderData(page);
 await checkAnimatedMouseDrag(page,'#mapas [data-ex-level="qa-map-2"] .explore-record-summary','#mapas [data-ex-level="qa-map-1"]');
 await expect.poll(async()=>(await savedAdventure(page)).exploration.levels.map(x=>x.id)).toEqual(['qa-map-2','qa-map-1']);
 await checkAnimatedMouseDrag(page,'#faccoes [data-ex-faction="faction-2"] .explore-faction-head','#faccoes [data-ex-faction="faction-1"]');
 await expect.poll(async()=>(await savedAdventure(page)).exploration.factions.map(x=>x.id)).toEqual(['faction-2','faction-1']);
 await page.reload();
 const a=await savedAdventure(page);
 expect(a.exploration.levels.map(x=>x.id)).toEqual(['qa-map-2','qa-map-1']);
 expect(a.exploration.factions.map(x=>x.id)).toEqual(['faction-2','faction-1']);
});


test('Clicar e segurar sem mover abre o editor, sem iniciar arrasto nem alterar ordem',async({page},testInfo)=>{
 test.skip(testInfo.project.name==='mobile-chromium','Verificação de ponteiro de mouse no desktop');
 await seedAnimatedOrderData(page);
 for(const {kind,id,summary} of [
  {kind:'local',id:'area-1',summary:'#exploracao [data-ex-area="area-1"] summary'},
  {kind:'mapa',id:'qa-map-1',summary:'#mapas [data-ex-level="qa-map-1"] summary'}
 ]){
  const before=await savedAdventure(page);
  const node=page.locator(summary);
  await node.scrollIntoViewIfNeeded();
  const box=await node.boundingBox();
  await page.mouse.move(box.x+box.width*.4,box.y+box.height*.45);
  await page.mouse.down();
  await page.waitForTimeout(240);
  await expect(page.locator('body>.adventure-floating-card')).toHaveCount(0);
  await page.mouse.up();
  await expect(node.locator('xpath=..')).toHaveAttribute('open','');
  const after=await savedAdventure(page);
  expect(after.exploration.areas.map(x=>x.id)).toEqual(before.exploration.areas.map(x=>x.id));
  expect(after.exploration.levels.map(x=>x.id)).toEqual(before.exploration.levels.map(x=>x.id));
 }
});

test('Arrastar para a posição que já ocupa não produz confirmação falsa',async({page},testInfo)=>{
 test.skip(testInfo.project.name==='mobile-chromium','Verificação de ponteiro de mouse no desktop');
 await seedAnimatedOrderData(page);
 const origin=page.locator('#missoes [data-entity-row="mission-1"] [data-adventure-grip]');
 const next=page.locator('#missoes [data-entity-row="mission-2"]');
 await origin.scrollIntoViewIfNeeded();
 const a=await origin.boundingBox(),b=await next.boundingBox();
 await page.mouse.move(a.x+a.width/2,a.y+a.height/2);
 await page.mouse.down();
 await page.mouse.move(a.x+a.width/2+10,a.y+a.height/2+9,{steps:4});
 await page.mouse.move(b.x+b.width*.35,b.y+b.height*.22,{steps:10});
 await expect(next).toHaveClass(/adventure-sort-before/);
 await page.mouse.up();
 await expect.poll(async()=>(await savedAdventure(page)).missions.map(x=>x.id)).toEqual(['mission-1','mission-2']);
 await expect(page.locator('#missoes .adventure-sort-feedback')).toHaveCount(0);
});
