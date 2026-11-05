import {test,expect} from './fixtures';
import {newProfile,finalStats,movementSpeedBonus,equip} from '../../src/game/progression/profile';
test('Coiffe du dev : icône Champion, équipement porté, bonus réels et aperçu dans huit directions',async({page},testInfo)=>{
 test.setTimeout(120000);
 const profile=newProfile();profile.inventory=[{uid:'dev',item:'devHat'},{uid:'cape',item:'6811'}];equip(profile,'cape');
 await page.addInitScript(profile=>{localStorage.setItem('bouftourush.save.v1',JSON.stringify({version:1,profile}));localStorage.setItem('bouftourush.help.seen','1');},profile);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1440,height:900});await page.goto('/');
 await page.getByRole('button',{name:'Inventaire (I)',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Inventaire et équipement',exact:true});
 await dialog.getByRole('button',{name:'Développeur',exact:true}).click();
 const item=dialog.getByRole('button',{name:'Coiffe du dev',exact:true});await expect(item).toBeVisible();await item.click();
 const details=dialog.getByRole('tooltip');await expect(details).toContainText('+10000 Vie');await expect(details).toContainText('+10000 Puissance');await expect(details).toContainText('90 % recharge');await expect(details).toContainText('+150 % déplacement');
 const pixels=await item.locator('img').evaluate(async element=>{const image=element as HTMLImageElement;await image.decode();const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);return {size:Math.max(c.width,c.height),alpha:ctx.getImageData(0,0,1,1).data[3]};});
 expect(pixels.size).toBeGreaterThanOrEqual(190);expect(pixels.alpha).toBe(0);
 await dialog.getByRole('button',{name:'Équiper',exact:true}).click();equip(profile,'dev');
 await expect(dialog.locator('.character-stats')).toContainText(String(finalStats(profile).hp));await expect(dialog.locator('.character-stats')).toContainText('90 %');await expect(dialog.locator('.character-stats')).toContainText(movementSpeedBonus(profile)+' %');
 const preview=dialog.getByRole('img',{name:'Aperçu du Crâ équipé',exact:true});
 for(let direction=0;direction<8;direction++){await expect(preview.locator('.atlas-sprite')).toHaveAttribute('data-loaded','true');await dialog.getByRole('button',{name:'Tourner',exact:true}).click();}
 await page.screenshot({path:testInfo.outputPath('dev-hat-desktop.png')});
 await page.setViewportSize({width:390,height:844});expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await page.screenshot({path:testInfo.outputPath('dev-hat-mobile.png')});
 await page.keyboard.press('i');const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-animation',/^appearance\.devHat\.6811\.cra\./);
 await page.keyboard.press('e');await expect(canvas).toHaveAttribute('data-animation',/^appearance\.devHat\.6811\.cra\.cast\.[RL]$/);
 await page.setViewportSize({width:1440,height:900});await page.screenshot({path:testInfo.outputPath('dev-hat-game.png')});
 await expect.poll(()=>page.evaluate(async()=>(await (await fetch('/api/profile')).json()).profile.equipment.hat)).toBe('dev');
 await page.reload();await expect(page.locator('canvas')).toHaveAttribute('data-animation',/^appearance\.devHat\.6811\.cra\./,{timeout:60000});
 expect(errors).toEqual([]);
});
