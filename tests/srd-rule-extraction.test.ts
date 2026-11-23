import { describe, expect, it } from 'vitest';
import { RPG_SOURCE_CATALOG, type RpgSource } from '../src/data/rpg-source-catalog';
import { SRD_LICENSE_NOTICES, findSrdLicenseNotice } from '../src/data/srd-license-notices';
import { auditRuleExtracts, getApprovedRuleExtract } from '../src/data/srd-rule-audit';
import { SRD_RULE_EXTRACTS, type SrdRuleExtract } from '../src/data/srd-rule-extracts';

const rule = SRD_RULE_EXTRACTS[0];
const get = (id: string) => SRD_RULE_EXTRACTS.find((item) => item.id === id);

describe('Etapa 4.03 — extração rastreável do SRD', () => {
  it('possui 20 registros em português derivados de duas fontes abertas', () => {
    expect(SRD_RULE_EXTRACTS).toHaveLength(20);
    expect(SRD_RULE_EXTRACTS.filter((item) => item.edition === 'srd-5.2.1')).toHaveLength(14);
    expect(SRD_RULE_EXTRACTS.filter((item) => item.edition === 'srd-5.1')).toHaveLength(6);
    expect(SRD_RULE_EXTRACTS.every((item) => item.textTreatment === 'adapted-paraphrase')).toBe(
      true,
    );
  });

  it('cada registro preserva fonte, seção, página, versão e estado de revisão', () => {
    expect(
      SRD_RULE_EXTRACTS.every(
        (item) =>
          Boolean(item.sourceId && item.sourceSection && item.titlePtBr && item.version) &&
          item.sourcePage > 0 &&
          item.status === 'in-review',
      ),
    ).toBe(true);
  });

  it('não permite que os registros extraídos sejam usados como regras aprovadas', () => {
    expect(SRD_RULE_EXTRACTS.every((item) => getApprovedRuleExtract(item.id) === undefined)).toBe(
      true,
    );
  });

  it('não extrai qualquer texto de livros comerciais', () => {
    expect(
      SRD_RULE_EXTRACTS.every(
        (item) =>
          RPG_SOURCE_CATALOG.find((source) => source.id === item.sourceId)?.rights.kind ===
          'cc-by-4.0',
      ),
    ).toBe(true);
  });

  it('mantém atribuicões oficiais distintas para os dois SRDs', () => {
    expect(SRD_LICENSE_NOTICES).toHaveLength(2);
    expect(
      SRD_LICENSE_NOTICES.every(
        (notice) =>
          notice.officialAttribution.includes('Wizards of the Coast LLC') &&
          notice.officialAttribution.includes('creativecommons.org/licenses/by/4.0/legalcode') &&
          notice.adaptationNotice.includes('não são uma tradução oficial'),
      ),
    ).toBe(true);
    expect(findSrdLicenseNotice('wotc-srd-521-en')?.sourceUrl).toBe(
      'https://www.dndbeyond.com/srd',
    );
    expect(findSrdLicenseNotice('wotc-phb-2024-en')).toBeUndefined();
  });

  it('a auditoria inicial do lote não acusa erros estruturais', () => {
    expect(auditRuleExtracts()).toEqual([]);
  });

  it('verifica modificadores e limites extraídos da tabela', () => {
    expect(get('srd-521-ability-modifier')?.facts).toMatchObject({
      minimumScore: 1,
      maximumScore: 30,
      referenceModifier: 0,
      score30Modifier: 10,
    });
    expect(get('srd-51-ability-modifier')?.facts).toMatchObject({ score30Modifier: 10 });
  });

  it('verifica faixas de proficiência de personagens sem confundir ND alto', () => {
    expect(get('srd-521-proficiency-character')?.facts).toEqual({
      levels1to4: 2,
      levels5to8: 3,
      levels9to12: 4,
      levels13to16: 5,
      levels17to20: 6,
    });
  });

  it('registra valores específicos e conflito de Vantagem e Desvantagem', () => {
    expect(get('srd-521-difficulty-classes')?.facts).toMatchObject({
      veryEasy: 5,
      easy: 10,
      medium: 15,
      hard: 20,
      veryHard: 25,
      nearlyImpossible: 30,
    });
    expect(get('srd-521-advantage')?.facts).toMatchObject({ opposingCancel: true, diceCount: 2 });
  });

  it('mantém 1 e 20 naturais restritos ao contexto de ataques', () => {
    expect(get('srd-521-natural-1-attack')?.facts).toMatchObject({
      naturalRoll: 1,
      automaticMiss: true,
    });
    expect(get('srd-521-natural-20-attack')?.facts).toMatchObject({
      naturalRoll: 20,
      critical: true,
    });
    expect(get('srd-521-d20-test')?.textPtBr).toContain('salvaguardas');
  });

  it('confere a ordem dos ajustes de dano com exemplo numérico da fonte', () => {
    const facts = get('srd-521-damage-order')?.facts;
    expect(facts).toMatchObject({
      startingDamage: 28,
      flatReduction: 5,
      afterResistance: 11,
      afterVulnerability: 22,
    });
    expect(Math.floor((28 - 5) / 2) * 2).toBe(22);
  });

  it('a duplicação de registros é detectada dentro da mesma edição', () => {
    const codes = auditRuleExtracts([rule, { ...rule }]).map((issue) => issue.code);
    expect(codes).toContain('duplicate-id');
    expect(codes).toContain('duplicate-section-title');
    const alternativeEdition: SrdRuleExtract = {
      ...rule,
      id: 'srd-51-nova-edicao',
      edition: 'srd-5.1',
      sourceId: 'wotc-srd-51-en',
    };
    expect(auditRuleExtracts([rule, alternativeEdition])).toEqual([]);
  });

  it('detecta fonte ausente ou de edição errada', () => {
    expect(auditRuleExtracts([{ ...rule, sourceId: 'inexistente' }])[0]?.code).toBe(
      'missing-source',
    );
    expect(auditRuleExtracts([{ ...rule, sourceId: 'wotc-srd-51-en' }])[0]?.code).toBe(
      'edition-mismatch',
    );
  });

  it('bloqueia uso de texto derivado de livro comercial mesmo com revisão', () => {
    const commercial: SrdRuleExtract = { ...rule, sourceId: 'wotc-phb-2024-en' };
    const codes = auditRuleExtracts([commercial]).map((issue) => issue.code);
    expect(codes).toContain('source-license-denied');
  });

  it('rejeita campos vazios, fatos inválidos e relacionamentos quebrados', () => {
    const broken: SrdRuleExtract = {
      ...rule,
      sourceSection: ' ',
      sourcePage: 0,
      facts: { anomaly: Number.NaN },
      relatedIds: ['srd-inexistente', rule.id],
    };
    expect(auditRuleExtracts([broken]).map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'missing-reference',
        'invalid-fact',
        'unresolved-relation',
        'self-reference',
      ]),
    );
  });

  it('não confunde aprovação do catálogo 4.02 com aprovação de regra individual', () => {
    const approved: SrdRuleExtract = {
      ...rule,
      status: 'approved',
      approvedBy: 'Mestre',
      approvedOn: '2026-11-23',
    };
    expect(auditRuleExtracts([approved]).map((issue) => issue.code)).toContain(
      'source-not-approved',
    );
    expect(getApprovedRuleExtract(approved.id, [approved])).toBeUndefined();
  });

  it('aceita regra apenas com fonte editorialmente validada e aceite individual', () => {
    const approvedRule: SrdRuleExtract = {
      ...rule,
      status: 'approved',
      approvedBy: 'Mestre',
      approvedOn: '2026-11-23',
    };
    const sources: RpgSource[] = RPG_SOURCE_CATALOG.map((source) =>
      source.id === approvedRule.sourceId
        ? { ...source, reviewStatus: 'approved', reviewedBy: 'Mestre', reviewedOn: '2026-11-23' }
        : source,
    );
    expect(auditRuleExtracts([approvedRule], sources)).toEqual([]);
    expect(getApprovedRuleExtract(approvedRule.id, [approvedRule], sources)?.id).toBe(
      approvedRule.id,
    );
  });
});
