import {test,expect} from './fixtures';
test('icônes Remastered AZER et états orange/blanc puis beige/noir pendant la recharge',async({page},testInfo)=>{
 await page.addInitScript(()=>localStorage.setItem('bouftourush.help.seen','1'));await page.goto('/');
 const deck=page.getByRole('group',{name:'Sorts AZER'}),spell=deck.locator('.spell').first();
 await expect(deck.locator('.spell-icon')).toHaveCount(4);
 for(const [index,id] of ['explosive','flaming','magic','power'].entries()){
  const icon=deck.locator('.spell-icon').nth(index);await expect(icon).toHaveAttribute('src',`/assets/textures/ui-spell-${id}/000.png`);
  expect(await icon.evaluate(async element=>{const image=element as HTMLImageElement;await image.decode();return Math.min(image.naturalWidth,image.naturalHeight);})).toBeGreaterThanOrEqual(180);
 }
 await expect(spell).toHaveAttribute('data-ready','true');await expect(spell).toHaveCSS('color','rgb(255, 255, 255)');
 await expect(spell).toHaveCSS('border-image-source',/ui-button\/000\.png/);
 await page.screenshot({path:testInfo.outputPath('sorts-disponibles.png')});
 await page.keyboard.press('a');await expect(spell).toHaveAttribute('data-ready','false');await expect(spell).toHaveCSS('color','rgb(0, 0, 0)');await expect(spell).toHaveCSS('border-image-source',/ui-slot\/000\.png/);
 await expect(spell.locator('.spell-timer')).toContainText('s');
 await spell.focus();await expect(spell.getByRole('tooltip')).toHaveCSS('color','rgb(51, 47, 32)');
 await page.setViewportSize({width:390,height:844});await page.locator('canvas').click();await page.screenshot({path:testInfo.outputPath('sorts-recharge-mobile.png')});
 expect(await page.locator('main').evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
 await expect(spell).toHaveAttribute('data-ready','true',{timeout:6000});await expect(spell).toHaveCSS('color','rgb(255, 255, 255)');
});
