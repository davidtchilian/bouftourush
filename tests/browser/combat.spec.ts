import {readFileSync,existsSync} from 'node:fs';
import {test,expect} from '@playwright/test';
import {parseManifest} from '../../src/game/assets/manifest';
import {Navigation,type Point} from '../../src/game/movement/navigation';
import {auditProfile,combatDestination} from '../../scripts/combat-audit';
import {dungeons,type DungeonId} from '../../src/data/dungeons';
const installed=existsSync('public/assets/manifest.json');
for(const dungeon of Object.keys(dungeons) as DungeonId[]){
 test(`${dungeon} : hub → quatre vagues et boss → récompenses → équipement et sauvegarde`,async({page},testInfo)=>{
  test.setTimeout(120000);test.skip(!installed,'Assets locaux nécessaires.');
  const manifest=parseManifest(JSON.parse(readFileSync('public/assets/manifest.json','utf8')));test.skip(!manifest.gameplayReady,'Assets de combat nécessaires.');
  const profile=auditProfile(dungeon);
  await page.addInitScript(profile=>{if(!localStorage.getItem('bouftourush.save.v1'))localStorage.setItem('bouftourush.save.v1',JSON.stringify({version:1,profile}));},profile);
  // Le hasard devient reproductible dans ce navigateur, sans modifier les taux de production.
  await page.addInitScript(()=>{Date.now=()=>42;});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.getByRole('button',{name:'Donjons',exact:true}).click();
  await page.getByRole('button',{name:`Entrer — ${dungeons[dungeon].name}`,exact:true}).click();
  const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-map',dungeon);
  const map=manifest.maps![dungeon],navigation=new Navigation(map.walkable!),rect=(await canvas.boundingBox())!;
  const [left,bottom,right,top]=map.bounds,scale=rect.height/Math.max(map.cameraHeight,(right-left)*rect.height/rect.width);
  const screen=(p:Point)=>({x:rect.x+rect.width/2+(p[0]-(left+right)/2)*scale,y:rect.y+rect.height/2-(p[1]-(bottom+top)/2)*scale});
  let moving=false,sawBoss=false,sawProjectile=false;const deadline=Date.now()+90000;
  while(Date.now()<deadline&&(await canvas.getAttribute('data-phase'))==='combat'){
   const state=await canvas.evaluate(c=>({x:Number(c.dataset.playerX),y:Number(c.dataset.playerY),enemies:JSON.parse(c.dataset.enemies??'[]') as {id:number;kind:string;x:number;y:number;hp:number}[],projectiles:Number(c.dataset.projectiles)}));
   sawProjectile ||= state.projectiles>0;sawBoss ||= state.enemies.some(e=>e.kind===dungeons[dungeon].bossWave[0]);
   const enemy=state.enemies.sort((a,b)=>Math.hypot(a.x-state.x,a.y-state.y)-Math.hypot(b.x-state.x,b.y-state.y))[0];
   if(enemy){
    const player:Point=[state.x,state.y],target:Point=[enemy.x,enemy.y];
    const destination=combatDestination(navigation,player,state.enemies.map(enemy=>({position:[enemy.x,enemy.y] as Point})));
    if(destination){const point=screen(destination);await page.mouse.click(point.x,point.y,{button:'right'});moving=true;}
    else if(moving){const point=screen(player);await page.mouse.click(point.x,point.y,{button:'right'});moving=false;}
    const aim=screen(target);await page.mouse.move(aim.x,aim.y);
    for(const key of ['r','a','z','e'])await page.keyboard.press(key);
   }
   await page.waitForTimeout(150); // Cadence d'entrée du joueur simulé, les règles restent en temps réel.
  }
  await testInfo.attach('combat-final.json',{body:JSON.stringify(await canvas.evaluate(c=>({...c.dataset}))),contentType:'application/json'});
  await expect(page.getByRole('dialog',{name:'Victoire',exact:true})).toBeVisible();expect(sawBoss).toBe(true);expect(sawProjectile).toBe(true);
  await page.getByRole('button',{name:'Voir l’inventaire',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Inventaire et équipement',exact:true});await expect(dialog).toBeVisible();
  const item=dialog.locator('.item-cell').first();await expect(item).toBeVisible();const itemName=(await item.getAttribute('aria-label'))!;await item.click();
  await dialog.getByRole('button',{name:/^Équiper/}).first().click();await expect(dialog.locator('.equipment-slot').getByRole('img',{name:itemName,exact:true})).toBeVisible();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('bouftourush.save.v1')??'null'));
  expect(saved.version).toBe(1);expect(saved.profile.kamas).toBeGreaterThan(0);expect(saved.profile.completed).toContain(dungeon);expect(Object.keys(saved.profile.equipment).length).toBeGreaterThan(0);
  await page.reload();await expect(page.getByRole('button',{name:'Donjons',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Inventaire (I)',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Inventaire et équipement'}).locator('.equipment-slot').getByRole('img',{name:itemName,exact:true})).toBeVisible();
  expect(errors).toEqual([]);
 });
}
