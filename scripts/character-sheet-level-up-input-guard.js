// Campos textuais do rascunho são consolidados no evento change (blur/commit do campo).
// Bloquear somente o input bubbling evita reconstruir todo o editor a cada tecla,
// sem impedir que o valor digitado apareça normalmente no controle.
function isLevelUpDraftText(target){return!!target?.closest?.('#level-up-editor')&&target?.matches?.('input[data-level-up-subclass-choice],input[data-feat-def]')}
function guardDraftTyping(event){if(isLevelUpDraftText(event.target))event.stopPropagation()}

document.addEventListener('input',guardDraftTyping,true);

export{isLevelUpDraftText,guardDraftTyping};
