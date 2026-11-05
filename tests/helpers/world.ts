import type {Manifest,MapDefinition} from '../../src/game/assets/manifest';
import {Simulation} from '../../src/game/core/simulation';
export function fixtureManifest():Manifest{
 const walkable=[];let id=0;
 for(let row=0;row<21;row++)for(let col=0;col<(row%2?14:15);col++)walkable.push({id:id++,position:[col*53+(row%2?26.5:0),-row*13.5] as [number,number]});
 const map:MapDefinition={bounds:[0,-432,742,0],spawn:[318,-189],cameraHeight:432,layers:[],walkable,enemySpawns:[[159,-135],[212,-162],[265,-135],[371,-108],[424,-135]]};
 return {version:1,assets:{},hub:map,maps:{incarnam:map,bouftou:map,ensable:map,tofu:map,scara:map},gameplayReady:true};
}
export function advance(game:Simulation,seconds:number){for(let t=0;t<seconds;t+=1/60)game.update(1/60);}
