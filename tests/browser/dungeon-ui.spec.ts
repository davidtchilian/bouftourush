import {existsSync} from 'node:fs';
import {dungeons} from '../../src/data/dungeons';
import {monsters} from '../../src/data/monsters';
import {test,expect} from '@playwright/test';
test('présente les gardiens des donjons avec leurs sprites, animations et butins',async({page},testInfo)=>{
 test.setTimeout(120000);
 test.skip(!existsSync('public/assets/manifest.json'),'Assets locaux nécessaires.');
 await page.goto('/');await page.getByRole('button',{name:'Donjons',exact:true}).click();await page.mouse.move(0,0);
 const dialog=page.getByRole('dialog',{name:'Choisir un donjon',exact:true});
 const milimilou=dialog.getByRole('img',{name:'Gardien : Milimilou',exact:true}),royal=dialog.getByRole('img',{name:'Gardien : Bouftou Royal',exact:true}),sponge=dialog.getByRole('img',{name:'Gardien : Mob l’Éponge',exact:true});
 await expect(milimilou).toHaveAttribute('data-asset','mob.1581.idle.R');
 await expect(royal).toHaveAttribute('data-asset','mob.1574.idle.R');
 await expect(sponge).toHaveAttribute('data-asset','mob.1546.idle.R');
 await expect(dialog.locator('.dungeon-loot img')).toHaveCount(Object.keys(dungeons).length*4);
 await expect(royal).toHaveAttribute('data-render-asset','preview.mob.1574.idle.R');
 await expect(royal.locator('.atlas-sprite')).toHaveAttribute('data-loaded','true');
 await expect(milimilou.locator('.atlas-sprite')).toHaveAttribute('data-loaded','true');
 await expect(sponge.locator('.atlas-sprite')).toHaveAttribute('data-loaded','true');
 for(const dungeon of Object.values(dungeons)){
  const boss=monsters[dungeon.bossWave.find(kind=>monsters[kind].boss)!];
  const portrait=dialog.getByRole('img',{name:`Gardien : ${boss.name}`,exact:true});
  await expect(portrait).toHaveAttribute('data-render-asset',`preview.mob.${boss.sprite}.idle.R`);
  await expect(portrait.locator('.atlas-sprite')).toHaveAttribute('data-loaded','true');
 }
 await page.screenshot({path:testInfo.outputPath('dungeons.png')});
 await royal.hover();await expect(royal).toHaveAttribute('data-asset','mob.1574.attack.R');
 await expect.poll(async()=>Number(await royal.locator('.atlas-sprite').getAttribute('data-frame'))).toBeGreaterThan(0);
 await page.emulateMedia({reducedMotion:'reduce'});await expect(royal.locator('.atlas-sprite')).toHaveAttribute('data-frame','0');
 await page.setViewportSize({width:390,height:844});
 expect(await dialog.evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);
 await page.screenshot({path:testInfo.outputPath('dungeons-mobile.png')});
 const batofu=dialog.getByRole('img',{name:'Gardien : Batofu',exact:true});
 await batofu.hover();await expect(batofu).toHaveAttribute('data-asset','mob.1380.attack.R');
 await page.screenshot({path:testInfo.outputPath('tofu-scara-mobile.png')});
});
