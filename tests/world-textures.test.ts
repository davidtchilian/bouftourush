import {expect,it} from 'vitest';
import {worldTexturePaths} from '../src/game/assets/worldTextures';
import {fixtureManifest} from './helpers/world';
import type {Animation} from '../src/game/assets/manifest';
const asset=(path:string)=>({frames:[{path,durationMs:100}]} as Animation);
it('charge le Crâ, ses sorts et la carte courante sans précharger les autres familles ni les portraits',()=>{
 const manifest=fixtureManifest();manifest.assets={
  'piece.body':asset('shared.png'),'spell.magic.projectile':asset('spell.png'),
  'map.floor':asset('floor.png'),'map.other':asset('other.png'),
  'mob.1558.run.R':asset('tofu.png'),'mob.1455.run.R':asset('scara.png'),
  'preview.mob.1558.run.R':asset('portrait.png'),'item.8114':asset('item.png'),
 };
 const map={...manifest.hub,layers:[{assetId:'map.floor',position:[0,0] as [number,number],order:0,flipX:false,rotation:0,scale:[1,1] as [number,number]}]};
 expect(worldTexturePaths(manifest,map,new Set(['tofu'])) .sort()).toEqual(['floor.png','shared.png','spell.png','tofu.png']);
});
it('inclut le lancer original et la lance de Raul Mops, sans requête répétée pour un atlas partagé',()=>{
 const manifest=fixtureManifest();manifest.assets={
  'piece.body':asset('shared.png'),'piece.hat':asset('shared.png'),
  'mob.1481.idle.R':asset('mops.png'),'mob.1481.throw.R':asset('throw.png'),
  'mob.1481.throw.L':asset('throw.png'),'spell.raulMops.spear':asset('spear.png'),
 };
 expect(worldTexturePaths(manifest,{...manifest.hub,layers:[]},['raulMops']).sort()).toEqual(['mops.png','shared.png','spear.png','throw.png']);
});
it('utilise le fond composé et garde les objets de premier plan indépendants',()=>{
 const manifest=fixtureManifest();manifest.assets={'map.floor':asset('raw-floor.png'),'map.front':asset('front.png'),'map.baked':asset('baked.png')};
 const layer={position:[0,0] as [number,number],order:100,flipX:false,rotation:0,scale:[1,1] as [number,number]};
 const map={...manifest.hub,backgroundAssetId:'map.baked',layers:[{...layer,assetId:'map.floor'},{...layer,assetId:'map.front',order:2200}]};
 expect(worldTexturePaths(manifest,map,[]).sort()).toEqual(['baked.png','front.png']);
 expect(map.layers).toHaveLength(2);
});
