import {test,expect} from '@playwright/test';
test('la compilation installée redémarre et entre en donjon sans réseau',async({page,context})=>{
 await page.goto('/');await expect(page.getByRole('button',{name:'Donjons',exact:true})).toBeVisible();
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 await expect(page.getByText('Hors connexion prêt',{exact:true})).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await context.setOffline(true);await page.reload();
 await expect(page.getByRole('button',{name:'Donjons',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Donjons',exact:true}).click();
 await expect(page.getByRole('img',{name:'Gardien : Bouftou Royal',exact:true}).locator('.atlas-sprite')).toHaveAttribute('data-loaded','true');
 await page.getByRole('button',{name:'Entrer — Donjon d’Incarnam',exact:true}).click();
 await expect(page.locator('canvas')).toHaveAttribute('data-phase','combat');
 await expect.poll(async()=>JSON.parse(await page.locator('canvas').getAttribute('data-enemies')??'[]').length).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Inventaire (I)',exact:true}).click();
 await expect(page.getByRole('img',{name:'Aperçu du Crâ équipé',exact:true}).locator('.atlas-sprite')).toHaveAttribute('data-loaded','true');
});
