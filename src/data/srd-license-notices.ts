/**
 * Avisos de atribuição das fontes oficialmente publicadas sob CC BY 4.0.
 * Reproduzidos da seção "Legal Information" dos dois PDFs oficiais.
 * As descrições em pt-BR dos registros foram adaptadas; NÃO são tradução oficial.
 *
 * TODO (4.05/4.09): exibir o aviso correspondente sempre que o Hub apresentar
 * texto derivado. Ainda não há página publicada para estas regras.
 */
import type { RulesReference } from './rpg-source-catalog';

export interface SrdLicenseNotice {
  edition: RulesReference;
  sourceId: string;
  licenseUrl: string;
  sourceUrl: string;
  officialAttribution: string;
  adaptationNotice: string;
}

export const SRD_LICENSE_NOTICES: readonly SrdLicenseNotice[] = [
  {
    edition: 'srd-5.2.1',
    sourceId: 'wotc-srd-521-en',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/legalcode',
    sourceUrl: 'https://www.dndbeyond.com/srd',
    officialAttribution:
      'This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.',
    adaptationNotice: 'Resumos e dados estruturados adaptados para português do Brasil; não são uma tradução oficial do SRD 5.2.1.',
  },
  {
    edition: 'srd-5.1',
    sourceId: 'wotc-srd-51-en',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/legalcode',
    sourceUrl: 'https://dnd.wizards.com/resources/systems-reference-document',
    officialAttribution:
      'This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.',
    adaptationNotice: 'Resumos e dados estruturados adaptados para português do Brasil; não são uma tradução oficial do SRD 5.1.',
  },
];

export function findSrdLicenseNotice(sourceId: string): SrdLicenseNotice | undefined {
  return SRD_LICENSE_NOTICES.find((notice) => notice.sourceId === sourceId);
}
