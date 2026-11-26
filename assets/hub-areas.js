// Registro único das áreas, subáreas e papéis. Não contém dados de RPG.
const commonRoles = Object.freeze(["dm", "player"]);
const masterRole = Object.freeze(["dm"]);
const item = (path, label, allowedRoles = commonRoles) =>
  Object.freeze({ path, label, allowedRoles });
const group = (path, label, children, allowedRoles = commonRoles) =>
  Object.freeze({ path, label, allowedRoles, children: Object.freeze(children) });

export const homeArea = group("/", "Início", [
  item("/inicio/novidades", "Novidades")
]);
export const hubAreas = Object.freeze([
  group("/compendio", "Compêndio", [
    item("/compendio/sistemas", "Sistemas"),
    item("/compendio/regras", "Regras"),
    item("/compendio/livros", "Livros"),
    item("/compendio/classes", "Classes"),
    item("/compendio/especies", "Espécies"),
    item("/compendio/magias", "Magias"),
    item("/compendio/equipamentos", "Equipamentos"),
    item("/compendio/criaturas", "Criaturas")
  ]),
  group("/personagens", "Personagens", [
    item("/personagens/fichas", "Fichas"),
    item("/personagens/criacao", "Criação"),
    item("/personagens/evolucao", "Evolução")
  ]),
  group("/campanhas", "Campanhas", [
    item("/campanhas/aventuras", "Aventuras"),
    item("/campanhas/sessoes", "Sessões"),
    item("/campanhas/npcs", "NPCs"),
    item("/campanhas/mapas", "Mapas"),
    item("/campanhas/cenarios", "Cenários"),
    item("/campanhas/anotacoes", "Anotações")
  ]),
  group("/ferramentas", "Ferramentas", [
    item("/ferramentas/dados", "Rolador de dados"),
    item("/ferramentas/combate", "Combate"),
    item("/ferramentas/iniciativa", "Iniciativa"),
    item("/ferramentas/geradores", "Geradores"),
    item("/ferramentas/automacoes", "Automações de regras")
  ]),
  group("/usuarios", "Administração", [
    item("/usuarios/vinculos", "Usuários e permissões", masterRole),
    item("/usuarios/importacao", "Importação de JSONs", masterRole),
    item("/usuarios/sistemas", "Gerenciamento de sistemas", masterRole),
    item("/usuarios/validacao", "Validação de dados", masterRole)
  ], masterRole)
]);

export const hubRoutes = Object.freeze([
  ...homeArea.children,
  ...hubAreas.flatMap(area => [area, ...area.children])
]);
export function visibleHubAreas(role) {
  return hubAreas.filter(area => area.allowedRoles.includes(role));
}
export function visibleHubChildren(area, role) {
  return area.allowedRoles.includes(role)
    ? (area.children || []).filter(child => child.allowedRoles.includes(role))
    : [];
}
export function hubParent(path) {
  return [homeArea, ...hubAreas].find(area => area.children.some(child => child.path === path));
}
