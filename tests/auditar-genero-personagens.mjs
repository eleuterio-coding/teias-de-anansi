import assert from'node:assert/strict';
import fs from'node:fs';
import{normalizeCharacterGender,characterGender,genderedCharacterTerm,characterIdentity,CHARACTER_GENDER_OPTIONS}from'../scripts/character-gender.js';

assert.deepEqual(CHARACTER_GENDER_OPTIONS,['Feminino','Masculino','Outro']);
assert.equal(normalizeCharacterGender('feminino'),'Feminino');
assert.equal(normalizeCharacterGender('Masculo'),'Masculino');
assert.equal(normalizeCharacterGender('Outro'),'Outro');
assert.equal(normalizeCharacterGender(''),'');
assert.equal(normalizeCharacterGender('valor inesperado'),'');
const aluria={
 id:'pc-aluria',name:'Aluria',
 refSnapshots:{class:{id:'ranger',name:'Patrulheiro'},species:{id:'elf',name:'Elfo'}},
 choices:{class:{level:4}},sheet:{profile:{gender:'Feminino'}}
};
const copy=structuredClone(aluria);
assert.equal(characterGender(aluria),'Feminino');
assert.equal(characterIdentity(aluria),'Aluria · Patrulheira lvl 4 · Elfa');
aluria.sheet.profile.gender='Masculino';
assert.equal(characterIdentity(aluria),'Aluria · Patrulheiro lvl 4 · Elfo');
aluria.sheet.profile.gender='Outro';
assert.equal(characterIdentity(aluria),'Aluria · Patrulheire lvl 4 · Elfe');
assert.equal(characterIdentity(aluria,{includeName:false}),'Patrulheire lvl 4 · Elfe');
assert.equal(genderedCharacterTerm('Mago','Outro','class'),'Mage');
assert.equal(genderedCharacterTerm('Anão','Feminino','species'),'Anã');
assert.equal(genderedCharacterTerm('Nobre','Outro','background'),'Nobre');
assert.equal(genderedCharacterTerm('Tiefling','Outro','species'),'Tiefling');
assert.equal(genderedCharacterTerm('Medusa','Outro','species'),'Medusa');
assert.equal(genderedCharacterTerm('Forjado Bélico','Feminino','species'),'Forjada Bélica');
assert.equal(genderedCharacterTerm('Guerreiro','Feminino','class'),'Guerreira');
assert.equal(genderedCharacterTerm('Guerreiro','Outro','class'),'Guerreire');
assert.equal(genderedCharacterTerm('Patrulheiro','', 'class'),'Patrulheiro');
assert.equal(genderedCharacterTerm('O Cerco','Outro','subclass'),'O Cerco');
// Calculadores e nomes normativos continuam masculinos: identidade é só apresentação.
assert.equal(copy.refSnapshots.class.name,'Patrulheiro');
assert.equal(aluria.refSnapshots.class.name,'Patrulheiro');
const creation=fs.readFileSync('criacao-personagem.html','utf8');
const sheet=fs.readFileSync('ficha-personagem.html','utf8');
for(const html of[creation,sheet]){
 const gender=/<select id="profile-gender">([\s\S]*?)<\/select>/.exec(html)?.[1]||'';
 assert.ok(gender,'O campo Gênero deve ser dropdown.');
 for(const value of CHARACTER_GENDER_OPTIONS)assert.ok(gender.includes(`value="${value}"`),`Opção ausente: ${value}`);
 assert.ok(!html.includes('id="profile-gender" type="text"'));
}
const campaign=fs.readFileSync('scripts/campaign-table-ui.js','utf8');
const adventure=fs.readFileSync('scripts/adventure-roster-ui.js','utf8');
const list=fs.readFileSync('scripts/character-list-ui.js','utf8');
for(const [surface,source]of[['Campanha',campaign],['Aventura',adventure],['Personagens',list]]){
 assert.match(source,/characterIdentity/,`${surface} sem formatter único`);
}
assert.match(fs.readFileSync('scripts/character-sheet.js','utf8'),/saveCharacter\('Gênero atualizado\.'/);
console.log('OK — 3 gêneros, concordância, fallback, preservação de dados e telas integradas.');
