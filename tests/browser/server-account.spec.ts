import {test,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {AccountStore} from '../../server/accounts';
import {createAuth,derivePassword} from '../../server/auth';
import {newProfile} from '../../src/game/progression/profile';
test('connecte le compte existant sans inscription puis modifie ses informations et son mot de passe',async({browser},testInfo)=>{
 const store=new AccountStore(':memory:'),salt='1234567890abcdef1234567890abcdef';
 store.create({username:'joueur',salt,hash:(await derivePassword('premier-mot-de-passe',salt)).toString('hex')},'Premier joueur',Date.now());
 const auth=createAuth(store),server=createServer((req,res)=>auth(req,res,()=>res.end('Jeu protégé')));
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address();if(!address||typeof address==='string')throw Error('port');const base=`http://127.0.0.1:${address.port}`;
 const context=await browser.newContext(),page=await context.newPage();
 try{
  expect((await context.request.get(base+'/setup')).status()).toBe(404);
  expect((await context.request.post(base+'/auth/setup')).status()).toBe(404);
  await page.goto(base+'/login');await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button',{name:'Créer mon compte'})).toHaveCount(0);
  await page.getByLabel('Identifiant',{exact:true}).fill('joueur');await page.getByLabel('Mot de passe',{exact:true}).fill('premier-mot-de-passe');
  await page.getByRole('button',{name:'Se connecter'}).click();await expect(page).toHaveURL(base+'/');
  await page.goto(base+'/account');await expect(page.getByLabel('Nom affiché')).toHaveValue('Premier joueur');
  await page.getByLabel('Nom affiché').fill('Archer du serveur');await page.getByRole('button',{name:'Enregistrer le nom'}).click();await expect(page.getByRole('status')).toHaveText('Nom enregistré.');
  await page.getByLabel('Mot de passe actuel').fill('premier-mot-de-passe');await page.getByLabel('Nouveau mot de passe').fill('deuxieme-mot-de-passe');await page.getByRole('button',{name:'Modifier le mot de passe'}).click();await expect(page.getByRole('status')).toContainText('Mot de passe modifié');
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:testInfo.outputPath('account-mobile.png'),fullPage:true});
  await page.getByRole('button',{name:'Déconnexion'}).click();await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Identifiant').fill('joueur');await page.getByLabel('Mot de passe',{exact:true}).fill('deuxieme-mot-de-passe');await page.getByRole('button',{name:'Se connecter'}).click();await expect(page).toHaveURL(base+'/');
  await page.goto(base+'/account');await expect(page.getByLabel('Nom affiché')).toHaveValue('Archer du serveur');
 }finally{await context.close();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));store.close();}
});
test('retrouve la progression serveur dans un navigateur neuf sans sauvegarde locale',async({browser,request,baseURL})=>{
 test.setTimeout(120000);
 const original=await (await request.get('/api/profile')).json();const profile=newProfile();profile.level=9;profile.kamas=4321;
 expect((await request.put('/api/profile',{headers:{Origin:baseURL!},data:{profile,revision:original.revision}})).status()).toBe(200);
 const context=await browser.newContext({baseURL,storageState:{cookies:[],origins:[]}}),page=await context.newPage();
 context.setDefaultTimeout(15000);
 try{
  await page.goto('/login');await page.getByLabel('Identifiant').fill('browser-test');await page.getByLabel('Mot de passe',{exact:true}).fill(process.env.BROWSER_TEST_PASSWORD!);await page.getByRole('button',{name:'Se connecter'}).click();
  await expect(page.getByRole('button',{name:'Donjons',exact:true})).toBeVisible({timeout:60000});
  expect(await page.evaluate(()=>localStorage.getItem('bouftourush.save.v1'))).toBeNull();
  await expect(page.locator('.adventure-status')).toContainText(/4[\s\u202f]?321/);
  if(await page.getByRole('button',{name:'Compris',exact:true}).isVisible())await page.getByRole('button',{name:'Compris',exact:true}).click();
  await page.getByRole('link',{name:'Mon compte',exact:true}).click();await expect(page).toHaveURL(/\/account$/);await expect(page.locator('#progress')).toContainText('Niveau 9');
 }finally{
  await context.close();const current=await (await request.get('/api/profile')).json();await request.put('/api/profile',{headers:{Origin:baseURL!},data:{profile:original.profile??newProfile(),revision:current.revision}});
 }
});
