import {test,expect} from '@playwright/test';

const campaign={id:'layout-interior-c',name:'Reinos de Prata',status:'active',members:[],
  npcs:[{id:'layout-npc-1',name:'Capitã Astrid',role:'Aliada'}],locations:[],sessions:[]};
const adventure={id:'layout-interior-a',campaignId:campaign.id,title:'O Palácio',status:'active',
  npcIds:['layout-npc-1'],locationIds:[],participantUsernames:[],characterIds:[],
  scenes:[{id:'layout-scene-1',title:'O Conselho',status:'planned',order:1}],
  missions:[{id:'layout-mission-1',title:'Proteger a Coroa',status:'active',order:1}],
  monsters:[{id:'layout-monster-1',name:'Guardião',source:'Biblioteca',order:1}],
  exploration:{
    levels:[{id:'layout-map-1',name:'Palácio',type:'Masmorra',order:1}],
    areas:Array.from({length:6},(_,i)=>({
      id:'layout-area-'+(i+1),code:'A'+String(i+1).padStart(2,'0'),
      name:i===2?'Galeria dos Retratos':'Sala '+(i+1),type:'Sala',
      levelId:'layout-map-1',status:'discovered',order:i+1
    })),
    factions:[{id:'layout-faction-1',name:'Guardiões',stance:'neutral',order:1}]
  }
};
test.beforeEach(async({page})=>{
  await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({enabled:false,authMode:'username-password'})
  }));
  await page.addInitScript(({campaign,adventure})=>{
    localStorage.setItem('hub-rpg:collaboration-session:v1',
      JSON.stringify({uid:'layout-interior-master',username:'rafael',isMaster:true,memberships:[]}));
    localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([campaign]));
    localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([adventure]));
    localStorage.setItem('hub-rpg:characters:v4','[]');
    localStorage.setItem('hub-rpg:npcs:v1','[]');
  },{campaign,adventure});
});
const visit=page=>page.goto('/aventuras.html?campaign=layout-interior-c&id=layout-interior-a');
const noPageOverflow=async page=>{
  const sizes=await page.evaluate(()=>({width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth}));
  expect(sizes.scrollWidth,'Página não deve apresentar rolagem horizontal').toBeLessThanOrEqual(sizes.width+3);
};

test('Visão Geral: cards de sete categorias preservam grade, conteúdo e ausência de overflow',async({page},testInfo)=>{
  await visit(page);
  await expect(page.locator('#adventure-overview-content')).toBeVisible();
  const sections=['overview-cenas','overview-locais','overview-mapas','overview-npcs',
    'overview-monstros','overview-objetivos','overview-faccoes'];
  const data=[];
  for(const id of sections){
    const section=page.locator('#'+id);
    await expect(section,id).toBeVisible();
    const cards=section.locator('.adventure-read-card');
    await expect(cards.first(),id+' deve exibir um registro').toBeVisible();
    const result=await section.evaluate(el=>{
      const parent=el.getBoundingClientRect();
      const cards=[...el.querySelectorAll('.adventure-read-card')].map(card=>{
        const r=card.getBoundingClientRect();
        return {left:r.left,right:r.right,width:r.width,height:r.height};
      });
      return {id:el.id,left:parent.left,right:parent.right,cards};
    });
    for(const card of result.cards){
      expect(card.width,id+' card visível').toBeGreaterThan(0);
      expect(card.left,id+' alinhamento esquerdo').toBeGreaterThanOrEqual(result.left-3);
      expect(card.right,id+' alinhamento direito').toBeLessThanOrEqual(result.right+3);
    }
    data.push({id,items:result.cards.length});
  }
  console.log('LAYOUT_INTERIOR_OVERVIEW '+testInfo.project.name+' '+JSON.stringify(data));
  await noPageOverflow(page);
});

test('Oficina: Cenas, Locais, Mapas, NPCs, Facções, Objetivos e Monstros usam as áreas corretas',async({page},testInfo)=>{
  await visit(page);
  await page.locator('#adventure-create-tab').click();
  const cases=[
    ['scene','#cenas','.adventure-scene-record'],
    ['area','#exploracao','.explore-area-card'],
    ['map','#mapas','.explore-level-card'],
    ['npc','#npcs','[data-campaign-npc]'],
    ['monster','#monstros','[data-monster-row]'],
    ['more','#missoes','.story-card'],
    ['more','#faccoes','[data-ex-faction]']
  ];
  const seen=[];
  for(const [kind,section,card] of cases){
    await page.locator('[data-adventure-creation-kind="'+kind+'"]').click();
    const el=page.locator(section);
    await expect(el,section+' visível em '+kind).toBeVisible();
    const count=await el.locator(card).count();
    seen.push({kind,section,count});
    await noPageOverflow(page);
  }
  console.log('LAYOUT_INTERIOR_EDITOR '+testInfo.project.name+' '+JSON.stringify(seen));
});

test('Oficina: Locais recolhidos formam grade de cartões quadrados; aberto ocupa a largura total',async({page},testInfo)=>{
  await visit(page);
  await page.locator('#adventure-create-tab').click();
  await page.locator('[data-adventure-creation-kind="area"]').click();
  const grid=page.locator('#exploracao .explore-area-grid');
  const cards=grid.locator(':scope > .explore-area-card');
  await expect(cards).toHaveCount(6);
  const geometry=await grid.evaluate(el=>{
    const gr=el.getBoundingClientRect(),css=getComputedStyle(el);
    const cards=[...el.querySelectorAll(':scope > .explore-area-card')].map(node=>{
      const r=node.getBoundingClientRect();
      return {x:r.x,y:r.y,width:r.width,height:r.height,ratio:r.width/r.height,
        isExpanded:node.querySelector(':scope > .explore-record-editor')?.open||false};
    });
    return {width:gr.width,columns:css.gridTemplateColumns,rows:cards};
  });
  console.log('LAYOUT_INTERIOR_LOCAIS '+testInfo.project.name+' '+JSON.stringify(geometry));
  const distinctColumns=new Set(geometry.rows.map(x=>Math.round(x.x))).size;
  expect(distinctColumns,'Locais recolhidos não podem ficar em uma única coluna de largura total').toBeGreaterThanOrEqual(2);
  for(const row of geometry.rows){
    expect(row.isExpanded).toBe(false);
    expect(Math.abs(row.width-row.height),'O card recolhido deve ser quadrado').toBeLessThanOrEqual(3);
    expect(row.width,'Card deve permanecer compacto').toBeLessThanOrEqual(testInfo.project.name==='mobile-chromium'?190:250);
  }
  await cards.first().locator('summary').click();
  await expect(cards.first().locator(':scope > .explore-record-editor')).toHaveAttribute('open','');
  const expanded=await grid.evaluate(el=>{
    const r=el.getBoundingClientRect(),c=el.querySelector('.explore-area-card').getBoundingClientRect();
    return {gridWidth:r.width,cardWidth:c.width};
  });
  expect(expanded.cardWidth).toBeGreaterThanOrEqual(expanded.gridWidth-3);
  await noPageOverflow(page);
});

test('Oficina: categorias de criação mantêm alvos de toque mínimos de 44px',async({page},testInfo)=>{
  await visit(page);
  await page.locator('#adventure-create-tab').click();
  const controls=await page.locator('.adventure-creation-choices>button').evaluateAll(nodes=>nodes.map(el=>{
    const r=el.getBoundingClientRect();
    return {label:el.textContent.trim(),height:r.height};
  }));
  console.log('LAYOUT_INTERIOR_TABS '+testInfo.project.name+' '+JSON.stringify(controls));
  expect(controls).toHaveLength(7);
  for(const control of controls)expect(control.height,control.label+' deve permitir toque confortável').toBeGreaterThanOrEqual(44);
  await noPageOverflow(page);
});
