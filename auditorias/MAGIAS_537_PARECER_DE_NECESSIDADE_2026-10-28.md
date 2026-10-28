
# Auditoria independente — 537 magias do Teias de Anansi

**Data:** 28/10/2026  
**Escopo:** catálogo congelado em `dados/magias-catalogo.json` (branch `main` no momento da coleta), `magias.html`, `scripts/character-builder/spells.js`, `scripts/character-builder/spell-progression-rules.js` e `scripts/concentracao-expandida-selos.js`.  
**Natureza:** análise documental estática. Nenhum registro ou regra do Hub foi alterado. Não foi testado lançamento de cada magia durante uma sessão real.

## Critério de decisão

A classificação diz se a **fonte é necessária para a cobertura editorial do Hub**; não julga se a magia é forte, se algum personagem a escolheu ou se deve ser preparada em determinada campanha. Uma magia de 9º nível pode ser parte indispensável do catálogo-base, embora não seja selecionável por um personagem de baixo nível.

- **ESSENCIAL — base 5.5e:** 391 entradas PHB 2024. Manter no núcleo, respeitando classe, nível e direitos da fonte.
- **CONDICIONAL — legado oficial 5e:** 96 entradas. Manter com filtro por origem/legado; não impor automaticamente a um personagem 5.5e.
- **CONDICIONAL — suplemento oficial 5.5e:** 20 entradas. Ativar conforme suplemento habilitado.
- **OPCIONAL — terceiro:** 3 entradas de Quickstone. Dependem de habilitação pelo Mestre.
- **DOCUMENTAL — terceiro incompleto:** 27 entradas L'Arsène. Sem classes e sem parâmetros publicáveis para uso autônomo. Preservar metadados, não habilitar na seleção de personagens sem implementação validada.

## Resumo quantitativo

| Grupo | Total |
|---|---:|
| ESSENCIAL — base 5.5e | 391 |
| CONDICIONAL — legado oficial 5e | 96 |
| DOCUMENTAL — terceiro incompleto | 27 |
| CONDICIONAL — suplemento oficial 5.5e | 20 |
| OPCIONAL — terceiro com classe | 3 |
| **Total** | **537** |

**Completude:** 339 completo_aberto; 171 stats_completos_resumo; 27 metadados_protegidos.  
**Concentração Expandida:** 285 SC; 121 NC; 33 CZ; 29 CL; 27 INDETERMINADA; 25 CM; 17 CI.

## Principais correções necessárias

1. **121 magias concentradas estão em CE = NC**, pendentes da classificação da Regra da Casa. Não há base suficiente para atribuir categoria apenas pelo nome, pela escola ou pelo efeito presumido; validar individualmente.
2. **27 magias têm concentração e ritual não informados**. O código de selos usa `record.concentracao !== true` para atribuir `SC`; isso confunde desconhecido com “Sem Concentração”. Corrigir a condição e apresentar estado indeterminado.
3. **52 magias do PHB 2024 não têm descrição integral no catálogo**; a referência à fonte pode ser suficiente editorialmente, mas o resumo não garante resolução da mecânica em jogo.
4. **27 magias de L'Arsène não possuem classe associada**; o construtor filtra magias por classe, de modo que esses registros não são candidatos normais. Devem continuar bibliográficos/opt-in e não ganhar classes inventadas.
5. **534 de 537 nomes ainda aparecem em inglês** na coluna `nome`; somente Curar Ferimentos, Mísseis Mágicos e Bola de Fogo estão explicitamente localizados. Priorizar PT-BR, mantendo o nome original como dado de proveniência.
6. **20 versões anteriores** possuem referência documental de substituição em `versoes_anteriores_descartadas`; preservar a informação, sem republicar o mesmo nome como duplicata ativa.
7. **A seleção de magias do construtor usa a lista de classes e o nível**, mas não há filtro explícito por origem do suplemento no método `spellProgressionCandidates`. A política de conteúdo precisa ser implementada no momento da seleção, não só na Biblioteca.

## 52 magias do núcleo com texto resumido

- 1. Blade Ward (nível 0) — CE pendente
- 12. Friends (nível 0) — CE pendente
- 13. Mind Sliver (nível 0)
- 29. Thunderclap (nível 0)
- 30. Word of Radiance (nível 0)
- 36. Toll the Dead (nível 0)
- 52. Thorn Whip (nível 0)
- 55. Armor of Agathys (nível 1)
- 75. Arms of Hadar (nível 1)
- 82. Hail of Thorns (nível 1)
- 91. Compelled Duel (nível 1)
- 111. Thunderous Smite (nível 1)
- 113. Witch Bolt (nível 1) — CE pendente
- 122. Wrathful Smite (nível 1)
- 134. Arcane Vigor (nível 2)
- 143. Beast Sense (nível 2)
- 153. Cloud of Daggers (nível 2)
- 161. Summon Beast (nível 2)
- 165. Crown of Madness (nível 2)
- 198. Cordon of Arrows (nível 2)
- 216. Aura of Vitality (nível 3) — CE pendente
- 235. Conjure Barrage (nível 3)
- 238. Hunger of Hadar (nível 3)
- 242. Summon Fey (nível 3)
- 251. Blinding Smite (nível 3)
- 254. Crusader's Mantle (nível 3) — CE pendente
- 270. Feign Death (nível 3)
- 275. Summon Undead (nível 3)
- 278. Elemental Weapon (nível 3) — CE pendente
- 284. Lightning Arrow (nível 3)
- 294. Aura of Purity (nível 4) — CE pendente
- 311. Grasping Vine (nível 4) — CE pendente
- 316. Summon Aberration (nível 4)
- 317. Summon Construct (nível 4)
- 318. Summon Elemental (nível 4)
- 326. Staggering Smite (nível 4)
- 328. Fount of Moonlight (nível 4) — CE pendente
- 350. Circle of Power (nível 5) — CE pendente
- 363. Banishing Smite (nível 5) — CE pendente
- 366. Conjure Volley (nível 5)
- 371. Steel Wind Strike (nível 5)
- 372. Summon Celestial (nível 5)
- 380. Synaptic Static (nível 5)
- 381. Yolande's Regal Presence (nível 5) — CE pendente
- 385. Destructive Wave (nível 5)
- 390. Jallarzi's Storm of Radiance (nível 5) — CE pendente
- 413. Swift Quiver (nível 5) — CE pendente
- 426. Arcane Gate (nível 6) — CE pendente
- 432. Summon Fiend (nível 6)
- 433. Tasha's Bubbling Cauldron (nível 6)
- 475. Power Word Fortify (nível 7)
- 497. Telepathy (nível 8)

## 27 entradas de terceiros atualmente documentais (não elegíveis automaticamente)

- 6. Pins & Needles (nível 0; Biomancia)
- 19. Flare (nível 0; Evocação)
- 74. Chameleon Skin (nível 1; Biomancia)
- 92. Daydream (nível 1; Encantamento)
- 98. Words of Discouragement (nível 1; Encantamento)
- 139. Protection (nível 2; Abjuração)
- 150. Blood Frenzy (nível 2; Biomancia)
- 151. Coralskin (nível 2; Biomancia)
- 152. Sugar Rush (nível 2; Biomancia)
- 176. Lightning Wave (nível 2; Evocação)
- 210. Riptide (nível 2; Transmutação)
- 230. Flesh to Bone (nível 3; Biomancia)
- 231. The Bends (nível 3; Biomancia)
- 232. Acid Rain (nível 3; Conjuração)
- 250. Enrage (nível 3; Encantamento)
- 256. Depth Charge (nível 3; Evocação)
- 292. Aura of Impurity (nível 4; Abjuração)
- 314. Living Candle (nível 4; Conjuração)
- 325. Humperdink’s Irresistible Revelry (nível 4; Encantamento)
- 333. Stunbolt (nível 4; Evocação)
- 362. Bone Cage (nível 5; Biomancia)
- 370. Purple Rain (nível 5; Conjuração)
- 387. Gravity Smash (nível 5; Evocação)
- 402. Endure (nível 5; Necromancia)
- 425. Lungburst (nível 6; Biomancia)
- 450. Crimson Death (nível 6; Necromancia)
- 514. Field of Bones (nível 8; Necromancia)

## Limites da auditoria

A tabela CSV ligada a este parecer contém **uma linha por magia**, com classe, nível, fonte, versão, completude, categoria de Concentração Expandida, pendências, substituições documentadas e decisão. Esta é uma análise editorial e de dados, não uma revisão independente dos 537 textos completos das publicações, nem uma verificação de escolhas realizadas por jogadores reais. É incorreto interpretar “essencial” como “obrigatória para todos os personagens”.
