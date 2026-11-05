import {test,expect} from './fixtures';
test('connexion obligatoire et absence d’inscription',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,storageState:{cookies:[],origins:[]}});const page=await context.newPage();
 await page.goto('/');await expect(page).toHaveURL(/\/login$/);
 await expect(page.getByRole('heading',{name:'Bouftourush'})).toBeVisible();
 await expect(page.locator('canvas')).toHaveCount(0);
 await page.screenshot({path:'test-results/login-desktop.png'});
 await page.setViewportSize({width:390,height:844});
 await expect(page.getByRole('button',{name:'Se connecter'})).toBeInViewport();
 await page.screenshot({path:'test-results/login-mobile.png'});
 expect((await context.request.get('/assets/manifest.json')).status()).toBe(401);
 expect((await context.request.post('/auth/register')).status()).toBe(404);
 await page.getByLabel('Identifiant').fill('inconnu');await page.getByLabel('Mot de passe').fill('incorrect');
 await page.getByRole('button',{name:'Se connecter'}).click();await expect(page.getByRole('alert')).toContainText('Connexion refusée');
 await context.close();
});
test('la session permet de jouer et la déconnexion ferme l’accès',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,storageState:{cookies:[],origins:[]}}),page=await context.newPage();
 await page.goto('/login');
 await page.getByLabel('Identifiant').fill('browser-test');
 await page.getByLabel('Mot de passe').fill(process.env.BROWSER_TEST_PASSWORD!);
 await page.getByRole('button',{name:'Se connecter'}).click();
 await page.goto('/');await expect(page.getByRole('button',{name:'Donjons',exact:true})).toBeVisible({timeout:60000});
 if(await page.getByRole('button',{name:'Compris',exact:true}).isVisible())await page.getByRole('button',{name:'Compris',exact:true}).click();
 await page.getByRole('button',{name:'Déconnexion',exact:true}).click();await expect(page).toHaveURL(/\/login$/);
 expect((await context.request.get('/assets/manifest.json')).status()).toBe(401);
 await page.goto('/');await expect(page).toHaveURL(/\/login$/);await expect(page.locator('canvas')).toHaveCount(0);
 await context.close();
});
