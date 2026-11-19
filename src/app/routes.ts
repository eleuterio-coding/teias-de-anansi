/**
 * Contrato provisório de navegação.
 * Apenas caminhos e rótulos: funcionalidades e permissões serão implementadas
 * nas etapas específicas. Estes caminhos não exibem dados privados.
 */
export const moduleRoutes = [
  { path: '/biblioteca', label: 'Biblioteca', etapa: 'Etapa 4' },
  { path: '/personagens', label: 'Personagens', etapa: 'Etapa 5' },
  { path: '/campanhas', label: 'Campanhas', etapa: 'Etapa 6' },
  { path: '/aventuras', label: 'Aventuras', etapa: 'Etapa 6' },
  { path: '/npcs', label: 'NPCs', etapa: 'Etapa 6' },
  { path: '/sessoes', label: 'Sessões', etapa: 'Etapa 7' },
  { path: '/area-jogador', label: 'Área do jogador', etapa: 'Etapa 7' },
  { path: '/preferencias', label: 'Preferências', etapa: 'Etapa 7' },
] as const;
