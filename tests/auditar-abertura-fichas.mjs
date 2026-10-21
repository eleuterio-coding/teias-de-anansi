import assert from'node:assert/strict';
import{assignedCharacterIds,canOpenCharacter,canEditCharacter,visibleCharacterIds}from'../scripts/collaboration-view.js';
import{readFileSync}from'node:fs';
import{normalizeCharacter}from'../scripts/character-builder/state.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const original={id:'example',name:'Ficha de teste',choices:{class:{level:2},background:{}},refSnapshots:{class:{name:'Guerreiro'}},updatedAt:'2026-10-21T10:00:00Z'};
const normalized=normalizeCharacter(original);
assert.equal(normalized.id,original.id);
assert.equal(normalized.name,original.name);
assert.equal(normalized.choices.class.level,2);
assert.equal(normalized.refSnapshots.class.name,'Guerreiro');
assert.equal(normalized.choices.spells.cantrips.length,0);
assert.notEqual(normalized,original,'Sem alterar os dados originais');
assert.deepEqual(original.choices.class,{level:2});
const sheet=read('scripts/character-sheet.js'),access=read('scripts/character-sheet-access-ui.js');
const realtime=read('scripts/collaboration-realtime.js');
assert.match(realtime,/function loginUrl\(\)/,'Redirecionamento explícito após Firebase encerrar a sessão');
assert.match(realtime,/login.searchParams.set\('next'/,'Restauração do destino da ficha após novo login');
assert.match(sheet,/sharedCharacterById\(id\)/);
assert.match(sheet,/canOpenCharacter\(id\)/);
assert.match(sheet,/retryWhenSharedCharacterArrives/);
assert.match(sheet,/normalizeCharacter\(saved\)/);
assert.match(access,/window\.addEventListener\('hub-rpg:remote-updated',apply\)/);
assert.match(access,/function refreshAccess\(\)/);
assert.match(access,/status&&status\.textContent!=='Somente leitura'/,'Proteção idempotente contra loops do MutationObserver');
assert.match(access,/loading\?\.dataset\.sheetPending==='true'/,'Não negar acesso enquanto a ficha sincroniza');
const session={uid:'uid-jogador',username:'jogador',isMaster:false,memberships:[{uid:'uid-jogador',username:'jogador',campaignId:'campanha-1',role:'player',active:true,characterId:'personagem-proprio'}]};
const storage={getItem(key){return({
 'hub-rpg:collaboration-session:v1':JSON.stringify(session),
 'hub-rpg:collaboration-cache:v1':JSON.stringify({campaigns:{}}),
 'hub-rpg:characters:v4':JSON.stringify([{id:'personagem-proprio',name:'Ficha do jogador'},{id:'personagem-alheio',name:'Outro'}])
})[key]||null}};
assert.deepEqual(assignedCharacterIds(storage),['personagem-proprio']);
assert.ok(visibleCharacterIds(storage).includes('personagem-proprio'),'Visibilidade própria sem cache');
assert.equal(canOpenCharacter('personagem-proprio',storage),true,'Abertura de ficha atribuída');
assert.equal(canEditCharacter('personagem-proprio',storage),true,'Edição da própria ficha');
assert.equal(canOpenCharacter('personagem-alheio',storage),false,'Não revela personagem alheio');
const expired={getItem(key){if(key==='hub-rpg:collaboration-session:v1')return JSON.stringify({...session,memberships:[{...session.memberships[0],active:false}]});return storage.getItem(key)}};
assert.deepEqual(assignedCharacterIds(expired),[],'Atribuição inativa não libera acesso');
console.log('OK: normalização idêntica, recuperação compartilhada e autorização da sessão e recuperação do cache.');
