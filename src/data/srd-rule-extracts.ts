/**
 * Registros de regras derivados por paráfrase do SRD 5.2.1 e SRD 5.1.
 * CC BY 4.0. Atribuições oficiais: src/data/srd-license-notices.ts.
 * Revisão editorial: EM REVISÃO; não alimentar cálculos normativos até aceite do Mestre.
 * Aprovado em 4.02: catálogo de fontes, NÃO revisão integral de cada regra.
 */
import type { RulesReference } from './rpg-source-catalog';

export type ExtractCategory = 'ability' | 'check' | 'proficiency' | 'combat' | 'damage';
export type ExtractStatus = 'in-review' | 'approved' | 'rejected';
export type ExtractFact = string | number | boolean;

export interface SrdRuleExtract {
  id: string;
  sourceId: string;
  edition: RulesReference;
  category: ExtractCategory;
  titlePtBr: string;
  sourceSection: string;
  /** Página impressa no documento oficial (não número de linha de PDF). */
  sourcePage: number;
  textPtBr: string;
  /** Paráfrase em português — adaptação, não tradução oficial. */
  textTreatment: 'adapted-paraphrase';
  facts: Readonly<Record<string, ExtractFact>>;
  formula?: string;
  version: string;
  sourceCheckedOn: string;
  status: ExtractStatus;
  approvedBy?: string;
  approvedOn?: string;
  relatedIds: readonly string[];
}

/**
 * Lote inicial auditável para conferir o pipeline do item 4.03.
 * Não é uma extração integral dos dois SRDs; novos lotes devem ser
 * conferidos a partir de seções/páginas, nunca inventados por associação.
 */
// prettier-ignore
export const SRD_RULE_EXTRACTS: readonly SrdRuleExtract[] = [
  {
    "id": "srd-521-ability-modifier",
    "sourceId": "wotc-srd-521-en",
    "edition": "srd-5.2.1",
    "category": "ability",
    "titlePtBr": "Modificadores de atributo",
    "sourceSection": "Playing the Game > The Six Abilities > Ability Modifiers",
    "sourcePage": 5,
    "textPtBr": "Modificador de atributo calculado pelo arredondamento para baixo de (valor − 10) / 2.",
    "textTreatment": "adapted-paraphrase",
    "facts": {
      "minimumScore": 1,
      "maximumScore": 30,
      "referenceScore": 10,
      "referenceModifier": 0,
      "score30Modifier": 10
    },
    "formula": "(score - 10) / 2, arredondando para baixo",
    "version": "1.0.0",
    "sourceCheckedOn": "2026-11-23",
    "status": "in-review",
    "relatedIds": []
  },
  {
    "id": "srd-521-d20-test",
    "sourceId": "wotc-srd-521-en",
    "edition": "srd-5.2.1",
    "category": "check",
    "titlePtBr": "Teste de d20",
    "sourceSection": "Playing the Game > D20 Tests",
    "sourcePage": 6,
    "textPtBr": "Testes de atributo, salvaguardas e jogadas de ataque usam 1d20, modificadores pertinentes e comparação com alvo; sucesso com total igual ou maior.",
    "textTreatment": "adapted-paraphrase",
    "facts": {
      "diceSides": 20,
      "successAtOrAboveTarget": true
    },
    "version": "1.0.0",
    "sourceCheckedOn": "2026-11-23",
    "status": "in-review",
    "relatedIds": []
  },
  {
    "id": "srd-521-difficulty-classes",
    "sourceId": "wotc-srd-521-en",
    "edition": "srd-5.2.1",
    "category": "check",
    "titlePtBr": "Classes de dificuldade típicas",
    "sourceSection": "Playing the Game > D20 Tests > Ability Checks > Difficulty Class",
    "sourcePage": 6,
    "textPtBr": "Valores típicos de CD: muito fácil 5, fácil 10, médio 15, difícil 20, muito difícil 25 e quase impossível 30; o Mestre define a CD da situação.",
    "textTreatment": "adapted-paraphrase",
    "facts": {
      "veryEasy": 5,
      "easy": 10,
      "medium": 15,
      "hard": 20,
      "veryHard": 25,
      "nearlyImpossible": 30
    },
    "version": "1.0.0",
    "sourceCheckedOn": "2026-11-23",
    "status": "in-review",
    "relatedIds": []
  },
  {
    "id": "srd-521-advantage",
    "sourceId": "wotc-srd-521-en",
    "edition": "srd-5.2.1",
    "category": "check",
    "titlePtBr": "Vantagem e desvantagem",
    "sourceSection": "Playing the Game > D20 Tests > Advantage/Disadvantage",
    "sourcePage": 7,
    "textPtBr": "Role dois d20 e use o maior para Vantagem ou o menor para Desvantagem. Não acumulam; uma de cada tipo cancela todas, independentemente da quantidade.",
    "textTreatment": "adapted-paraphrase",
    "facts": {
      "diceCount": 2,
      "stackable": false,
      "opposingCancel": true
    },
    "version": "1.0.0",
    "sourceCheckedOn": "2026-11-23",
    "status": "in-review",
    "relatedIds": []
  },
  {
    "id": "srd-521-armor-class-base",
    "sourceId": "wotc-srd-521-en",
    "edition": "srd-5.2.1",
    "category": "combat",
    "titlePtBr": "Classe de Armadura básica",
    "sourceSection": "Playing the Game > D20 Tests > Attack Rolls > Armor Class",
    "sourcePage": 7,
    "textPtBr": "A CA básica de uma criatura sem outra fórmula é 10 mais modificador de Destreza; somente um cálculo de CA base vigora por vez.",
    "textTreatment": "adapted-paraphrase",
    "facts": {
      "baseArmorClass": 10,
      "oneBaseArmorClass": true
    },
    "version": "1.0.0",
    "sourceCheckedOn": "2026-11-23",
    "status": "in-review",
    "relatedIds": []
  },
  {
    "id": "srd-521-natural-20-attack",
    "sourceId": "wotc-srd-521-en",
    "edition": "srd-5.2.1",
    "category": "combat",
    "titlePtBr": "20 natural em ataque",
    "sourceSection": "Playing the Game > D20 Tests > Attack Rolls > Rolling 20 or 1",
    "sourcePage": 7,
    "textPtBr": "Um 20 natural em jogada de ataque acerta independentemente da CA e produz acerto crítico; não estender automaticamente a testes de atributo.",
    "textTreatment": "adapted-paraphrase",
    "facts": {
      "naturalRoll": 20,
      "automaticHit": true,
      "critical": true
    },
    "version": "1.0.0",
    "sourceCheckedOn": "2026-11-23",
    "status": "in-review",
    "relatedIds": []
  },
  {
    "id": "srd-521-natural-1-attack",
    "sourceId": "wotc-srd-521-en",
    "edition": "srd-5.2.1",
    "category": "combat",
    "titlePtBr": "1 natural em ataque",
    "sourceSection": "Playing the Game > D20 Tests > Attack Rolls > Rolling 20 or 1",
    "sourcePage": 7,
    "textPtBr": "Um 1 natural em jogada de ataque erra independentemente dos modificadores e da CA; regra não equivale a falha automática em todo teste.",
    "textTreatment": "adapted-paraphrase",
    "facts": {
      "naturalRoll": 1,
      "automaticMiss": true
    },
    "version": "1.0.0",
    "sourceCheckedOn": "2026-11-23",
    "status": "in-review",
    "relatedIds": []
  },
  {
    "id": "srd-521-proficiency-character",
    "sourceId": "wotc-srd-521-en",
    "edition": "srd-5.2.1",
    "category": "proficiency",
    "titlePtBr": "Proficiência por nível de personagem",
    "sourceSection": "Playing the Game > Proficiency > Proficiency Bonus",
    "sourcePage": 8,
    "textPtBr": "Para personagens: níveis 1–4 concedem +2; 5–8 +3; 9–12 +4; 13–16 +5; 17–20 +6. A tabela também cobre ND de monstros maiores, separadamente.",
    "textTreatment": "adapted-paraphrase",
    "facts": {
      "levels1to4": 2,
      "levels5to8": 3,
      "levels9to12": 4,
      "levels13to16": 5,
      "levels17to20": 6
    },
    "version": "1.0.0",
    "sourceCheckedOn": "2026-11-23",
    "status": "in-review",
    "relatedIds": []
  },
  {
    "id": "srd-521-proficiency-no-stack",
    "sourceId": "wotc-srd-521-en",
    "edition": "srd-5.2.1",
    "category": "proficiency",
    "titlePtBr": "Proficiência não se soma duas vezes",
    "sourceSection": "Playing the Game > Proficiency > The Bonus Doesn't Stack",
    "sourcePage": 8,
    "textPtBr": "O mesmo bônus de proficiência não é somado mais de uma vez ao mesmo resultado, mesmo que haja duas fontes de proficiência pertinentes.",
    "textTreatment": "adapted-paraphrase",
    "facts": {
      "stackable": false
    },
    "version": "1.0.0",
    "sourceCheckedOn": "2026-11-23",
    "status": "in-review",
    "relatedIds": []
  },
  {
    "id": "srd-521-skill-tool-synergy",
    "sourceId": "wotc-srd-521-en",
    "edition": "srd-5.2.1",
    "category": "proficiency",
    "titlePtBr": "Perícia e ferramenta no mesmo teste",
    "sourceSection": "Playing the Game > Proficiency > Equipment Proficiencies > Tools",
    "sourcePage": 8,
    "textPtBr": "Quando o teste envolve uma ferramenta e uma perícia com as quais você tem proficiência, aplique o bônus de proficiência apenas uma vez e conceda Vantagem.",
    "textTreatment": "adapted-paraphrase",
    "facts": {
      "bonusAppliedOnce": true,
      "advantageIfBothProficient": true
    },
    "version": "1.0.0",
    "sourceCheckedOn": "2026-11-23",
    "status": "in-review",
    "relatedIds": []
  },
  {
    "id": "srd-521-critical-damage",
    "sourceId": "wotc-srd-521-en",
    "edition": "srd-5.2.1",
    "category": "damage",
    "titlePtBr": "Dados de dano em crítico",
    "sourceSection": "Playing the Game > Damage and Healing > Critical Hits",
    "sourcePage": 16,
    "textPtBr": "Em acerto crítico, role duas vezes todos os dados de dano envolvidos no ataque, inclusive dados adicionais pertinentes; some modificadores fixos uma vez.",
    "textTreatment": "adapted-paraphrase",
    "facts": {
      "damageDiceMultiplier": 2,
      "fixedModifierMultiplier": 1
    },
    "version": "1.0.0",
    "sourceCheckedOn": "2026-11-23",
    "status": "in-review",
    "relatedIds": []
  },
  {
    "id": "srd-521-resistance",
    "sourceId": "wotc-srd-521-en",
    "edition": "srd-5.2.1",
    "category": "damage",
    "titlePtBr": "Resistência a dano",
    "sourceSection": "Playing the Game > Damage and Healing > Resistance and Vulnerability",
    "sourcePage": 17,
    "textPtBr": "Resistência reduz pela metade o dano do tipo pertinente, arredondando para baixo; múltiplas resistências do mesmo tipo não se acumulam.",
    "textTreatment": "adapted-paraphrase",
    "facts": {
      "divisor": 2,
      "roundDown": true,
      "stackable": false
    },
    "version": "1.0.0",
    "sourceCheckedOn": "2026-11-23",
    "status": "in-review",
    "relatedIds": []
  },
  {
    "id": "srd-521-vulnerability",
    "sourceId": "wotc-srd-521-en",
    "edition": "srd-5.2.1",
    "category": "damage",
    "titlePtBr": "Vulnerabilidade a dano",
    "sourceSection": "Playing the Game > Damage and Healing > Resistance and Vulnerability",
    "sourcePage": 17,
    "textPtBr": "Vulnerabilidade dobra o dano do tipo pertinente; múltiplas vulnerabilidades ao mesmo tipo não se acumulam.",
    "textTreatment": "adapted-paraphrase",
    "facts": {
      "multiplier": 2,
      "stackable": false
    },
    "version": "1.0.0",
    "sourceCheckedOn": "2026-11-23",
    "status": "in-review",
    "relatedIds": []
  },
  {
    "id": "srd-521-damage-order",
    "sourceId": "wotc-srd-521-en",
    "edition": "srd-5.2.1",
    "category": "damage",
    "titlePtBr": "Ordem de modificadores do dano",
    "sourceSection": "Playing the Game > Damage and Healing > Resistance and Vulnerability > Order of Application",
    "sourcePage": 17,
    "textPtBr": "Aplique primeiro ajustes gerais; depois Resistência e, por último, Vulnerabilidade. Exemplo oficial conferido: 28 − 5 = 23; resistência resulta em 11; vulnerabilidade em 22.",
    "textTreatment": "adapted-paraphrase",
    "facts": {
      "startingDamage": 28,
      "flatReduction": 5,
      "afterResistance": 11,
      "afterVulnerability": 22
    },
    "version": "1.0.0",
    "sourceCheckedOn": "2026-11-23",
    "status": "in-review",
    "relatedIds": []
  },
  {
    "id": "srd-51-ability-modifier",
    "sourceId": "wotc-srd-51-en",
    "edition": "srd-5.1",
    "category": "ability",
    "titlePtBr": "Modificador de atributo (2014)",
    "sourceSection": "Using Ability Scores > Ability Scores and Modifiers",
    "sourcePage": 76,
    "textPtBr": "O modificador é (atributo − 10) dividido por 2, arredondando para baixo; a tabela do SRD 5.1 cobre valores de 1 a 30.",
    "textTreatment": "adapted-paraphrase",
    "facts": {
      "minimumScore": 1,
      "maximumScore": 30,
      "referenceScore": 10,
      "referenceModifier": 0,
      "score30Modifier": 10
    },
    "formula": "(score - 10) / 2, arredondando para baixo",
    "version": "1.0.0",
    "sourceCheckedOn": "2026-11-23",
    "status": "in-review",
    "relatedIds": []
  },
  {
    "id": "srd-51-advantage",
    "sourceId": "wotc-srd-51-en",
    "edition": "srd-5.1",
    "category": "check",
    "titlePtBr": "Vantagem e desvantagem (2014)",
    "sourceSection": "Using Ability Scores > Advantage and Disadvantage",
    "sourcePage": 76,
    "textPtBr": "Dois d20; escolha o maior em Vantagem ou o menor em Desvantagem. Não acumulam; ocorrências opostas se cancelam.",
    "textTreatment": "adapted-paraphrase",
    "facts": {
      "diceCount": 2,
      "stackable": false,
      "opposingCancel": true
    },
    "version": "1.0.0",
    "sourceCheckedOn": "2026-11-23",
    "status": "in-review",
    "relatedIds": []
  },
  {
    "id": "srd-51-proficiency-no-stack",
    "sourceId": "wotc-srd-51-en",
    "edition": "srd-5.1",
    "category": "proficiency",
    "titlePtBr": "Proficiência não se soma duas vezes (2014)",
    "sourceSection": "Using Ability Scores > Proficiency Bonus",
    "sourcePage": 76,
    "textPtBr": "O bônus de proficiência não é aplicado duas vezes ao mesmo número; proficiências redundantes não geram bônus adicional.",
    "textTreatment": "adapted-paraphrase",
    "facts": {
      "stackable": false
    },
    "version": "1.0.0",
    "sourceCheckedOn": "2026-11-23",
    "status": "in-review",
    "relatedIds": []
  },
  {
    "id": "srd-51-difficulty-classes",
    "sourceId": "wotc-srd-51-en",
    "edition": "srd-5.1",
    "category": "check",
    "titlePtBr": "Classes de dificuldade típicas (2014)",
    "sourceSection": "Using Ability Scores > Ability Checks",
    "sourcePage": 77,
    "textPtBr": "Valores de referência de CD: 5, 10, 15, 20, 25 e 30, em progressão de muito fácil até quase impossível.",
    "textTreatment": "adapted-paraphrase",
    "facts": {
      "veryEasy": 5,
      "easy": 10,
      "medium": 15,
      "hard": 20,
      "veryHard": 25,
      "nearlyImpossible": 30
    },
    "version": "1.0.0",
    "sourceCheckedOn": "2026-11-23",
    "status": "in-review",
    "relatedIds": []
  },
  {
    "id": "srd-51-critical-damage",
    "sourceId": "wotc-srd-51-en",
    "edition": "srd-5.1",
    "category": "damage",
    "titlePtBr": "Dados de dano em crítico (2014)",
    "sourceSection": "Combat > Damage and Healing > Critical Hits",
    "sourcePage": 96,
    "textPtBr": "Dobre a quantidade de dados de dano do ataque em crítico, inclusive dados extras envolvidos; adicione modificadores fixos normalmente.",
    "textTreatment": "adapted-paraphrase",
    "facts": {
      "damageDiceMultiplier": 2,
      "fixedModifierMultiplier": 1
    },
    "version": "1.0.0",
    "sourceCheckedOn": "2026-11-23",
    "status": "in-review",
    "relatedIds": []
  },
  {
    "id": "srd-51-resistance-vulnerability",
    "sourceId": "wotc-srd-51-en",
    "edition": "srd-5.1",
    "category": "damage",
    "titlePtBr": "Resistência e vulnerabilidade (2014)",
    "sourceSection": "Combat > Damage and Healing > Damage Resistance and Vulnerability",
    "sourcePage": 97,
    "textPtBr": "Reduções e bônus são aplicados antes de Resistência e Vulnerabilidade. Resistência divide o dano por dois; Vulnerabilidade multiplica por dois. Não acumulam por tipo.",
    "textTreatment": "adapted-paraphrase",
    "facts": {
      "resistanceDivisor": 2,
      "vulnerabilityMultiplier": 2,
      "stackable": false
    },
    "version": "1.0.0",
    "sourceCheckedOn": "2026-11-23",
    "status": "in-review",
    "relatedIds": []
  }
] as const;
