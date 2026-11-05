import {existsSync} from 'node:fs';
import {test,expect} from './fixtures';
import {newProfile} from '../../src/game/progression/profile';

test('vend tous les doublons du sac, conserve les exemplaires portés et sauvegarde',async({page})=>{
 test.skip(!existsSync('public/assets/manifest.json'),'Assets locaux nécessaires.');
 const profile=newProfile();profile.kamas=10;
 profile.inventory=[{uid:'extra-hat',item:'2411'},{uid:'ring-two',item:'2419'},{uid:'worn-hat',item:'2411'},{uid:'extra-hat2',item:'2411'},{uid:'cape',item:'2414'},{uid:'ring-one',item:'2419'},{uid:'amulet',item:'2425'},{uid:'amulet-extra',item:'2425'}];
 profile.equipment={hat:'worn-hat',cape:'cape',ring1:'ring-one',ring2:'ring-two'};
 await page.addInitScript(profile=>{if(!localStorage.getItem('bouftourush.save.v1'))localStorage.setItem('bouftourush.save.v1',JSON.stringify({version:1,profile}));},profile);
 await page.goto('/');await page.getByRole('button',{name:'Inventaire (I)',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Inventaire et équipement',exact:true}),sell=dialog.getByRole('button',{name:'Vendre doublons',exact:true});
 await expect(sell).toBeEnabled();await expect(dialog.getByText('3 doublons · +8 kamas',{exact:true})).toBeVisible();
 // La vente concerne le sac entier, même si un filtre masque les objets concernés.
 await dialog.getByRole('button',{name:'Aventurier',exact:true}).click();await sell.click();
 await expect(dialog.getByText('3 doublons vendus : +8 kamas.',{exact:true})).toBeVisible();await expect(sell).toBeDisabled();
 await dialog.getByRole('button',{name:'Tous',exact:true}).click();await expect(dialog.locator('.item-cell')).toHaveCount(1);
 await expect(dialog.getByRole('img',{name:'Aperçu du Crâ équipé',exact:true})).toHaveAttribute('data-asset','appearance.2411.2414.cra.idle.southeast');
 const saved=await page.evaluate(()=>fetch('/api/profile').then(response=>response.json()).then(saved=>saved.profile));
 expect(saved.kamas).toBe(18);expect(saved.inventory.map((item:{uid:string})=>item.uid)).toEqual(['ring-two','worn-hat','cape','ring-one','amulet']);expect(saved.equipment).toEqual({hat:'worn-hat',cape:'cape',ring1:'ring-one',ring2:'ring-two'});
 await page.reload();await page.getByRole('button',{name:'Inventaire (I)',exact:true}).click();await expect(sell).toBeDisabled();await expect(dialog.locator('.item-cell')).toHaveCount(1);
});
