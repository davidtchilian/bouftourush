import {describe,it,expect} from 'vitest';
import {parseManifest,requiredIds,type Manifest} from '../src/game/assets/manifest';
import {composeActor,layerBounds} from '../src/game/rendering/composition';
const identity=[1,0,0,1,0,0];
function fixture():Manifest{
 const asset={frames:[{path:'piece.png',durationMs:100},{path:'piece.png',durationMs:200}],pivot:[0.5,1],size:[20,30],offset:[0,0],loop:true,provenance:{source:'Dofedex',version:'1.40.13-remastered',originalFile:'clips/sprites/90.swf#staticS',conversion:'export vectoriel local',usageRights:'Usage local'}};
 const assets=Object.fromEntries([...requiredIds,'body','hair','hat','cape','bow'].map(id=>[id,structuredClone(asset)]));
 const accessories=Object.fromEntries([['2411','hat'],['2474','hat'],['8259','hat'],['2414','cape'],['2473','cape'],['8258','cape'],['bow','bow']].map(([id,slot])=>[id,{slot,views:{R:slot}}]));
 const layers=[{slot:'cape',label:'R',matrix:[1,0.2,0.3,1,5,-12]},{assetId:'body',matrix:identity},{assetId:'hair',matrix:identity,hideWithHat:true},{slot:'hat',label:'R',matrix:[1,0,0,1,0,-30]}];
 return parseManifest({version:1,assets,hub:{bounds:[0,0,100,100],spawn:[50,50],cameraHeight:100},composition:{version:1,accessories,actors:{'cra.idle.south':{loop:true,flipX:false,frames:[{durationMs:100,layers},{durationMs:200,layers}]}}}});
}
describe('composition indépendante Remastered',()=>{
 it('préserve l’ordre cape/corps/cheveux/coiffe et les matrices source',()=>{
  const manifest=fixture();const layers=composeActor(manifest,'cra.idle.south',{hat:'2411',cape:'2414'},0);
  expect(layers.map(l=>l.assetId)).toEqual(['cape','body','hat']);expect(layers[0].matrix).toEqual([1,0.2,0.3,1,5,-12]);
 });
 it('rétablit les cheveux dès le retrait et accepte les équipements mixtes sans variante',()=>{
  const manifest=fixture();expect(composeActor(manifest,'cra.idle.south',{hat:'none',cape:'none'},0).map(l=>l.assetId)).toEqual(['body','hair']);
  expect(composeActor(manifest,'cra.idle.south',{hat:'2474',cape:'2414'},0).map(l=>l.assetId)).toEqual(['cape','body','hat']);
  expect(Object.keys(manifest.assets).some(id=>id.startsWith('appearance.'))).toBe(false);
 });
 it('sélectionne les cycles imbriqués à la frame source et respecte le bouclage',()=>{
  const manifest=fixture();const equipment={hat:'2411',cape:'2414'};
  expect(composeActor(manifest,'cra.idle.south',equipment,99)[0].frame).toBe(0);
  expect(composeActor(manifest,'cra.idle.south',equipment,100)[0].frame).toBe(1);
  expect(composeActor(manifest,'cra.idle.south',equipment,300)[0].frame).toBe(0);
 });
 it('calcule le cadrage avec pivots, cisaillement et rotation',()=>{
  const manifest=fixture();expect(layerBounds(manifest.assets.body,[0,1,-1,0,5,7])).toEqual([5,-3,35,17]);
 });
 it('diagnostique les couches et vues manquantes et les matrices singulières',()=>{
  const m=fixture();delete m.assets.body;expect(()=>parseManifest(m)).toThrow('Couche de corps absente');
  const n=fixture();delete n.composition!.accessories['2411'].views.R;expect(()=>parseManifest(n)).toThrow('Vue d’attache absente');
  const p=fixture();p.composition!.actors['cra.idle.south'].frames[0].layers[0].matrix=[0,0,0,0,0,0];expect(()=>parseManifest(p)).toThrow('singulière');
 });
 it('conserve le masque source et l’opacité des accessoires pendant la mort',()=>{
  const manifest=fixture(),layer=manifest.composition!.actors['cra.idle.south'].frames[0].layers[0];
  layer.maskAssetId='body';layer.opacity=0.4;
  const composed=composeActor(manifest,'cra.idle.south',{hat:'none',cape:'2414'},0);
  expect(composed[0].maskAssetId).toBe('body');expect(composed[0].opacity).toBe(0.4);
  layer.maskAssetId='absent';expect(()=>parseManifest(manifest)).toThrow('Masque source absent');
 });
 it('préserve une dernière frame de disparition entièrement vide',()=>{
  const manifest=fixture(),actor=manifest.composition!.actors['cra.idle.south'];actor.loop=false;actor.frames[1].layers=[];
  expect(composeActor(manifest,'cra.idle.south',{hat:'2411',cape:'2414'},999)).toEqual([]);
 });
 it('un catalogue de 50 coiffes et 50 capes ne nécessite que 100 références indépendantes',()=>{
  const manifest=fixture();for(let i=0;i<50;i++)for(const slot of ['hat','cape'] as const)manifest.composition!.accessories[`${slot}${i}`]={slot,views:{R:slot}};
  const count=Object.keys(manifest.assets).length;
  for(let h=0;h<50;h++)for(let c=0;c<50;c++)expect(composeActor(manifest,'cra.idle.south',{hat:`hat${h}`,cape:`cape${c}`},100)).toHaveLength(3);
  expect(Object.keys(manifest.assets)).toHaveLength(count);
 });
});
