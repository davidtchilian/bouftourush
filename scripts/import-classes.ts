/** Publie uniquement les PNG préparés et le manifeste ; aucune source SWF. */
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {manifestSchema} from '../src/game/assets/manifest';
import {classes,missingClassAssets} from '../src/data/classes';
const root='.local-assets/classes-runtime',output=process.argv[2]??'public/assets';
const manifest=JSON.parse(await readFile(join(root,'manifest.json'),'utf8'));
const jobs: {id:string}[]=JSON.parse(await readFile(join(root,'_appearance/jobs.json'),'utf8'));
for(const definition of Object.values(classes).filter(c=>c.id!=='cra')){
 for(const [id,actor] of Object.entries(manifest.composition.actors) as [string,{frames:{layers:{assetId?:string}[]}[]} ][]){
  if(!id.startsWith(definition.sprite+'.'))continue;
  const piece=actor.frames.flatMap(frame=>frame.layers).find(layer=>layer.assetId)?.assetId;
  if(!piece)throw new Error(`Corps absent : ${id}`);
  manifest.assets[id].frames=manifest.assets[id].frames.map((frame:{durationMs:number})=>({...manifest.assets[piece].frames[0],durationMs:frame.durationMs}));
 }
 const missing=missingClassAssets(manifest,definition);if(missing.length)throw new Error(missing.join('\n'));
}
manifestSchema.parse(manifest);
for(const path of new Set(jobs.flatMap(job=>manifest.assets[job.id].frames.map((frame:{path:string})=>frame.path))) as Set<string>){const target=join(output,path);await mkdir(dirname(target),{recursive:true});await copyFile(join(root,path),target);}
await writeFile(join(output,'manifest.json'),JSON.stringify(manifest,null,2));
console.log('Sacrieur, Iop, Féca : PNG et compositions importés.');
