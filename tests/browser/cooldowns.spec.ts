import {test,expect} from './fixtures';
import {auditProfile} from '../../scripts/combat-audit';
test('Mousse affiche sa réduction, modifie les quatre sorts et suit équipement et sauvegarde',async({page},testInfo)=>{
 const profile=auditProfile('bouftou');
 await page.addInitScript(profile=>{localStorage.setItem('bouftourush.help.seen','1');if(!localStorage.getItem('bouftourush.save.v1'))localStorage.setItem('bouftourush.save.v1',JSON.stringify({version:1,profile}));},profile);
 await page.goto('/');await page.getByRole('button',{name:'Inventaire (I)',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Inventaire et équipement'}),reduction=dialog.locator('.character-stats div').filter({hasText:'Réduction recharge'}).locator('dd');
 await expect(reduction).toHaveText('15 %');await expect(dialog.locator('.set-summary')).toContainText('−9 % recharge');
 await dialog.getByRole('button',{name:'Retirer Cape',exact:true}).click();await expect(reduction).toHaveText('12 %');
 const cape=dialog.getByRole('button',{name:'Cape en Mousse',exact:true});await cape.click();await expect(dialog.getByRole('tooltip')).toContainText('−1 % recharge');
 await expect(dialog.locator('.set-summary')).toContainText('À 7 pièces : +110 Vie · +55 Puissance · −9 % recharge');
 await cape.dblclick();await expect(reduction).toHaveText('15 %');
 await page.setViewportSize({width:390,height:844});expect(await dialog.evaluate(element=>element.scrollWidth<=element.clientWidth+1)).toBe(true);
 await page.screenshot({path:testInfo.outputPath('mousse-cooldowns-mobile.png')});await page.keyboard.press('i');
 const deck=page.getByRole('group',{name:'Sorts AZER'});
 for(const [index,text] of ['2.72','1.445','0.408','13.6'].entries()){
  const spell=deck.locator('.spell').nth(index);await spell.focus();await expect(spell.getByRole('tooltip')).toContainText(`Recharge : ${text} s (−15 %)`);
 }
 await page.locator('canvas').click();await page.keyboard.press('r');await expect(deck.locator('.spell').nth(3)).toHaveAttribute('data-ready','false');
 await expect(deck.locator('.spell-timer').nth(3)).toContainText(/1[23]\.\d s/);
 await page.reload();await page.getByRole('button',{name:'Inventaire (I)',exact:true}).click();await expect(reduction).toHaveText('15 %');
});
