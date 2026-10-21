import{test,expect}from'@playwright/test';

const picture=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64');
const mockModule=`
const accounts=[
 {uid:'uid-rafael',username:'rafael',displayName:'Rafael',avatarDataUrl:''},
 {uid:'uid-bruno',username:'bruno',displayName:'Bruno',avatarDataUrl:''},
 {uid:'uid-fernanda',username:'fernanda',displayName:'Fernanda',avatarDataUrl:''}
];
const session=()=>JSON.parse(localStorage.getItem('hub-rpg:collaboration-session:v1')||'{}');
const rows=()=>JSON.parse(localStorage.getItem('mock:user-profiles')||JSON.stringify(accounts));
const update=value=>{const items=rows();const index=items.findIndex(row=>row.uid===value.uid);if(index<0)throw Error('Não encontrado.');items[index]={...items[index],...value};localStorage.setItem('mock:user-profiles',JSON.stringify(items));return items[index]};
export const loadFirebaseConfig=async()=>({configured:true,ownerUsername:'rafael',playerAccounts:[{username:'bruno',displayName:'Bruno'},{username:'fernanda',displayName:'Fernanda'}]});
export async function createFirebaseCollaborationProvider(){
 const config=await loadFirebaseConfig();
 return{
  configured:true,config,
  async currentUser(){return rows().find(row=>row.username===session().username)},
  async getMyProfile(){return rows().find(row=>row.username===session().username)},
  async listUsers(){return rows()},
  async saveMyAvatar(avatarDataUrl){const me=rows().find(row=>row.username===session().username);return update({uid:me.uid,avatarDataUrl})},
  async saveManagedUserProfile(value){
   if(session().username!=='rafael')throw Error('Sem permissão.');
   return update(value)
  },
  async listCampaignMemberships(){return[]},
  subscribeRealtime(){return()=>{}},
  onAuthChanged(callback){callback(rows().find(row=>row.username===session().username));return()=>{}}
 };
}
`;
async function openAs(page,name,isMaster){
 await page.addInitScript(({name,isMaster})=>{
  localStorage.setItem('hub-rpg:collaboration-session:v1',JSON.stringify({uid:'uid-'+name,username:name,isMaster,memberships:[]}));
 },{name,isMaster});
 await page.route('**/scripts/firebase-collaboration-provider.js*',route=>route.fulfill({status:200,contentType:'text/javascript',body:mockModule}));
 await page.goto('/usuario.html');
 await expect(page.locator('#hub-users-list .hub-user-list-item')).toHaveCount(3);
}
test('Mestre vê o diretório, seleciona perfil, altera nome e foto e mantém mudanças',async({page})=>{
 await openAs(page,'rafael',true);
 await expect(page.locator('.hub-nav-secondary a[href="usuario.html"]')).toContainText('Usuários');
 await expect(page.getByRole('heading',{name:'Usuários',exact:true})).toBeVisible();
 await page.locator('[data-user-select="uid-bruno"]').click();
 await expect(page.locator('#user-admin-card')).toBeVisible();
 await page.locator('#admin-display-name').fill('Bruno Aventureiro');
 await page.locator('#admin-avatar-file').setInputFiles({name:'avatar.png',mimeType:'image/png',buffer:picture});
 await expect(page.locator('#admin-avatar-preview img')).toBeVisible();
 await page.locator('#admin-save').click();
 await expect(page.locator('#admin-feedback')).toContainText('Alterações salvas.');
 await expect(page.locator('[data-user-select="uid-bruno"]')).toContainText('Bruno Aventureiro');
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('mock:user-profiles')).find(row=>row.uid==='uid-bruno'));
 expect(stored.displayName).toBe('Bruno Aventureiro');
 expect(stored.avatarDataUrl).toMatch(/^data:image\/(webp|jpeg|png);base64,/);
 await page.reload();
 await expect(page.locator('[data-user-select="uid-bruno"]')).toContainText('Bruno Aventureiro');
});
test('Jogador vê a lista mas não recebe controles administrativos',async({page})=>{
 await openAs(page,'bruno',false);
 await expect(page.locator('#user-admin-card')).toBeHidden();
 await expect(page.locator('[data-user-select]')).toHaveCount(0);
 await expect(page.locator('#user-avatar-preview')).toHaveAttribute('role','button');
 await expect(page.locator('#user-avatar-remove')).toHaveText('Remover');
});

test('Link da Campanha abre o perfil específico sem conceder edição ao jogador',async({page})=>{
 await openAs(page,'fernanda',false);
 await page.goto('/usuario.html?user=bruno&campaign=reinos-de-prata');
 await expect(page.locator('#hub-user-focused-profile')).toBeVisible();
 await expect(page.locator('#hub-focused-user-name')).toHaveText('Bruno');
 await expect(page.locator('#hub-focused-user-login')).toHaveText('Usuário: @bruno');
 await expect(page.locator('#hub-user-profile-back')).toHaveAttribute('href','mesa.html?id=reinos-de-prata');
 await expect(page.locator('#user-admin-card')).toBeHidden();
 await expect(page.locator('#hub-users-list .hub-user-list-item-focused')).toContainText('Bruno');
});
