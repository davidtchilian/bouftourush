import {test,expect} from './fixtures';
import {newProfile} from '../../src/game/progression/profile';
import type {Simulation} from '../../src/game/core/simulation';

test('change de classe près des kamas, conserve le profil et affiche les trois personnages équipés',async({page},info)=>{
 test.setTimeout(240000);
 const profile=newProfile();profile.kamas=123;profile.inventory=[{uid:'hat',item:'2411'},{uid:'cape',item:'2473'}];profile.equipment={hat:'hat',cape:'cape'};
 await page.addInitScript(p=>{localStorage.setItem('bouftourush.save.v1',JSON.stringify({version:1,profile:p}));localStorage.setItem('bouftourush.help.seen','1');},profile);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1280,height:900});await page.goto('/');
 const select=page.getByRole('combobox',{name:'Changer de classe'});await expect(select).toBeEnabled({timeout:120000});
 for(const [id,name] of [['sacrier','Sacrieur'],['iop','Iop'],['feca','Féca']]){
  await select.selectOption(id);await expect(select).toHaveValue(id);await expect(page.locator('.eyebrow').filter({hasText:`${name} · Niveau`})).toBeVisible();
  await expect(page.locator('canvas')).toHaveAttribute('data-animation',new RegExp(id+'\\.idle'));
  await page.getByRole('button',{name:'Inventaire (I)',exact:true}).click();
  await expect(page.locator('.character-portrait .atlas-sprite')).toHaveAttribute('data-loaded','true');
  await page.screenshot({path:info.outputPath(`${id}-inventory-desktop.png`)});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:info.outputPath(`${id}-inventory-mobile.png`)});
  await page.keyboard.press('Escape');await page.setViewportSize({width:1280,height:900});
  await page.getByRole('button',{name:'Donjons',exact:true}).click();await page.getByRole('button',{name:'Entrer — Donjon d’Incarnam',exact:true}).click();
  await expect(select).toBeDisabled();
  await page.locator('canvas').evaluate(async(canvas,id)=>{
   const path='/src/game/rendering/inspection.ts';const {inspectSimulation}=await import(path);const s=inspectSimulation(canvas as HTMLCanvasElement) as Simulation;
   s.director=null;s['spawn'](['bouftou']);const e=s.enemies[0];e.position=[s.player.position[0]+10,s.player.position[1]];e.hp=e.maxHp=10000;e.attackAt=Infinity;e.actionUntil=Infinity;
   for(const spell of s.playerClass.abilities){s.castUntil=0;s.cast(spell,e.position);}
  },id);
  await page.screenshot({path:info.outputPath(`${id}-combat.png`)});
  await page.getByRole('button',{name:'Abandonner',exact:true}).click();await expect(select).toBeEnabled();
 }
 await expect(page.locator('.adventure-status')).toContainText('123 kamas');
 await expect.poll(async()=>{const result=await page.evaluate(()=>fetch('/api/profile').then(r=>r.json()));return result.profile?.classId;}).toBe('feca');
 await page.reload();await expect(select).toHaveValue('feca',{timeout:120000});expect(errors).toEqual([]);
});
