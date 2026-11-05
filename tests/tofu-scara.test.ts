import {expect,it} from 'vitest';
import {dungeons,dungeonModes} from '../src/data/dungeons';
import {items,sets} from '../src/data/items';
import {monsters} from '../src/data/monsters';
import {equip,finalStats,movementSpeedBonus,newProfile} from '../src/game/progression/profile';
for(const id of ['tofu','scara'] as const){
 it(`${id} : trois vagues, boss authentique et butin de la bonne panoplie`,()=>{
  const dungeon=dungeons[id];expect(dungeon.normalWaves).toHaveLength(3);
  expect(dungeon.bossWave.filter(kind=>monsters[kind].boss)).toHaveLength(1);
  for(const kind of [...dungeon.normalWaves.flat(),...dungeon.bossWave])for(const drop of monsters[kind].loot)expect(items[drop.item].set).toBe(dungeon.rewardSet);
  expect(dungeonModes.extreme.completeSet).toBe(true);
 });
}
it('différencie les panoplies complètes : Tofu mobile, Scarafeuille robuste',()=>{
 const profiles=['tofu','blackScara'].map(set=>{
  const p=newProfile();for(const item of Object.values(items).filter(i=>i.set===set)){p.inventory.push({uid:item.id,item:item.id});equip(p,item.id);}return p;
 });
 const [tofu,scara]=profiles;expect(movementSpeedBonus(tofu)).toBeGreaterThan(movementSpeedBonus(scara));
 expect(finalStats(scara).hp).toBeGreaterThan(finalStats(tofu).hp);expect(finalStats(scara).power).toBeGreaterThan(finalStats(tofu).power);
 expect(finalStats(tofu).cooldownReduction).toBeGreaterThan(finalStats(scara).cooldownReduction);
 expect(Object.keys(sets.blackScara.thresholds)).toEqual(['2','3','4']);
});

it.each([['8114','8112'],['8133','8134']])('%s/%s : compose les accessoires avec chaque panoplie et chaque frame du Crâ',async(newHat,newCape)=>{
 const {readFileSync}=await import('node:fs');
 const {parseManifest}=await import('../src/game/assets/manifest');
 const {composeActor}=await import('../src/game/rendering/composition');
 const manifest=parseManifest(JSON.parse(readFileSync('public/assets/manifest.json','utf8')));
 const hats=['none','2411','2474','8259','2438','8114','8133'],capes=['none','2414','2473','8258','2445','8112','8134'];
 for(const hat of hats)for(const cape of capes){
  if(hat!==newHat&&cape!==newCape)continue;
  for(const [id,actor] of Object.entries(manifest.composition!.actors)){
   let time=0;for(const frame of actor.frames){
    for(const layer of composeActor(manifest,id,{hat,cape},time)){
     if(!manifest.assets[layer.assetId])throw new Error(`${id} : pièce absente ${hat}/${cape}`);
     if(id.startsWith('cra.idle.')&&!manifest.assets[`preview.${layer.assetId}`])throw new Error(`Aperçu HD absent : ${layer.assetId}`);
    }
    time+=frame.durationMs;
   }
  }
 }
});

it('garde les portraits HD des nouveaux boss cadrés sur toute leur animation',async()=>{
 const {readFileSync}=await import('node:fs');
 const {parseManifest}=await import('../src/game/assets/manifest');
 const manifest=parseManifest(JSON.parse(readFileSync('public/assets/manifest.json','utf8')));
 for(const sprite of ['1380','1455'])for(const action of ['idle','attack']){
  const game=manifest.assets[`mob.${sprite}.${action}.R`],preview=manifest.assets[`preview.mob.${sprite}.${action}.R`];
  expect(preview.frames).toHaveLength(game.frames.length);
  expect(preview.size).toEqual(game.size);expect(preview.pivot).toEqual(game.pivot);
  for(const frame of preview.frames){
   const bytes=frame.region?null:readFileSync(`public/assets/${frame.path}`);
   const width=frame.region?.[2]??bytes!.readUInt32BE(16),height=frame.region?.[3]??bytes!.readUInt32BE(20);
   expect(width).toBeGreaterThanOrEqual(preview.size[0]*6);
   expect(height).toBeGreaterThanOrEqual(preview.size[1]*6);
  }
 }
});
