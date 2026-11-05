import {test,expect} from './fixtures';
import {items} from '../../src/data/items';
import {newProfile,equip} from '../../src/game/progression/profile';
import {dungeons} from '../../src/data/dungeons';

for(const [dungeon,set,hat,cape] of [['tofu','tofu','8114','8112'],['scara','blackScara','8133','8134']] as const){
 test(`${dungeon} : panoplie portée, icônes transparentes et carte entière sur petit écran`,async({page},testInfo)=>{
  test.setTimeout(120000);
  const profile=newProfile();profile.level=30;
  profile.inventory=Object.values(items).filter(item=>['tofu','blackScara'].includes(item.set)).map(item=>({uid:item.id,item:item.id}));
  equip(profile,hat);equip(profile,cape);
  await page.addInitScript(profile=>localStorage.setItem('bouftourush.save.v1',JSON.stringify({version:1,profile})),profile);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:1440,height:900});await page.goto('/');
  const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-animation',new RegExp(`^appearance\\.${hat}\\.${cape}\\.cra\\.`),{timeout:60000});
  await page.keyboard.press('i');const dialog=page.getByRole('dialog',{name:'Inventaire et équipement',exact:true});
  await dialog.getByRole('button',{name:set==='tofu'?'Tofu':'Scarafeuille Noir',exact:true}).click();
  await expect(dialog.locator('.item-cell')).toHaveCount(set==='tofu'?5:2);
  for(const icon of await dialog.locator('.item-cell img,.slot img').all()){
   const pixels=await icon.evaluate(async element=>{
    const image=element as HTMLImageElement;await image.decode();const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;
    const context=c.getContext('2d')!;context.drawImage(image,0,0);const data=context.getImageData(0,0,c.width,c.height).data;
    let opaque=0,clear=0;for(let i=3;i<data.length;i+=4){if(data[i]>128)opaque++;else clear++;}
    return {size:Math.max(c.width,c.height),ratio:opaque/(c.width*c.height),clear};
   });
   expect(pixels.size).toBeGreaterThanOrEqual(190);expect(pixels.ratio).toBeGreaterThan(0.1);expect(pixels.clear).toBeGreaterThan(0);
  }
  const preview=dialog.getByRole('img',{name:'Aperçu du Crâ équipé',exact:true});
  for(let direction=0;direction<8;direction++){
   await expect(preview.locator('.atlas-sprite')).toHaveAttribute('data-loaded','true');
   await dialog.getByRole('button',{name:'Tourner',exact:true}).click();
  }
  await page.screenshot({path:testInfo.outputPath(`${dungeon}-inventory-desktop.png`)});
  await page.setViewportSize({width:390,height:844});
  expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  await page.screenshot({path:testInfo.outputPath(`${dungeon}-inventory-mobile.png`)});
  await page.keyboard.press('i');await page.getByRole('button',{name:'Donjons',exact:true}).click();
  await page.getByRole('button',{name:`Entrer — ${dungeons[dungeon].name}`,exact:true}).click();
  await expect(canvas).toHaveAttribute('data-map',dungeon,{timeout:30000});
  await page.keyboard.press('e');await expect(canvas).toHaveAttribute('data-animation',new RegExp(`^appearance\\.${hat}\\.${cape}\\.cra\\.cast\\.[RL]$`));
  for(const size of [{width:390,height:844},{width:1440,height:900}]){
   await page.setViewportSize(size);
   await expect.poll(()=>canvas.evaluate(c=>{
    const [cl,cb,cr,ct]=JSON.parse(c.dataset.cameraBounds??'[]'),[l,b,r,t]=JSON.parse(c.dataset.mapBounds??'[]');
    return cl<=l+0.001&&cb<=b+0.001&&cr>=r-0.001&&ct>=t-0.001;
   })).toBe(true);
   await page.screenshot({path:testInfo.outputPath(`${dungeon}-map-${size.width}.png`)});
  }
  expect(errors).toEqual([]);
 });
}
