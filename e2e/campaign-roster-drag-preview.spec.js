import {test,expect} from '@playwright/test';

const campaign={
 id:'e2e-roster-preview',name:'Reinos de Prata',status:'active',system:'D&D 5.5e',
 members:[
  {id:'m1',username:'fernanda',name:'Fernanda',role:'player',characterId:'p1',active:true},
  {id:'m2',username:'bruno',name:'Bruno',role:'player',characterId:'p2',active:true},
  {id:'m3',username:'gustavo',name:'Gustavo',role:'player',characterId:'p3',active:true}
 ],
 sessions:[]
};
const characters=[
 {id:'p1',name:'Aluria'},{id:'p2',name:'Tanzan'},{id:'p3',name:'Dongron'}
];

test.beforeEach(async({page})=>{
 await page.route('**/dados/firebase-config.json*',route=>route.fulfill({
  status:200,contentType:'application/json',
  body:JSON.stringify({enabled:false,authMode:'username-password'})
 }));
 await page.addInitScript(data=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({
   uid:'dm-roster',username:'rafael',isMaster:true,memberships:[]
  }));
  localStorage.setItem('hub-rpg:campaigns:v1',JSON.stringify([data.campaign]));
  localStorage.setItem('hub-rpg:characters:v4',JSON.stringify(data.characters));
 },{campaign,characters});
});

test('o card levantado mantém o grid e não sai lateralmente da lista',async({page,browserName})=>{
 test.skip(browserName!=='chromium'||test.info().project.name!=='desktop-chromium','Arraste com mouse no desktop');
 await page.setViewportSize({width:1120,height:900});
 await page.goto('/mesa.html?id='+campaign.id);
 const rows=page.locator('#member-list > [data-member-row]');
 await expect(rows).toHaveCount(3);
 const source=rows.first(),destination=rows.last(),grip=source.locator('.roster-grip');
 await grip.scrollIntoViewIfNeeded();
 const sourceBox=await source.boundingBox(),targetBox=await destination.boundingBox(),gripBox=await grip.boundingBox();
 expect(sourceBox&&targetBox&&gripBox).toBeTruthy();
 const startX=gripBox.x+gripBox.width/2,startY=gripBox.y+gripBox.height/2;
 const initialScrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
 await page.mouse.move(startX,startY);
 await page.mouse.down();
 await page.mouse.move(startX+18,startY+8,{steps:4});
 const preview=page.locator('#jogadores > .roster-floating-card');
 await expect(preview).toBeVisible();
 const before=await preview.boundingBox();
 expect(Math.abs(before.x-sourceBox.x)).toBeLessThanOrEqual(2);
 expect(Math.abs(before.width-sourceBox.width)).toBeLessThanOrEqual(2);
 const styling=await preview.evaluate(el=>({
  position:getComputedStyle(el).position,
  grid:getComputedStyle(el).gridTemplateColumns,
  originalGrid:getComputedStyle(document.querySelector('#member-list [data-member-row]')).gridTemplateColumns,
  identity:getComputedStyle(el.querySelector('.roster-player-identity')).display,
  actionLabel:getComputedStyle(el.querySelector('.roster-action-label')).position,
  actionWidths:[...el.querySelectorAll('.roster-open-button,.roster-remove-button')].map(b=>Math.round(b.getBoundingClientRect().width)),
  text:el.querySelector('.roster-player-name')?.textContent,
  character:el.querySelector('[data-member-character]')?.value
 }));
 expect(styling.position).toBe('absolute');
 expect(styling.grid).toBe(styling.originalGrid);
 expect(styling.identity).toBe('contents');
 expect(styling.actionLabel).toBe('absolute');
 expect(styling.actionWidths).toEqual([44,44]);
 expect(styling.text).toBe('Fernanda');
 expect(styling.character).toBe('p1');
 await page.mouse.move(Math.min(targetBox.x+targetBox.width-20,startX+220),targetBox.y+targetBox.height-7,{steps:12});
 const after=await preview.boundingBox();
 expect(Math.abs(after.x-sourceBox.x)).toBeLessThanOrEqual(2);
 expect(after.y).toBeGreaterThan(before.y+20);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(initialScrollWidth+2);
 await page.mouse.up();
 await expect(preview).toHaveCount(0);
 await expect.poll(()=>rows.evaluateAll(nodes=>nodes.map(n=>n.dataset.memberRow))).toEqual(['m2','m3','m1']);
 await page.reload();
 await expect.poll(()=>rows.evaluateAll(nodes=>nodes.map(n=>n.dataset.memberRow))).toEqual(['m2','m3','m1']);
});
