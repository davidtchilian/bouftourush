import {existsSync,readFileSync} from 'node:fs';
import {test,expect} from '@playwright/test';
import {newProfile} from '../../src/game/progression/profile';
test('icônes recadrées, coiffe et cape portées, cartes figées',async({page},testInfo)=>{
 test.skip(!existsSync('public/assets/manifest.json'),'Assets locaux nécessaires.');
 const manifest=JSON.parse(readFileSync('public/assets/manifest.json','utf8'));
 test.skip(!manifest.composition?.actors['cra.idle.south'],'Apparences locales nécessaires.');
 for(const map of [manifest.hub,...Object.values(manifest.maps)] as {layers:{assetId:string}[]}[])
  for(const layer of map.layers)expect(manifest.assets[layer.assetId].frames).toHaveLength(1);
 const profile=newProfile();profile.inventory=[{uid:'hat',item:'2411'},{uid:'cape',item:'2414'},{uid:'hat2',item:'2474'},{uid:'cape2',item:'2473'},{uid:'mousseHat',item:'8259'},{uid:'mousseCape',item:'8258'}];profile.equipment={hat:'hat',cape:'cape'};
 await page.addInitScript(profile=>localStorage.setItem('bouftourush.save.v1',JSON.stringify({version:1,profile})),profile);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-animation',/^appearance\.2411\.2414\.cra\./);
 await page.screenshot({path:testInfo.outputPath('equipped.png')});
 await page.keyboard.press('i');const dialog=page.getByRole('dialog',{name:'Inventaire et équipement',exact:true});
 const preview=dialog.getByRole('img',{name:'Aperçu du Crâ équipé',exact:true});
 await expect(preview.locator('.atlas-sprite')).toHaveAttribute('data-loaded','true');
 await expect(preview).toHaveAttribute('data-render-asset','composition.cra.idle.southeast');
 await expect(preview).toHaveAttribute('data-asset','appearance.2411.2414.cra.idle.southeast');
 await dialog.getByRole('button',{name:'Tourner',exact:true}).click();await expect(preview).toHaveAttribute('data-asset','appearance.2411.2414.cra.idle.south');
 const icons=dialog.locator('.item-cell img');await expect(icons).toHaveCount(4);
 await expect(dialog.getByRole('button',{name:'Coiffe du Bouftou',exact:true})).toHaveCount(0);
 await expect(dialog.getByRole('button',{name:'Cape Bouffante',exact:true})).toHaveCount(0);
 for(const icon of await icons.all()){
  const pixels=await icon.evaluate(async element=>{
   const image=element as HTMLImageElement;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
   const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);const rgba=ctx.getImageData(0,0,canvas.width,canvas.height).data;
   let opaque=0,clear=0;for(let i=3;i<rgba.length;i+=4){if(rgba[i]>128)opaque++;else clear++;}return {width:canvas.width,height:canvas.height,opaque,clear};
  });
  expect(pixels.opaque/(pixels.width*pixels.height)).toBeGreaterThan(0.1);expect(pixels.clear).toBeGreaterThan(0);
 }
 await page.screenshot({path:testInfo.outputPath('inventory.png')});
 await dialog.getByRole('button',{name:'Chapeau de l’Aventurier',exact:true}).click();
 await expect(preview).toHaveAttribute('data-asset','appearance.2411.2414.cra.idle.south');
 await dialog.getByRole('button',{name:'Chapeau de l’Aventurier',exact:true}).dblclick();
 await expect(preview).toHaveAttribute('data-asset','appearance.2474.2414.cra.idle.south');
 await expect(dialog.getByRole('button',{name:'Chapeau de l’Aventurier',exact:true})).toHaveCount(0);
 await expect(dialog.getByRole('button',{name:'Coiffe du Bouftou',exact:true})).toBeVisible();
 await page.keyboard.press('i');
 await expect(canvas).toHaveAttribute('data-animation',/^appearance\.2474\.2414\.cra\./);
 await page.keyboard.press('i');await expect(dialog.getByRole('img',{name:'Aperçu du Crâ équipé',exact:true})).toHaveAttribute('data-asset','appearance.2474.2414.cra.idle.southeast');await page.keyboard.press('i');
 await page.keyboard.press('i');await dialog.getByRole('button',{name:'Cape de l’Aventurier',exact:true}).click();await dialog.getByRole('button',{name:'Équiper',exact:true}).click();await page.keyboard.press('i');
 await expect(canvas).toHaveAttribute('data-animation',/^appearance\.2474\.2473\.cra\./);
 await page.keyboard.press('i');
 await dialog.getByRole('button',{name:'Retirer Coiffe',exact:true}).click();await expect(dialog.getByRole('button',{name:'Chapeau de l’Aventurier',exact:true})).toBeVisible();await page.keyboard.press('i');
 await expect(canvas).toHaveAttribute('data-animation',/^appearance\.none\.2473\.cra\./);
 await page.keyboard.press('i');await dialog.getByRole('button',{name:'Coiffe en Mousse',exact:true}).click();await dialog.getByRole('button',{name:'Équiper',exact:true}).click();await page.keyboard.press('i');
 await expect(canvas).toHaveAttribute('data-animation',/^appearance\.8259\.2473\.cra\./);
 await page.keyboard.press('i');await dialog.getByRole('button',{name:'Cape en Mousse',exact:true}).click();await dialog.getByRole('button',{name:'Équiper',exact:true}).click();await page.keyboard.press('i');
 await expect(canvas).toHaveAttribute('data-animation',/^appearance\.8259\.8258\.cra\./);
 await page.keyboard.press('i');await expect(preview).toHaveAttribute('data-asset','appearance.8259.8258.cra.idle.southeast');await page.keyboard.press('i');
 await page.keyboard.press('e');await expect(canvas).toHaveAttribute('data-animation',/^appearance\.8259\.8258\.cra\.cast\.[RL]$/);
 await page.setViewportSize({width:390,height:844});await page.keyboard.press('i');
 expect(await dialog.evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);
 await page.screenshot({path:testInfo.outputPath('inventory-mobile.png')});
 await expect(preview.locator('.atlas-sprite')).toHaveAttribute('data-loaded','true');
 await page.screenshot({path:testInfo.outputPath('inventory-mobile.png')});
 expect(errors).toEqual([]);
});
