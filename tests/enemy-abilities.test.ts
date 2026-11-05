import {describe,it,expect} from 'vitest';
import {monsters} from '../src/data/monsters';
import {enemyMovementSpeed,speedBurstActive} from '../src/game/ai/speedBurst';
import {Simulation} from '../src/game/core/simulation';
import {Navigation} from '../src/game/movement/navigation';
import {newProfile} from '../src/game/progression/profile';
import {fixtureManifest,advance} from './helpers/world';

function encounter(kind:'royal'|'raulMops'){
 let saves=0;
 const game=new Simulation(fixtureManifest(),newProfile(),()=>{saves++;},42,0);game.phase='combat';game['spawn']([kind]);
 const enemy=game.enemies[0];enemy.position=[159,-135];game.player.position=[318,-135];enemy.attackAt=0;
 return {game,enemy,saves:()=>saves};
}
function launchedSpear(){
 const encounterState=encounter('raulMops'),{game,enemy}=encounterState;
 game.update(0.01);advance(game,0.47);expect(game.enemyShots).toHaveLength(1);enemy.attackAt=Infinity;
 return encounterState;
}

describe('accélération périodique du Bouftou Royal',()=>{
 it('double la vitesse pendant [5,6[, [10,11[ à partir de chaque apparition',()=>{
  const burst=monsters.royal.speedBurst;
  for(const age of [0,4.999,6,9.999,11])expect(speedBurstActive(burst,age)).toBe(false);
  for(const age of [5,5.999,10,10.999])expect(speedBurstActive(burst,age)).toBe(true);
  expect(monsters.royal.speed).toBe(49);
  expect(enemyMovementSpeed(monsters.royal,5,6)).toBe(98);
  expect(enemyMovementSpeed(monsters.royal,6,10)).toBe(49);
  expect(enemyMovementSpeed(monsters.chief,5,6)).toBe(monsters.chief.speed);
 });
 it('intègre exactement un pas chevauchant le début ou la fin du boost',()=>{
  for(const [from,to] of [[4.8,5.2],[5.8,6.2]])expect(enemyMovementSpeed(monsters.royal,from,to)*(to-from)).toBeCloseTo(49*0.6);
  expect(enemyMovementSpeed(monsters.royal,0,11)*11).toBeCloseTo(49*13);
 });
 it('applique le boost au déplacement réel, reprend la vitesse normale et fige le cycle en pause',()=>{
  const {game,enemy}=encounter('royal');enemy.attackAt=Infinity;enemy.pathAt=Infinity;
  const moveAt=(time:number)=>{game.time=time;enemy.position=[159,-135];enemy.route=[[318,-135]];game.update(0.1);return enemy.position[0]-159;};
  expect(moveAt(4.8)).toBeCloseTo(4.9);expect(moveAt(5)).toBeCloseTo(9.8);expect(moveAt(6)).toBeCloseTo(4.9);
  game.paused=true;const time=game.time,position=[...enemy.position];game.update(20);expect(game.time).toBe(time);expect(enemy.position).toEqual(position);
  game.paused=false;enemy.spawnedAt=game.time;expect(moveAt(game.time)).toBeCloseTo(4.9);
 });
});

describe('lance à distance de Raul Mops',()=>{
 it('prépare son lancer sans dégâts immédiats, puis touche après le temps de vol, une seule fois',()=>{
  const {game,enemy}=encounter('raulMops');enemy.damage=47;const hp=game.hp;
  game.update(0.01);expect(enemy.rangedTarget?.position).toEqual([318,-135]);expect(game.hp).toBe(hp);expect(game.enemyShots).toHaveLength(0);
  advance(game,0.47);enemy.attackAt=Infinity;expect(game.enemyShots).toHaveLength(1);expect(game.hp).toBe(hp);
  advance(game,0.3);expect(game.hp).toBe(hp);advance(game,0.4);expect(game.hp).toBe(hp-47);expect(game.enemyShots).toHaveLength(0);
  advance(game,2);expect(game.hp).toBe(hp-47);
 });
 it('vise la position au départ et permet d’esquiver ; la pause fige le projectile',()=>{
  const {game}=launchedSpear(),hp=game.hp,shot=game.enemyShots[0];
  game.paused=true;const position=[...shot.position];game.update(10);expect(shot.position).toEqual(position);
  game.paused=false;game.player.position=[318,-189];advance(game,0.8);
  expect(shot.target).toEqual([318,-135]);expect(game.hp).toBe(hp);expect(game.enemyShots).toHaveLength(0);
 });
 it('respecte la portée et la ligne de vue au lancement et les obstacles pendant le vol',()=>{
  const {game,enemy}=encounter('raulMops');game.player.position=[424,-135];game.update(0.01);expect(enemy.rangedTarget).toBeUndefined();expect(enemy.position[0]).toBeGreaterThan(159);
  const wall=new Navigation(fixtureManifest().hub.walkable!.filter(cell=>cell.position[0]<240||cell.position[0]>290));
  const blocked=encounter('raulMops');blocked.game.navigation=wall;blocked.game.update(0.01);expect(blocked.enemy.rangedTarget).toBeUndefined();
  const flying=launchedSpear(),hp=flying.game.hp;flying.game.navigation=wall;advance(flying.game,0.8);expect(flying.game.hp).toBe(hp);expect(flying.game.enemyShots).toHaveLength(0);
 });
 it('conserve la mêlée et partage le délai d’attaque avec le lancer',()=>{
  const {game,enemy}=encounter('raulMops');enemy.position=[300,-135];const hp=game.hp;
  game.update(0.01);expect(game.hp).toBe(hp-enemy.damage);expect(enemy.rangedTarget).toBeUndefined();
  enemy.position=[159,-135];game.update(0.5);expect(enemy.rangedTarget).toBeUndefined();expect(game.enemyShots).toHaveLength(0);
 });
 it('annule le lancer préparé à la mort du monstre et nettoie les projectiles au retour au hub',()=>{
  const {game,enemy}=encounter('raulMops');game.update(0.01);game['hit'](enemy,enemy.hp);advance(game,1);expect(game.enemyShots).toHaveLength(0);
  const flying=launchedSpear();flying.game.returnHub();expect(flying.game.enemyShots).toHaveLength(0);
 });
 it('déclenche la mort sur un impact létal sans dégâts ultérieurs ni perte de progression',()=>{
  const {game,saves}=launchedSpear();game.hp=1;game.profile.kamas=13;game.player.route=[[424,-135]];
  // Immobiliser le joueur pour recevoir le projectile.
  game.player.route=[];advance(game,0.8);expect(game.phase).toBe('death');expect(game.enemyShots).toHaveLength(0);expect(game.player.action).toBe('death');
  expect(game.profile.kamas).toBe(13);expect(saves()).toBeGreaterThan(0);advance(game,1);expect(game.hp).toBe(0);
 });
});
