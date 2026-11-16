import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderAdventureParchmentDashboard,renderSessionParchmentDashboard} from '../scripts/narrative-parchment-dashboard.js';

const adv={
 id:'adv',title:'A Torre Escarlate',status:'active',
 npcIds:['npc1','npc2'],scenes:[{id:'s1',title:'A Câmara'}],
 missions:[{id:'m1',title:'Impedir o Ritual'}],monsters:[{id:'b1',name:'Guardião'}],
 developments:[{id:'d1',sessionId:'session',sceneId:'s1',
 description:'Os heróis encontraram uma <chave> & seguiram.',at:'2026-11-16T11:00:00Z'}],
 exploration:{levels:[{id:'map1',name:'Fortaleza'}],areas:[{id:'area1',name:'Salão'}],factions:[{id:'f1',name:'Vigias'}]}
};
const campaign={name:'Crônicas da Torre',sessions:[{id:'session',adventureId:'adv'}]};
const session={id:'session',mapIds:['map1'],objectiveIds:['m1'],participantUsernames:['ana','leo'],
 scenes:[{id:'ss1',adventureSceneId:'s1',title:'A Câmara'}],encounters:[]};
const a=renderAdventureParchmentDashboard(adv,campaign);
assert.match(a,/Estrutura da Aventura/);
assert.match(a,/Ações Rápidas/);
assert.match(a,/Últimos Desenrolares/);
for(const key of ['overview-mapas','overview-cenas','overview-locais','overview-npcs',
 'overview-monstros','overview-faccoes','overview-objetivos','overview-desenrolares',
 'adventure-overview-timeline'])assert.ok(a.includes('data-parchment-focus="'+key+'"'),key);
for(const key of ['scene','map','npc','development'])
 assert.ok(a.includes('data-adventure-quick-kind="'+key+'"'),key);
assert.match(a, /1<\/strong><span>Mapas/);
assert.match(a, /2<\/strong><span>NPCs/);
assert.doesNotMatch(a, /<chave>/,'O conteúdo dos jogadores não pode virar HTML');

const s=renderSessionParchmentDashboard(session,adv,false);
assert.match(s,/Estrutura da Sessão/);
assert.match(s,/data-session-parchment="edit"/);
assert.match(s,/data-session-parchment="create"/);
assert.match(s,/data-session-parchment="live"/);
assert.match(s,/data-session-focus-input="development"/);
assert.match(s,/Últimos Desenrolares/);
assert.match(s,/Os heróis encontraram uma &lt;chave&gt; &amp; seguiram/);
assert.match(s,/1<\/strong><span>Objetivos/);
const restricted=renderSessionParchmentDashboard(session,adv,true);
assert.doesNotMatch(restricted,/data-session-parchment=/,'Somente o Mestre pode receber atalhos de edição');

for(const route of ['aventuras.html','sessoes.html']){
 const html=readFileSync(new URL('../'+route,import.meta.url),'utf8');
 assert.match(html,/narrative-parchment.css\?v=/,route+' deve carregar CSS');
 assert.match(html,/class="hub-narrative-modern hub-parchment"/,route+' deve ativar tema');
}
const css=readFileSync(new URL('../narrative-parchment.css',import.meta.url),'utf8');
assert.match(css,/@media \(max-width:640px\)/,'Tema exige layout compacto');
assert.match(css,/\.parchment-dashboard-columns/);
const tokens=readFileSync(new URL('../hub-design-tokens.css',import.meta.url),'utf8');
for(const variable of ['bg','surface','surface-2','surface-3','text','text-2','border','accent','accent-2']){
 assert.match(tokens,new RegExp('--hub-'+variable+':'),`Paleta global sem --hub-${variable}`);
 assert.match(css,new RegExp('var\\(--hub-'+variable.replace(/[.*+?^${}()|[\]\\]/g,'\\assert.match(css,/\.parchment-dashboard-columns/);')+'\\)'),`Tela deve herdar --hub-${variable}`);
}
assert.match(css,/color-scheme:dark/,'Aventuras/Sessões devem compartilhar o tema escuro do Hub');
assert.match(css,/\.parchment-dashboard-columns/,'Hierarquia visual preservada');
assert.doesNotMatch(css,/color-scheme:light|background:#(?:fff|faf|f6e)/i,'Não forçar fundo claro no layout');
for(const route of ['aventuras.html','sessoes.html']){
 const html=readFileSync(new URL('../'+route,import.meta.url),'utf8');
 assert.match(html,/narrative-parchment\.css\?v=20261116-paleta-hub1/,'Cache novo da paleta');
}

const ui=readFileSync(new URL('../scripts/campaign-sessions-ui.js',import.meta.url),'utf8');
assert.match(ui,/renderSessionParchmentDashboard\(s,adv,restricted\)/);
const adventureUi=readFileSync(new URL('../scripts/adventure-ui.js',import.meta.url),'utf8');
assert.match(adventureUi,/renderAdventureParchmentDashboard\(a,c\)/);
assert.match(adventureUi,/bindParchmentAdventureActions\(\)/);
console.log('✓ Layout Pergaminho: painéis, dados reais, ações, acessibilidade e rotas consistentes.');
