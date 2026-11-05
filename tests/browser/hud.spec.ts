import {test,expect} from './fixtures';

test('HUD compact : aide, sorts et menus sur ordinateur et petit écran',async({page},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/');
 const help=page.getByRole('complementary',{name:'Comment jouer'});
 await expect(help).toBeVisible({timeout:60000});
 await help.getByRole('button',{name:'Compris'}).click();
 await expect(help).toHaveCount(0);
 const spells=page.getByRole('group',{name:'Sorts AZER'});
 await expect(spells.locator('.spell')).toHaveCount(4);
 await page.keyboard.press('Tab');
 await spells.locator('.spell').first().focus();
 await expect(spells.getByRole('tooltip').first()).toBeVisible();
 await page.keyboard.press('Tab');
 await page.locator('canvas').click();
 await page.screenshot({path:testInfo.outputPath('hud-desktop.png')});
 await page.getByRole('button',{name:'Donjons',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Choisir un donjon'})).toBeVisible();
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Inventaire (I)',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Inventaire et équipement'})).toBeVisible();
 await page.keyboard.press('Escape');
 await page.setViewportSize({width:390,height:844});
 await expect(spells).toBeVisible();
 expect(await page.locator('main').evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
 const rect=await page.locator('canvas').boundingBox();expect(rect!.height).toBeGreaterThan(450);
 await page.screenshot({path:testInfo.outputPath('hud-mobile.png')});
 // La carte part du haut de l’écran et reste intégralement au-dessus de la barre du bas.
 for(const size of [{width:1440,height:900},{width:390,height:844},{width:1440,height:700}]){
  await page.setViewportSize(size);
  await expect.poll(async()=>{
   const canvas=page.locator('canvas'),rect=await canvas.boundingBox(),footer=await page.locator('.spellbar').boundingBox();
   const bounds=await canvas.evaluate(c=>({camera:JSON.parse(c.dataset.cameraBounds??'null'),map:JSON.parse(c.dataset.mapBounds??'null')}));
   if(!bounds.camera||!bounds.map||!rect||!footer)return false;
   const [left,bottom,right,top]=bounds.map,[cl,cb,cr,ct]=bounds.camera;
   return cl<=left+0.001&&cb<=bottom+0.001&&cr>=right-0.001&&ct>=top-0.001&&Math.abs(rect.y)<=1&&rect.y+rect.height<=footer.y+1;
  }).toBe(true);
 }
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Aide',exact:true}).click();
 await expect(help).toBeVisible();
 await help.getByRole('button',{name:'Compris'}).click();
 await page.reload();
 await expect(page.getByRole('button',{name:'Donjons',exact:true})).toBeVisible();
 await expect(help).toHaveCount(0);
 expect(errors).toEqual([]);
});
