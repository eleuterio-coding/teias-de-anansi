/**
 * Etapa 4.02: metadados públicos de fontes de D&D.
 *
 * NÃO contém textos de livros comerciais, personagens, campanhas ou dados privados.
 * "edition" representa a LINHAGEM de regras aprovada em 4.01, não a licença
 * da obra nem uma afirmação de que o livro inteiro integra o SRD.
 * Adicionar conteúdo de regras é responsabilidade dos itens 4.03 e 4.14.
 */

export type RulesReference = 'srd-5.2.1' | 'srd-5.1';
export type SourceType = 'srd' | 'core-rulebook' | 'supplement' | 'setting' | 'other';
export type SourceUsage = 'baseline' | 'legacy' | 'reference-candidate';
export type SourceReviewStatus = 'draft' | 'in-review' | 'approved' | 'rejected';
export type SourceLanguage = 'en' | 'pt-BR' | 'es';

export type SourceRights =
  | {
      kind: 'cc-by-4.0';
      licenseUrl: string;
      attribution: string;
      permittedUse: 'reuse-with-attribution';
    }
  | {
      kind: 'reference-only';
      permittedUse: 'metadata-and-link-only';
      rightsHolder: string;
    };

export interface RpgSource {
  /** ID permanente: nunca reaproveitar após exclusão de uma fonte. */
  id: string;
  title: string;
  /** Linhagem de regras (4.01), não licença editorial do livro. */
  edition: RulesReference;
  /** Ano desta publicação/versão específica, não da primeira edição de D&D. */
  year: number;
  language: SourceLanguage;
  sourceType: SourceType;
  usage: SourceUsage;
  version: string;
  origin: {
    publisher: string;
    officialUrl: string;
  };
  rights: SourceRights;
  reviewStatus: SourceReviewStatus;
  /** Preenchidos somente após aceite efetivo e rastreável do Mestre. */
  reviewedBy?: string;
  reviewedOn?: string;
  metadataCheckedOn: string;
  note?: string;
}

const WOTC = 'Wizards of the Coast LLC';
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';

export const RPG_SOURCE_CATALOG: readonly RpgSource[] = [
  {
    id: 'wotc-srd-521-en',
    title: 'System Reference Document 5.2.1',
    edition: 'srd-5.2.1',
    year: 2025,
    language: 'en',
    sourceType: 'srd',
    usage: 'baseline',
    version: '5.2.1',
    origin: {
      publisher: WOTC,
      officialUrl: 'https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf',
    },
    rights: {
      kind: 'cc-by-4.0',
      licenseUrl: LICENSE,
      attribution: 'System Reference Document 5.2.1 — Wizards of the Coast LLC (CC BY 4.0)',
      permittedUse: 'reuse-with-attribution',
    },
    reviewStatus: 'in-review',
    metadataCheckedOn: '2026-11-23',
    note: 'Referência principal. Metadados e licença verificados; extração de regras ainda não autorizada por este cadastro.',
  },
  {
    id: 'wotc-srd-51-en',
    title: 'System Reference Document 5.1',
    edition: 'srd-5.1',
    year: 2023,
    language: 'en',
    sourceType: 'srd',
    usage: 'legacy',
    version: '5.1 (publicação sob CC BY 4.0 em 2023)',
    origin: {
      publisher: WOTC,
      officialUrl: 'https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf',
    },
    rights: {
      kind: 'cc-by-4.0',
      licenseUrl: LICENSE,
      attribution: 'System Reference Document 5.1 — Wizards of the Coast LLC (CC BY 4.0)',
      permittedUse: 'reuse-with-attribution',
    },
    reviewStatus: 'in-review',
    metadataCheckedOn: '2026-11-23',
    note: 'Referência legada de D&D 2014. Ano indica a publicação desta versão sob Creative Commons.',
  },
  {
    id: 'wotc-phb-2024-en',
    title: "Player's Handbook (2024)",
    edition: 'srd-5.2.1',
    year: 2024,
    language: 'en',
    sourceType: 'core-rulebook',
    usage: 'reference-candidate',
    version: '2024',
    origin: { publisher: WOTC, officialUrl: 'https://www.dndbeyond.com/sources/dnd/phb-2024' },
    rights: { kind: 'reference-only', rightsHolder: WOTC, permittedUse: 'metadata-and-link-only' },
    reviewStatus: 'draft',
    metadataCheckedOn: '2026-11-23',
    note: 'Livro comercial associado à linhagem 2024; não confundir seu texto integral com o SRD 5.2.1.',
  },
  {
    id: 'wotc-dmg-2024-en',
    title: "Dungeon Master's Guide (2024)",
    edition: 'srd-5.2.1',
    year: 2024,
    language: 'en',
    sourceType: 'core-rulebook',
    usage: 'reference-candidate',
    version: '2024',
    origin: { publisher: WOTC, officialUrl: 'https://www.dndbeyond.com/sources/dnd/dmg-2024' },
    rights: { kind: 'reference-only', rightsHolder: WOTC, permittedUse: 'metadata-and-link-only' },
    reviewStatus: 'draft',
    metadataCheckedOn: '2026-11-23',
  },
  {
    id: 'wotc-mm-2025-en',
    title: 'Monster Manual (2025)',
    edition: 'srd-5.2.1',
    year: 2025,
    language: 'en',
    sourceType: 'core-rulebook',
    usage: 'reference-candidate',
    version: '2025',
    origin: { publisher: WOTC, officialUrl: 'https://www.dndbeyond.com/sources/dnd/mm-2024' },
    rights: { kind: 'reference-only', rightsHolder: WOTC, permittedUse: 'metadata-and-link-only' },
    reviewStatus: 'draft',
    metadataCheckedOn: '2026-11-23',
    note: 'A URL do D&D Beyond termina em mm-2024; o ano da publicação comercial é 2025.',
  },
  {
    id: 'wotc-phb-2014-en',
    title: "Player's Handbook (2014)",
    edition: 'srd-5.1',
    year: 2014,
    language: 'en',
    sourceType: 'core-rulebook',
    usage: 'reference-candidate',
    version: '2014',
    origin: { publisher: WOTC, officialUrl: 'https://www.dndbeyond.com/sources/dnd/phb-2014' },
    rights: { kind: 'reference-only', rightsHolder: WOTC, permittedUse: 'metadata-and-link-only' },
    reviewStatus: 'draft',
    metadataCheckedOn: '2026-11-23',
  },
  {
    id: 'wotc-dmg-2014-en',
    title: "Dungeon Master's Guide (2014)",
    edition: 'srd-5.1',
    year: 2014,
    language: 'en',
    sourceType: 'core-rulebook',
    usage: 'reference-candidate',
    version: '2014',
    origin: { publisher: WOTC, officialUrl: 'https://www.dndbeyond.com/sources/dnd/dmg-2014' },
    rights: { kind: 'reference-only', rightsHolder: WOTC, permittedUse: 'metadata-and-link-only' },
    reviewStatus: 'draft',
    metadataCheckedOn: '2026-11-23',
  },
  {
    id: 'wotc-mm-2014-en',
    title: 'Monster Manual (2014)',
    edition: 'srd-5.1',
    year: 2014,
    language: 'en',
    sourceType: 'core-rulebook',
    usage: 'reference-candidate',
    version: '2014',
    origin: { publisher: WOTC, officialUrl: 'https://www.dndbeyond.com/sources/dnd/mm-2014' },
    rights: { kind: 'reference-only', rightsHolder: WOTC, permittedUse: 'metadata-and-link-only' },
    reviewStatus: 'draft',
    metadataCheckedOn: '2026-11-23',
  },
];

/** Recupera uma fonte sem alterar a coleção original. */
export function getRpgSource(
  id: string,
  sources: readonly RpgSource[] = RPG_SOURCE_CATALOG,
): RpgSource | undefined {
  return sources.find((source) => source.id === id);
}

export interface SourceCatalogFilter {
  query?: string;
  edition?: RulesReference;
  language?: SourceLanguage;
  sourceType?: SourceType;
  usage?: SourceUsage;
  rights?: SourceRights['kind'];
  reviewStatus?: SourceReviewStatus;
}

/** Busca simples por metadados; a busca global por itens de jogo será criada em 4.10. */
export function listRpgSources(
  filter: SourceCatalogFilter = {},
  sources: readonly RpgSource[] = RPG_SOURCE_CATALOG,
): RpgSource[] {
  const normalize = (value: string): string =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR')
      .trim();
  const query = normalize(filter.query ?? '');
  return sources
    .filter((source) => {
      if (filter.edition && source.edition !== filter.edition) return false;
      if (filter.language && source.language !== filter.language) return false;
      if (filter.sourceType && source.sourceType !== filter.sourceType) return false;
      if (filter.usage && source.usage !== filter.usage) return false;
      if (filter.rights && source.rights.kind !== filter.rights) return false;
      if (filter.reviewStatus && source.reviewStatus !== filter.reviewStatus) return false;
      return normalize(
        [source.title, source.id, source.version, source.origin.publisher].join(' '),
      ).includes(query);
    })
    .sort(
      (a, b) =>
        a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' }) ||
        a.id.localeCompare(b.id),
    );
}

/**
 * A permissão legal não substitui a aprovação editorial do Mestre.
 * O item 4.03 ainda definirá o processo de extração/atribuição/controle de versões.
 */
export function canExtractSourceText(source: RpgSource): boolean {
  return (
    source.reviewStatus === 'approved' &&
    source.rights.kind === 'cc-by-4.0' &&
    Boolean(source.reviewedBy?.trim()) &&
    Boolean(source.reviewedOn)
  );
}

export interface SourceCatalogIssue {
  code:
    | 'duplicate-id'
    | 'duplicate-edition-title'
    | 'missing-required'
    | 'invalid-year'
    | 'invalid-url'
    | 'missing-license'
    | 'approval-without-review';
  sourceId: string;
  detail: string;
}

/** Auditoria de metadados para 4.02; NÃO substitui a auditoria de conteúdos do item 4.14. */
export function auditRpgSources(
  sources: readonly RpgSource[] = RPG_SOURCE_CATALOG,
): SourceCatalogIssue[] {
  const issues: SourceCatalogIssue[] = [];
  const ids = new Set<string>();
  const titles = new Set<string>();
  for (const source of sources) {
    const add = (code: SourceCatalogIssue['code'], detail: string) =>
      issues.push({ code, sourceId: source.id, detail });
    if (ids.has(source.id)) add('duplicate-id', 'Identificador duplicado');
    ids.add(source.id);
    const key = [source.edition, source.language, source.title.toLocaleLowerCase('en')].join('|');
    if (titles.has(key))
      add('duplicate-edition-title', 'Título duplicado na mesma edição e idioma');
    titles.add(key);
    if (
      ![
        source.id,
        source.title,
        source.version,
        source.language,
        source.origin.publisher,
        source.metadataCheckedOn,
      ].every((value) => typeof value === 'string' && value.trim().length > 0)
    )
      add('missing-required', 'Campo textual obrigatório vazio');
    if (!Number.isInteger(source.year) || source.year < 1974 || source.year > 2100) {
      add('invalid-year', 'Ano da publicação inválido');
    }
    try {
      if (new URL(source.origin.officialUrl).protocol !== 'https:')
        add('invalid-url', 'Fonte exige HTTPS');
    } catch {
      add('invalid-url', 'Endereço de origem inválido');
    }
    if (
      source.rights.kind === 'cc-by-4.0' &&
      (!source.rights.attribution.trim() || source.rights.licenseUrl !== LICENSE)
    ) {
      add('missing-license', 'Fonte CC BY 4.0 requer atribuição e URL da licença');
    }
    if (source.reviewStatus === 'approved' && (!source.reviewedBy?.trim() || !source.reviewedOn)) {
      add('approval-without-review', 'Aprovação exige revisor e data registrados');
    }
  }
  return issues;
}
