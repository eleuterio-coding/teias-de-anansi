import { test, expect } from '@playwright/test';

test.beforeEach(async ({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({status:200,contentType:'application/json',body:'{"enabled":false,"authMode":"username-password"}'}));
 await page.addInitScript(()=>{
  const camp={id:'qa-layout-camp',name:'Reinos de Prata',status:'active',
   members:[{id:'m1',username:'ana',name:'Ana',role:'player',active:true},{id:'m2',username:'beto',name:'Beto',role:'player',active:true}],
   npcs:[{id:'npc1',name:'Iria, capitã da guarda',role:'Aliada'},{id:'npc2',name:'Arconte',role:'Antagonista'}],
   sessions:[{id:'s1',adventureId:'qa-layout-adv',number:1,order:1,title:'O Conselho',status:'current'}, {id:'s2',adventureId:'qa-layout-adv',number:2,order:2,title:'A Reunião das Rainhas',status:'planned'}]};
  const adv={id:'qa-layout-adv',campaignId:'qa-layout-camp',title:'As Rainhas',status:'active',description:'Um acordo improvável entre as casas rivais.',participantUsernames:['ana','beto'],npcIds:['npc1','npc2'],
   missions:[{id:'mi1',title:'Proteger o conselho',description:'Impedir a sabotagem',order:1}],
   monsters:[{id:'mo1',name:'Guardião de pedra',monsterId:'g1',source:'Biblioteca',order:1}],
   scenes:[{id:'sc1',title:'Encontro no salão',areaId:'ar1',status:'planned',order:1,monsterIds:['mo1'],npcIds:['npc1']},{id:'sc2',title:'Um novo aliado',status:'planned',order:2}],
   exploration:{levels:[{id:'l1',name:'Palácio',type:'Masmorra',order:1}],areas:[{id:'ar1',code:'A01',name:'Salão do Conselho',type:'Salão',status:'discovered',levelId:'l1'},{id:'ar2',code:'A02',name:'Corredor leste',type:'Corredor',status:'unknown',levelId:'l1'}],factions:[{id:'f1',name:'Casa Real',stance:'friendly',order:1}]}};
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'qa-layout-master',username:'rafael',isMaster:true,memberships:[]}));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([camp]));
  localStorage.setItem('hub-rpg:adventures:v1',JSON.stringify([adv]));
  localStorage.setItem('hub-rpg:characters:v4','[]');
  localStorage.setItem('hub-rpg:npcs:v1','[]');
 });
});
test('diagnosticar grade e espaços do editor da Aventura',async ({page},testInfo)=>{
 await page.goto('/aventuras.html?campaign=qa-layout-camp&id=qa-layout-adv');
 await expect(page.locator('#cenas h2')).toHaveText('Cenas');
 const info=await page.evaluate(()=>{
  const clip=el=>{const r=el.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),bottom:Math.round(r.bottom)}};
  const grid=document.querySelector('#adventure-root .hub-detail-grid');
  const blocks=[...grid.children].map(el=>{
    const rect=clip(el),title=el.querySelector('h2')?.textContent;
    const gridInfo=getComputedStyle(el);
    const children=[...el.children].filter(x=>getComputedStyle(x).display!=='none').map(x=>({...clip(x),sel:x.id||x.className?.toString().slice(0,60)||x.tagName}));
    return {id:el.id||el.className.split(' ')[0],title,...rect,display:gridInfo.display,gridRow:gridInfo.gridRowStart,cssGap:gridInfo.rowGap,children}
  });
  const doc=document.documentElement;
  const rowGaps=blocks.map((x,i)=>({...x, nextTop:blocks[i+1]?.y}));
  const full=document.querySelector('#adventure-root .hub-detail-page');
  return {viewport:{w:window.innerWidth,h:window.innerHeight},documentWidth:doc.scrollWidth,root:clip(full),grid:clip(grid),gap:getComputedStyle(grid).gap,columns:getComputedStyle(grid).gridTemplateColumns,blocks:rowGaps};
 });
 console.log('LAYOUT_AUDIT_JSON '+JSON.stringify(info));
 expect(info.documentWidth).toBeLessThanOrEqual(info.viewport.w+2);
 await page.screenshot({path:testInfo.outputPath('adventure-layout-full.png'),fullPage:true});
});
