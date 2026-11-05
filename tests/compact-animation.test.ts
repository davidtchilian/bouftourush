import {expect,it} from 'vitest';
import {compactAnimationFrames,framePixels} from '../scripts/compact-animation';
import {animationFrame} from '../src/game/rendering/animation';
import type {Animation} from '../src/game/assets/manifest';
it('réduit les pauses identiques sans changer une seule image affichée ni sa durée',()=>{
 const a={path:'atlas.png',region:[1,1,10,10,64,64] as [number,number,number,number,number,number],durationMs:20};
 const b={...a,region:[14,1,10,10,64,64] as typeof a.region,durationMs:30};
 const raw=[a,{...a},b,{...a,durationMs:10},{...a}],compact=compactAnimationFrames(raw);
 expect(compact).toHaveLength(3);expect(compact.map(f=>f.durationMs)).toEqual([40,30,30]);
 for(const loop of [true,false])for(let ms=0;ms<250;ms++)expect(framePixels(raw[animationFrame({frames:raw,loop},ms)])).toBe(framePixels(compact[animationFrame({frames:compact,loop},ms)]));
 expect(a.durationMs).toBe(20);compact[0].region![0]=30;expect(a.region[0]).toBe(1);
});
it('conserve les retours à une pose et les régions différentes d’un même atlas',()=>{
 const first={path:'atlas.png',region:[0,0,2,2,8,8] as [number,number,number,number,number,number],durationMs:25};
 const second={...first,region:[2,0,2,2,8,8] as typeof first.region};
 expect(compactAnimationFrames([first,second,first])).toHaveLength(3);
});
