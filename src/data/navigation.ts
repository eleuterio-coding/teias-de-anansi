import {
  BookOpenText,
  CalendarDays,
  Compass,
  Dices,
  Library,
  Map,
  ScrollText,
  Settings2,
  Shield,
  Swords,
  UsersRound,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react';

export type PageId =
  | 'inicio'
  | 'campanhas'
  | 'aventuras'
  | 'sessoes'
  | 'personagens'
  | 'biblioteca'
  | 'regras'
  | 'encontros'
  | 'ferramentas'
  | 'configuracoes';

export type NavItem = {
  id: PageId;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const primaryNavigation: NavItem[] = [
  { id: 'inicio', label: 'Visão geral', description: 'Seu ponto de partida', icon: Compass },
  { id: 'campanhas', label: 'Campanhas', description: 'Histórias e mundos', icon: Map },
  { id: 'aventuras', label: 'Aventuras', description: 'Arcos narrativos', icon: ScrollText },
  { id: 'sessoes', label: 'Sessões', description: 'Encontros da mesa', icon: CalendarDays },
  { id: 'personagens', label: 'Personagens', description: 'Heróis e aliados', icon: UsersRound },
];

export const supportNavigation: NavItem[] = [
  { id: 'biblioteca', label: 'Biblioteca', description: 'Conteúdo de referência', icon: Library },
  { id: 'regras', label: 'Regras', description: 'Sistemas e mecânicas', icon: BookOpenText },
  { id: 'encontros', label: 'Encontros', description: 'Desafios e criaturas', icon: Swords },
  { id: 'ferramentas', label: 'Ferramentas', description: 'Recursos de jogo', icon: Dices },
];

export const settingsNavigation: NavItem = {
  id: 'configuracoes', label: 'Configurações', description: 'Preferências e acesso', icon: Settings2,
};

export const allNavigation = [
  ...primaryNavigation,
  ...supportNavigation,
  settingsNavigation,
];

export const libraryTiles = [
  { label: 'Classes', description: 'Arquétipos e progressão', icon: Shield },
  { label: 'Magias', description: 'Efeitos e conjurações', icon: WandSparkles },
  { label: 'Equipamentos', description: 'Itens e recursos', icon: Swords },
  { label: 'Conhecimento', description: 'Livros e verbetes', icon: BookOpenText },
];

export function isPageId(id: string): id is PageId {
  return allNavigation.some((nav) => nav.id === id);
}