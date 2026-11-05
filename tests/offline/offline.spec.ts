import {test,expect} from '@playwright/test';
test('le jeu authentifié ne démarre pas hors connexion',async({page,context})=>{
 await page.goto('/');await expect(page.getByRole('button',{name:'Donjons',exact:true})).toBeVisible({timeout:60000});
 expect(await page.evaluate(async()=>await caches.keys())).toEqual([]);
 await context.setOffline(true);
 await expect(page.locator('.viewport canvas')).toHaveCount(0,{timeout:20000});
 const fresh=await context.newPage();
 await fresh.goto('/').catch(()=>{});
 await expect(fresh.locator('.viewport canvas')).toHaveCount(0);
});
