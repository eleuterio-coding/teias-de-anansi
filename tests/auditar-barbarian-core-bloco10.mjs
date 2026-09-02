import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const builder = path.join(ROOT, 'scripts', 'character-builder');
const stateUrl = pathToFileURL(path.join(builder, 'state.js')).href;
const rulesUrl = `${pathToFileURL(path.join(builder, 'rules.js')).href}?audit=block10-barbarian-core`;
const { state } = await import(stateUrl);
const { applyBarbarianCoreMechanics } = await import(rulesUrl);

state.c = { choices: { equipment: { shield: false } } };

const level1 = {
  klass: { slug: 'barbarian' },
  level: 1,
  scores: { Força: 16, Destreza: 14, Constituição: 16 },
  armor: null,
  ac: 12,
  speed: 30,
  hp: 15,
  attack: 5,
  wAbility: 'Força',
};
applyBarbarianCoreMechanics(level1);
assert.equal(level1.ac, 15, 'Defesa sem Armadura deve usar 10 + Des + Con quando superar a CA atual.');
assert.equal(level1.barbarianCoreMechanics.unarmoredDefense, true);
assert.equal(level1.attacksPerAttackAction, undefined, 'Ataque Extra não deve existir antes do nível 5.');

const level5 = {
  klass: { slug: 'barbarian' },
  level: 5,
  scores: { Força: 18, Destreza: 14, Constituição: 16 },
  armor: { categoria: 'Média' },
  ac: 16,
  speed: 30,
  hp: 55,
  attack: 7,
  wAbility: 'Força',
};
applyBarbarianCoreMechanics(level5);
assert.equal(level5.attacksPerAttackAction, 2, 'Ataque Extra deve produzir duas investidas na ação Atacar a partir do nível 5.');
assert.equal(level5.speed, 40, 'Movimento Rápido deve acrescentar 10 ft sem Armadura Pesada.');
assert.equal(level5.ac, 16, 'Defesa sem Armadura não pode substituir a CA enquanto o Bárbaro usa armadura.');

const heavy = {
  klass: { slug: 'barbarian' },
  level: 7,
  scores: { Força: 18, Destreza: 12, Constituição: 16 },
  armor: { categoria: 'Pesada' },
  ac: 18,
  speed: 30,
  hp: 75,
  attack: 7,
  wAbility: 'Força',
};
applyBarbarianCoreMechanics(heavy);
assert.equal(heavy.speed, 30, 'Movimento Rápido não pode operar com Armadura Pesada.');
assert.equal(heavy.initiativeAdvantage, true, 'Instinto Selvagem deve registrar Vantagem em Iniciativa a partir do nível 7.');

state.c.choices.equipment.shield = true;
const shielded = {
  klass: { slug: 'barbarian' },
  level: 7,
  scores: { Força: 18, Destreza: 14, Constituição: 16 },
  armor: null,
  ac: 14,
  speed: 30,
  hp: 75,
  attack: 7,
  wAbility: 'Força',
};
applyBarbarianCoreMechanics(shielded);
assert.equal(shielded.ac, 17, 'Defesa sem Armadura deve permanecer compatível com Escudo.');

state.c.choices.equipment.shield = false;
const level20 = {
  klass: { slug: 'barbarian' },
  level: 20,
  scores: { Força: 20, Destreza: 14, Constituição: 20 },
  armor: null,
  ac: 17,
  speed: 30,
  hp: 245,
  attack: 11,
  wAbility: 'Força',
};
applyBarbarianCoreMechanics(level20);
assert.equal(level20.scores.Força, 24, 'Campeão Primal deve aumentar Força em 4, respeitando máximo 25.');
assert.equal(level20.scores.Constituição, 24, 'Campeão Primal deve aumentar Constituição em 4, respeitando máximo 25.');
assert.equal(level20.attack, 13, 'A mudança do modificador de Força deve alcançar o ataque derivado.');
assert.equal(level20.hp, 285, 'A mudança do modificador de Constituição deve recalcular PV por nível.');
assert.equal(level20.ac, 19, 'A nova Constituição deve alcançar Defesa sem Armadura.');
assert.equal(level20.attacksPerAttackAction, 2);
assert.equal(level20.speed, 40);
assert.equal(level20.initiativeAdvantage, true);
assert.deepEqual(level20.barbarianCoreMechanics.primalChampion, {
  strength: 24,
  constitution: 24,
  strengthModifierDelta: 2,
  constitutionModifierDelta: 2,
});

const fighter = {
  klass: { slug: 'fighter' },
  level: 20,
  scores: { Força: 20, Destreza: 14, Constituição: 20 },
  armor: null,
  ac: 12,
  speed: 30,
  hp: 200,
};
assert.equal(applyBarbarianCoreMechanics(fighter), fighter);
assert.equal(fighter.barbarianCoreMechanics, undefined, 'O runtime do Bárbaro não pode vazar para outras classes.');

console.log('OK · núcleo do Bárbaro produz CA, ataques por ação, deslocamento, iniciativa e atributos/PV derivados observáveis.');
