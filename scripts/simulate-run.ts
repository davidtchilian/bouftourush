/** Audit avec les cartes/règles de production et un équipement adapté au palier. */
import {readFile} from 'node:fs/promises';
import {parseManifest} from '../src/game/assets/manifest';
import {Simulation} from '../src/game/core/simulation';
import {auditProfile,combatDestination} from './combat-audit';
import {dungeons,type DungeonId} from '../src/data/dungeons';
const manifest=parseManifest(JSON.parse(await readFile(process.argv[2]??'public/assets/manifest.json','utf8')));
for(const dungeon of Object.keys(dungeons) as DungeonId[]){
 const profile=auditProfile(dungeon),initialItems=profile.inventory.length,game=new Simulation(manifest,profile,()=>{},42);game.enter(dungeon);
 let nextInput=0;
 while(game.time<240&&game.phase==='combat'){
  if(game.time>=nextInput){
   nextInput=game.time+0.15;
   const enemies=game.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.position[0]-game.player.position[0],a.position[1]-game.player.position[1])-Math.hypot(b.position[0]-game.player.position[0],b.position[1]-game.player.position[1]));
   const enemy=enemies[0];
   if(enemy){
    const destination=combatDestination(game.navigation,game.player.position,enemies);if(destination)game.move(destination);else game.player.route=[];
    for(const spell of ['power','explosive','flaming','magic'] as const)game.cast(spell,enemy.position);
   }
  }
  game.update(1/60);
 }
 console.log(JSON.stringify({dungeon,phase:game.phase,time:Math.round(game.time*10)/10,hp:game.hp,wave:game.snapshot().wave,kills:game.kills,level:profile.level,kamas:profile.kamas,drops:profile.inventory.slice(initialItems).map(i=>i.item)}));
 if(game.phase!=='victory')process.exitCode=1;
}
