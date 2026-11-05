import { expect,it } from 'vitest';
import { Navigation } from '../src/game/movement/navigation';
import {readFileSync} from 'node:fs';
import type {Cell,Point} from '../src/game/movement/navigation';
it('parcourt la zone libre en continu vers le curseur',()=>{
 const n=new Navigation([{id:0,position:[0,0]},{id:1,position:[26.5,13.5]},{id:2,position:[53,0]}]);
 const route=n.route([0,0],[52,0]);
 expect(route.length).toBeGreaterThan(0);
 let last:[number,number]=[0,0];
 for(const point of route){expect(n.clear(last,point)).toBe(true);last=point;}
});
it('ne traverse pas un trou de collision',()=>{
 const n=new Navigation([{id:0,position:[0,0]},{id:1,position:[106,0]}]);
 expect(n.route([0,0],[106,0])).toEqual([]);
 expect(n.clear([0,0],[106,0])).toBe(false);
});
it('ramène un clic extérieur vers une cellule autorisée',()=>{
 const n=new Navigation([{id:0,position:[0,0]}]);
 expect(n.route([0,0],[500,500])).toEqual([[0,0]]);
});
type ReviewedCell=Cell&{assetId:string};
const manifest=JSON.parse(readFileSync('public/assets/manifest.json','utf8'));
const rules=JSON.parse(readFileSync('scripts/map-navigation.json','utf8'));
for(const mapId of ['hub','incarnam','bouftou','ensable','tofu','scara']){
 it(`${mapId} : traverse les décors depuis le spawn et respecte obstacles et limites`,()=>{
  const map=(mapId==='hub'?manifest.hub:manifest.maps[mapId]) as {walkable:Cell[];spawn:Point;enemySpawns?:Point[];layers:{assetId:string;position:Point;order:number}[]};
  const n=new Navigation(map.walkable);
  expect(n.contains(map.spawn)).toBe(true);
  for(const cell of rules.maps[mapId].passable as ReviewedCell[]){
   const [x,y]=cell.position;
   expect(n.clear([x-6,y],[x+6,y]),`décor ${cell.id}`).toBe(true);
   expect(n.route(map.spawn,cell.position).length,`accès décor ${cell.id}`).toBeGreaterThan(0);
  }
  for(const cell of rules.maps[mapId].outside as ReviewedCell[])expect(n.contains(cell.position),`limite ${cell.id}`).toBe(false);
  for(const layer of map.layers){
   if(rules.objects[layer.assetId]?.kind==='obstacle'){
    expect(n.contains(layer.position),`obstacle ${layer.assetId} à ${layer.position}`).toBe(false);
    const [x,y]=layer.position;
    expect(n.clear([x-6,y],[x+6,y])).toBe(false);
   }
  }
  for(const spawn of map.enemySpawns??[]){expect(n.contains(spawn)).toBe(true);expect(n.route(map.spawn,spawn).length).toBeGreaterThan(0);}
 });
}
it('distingue les buissons des statues du Bouftou Royal et les barrières des accessoires de plage',()=>{
 const bouftou=new Navigation(manifest.maps.bouftou.walkable),beach=new Navigation(manifest.maps.ensable.walkable);
 for(const point of [[424,-108],[185.5,-148.5],[503.5,-310.5]] as Point[])expect(bouftou.contains(point)).toBe(true);
 for(const point of [[185.5,-337.5],[238.5,-364.5]] as Point[])expect(bouftou.contains(point)).toBe(false);
 expect(beach.contains([265,-108])).toBe(true); // Ballon décoratif.
 expect(beach.contains([185.5,-337.5])).toBe(true); // Étoile de mer.
 expect(beach.contains([212,-189])).toBe(false); // Barrière physique.
});
