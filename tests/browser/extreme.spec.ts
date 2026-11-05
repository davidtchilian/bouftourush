import {readFileSync} from 'node:fs';
import {dungeons} from '../../src/data/dungeons';
import {test,expect} from './fixtures';
test('choisit Extrême, affiche ×5 monstres avec ×1,5 PV et conserve le mode lors d’un nouvel essai',async({page},testInfo)=>{
 await page.addInitScript(()=>localStorage.setItem('bouftourush.help.seen','1'));
 await page.goto('/');await page.getByRole('button',{name:'Donjons',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Choisir un donjon'});
 await expect(dialog.getByRole('button',{name:/^Entrer en Extrême/})).toHaveCount(Object.keys(dungeons).length);
 await expect(dialog).toContainText('Extrême : monstres ×5, PV ×1,5.');
 await page.setViewportSize({width:390,height:844});expect(await dialog.evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);
 await page.screenshot({path:testInfo.outputPath('choix-extreme-mobile.png')});
 await dialog.getByRole('button',{name:'Entrer en Extrême — Donjon d’Incarnam',exact:true}).click();
 const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-mode','extreme');
 await expect.poll(async()=>JSON.parse(await canvas.getAttribute('data-enemies')??'[]').length).toBe(30);
 const enemies=JSON.parse(await canvas.getAttribute('data-enemies')??'[]') as {kind:string;hp:number}[];
 expect(enemies.filter(e=>e.kind==='youngWhite')).toHaveLength(15);expect(enemies.filter(e=>e.kind==='youngBlack')).toHaveLength(15);
 expect(enemies.every(e=>e.hp===(e.kind==='youngWhite'?63:72))).toBe(true);
 await page.screenshot({path:testInfo.outputPath('premiere-vague-extreme.png')});
 // Ne pas attaquer : une défaite n'accorde pas la panoplie de victoire.
 await expect(page.getByRole('dialog',{name:'Défaite',exact:true})).toBeVisible({timeout:30000});
 const saved=await page.evaluate(()=>fetch('/api/profile').then(response=>response.json()));expect(saved.profile.inventory).toHaveLength(0);
 await page.getByRole('button',{name:'Recommencer',exact:true}).click();await expect(canvas).toHaveAttribute('data-mode','extreme');await expect(canvas).toHaveAttribute('data-phase','combat');
 await page.getByRole('button',{name:'Abandonner',exact:true}).click();await expect(canvas).toHaveAttribute('data-mode','normal');await expect(canvas).toHaveAttribute('data-phase','hub');
 const manifest=JSON.parse(readFileSync('public/assets/manifest.json','utf8'));expect(manifest.assets['ui.spell.explosive'].provenance.version).toBe('1.40.13-remastered');
});
