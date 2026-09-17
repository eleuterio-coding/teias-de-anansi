const SHEET_ID='sheet';
const SAVE_ID='save-sheet';
const STATUS_ID='save-status';
let timer=0,lastQueuedAt=0;
function editableTarget(target){return target instanceof Element&&target.closest(`#${SHEET_ID}`)&&!target.closest('button,a')&&target.matches('input,textarea,select,[contenteditable="true"]')&&!target.matches(':disabled,[readonly]')}
function saveNow(){clearTimeout(timer);timer=0;const button=document.getElementById(SAVE_ID);if(!button||button.disabled)return;button.click()}
function queueSave(){lastQueuedAt=Date.now();clearTimeout(timer);timer=setTimeout(saveNow,260);const status=document.getElementById(STATUS_ID);if(status)status.textContent='Salvando...'}
function onChange(event){if(editableTarget(event.target))queueSave()}
function onRemote(event){const kinds=event.detail?.kinds||[];if(!kinds.includes('characters'))return;if(Date.now()-lastQueuedAt<700)return;event.detail?.claim?.();location.reload()}
function init(){document.addEventListener('input',onChange,true);document.addEventListener('change',onChange,true);window.addEventListener('beforeunload',()=>{if(timer)saveNow()});window.addEventListener('hub-rpg:remote-updated',onRemote)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
