import { RPG_SOURCE_CATALOG, type RpgSource } from './rpg-source-catalog';
import { SRD_LICENSE_NOTICES } from './srd-license-notices';
import { SRD_RULE_EXTRACTS, type SrdRuleExtract } from './srd-rule-extracts';

export interface RuleExtractIssue {
  code:
    | 'duplicate-id'
    | 'duplicate-section-title'
    | 'missing-source'
    | 'edition-mismatch'
    | 'source-license-denied'
    | 'missing-attribution'
    | 'missing-reference'
    | 'invalid-fact'
    | 'unresolved-relation'
    | 'self-reference'
    | 'approval-without-review'
    | 'source-not-approved';
  ruleId: string;
  detail: string;
}

export function auditRuleExtracts(
  entries: readonly SrdRuleExtract[] = SRD_RULE_EXTRACTS,
  sources: readonly RpgSource[] = RPG_SOURCE_CATALOG,
): RuleExtractIssue[] {
  const result: RuleExtractIssue[] = [];
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const ids = new Set<string>();
  const titles = new Set<string>();
  const entryIds = new Set(entries.map((entry) => entry.id));
  const add = (ruleId: string, code: RuleExtractIssue['code'], detail: string) =>
    result.push({ ruleId, code, detail });

  for (const entry of entries) {
    if (ids.has(entry.id)) add(entry.id, 'duplicate-id', 'Identificador repetido');
    ids.add(entry.id);

    const semanticKey = [entry.edition, entry.sourceSection, entry.titlePtBr]
      .map((value) => value.normalize('NFD').toLowerCase().trim())
      .join('|');
    if (titles.has(semanticKey)) {
      add(entry.id, 'duplicate-section-title', 'Título repetido dentro da mesma seção e edição');
    }
    titles.add(semanticKey);

    const source = sourceById.get(entry.sourceId);
    if (!source) {
      add(entry.id, 'missing-source', 'Fonte não encontrada no catálogo do item 4.02');
    } else {
      if (source.edition !== entry.edition) {
        add(entry.id, 'edition-mismatch', 'Edição diverge da fonte catalogada');
      }
      if (source.rights.kind !== 'cc-by-4.0') {
        add(entry.id, 'source-license-denied', 'Livro sem autorização para texto derivado');
      }
      if (!SRD_LICENSE_NOTICES.some((notice) => notice.sourceId === source.id)) {
        add(entry.id, 'missing-attribution', 'Não existe aviso completo de atribuição');
      }
      if (entry.status === 'approved' && source.reviewStatus !== 'approved') {
        add(entry.id, 'source-not-approved', 'Fonte ainda não recebeu revisão editorial');
      }
    }

    if (!entry.id.trim() || !entry.titlePtBr.trim() || !entry.sourceSection.trim() ||
      !entry.textPtBr.trim() || !entry.version.trim() || !entry.sourceCheckedOn.trim() ||
      !Number.isInteger(entry.sourcePage) || entry.sourcePage < 1) {
      add(entry.id, 'missing-reference', 'Registro incompleto ou página inválida');
    }

    if (!Object.values(entry.facts).every((value) =>
      typeof value === 'string' || typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value)))) {
      add(entry.id, 'invalid-fact', 'Fato estruturado inválido ou não finito');
    }

    if (entry.status === 'approved' && (!entry.approvedBy?.trim() || !entry.approvedOn)) {
      add(entry.id, 'approval-without-review', 'Aceite individual exige data e responsável');
    }

    for (const reference of entry.relatedIds) {
      if (reference === entry.id) add(entry.id, 'self-reference', 'Autorreferência indevida');
      else if (!entryIds.has(reference)) {
        add(entry.id, 'unresolved-relation', `Referência inexistente: ${reference}`);
      }
    }
  }

  return result;
}

/**
 * As regras em revisão podem ser consultadas com aviso, mas nunca devem
 * alimentar o motor normativo de 4.12 ou operações dos personagens.
 */
export function getApprovedRuleExtract(
  id: string,
  entries: readonly SrdRuleExtract[] = SRD_RULE_EXTRACTS,
  sources: readonly RpgSource[] = RPG_SOURCE_CATALOG,
): SrdRuleExtract | undefined {
  const found = entries.find((entry) => entry.id === id);
  if (!found || found.status !== 'approved' || !found.approvedBy?.trim() || !found.approvedOn) {
    return undefined;
  }
  if (auditRuleExtracts(entries, sources).some((issue) => issue.ruleId === found.id)) return undefined;
  return found;
}
