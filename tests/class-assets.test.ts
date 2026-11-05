import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {parseManifest} from '../src/game/assets/manifest';
import {classes,missingClassAssets} from '../src/data/classes';
import {composeActor} from '../src/game/rendering/composition';
const manifest=parseManifest(JSON.parse(readFileSync('public/assets/manifest.json','utf8')));
describe('classes Remastered préparées',()=>{
 for(const definition of [classes.sacrier,classes.iop,classes.feca]){
  it(`${definition.name} : animations, sorts et icônes complets`,()=>{expect(missingClassAssets(manifest,definition)).toEqual([]);});
  it(`${definition.name} : accessoires mixtes sur toutes les frames et directions`,()=>{
   for(const [id,actor] of Object.entries(manifest.composition!.actors).filter(([id])=>id.startsWith(definition.sprite+'.'))){
    for(const equipment of [{hat:'none',cape:'none'},{hat:'2411',cape:'2414'},{hat:'2474',cape:'2473'},{hat:'2411',cape:'2473'},{hat:'2474',cape:'2414'}]){
     let time=0;
     for(const frame of actor.frames){
      const layers=composeActor(manifest,id,equipment,time);expect(layers.length).toBeGreaterThan(0);
      for(const layer of layers){expect(manifest.assets[layer.assetId].provenance.version).toBe('1.40.13-remastered');if(id.includes('.idle.'))expect(manifest.assets['preview.'+layer.assetId]).toBeDefined();}
      time+=frame.durationMs;
     }
    }
   }
  });
 }
});
