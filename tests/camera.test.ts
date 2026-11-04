import {describe,it,expect} from 'vitest';
import {fitMapView} from '../src/game/rendering/camera';

describe('cadrage intégral des cartes',()=>{
 for(const [width,height] of [[1440,720],[390,600],[1800,400]]){
  it(`conserve les quatre bords à ${width} × ${height}`,()=>{
   // cameraHeight peut être inférieur à la carte : aucun bord ne doit disparaître.
   const map={bounds:[0,-432,742,0] as [number,number,number,number],cameraHeight:300};
   const view=fitMapView(map,width,height);
   expect(view.x-view.halfWidth).toBeLessThanOrEqual(0.00001);
   expect(view.x+view.halfWidth).toBeGreaterThanOrEqual(742-0.00001);
   expect(view.y-view.halfHeight).toBeLessThanOrEqual(-432+0.00001);
   expect(view.y+view.halfHeight).toBeGreaterThanOrEqual(-0.00001);
   expect(view.halfWidth/view.halfHeight).toBeCloseTo(width/height);
  });
 }
});
