import {test,expect} from './fixtures';
import {newProfile} from '../../src/game/progression/profile';
import {royalUpgrades} from '../../src/data/items';

test('panoplie royale : icônes transparentes, équipement et petit écran',async({page},testInfo)=>{
 test.setTimeout(180000);
 await page.setViewportSize({width:1280,height:960});
 await page.emulateMedia({reducedMotion:'reduce'});
 const profile=newProfile();profile.inventory=royalUpgrades.map(([,id])=>({uid:id,item:id}));profile.equipment={hat:'2438',cape:'2445'};
 await page.addInitScript(profile=>localStorage.setItem('bouftourush.save.v1',JSON.stringify({version:1,profile})),profile);
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');await expect(page.locator('canvas')).toBeVisible({timeout:60000});await page.keyboard.press('i');
 const dialog=page.getByRole('dialog',{name:'Inventaire et équipement',exact:true});
 await dialog.getByRole('button',{name:'Bouftou Royal',exact:true}).click();
 await expect(dialog.locator('.item-cell')).toHaveCount(5);
 for(const icon of await dialog.locator('.item-cell img,.slot img').all()){
  const pixels=await icon.evaluate(async element=>{
   const image=element as HTMLImageElement;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
   const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);const rgba=ctx.getImageData(0,0,canvas.width,canvas.height).data;
   let opaque=0,clear=0;for(let i=3;i<rgba.length;i+=4){if(rgba[i]>128)opaque++;else clear++;}return {width:canvas.width,height:canvas.height,opaque,clear};
  });
  expect(Math.max(pixels.width,pixels.height)).toBeGreaterThanOrEqual(190);expect(pixels.opaque/(pixels.width*pixels.height)).toBeGreaterThan(0.1);expect(pixels.clear).toBeGreaterThan(0);
 }
 const preview=dialog.getByRole('img',{name:'Aperçu du Crâ équipé',exact:true});
 await expect(preview).toHaveAttribute('data-asset',/^appearance\.2438\.2445\.cra\.idle\./);
 await expect(preview.locator('.atlas-sprite')).toHaveAttribute('data-loaded','true');
 await page.screenshot({path:testInfo.outputPath('royal-inventory-desktop.png')});
 await page.setViewportSize({width:390,height:844});expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
 await page.screenshot({path:testInfo.outputPath('royal-inventory-mobile.png')});await page.keyboard.press('i');
 await expect(page.locator('canvas')).toHaveAttribute('data-animation',/^appearance\.2438\.2445\.cra\./);
 // Toutes les frames et combinaisons avec les équipements déjà intégrés doivent rester composables.
 const combinations=await page.evaluate(async()=>{
  const path='/src/game/rendering/composition.ts';const {composeActor}=await import(path);
  const manifest=await fetch('/assets/manifest.json').then(r=>r.json());let combinations=0;
  for(const hat of ['none','2411','2474','8259','2438'])for(const cape of ['none','2414','2473','8258','2445']){
   if(hat!=='2438'&&cape!=='2445')continue;
   for(const [actorId,actor] of Object.entries(manifest.composition.actors) as [string,{frames:{durationMs:number}[]}][]){
    let elapsed=0;for(const frame of actor.frames){composeActor(manifest,actorId,{hat,cape},elapsed);elapsed+=frame.durationMs;}
   }combinations++;
  }return combinations;
 });
 expect(combinations).toBe(9);expect(errors).toEqual([]);
});
