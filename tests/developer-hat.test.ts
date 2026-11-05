import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
import {developerHatId} from '../src/data/developerItem';
import {items} from '../src/data/items';
import {spells,balance} from '../src/data/balance';
import {newProfile,equip,finalStats,movementSpeedBonus,equipmentLimits} from '../src/game/progression/profile';
import {Simulation} from '../src/game/core/simulation';
import {cooldownFor} from '../src/game/combat/cooldowns';
import {composeActor} from '../src/game/rendering/composition';
import {parseManifest} from '../src/game/assets/manifest';
import {saveProfile,loadProfile} from '../src/game/save/persistence';
import {monsters} from '../src/data/monsters';
import {fixtureManifest} from './helpers/world';
function equipped(){const profile=newProfile();profile.inventory=[{uid:'dev',item:developerHatId}];equip(profile,'dev');return profile;}
it('accorde exactement les bonus demandés, avec plafonds administratifs uniquement lorsque la coiffe est portée',()=>{
 const profile=equipped();expect(items[developerHatId].name).toBe('Coiffe du dev');
 expect(finalStats(profile)).toEqual({hp:10180,power:10000,cooldownReduction:90});expect(movementSpeedBonus(profile)).toBe(150);
 for(let i=0;i<10;i++)equip(profile,'dev');expect(finalStats(profile).hp).toBe(10180);
 delete profile.equipment.hat;
 expect(finalStats(profile)).toEqual({hp:180,power:0,cooldownReduction:0});expect(movementSpeedBonus(profile)).toBe(0);
 expect(equipmentLimits(profile)).toEqual({movementSpeed:60,cooldownReduction:30});
});
it('applique +150 % à la vitesse réelle et −90 % au délai des quatre sorts',()=>{
 const game=new Simulation(fixtureManifest(),equipped());game.move([424,-189]);game.update(0.1);
 expect(game.player.position[0]-318).toBeCloseTo(balance.playerSpeed*2.5*0.1);
 for(const id of ['explosive','flaming','magic','power'] as const){
  const game=new Simulation(fixtureManifest(),equipped());expect(game.cast(id,[424,-189])).toBe(true);
  expect(game.snapshot().cooldowns[id]).toBeCloseTo(spells[id].cooldown*0.1);
 }
 expect(cooldownFor('magic',100)).toBeCloseTo(spells.magic.cooldown*0.7);
});
it('conserve la coiffe dans la sauvegarde, sans ajouter cet objet aux butins',()=>{
 const profile=equipped();let raw='';const storage={getItem:()=>raw,setItem:(_key:string,value:string)=>{raw=value;}};
 saveProfile(storage,profile);expect(loadProfile(storage)).toEqual({profile});
 for(const monster of Object.values(monsters))expect(monster.loot.some(drop=>drop.item===developerHatId)).toBe(false);
});
it('utilise le Champion Remastered pour l’icône et toutes les attaches du Crâ, y compris avec des capes mixtes',()=>{
 const manifest=parseManifest(JSON.parse(readFileSync('public/assets/manifest.json','utf8')));
 expect(manifest.assets['item.devHat'].provenance.originalFile).toBe('clips/items/16/127.swf');
 for(const cape of ['none',...Object.entries(manifest.composition!.accessories).filter(([,a])=>a.slot==='cape').map(([id])=>id)]){
  for(const [id,actor] of Object.entries(manifest.composition!.actors)){
   let time=0;for(const frame of actor.frames){
    for(const layer of composeActor(manifest,id,{hat:developerHatId,cape},time))expect(manifest.assets[layer.assetId],`${id} ${cape} ${layer.assetId}`).toBeTruthy();
    time+=frame.durationMs;
   }
  }
 }
 for(const view of Object.values(manifest.composition!.accessories.devHat.views)){
  expect(manifest.assets[view].provenance.originalFile).toMatch(/^clips\/sprites\/accessories\/a1.swf#16_127:/);
  expect(manifest.assets[`preview.${view}`]).toBeTruthy();
 }
});
