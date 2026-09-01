import assert from'node:assert/strict';
import fs from'node:fs';
import{ensureGameplayState,setGameplayField,gameplaySnapshot,GAMEPLAY_FIELDS}from'../scripts/character-sheet-gameplay-state.js';

const character={id:'pc-game',sheet:{profile:{player:'Ana'},runtime:{currentHp:12}}};
const gameplay=ensureGameplayState(character);
assert.deepEqual(GAMEPLAY_FIELDS,['objective','scene','notes','reminders'],'O estado operacional precisa manter os quatro campos de sessão previstos.');
assert.equal(gameplay.objective,'');
assert.equal(character.sheet.profile.player,'Ana','Inicializar o modo de jogo não pode apagar dados existentes da ficha.');
assert.equal(character.sheet.runtime.currentHp,12,'Inicializar o modo de jogo não pode alterar o estado de combate.');
assert.equal(setGameplayField(character,'objective','Encontrar o portal'),true);
assert.equal(setGameplayField(character,'notes','Símbolo azul na parede'),true);
assert.equal(setGameplayField(character,'campo-invalido','x'),false,'Campos arbitrários não devem contaminar o estado da ficha.');
const snapshot=gameplaySnapshot(character);
assert.equal(snapshot.objective,'Encontrar o portal');
assert.equal(snapshot.notes,'Símbolo azul na parede');
const roundTrip=JSON.parse(JSON.stringify(character));
assert.deepEqual(gameplaySnapshot(roundTrip),snapshot,'Notas operacionais devem sobreviver ao round-trip de persistência.');

const html=fs.readFileSync('ficha-personagem.html','utf8');
const ui=fs.readFileSync('scripts/character-sheet-gameplay-ui.js','utf8');
assert.match(html,/character-sheet-gameplay-ui\.js/,'A ficha precisa carregar explicitamente o modo de jogo.');
for(const token of[
 'Ficha digital · Modo de jogo','Editar estrutura','Estado atual','Objetivo atual','Local / cena','Notas rápidas','Lembretes',
 "sheet.addEventListener('input'","sheet.addEventListener('change'","window.addEventListener('pagehide'","visibilitychange","event.ctrlKey||event.metaKey",
 "write(list)","Alterações pendentes…","Salvo automaticamente.","hub-rpg:sheet-ready"
])assert.ok(ui.includes(token),`Modo de jogo sem requisito obrigatório: ${token}`);
assert.ok(!ui.toLowerCase().includes('supabase'),'Modo de jogo não pode introduzir Supabase.');
assert.ok(ui.includes("state.c.updatedAt=new Date().toISOString()"),'Autosave deve atualizar a data de modificação do personagem.');
assert.ok(ui.includes("state.c.sheet")||fs.readFileSync('scripts/character-sheet-gameplay-state.js','utf8').includes('character.sheet.gameplay'),'Dados de sessão devem viver na ficha, não nas escolhas estruturais do construtor.');

console.log('Ficha em modo de jogo validada: estado operacional, autosave, barra atual, sessão e independência do construtor.');
