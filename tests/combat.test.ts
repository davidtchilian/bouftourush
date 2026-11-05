import {describe,it,expect} from 'vitest';
import {damage,segmentDistance} from '../src/game/combat/damage';
import {Simulation} from '../src/game/core/simulation';
import {fixtureManifest,advance} from './helpers/world';
import {newProfile} from '../src/game/progression/profile';
import {auditProfile,combatDestination} from '../scripts/combat-audit';
import {items} from '../src/data/items';
import {spells,balance} from '../src/data/balance';
describe('combat déterministe',()=>{
 it('applique Puissance en pourcentage puis buff et résistance, arrondi inférieur',()=>{
  expect(damage(20,2,50)).toBe(60);expect(damage(17,1.2,25,1.6,0.2)).toBe(32);expect(damage(20,2,0)).toBe(40);
 });
 it('mesure le segment complet pour éviter de traverser un ennemi rapide',()=>expect(segmentDistance([50,4],[0,0],[100,0])).toBe(4));
 it('respecte le cooldown, la fenêtre de cast et l’expiration du buff',()=>{
  const game=new Simulation(fixtureManifest(),newProfile(),()=>{},42);game.phase='combat';
  expect(game.cast('power',[0,0])).toBe(true);expect(game.cast('magic',[400,-189])).toBe(false);
  advance(game,0.2);expect(game.cast('magic',[400,-189])).toBe(true);expect(game.cast('magic',[400,-189])).toBe(false);
  advance(game,balance.buffDuration);expect(game.snapshot().buffRemaining).toBe(0);expect(game.cast('power',[0,0])).toBe(false);
  advance(game,spells.power.cooldown);expect(game.cast('power',[0,0])).toBe(true);
 });
 it('permet l’entraînement au hub mais bloque les sorts en pause et après la mort',()=>{
  const game=new Simulation(fixtureManifest(),newProfile());expect(game.cast('magic',[400,-189])).toBe(true);
  game.phase='combat';game.paused=true;expect(game.cast('power',[0,0])).toBe(false);const time=game.time;advance(game,1);expect(game.time).toBe(time);
  game.paused=false;game.phase='death';expect(game.cast('power',[0,0])).toBe(false);
 });
 it('déclenche le buff immédiatement pendant une animation de tir',()=>{const game=new Simulation(fixtureManifest(),newProfile());expect(game.cast('magic',[424,-189])).toBe(true);expect(game.cast('power',[0,0])).toBe(true);expect(game.snapshot().buffRemaining).toBe(balance.buffDuration);});
 it('immobilise pendant le cast puis reprend la destination, même avec un nouveau clic',()=>{
  const game=new Simulation(fixtureManifest(),newProfile());game.phase='combat';game.move([371,-189]);game.cast('magic',[424,-189]);
  const position=[...game.player.position];game.update(0.06);game.move([424,-189]);game.update(0.05);expect(game.player.position).toEqual(position);
  game.update(0.02);expect(game.player.position[0]-318).toBeCloseTo(balance.playerSpeed*0.01);
  advance(game,0.1);expect(game.player.position[0]).toBeGreaterThan(318);expect(game.shots.length).toBe(1);
 });
 it('laisse les monstres se traverser et se superposer sans répulsion',()=>{
  const game=new Simulation(fixtureManifest(),newProfile());game.enter('incarnam');game.update(2);
  game.enemies=game.enemies.slice(0,2);
  for(const enemy of game.enemies){enemy.position=[159,-135];enemy.route=[[...game.player.position]];enemy.pathAt=Infinity;enemy.actionUntil=0;}
  game.update(0.1);
  expect(game.enemies[0].position).toEqual(game.enemies[1].position);
  expect(game.enemies[0].position).not.toEqual([159,-135]);
  expect(game.navigation.contains(game.enemies[0].position)).toBe(true);
 });
 it('termine les trois donjons, récompense chaque mort une seule fois et garde les gains',()=>{
  for(const dungeon of ['incarnam','bouftou','ensable'] as const){
   const profile=auditProfile(dungeon),owned=profile.inventory.length,game=new Simulation(fixtureManifest(),profile,()=>{},42,1);game.enter(dungeon);
   let nextInput=0;
   for(let t=0;t<240&&game.phase==='combat';t+=1/60){
    const enemy=game.enemies.find(e=>e.hp>0);
    if(enemy&&game.time>=nextInput){
     nextInput=game.time+0.15;const destination=combatDestination(game.navigation,game.player.position,game.enemies.filter(e=>e.hp>0));if(destination)game.move(destination);else game.player.route=[];
     for(const id of ['power','explosive','flaming','magic'] as const)game.cast(id,enemy.position);
    }
    game.update(1/60);
   }
   expect(game.phase,dungeon).toBe('victory');expect(game.director?.index).toBe(3);expect(profile.completed).toContain(dungeon);
   expect(profile.inventory.slice(owned).filter(instance=>items[instance.item].set!=='royalBouftou').length).toBe(game.kills);expect(profile.level).toBeGreaterThan(1);expect(profile.kamas).toBeGreaterThan(0);
   const kamas=profile.kamas;advance(game,3);expect(profile.kamas).toBe(kamas);game.returnHub();expect(game.hp).toBe(game.snapshot().maxHp);expect(profile.kamas).toBe(kamas);
  }
 });
 it('affiche le butin au-dessus du monstre avec son icône, puis l’efface',()=>{
  const game=new Simulation(fixtureManifest(),newProfile(),()=>{},42,1);game.enter('incarnam');advance(game,2);
  const enemy=game.enemies.find(e=>e.hp>0)!;game.enemies=[enemy];enemy.hp=1;expect(game.cast('magic',enemy.position)).toBe(true);advance(game,0.5);
  const label=game.floating.find(f=>f.kind==='loot');expect(label).toBeDefined();expect(label!.text).not.toContain('Butin');expect(label!.icon).toMatch(/^item\./);
  advance(game,2);expect(game.floating.some(f=>f.kind==='loot')).toBe(false);
 });
 it('la mort conserve les gains et recommencer réinitialise les vagues',()=>{
  const profile=newProfile(),game=new Simulation(fixtureManifest(),profile,()=>{},42);game.enter('incarnam');profile.kamas=12;
  advance(game,2);game.hp=1;
  for(const enemy of game.enemies){enemy.position=[...game.player.position];enemy.attackAt=0;}
  advance(game,0.1);expect(game.phase).toBe('death');expect(profile.kamas).toBe(12);game.enter('incarnam');expect(game.phase).toBe('combat');expect(game.director?.index).toBe(-1);expect(game.hp).toBe(game.snapshot().maxHp);
 });
});
it('ne réutilise pas un identifiant de butin après rechargement avec la même graine',()=>{
 const profile=newProfile();profile.inventory.push({uid:'drop-42-1000',item:'2411'});
 const game=new Simulation(fixtureManifest(),profile,()=>{},42,1);game.enter('incarnam');
 for(let t=0;t<10&&profile.inventory.length===1;t+=1/30){const enemy=game.enemies.find(e=>e.hp>0);if(enemy)game.cast('explosive',enemy.position);game.update(1/30);}
 expect(profile.inventory.length).toBeGreaterThan(1);expect(new Set(profile.inventory.map(i=>i.uid)).size).toBe(profile.inventory.length);
 expect(profile.inventory.slice(1).every(i=>Number(i.uid.split('-').at(-1))>1000)).toBe(true);
});

it('attribue et sauvegarde le bonus royal une seule fois par mort, en normal et en Extrême',()=>{
 for(const mode of ['normal','extreme'] as const){
  const profile=newProfile();let saved=0;
  const game=new Simulation(fixtureManifest(),profile,()=>{saved++;},42,0);game.enter('bouftou',mode);
  for(let wave=0;wave<4;wave++){game.update(2);if(wave<3)for(const enemy of game.enemies)enemy.hp=0;}
  const royal=game.enemies.find(enemy=>enemy.kind==='royal')!;
  game['random']=()=>0;
  game['hit'](royal,royal.hp);
  expect(profile.inventory.map(instance=>items[instance.item].set)).toEqual(['royalBouftou']);
  const inventory=structuredClone(profile.inventory),kamas=profile.kamas,saves=saved;
  game['hit'](royal,999999);expect(profile.inventory).toEqual(inventory);expect(profile.kamas).toBe(kamas);expect(saved).toBe(saves);
  expect(saves).toBeGreaterThan(0);
 }
});
