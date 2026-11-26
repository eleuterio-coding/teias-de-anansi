// Registro único das áreas do Hub. Não contém dados de RPG.
const commonRoles = Object.freeze(["dm", "player"]);
export const hubAreas = Object.freeze([
  { path: "/compendio", label: "Compêndio", allowedRoles: commonRoles },
  { path: "/personagens", label: "Personagens", allowedRoles: commonRoles },
  { path: "/campanhas", label: "Campanhas", allowedRoles: commonRoles },
  { path: "/ferramentas", label: "Ferramentas", allowedRoles: commonRoles },
  { path: "/usuarios", label: "Administração", allowedRoles: Object.freeze(["dm"]) }
].map(Object.freeze));

export function visibleHubAreas(role) {
  return hubAreas.filter(area => area.allowedRoles.includes(role));
}
