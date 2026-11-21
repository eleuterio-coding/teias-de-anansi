/**
 * Contrato provisório de navegação.
 * Caminhos reservados do Hub: sem payload de campanha no bundle.
 * A camada de navegação confere papel na sessão, e as Rules impedem acesso
 * remoto indevido. Guardas de UI nao substituem regras Firestore.
 */
export const moduleRoutes = [
  { path: '/biblioteca', label: 'Biblioteca', etapa: 'Etapa 4', allowedRoles: ['dm', 'player'] },
  { path: '/personagens', label: 'Personagens', etapa: 'Etapa 5', allowedRoles: ['dm', 'player'] },
  { path: '/campanhas', label: 'Campanhas', etapa: 'Etapa 6', allowedRoles: ['dm'] },
  { path: '/aventuras', label: 'Aventuras', etapa: 'Etapa 6', allowedRoles: ['dm'] },
  { path: '/npcs', label: 'NPCs', etapa: 'Etapa 6', allowedRoles: ['dm'] },
  { path: '/sessoes', label: 'Sessões', etapa: 'Etapa 7', allowedRoles: ['dm'] },
  { path: '/area-jogador', label: 'Área do jogador', etapa: 'Etapa 7', allowedRoles: ['player'] },
  {
    path: '/preferencias',
    label: 'Preferências',
    etapa: 'Etapa 7',
    allowedRoles: ['dm', 'player'],
  },
] as const;

export type ModuleRoute = (typeof moduleRoutes)[number];

/** Área administrativa da Etapa 3; não altera o catálogo dos oito módulos RPG. */
export const usersAdminRoute = {
  path: '/usuarios',
  label: 'Usuários e vínculos',
  etapa: 'Etapa 3',
  allowedRoles: ['dm'],
} as const;
