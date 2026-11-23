import { describe, expect, it } from 'vitest';
import {
  RPG_SOURCE_CATALOG,
  auditRpgSources,
  canExtractSourceText,
  getRpgSource,
  listRpgSources,
  type RpgSource,
} from '../src/data/rpg-source-catalog';

const sample = RPG_SOURCE_CATALOG[0];

describe('Etapa 4.02 — Catálogo de fontes RPG', () => {
  it('possui oito referências oficiais catalogadas com origem e edição', () => {
    expect(RPG_SOURCE_CATALOG).toHaveLength(8);
    expect(RPG_SOURCE_CATALOG.every((source) => source.origin.officialUrl.startsWith('https://'))).toBe(true);
    expect(RPG_SOURCE_CATALOG.every((source) => source.language === 'en')).toBe(true);
    expect(RPG_SOURCE_CATALOG.map((source) => source.edition).sort()).toContain('srd-5.2.1');
    expect(RPG_SOURCE_CATALOG.map((source) => source.edition).sort()).toContain('srd-5.1');
  });

  it('distingue os dois SRDs CC BY 4.0 dos livros comerciais', () => {
    expect(RPG_SOURCE_CATALOG.filter((source) => source.rights.kind === 'cc-by-4.0')).toHaveLength(2);
    expect(RPG_SOURCE_CATALOG.filter((source) => source.rights.kind === 'reference-only')).toHaveLength(6);
    expect(RPG_SOURCE_CATALOG.filter((source) => source.usage === 'baseline')).toHaveLength(1);
    expect(RPG_SOURCE_CATALOG.filter((source) => source.usage === 'legacy')).toHaveLength(1);
  });

  it('não declara nenhuma fonte aprovada antes do aceite do Mestre', () => {
    expect(RPG_SOURCE_CATALOG.every((source) => source.reviewStatus !== 'approved')).toBe(true);
    expect(RPG_SOURCE_CATALOG.every((source) => !canExtractSourceText(source))).toBe(true);
  });

  it('localiza uma fonte por identificador estável', () => {
    expect(getRpgSource('wotc-srd-521-en')?.version).toBe('5.2.1');
    expect(getRpgSource('nao-existe')).toBeUndefined();
  });

  it('combina edição, tipo, direito e estado de revisão', () => {
    const result = listRpgSources({
      edition: 'srd-5.2.1',
      sourceType: 'srd',
      rights: 'cc-by-4.0',
      reviewStatus: 'in-review',
      language: 'en',
    });
    expect(result.map((item) => item.id)).toEqual(['wotc-srd-521-en']);
  });

  it('busca por nome sem diferenciar caixa e acentos', () => {
    expect(listRpgSources({ query: 'DUNGEON' })).toHaveLength(2);
    expect(listRpgSources({ query: 'REFERENCE DOCUMENT' })).toHaveLength(2);
    expect(listRpgSources({ query: 'wotc-phb-2014-en' })[0]?.year).toBe(2014);
  });

  it('retorna lista ordenada sem modificar a lista original', () => {
    const snapshot = RPG_SOURCE_CATALOG.map((item) => item.id);
    const first = listRpgSources();
    expect(first).toHaveLength(8);
    expect(first[0]?.title).toBe("Dungeon Master's Guide (2014)");
    expect(RPG_SOURCE_CATALOG.map((item) => item.id)).toEqual(snapshot);
  });

  it('a auditoria inicial não contém problemas estruturais', () => {
    expect(auditRpgSources()).toEqual([]);
  });

  it('a auditoria detecta identificador e título duplicados', () => {
    const issues = auditRpgSources([sample, { ...sample }]);
    expect(issues.map((issue) => issue.code)).toContain('duplicate-id');
    expect(issues.map((issue) => issue.code)).toContain('duplicate-edition-title');
  });

  it('a auditoria detecta campos vazios, anos e URLs inválidos', () => {
    const broken: RpgSource = {
      ...sample,
      title: ' ',
      year: 1900,
      origin: { ...sample.origin, officialUrl: 'http://example.com' },
    };
    const codes = auditRpgSources([broken]).map((issue) => issue.code);
    expect(codes).toContain('missing-required');
    expect(codes).toContain('invalid-year');
    expect(codes).toContain('invalid-url');
  });

  it('exige licença e atribuição no cadastro CC BY 4.0', () => {
    if (sample.rights.kind !== 'cc-by-4.0') throw new Error('Fixture incorreta');
    const broken: RpgSource = {
      ...sample,
      rights: { ...sample.rights, attribution: '' },
    };
    expect(auditRpgSources([broken]).map((issue) => issue.code)).toContain('missing-license');
  });

  it('não permite aprovação sem revisor e data', () => {
    const approvedWithoutEvidence: RpgSource = { ...sample, reviewStatus: 'approved' };
    expect(auditRpgSources([approvedWithoutEvidence]).map((issue) => issue.code)).toContain(
      'approval-without-review',
    );
    expect(canExtractSourceText(approvedWithoutEvidence)).toBe(false);
  });

  it('só autoriza extração quando a licença e o aceite foram registrados', () => {
    const approvedOpen: RpgSource = {
      ...sample,
      reviewStatus: 'approved',
      reviewedBy: 'Mestre',
      reviewedOn: '2026-11-23',
    };
    expect(auditRpgSources([approvedOpen])).toEqual([]);
    expect(canExtractSourceText(approvedOpen)).toBe(true);
    const commercial = RPG_SOURCE_CATALOG.find((item) => item.rights.kind === 'reference-only');
    if (!commercial) throw new Error('Livro comercial não encontrado');
    expect(
      canExtractSourceText({
        ...commercial,
        reviewStatus: 'approved',
        reviewedBy: 'Mestre',
        reviewedOn: '2026-11-23',
      }),
    ).toBe(false);
  });
});
