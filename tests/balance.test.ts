import {describe,it,expect} from 'vitest';
import {balance,spells} from '../src/data/balance';
import {dungeons,waveMultipliers} from '../src/data/dungeons';
import {items} from '../src/data/items';
import {monsters} from '../src/data/monsters';
import {cooldownFor} from '../src/game/combat/cooldowns';
import {Simulation} from '../src/game/core/simulation';
import {newProfile,equip,finalStats} from '../src/game/progression/profile';
import {seededRandom,weightedLoot} from '../src/game/progression/loot';
import {fixtureManifest} from './helpers/world';
function fullSet(set:string){const p=newProfile();for(const item of Object.values(items).filter(item=>item.set===set)){p.inventory.push({uid:item.id,item:item.id});equip(p,item.id);}return p;}
describe('paliers, panoplies et difficulté croissante',()=>{
 it('donne une progression de puissance nette Aventurier → Mousse → Bouftou',()=>{
  const adventurer=finalStats(fullSet('adventurer')),mousse=finalStats(fullSet('mousse')),bouftou=finalStats(fullSet('bouftou'));
  expect(adventurer).toEqual({hp:320,power:50,cooldownReduction:0});expect(mousse).toEqual({hp:440,power:110,cooldownReduction:15});expect(bouftou).toEqual({hp:640,power:260,cooldownReduction:0});
  // Même au niveau maximum, Bouftou reste devant Mousse sur le débit de dégâts.
  const basePower=99*balance.powerPerLevel;expect(1+(basePower+bouftou.power)/100).toBeGreaterThan((1+(basePower+mousse.power)/100)/0.85);
 });
 it('recalcule la recharge des pièces et du meilleur seuil sans accumulation ni soin',()=>{
  const p=fullSet('mousse'),game=new Simulation(fixtureManifest(),p);game.hp=100;
  for(let i=0;i<20;i++)game.equipItem('8258');expect(game.snapshot().cooldownReduction).toBe(15);expect(game.hp).toBe(100);
  game.unequip('cape');expect(game.snapshot().cooldownReduction).toBe(12);
  for(const slot of Object.keys(p.equipment))game.unequip(slot as keyof typeof p.equipment);
  expect(finalStats(p).cooldownReduction).toBe(0);expect(game.hp).toBe(100);
 });
 it('deux anneaux donnent leurs stats mais ne doublent pas un seuil de panoplie',()=>{
  const p=newProfile();p.inventory=[{uid:'one',item:'8254'},{uid:'two',item:'8254'}];equip(p,'one','ring1');equip(p,'two','ring2');
  expect(finalStats(p)).toEqual({hp:216,power:12,cooldownReduction:2});
 });
 it('réduit les quatre sorts, borne la réduction et fixe le délai au lancement',()=>{
  for(const id of ['explosive','flaming','magic','power'] as const)expect(cooldownFor(id,15)).toBeCloseTo(spells[id].cooldown*0.85);
  expect(cooldownFor('magic',100)).toBeCloseTo(spells.magic.cooldown*0.7);expect(cooldownFor('magic',-10)).toBe(spells.magic.cooldown);
  const game=new Simulation(fixtureManifest(),fullSet('mousse'));expect(game.cast('magic',[424,-189])).toBe(true);expect(game.snapshot().cooldowns.magic).toBeCloseTo(0.408);
  game.unequip('cape');expect(game.snapshot().cooldowns.magic).toBeCloseTo(0.408);game.update(0.407);expect(game.cast('magic',[424,-189])).toBe(false);
  game.update(0.002);expect(game.cast('magic',[424,-189])).toBe(true);expect(game.snapshot().cooldowns.magic).toBeCloseTo(0.48*0.88);
 });
 it('augmente effectifs, PV et dégâts par vague et conserve toutes les vitesses',()=>{
  expect((['incarnam','ensable','bouftou'] as const).map(id=>dungeons[id]).map(d=>d.tier)).toEqual([1,2,3]);
  expect((['incarnam','ensable','bouftou'] as const).map(id=>dungeons[id]).map(d=>[...d.normalWaves,d.bossWave].reduce((n,w)=>n+w.length,0))).toEqual([30,38,46]);
  for(const dungeon of (['incarnam','ensable','bouftou'] as const).map(id=>dungeons[id])){
   expect(dungeon.normalWaves.map(w=>w.length)).toEqual([...dungeon.normalWaves.map(w=>w.length)].sort((a,b)=>a-b));
   for(let wave=1;wave<4;wave++){expect(waveMultipliers(dungeon,wave).hp).toBeGreaterThan(waveMultipliers(dungeon,wave-1).hp);expect(waveMultipliers(dungeon,wave).damage).toBeGreaterThan(waveMultipliers(dungeon,wave-1).damage);}
  }
  expect(Object.fromEntries(Object.entries(monsters).filter(([,m])=>!['tofu','blackScara','chefBwork','blopMulti'].includes(items[m.loot[0].item].set)).map(([id,m])=>[id,m.speed]))).toEqual({white:54,black:56,bouftou:51,chief:64,royal:49,milimilou:64,chafer:48,youngWhite:51,youngBlack:53,smallBouftou:49,crabe:44,etoileMer:41,pichonBlanc:51,pichonBleu:51,pichonVert:51,pichonOrange:51,pichonKloune:53,raulMops:55,sponge:48});expect(balance.playerSpeed).toBe(95);
 });
 it('applique les multiplicateurs au combat et répartit les apparitions sans empilement',()=>{
  const game=new Simulation(fixtureManifest(),newProfile());game.enter('bouftou');
  for(let wave=0;wave<4;wave++){
   game.update(2);const multiplier=waveMultipliers(dungeons.bouftou,wave);
   for(const enemy of game.enemies){expect(enemy.hp).toBe(Math.round(monsters[enemy.kind].hp*multiplier.hp));expect(enemy.damage).toBe(Math.round(monsters[enemy.kind].damage*multiplier.damage));expect(game.navigation.contains(enemy.position)).toBe(true);}
   expect(new Set(game.enemies.map(e=>e.position.join(','))).size).toBe(game.enemies.length);
   for(const enemy of game.enemies)enemy.hp=0;
  }
 });
 it('réduit le loot total malgré les groupes plus nombreux et demande plusieurs expéditions',()=>{
  for(const dungeon of (['incarnam','ensable','bouftou'] as const).map(id=>dungeons[id])){
   const enemies=[...dungeon.normalWaves.flat(),...dungeon.bossWave].map(id=>monsters[id]),random=seededRandom(7331);
   const expected=enemies.reduce((n,m)=>n+(m.boss?dungeon.loot.bossChance:dungeon.loot.normalChance),0);expect(expected).toBeGreaterThan(1);expect(expected).toBeLessThan(2);
   const unique=new Set(enemies.flatMap(m=>m.loot.map(drop=>drop.item))),runs:number[]=[];let firstClear=0;
   for(let sample=0;sample<500;sample++){
    const owned=new Set<string>();let count=0;
    while(owned.size<unique.size&&count<300){count++;for(const enemy of enemies){const drop=weightedLoot(enemy.loot,enemy.boss?dungeon.loot.bossChance:dungeon.loot.normalChance,random);if(drop)owned.add(drop);}if(count===1&&owned.size===unique.size)firstClear++;}
    runs.push(count);
   }
   expect(firstClear).toBeLessThan(5);expect(runs.reduce((n,r)=>n+r,0)/runs.length).toBeGreaterThan(6);expect(Math.max(...runs)).toBeLessThan(300);
  }
 });
});
