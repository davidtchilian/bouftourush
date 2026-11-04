/** Comparaison locale des pièces aux anciens SVG de référence (jamais distribués).
 * Exécuter après rasterisation, avant/après atlas : node --import tsx scripts/verify-composition.ts
 */
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from '@playwright/test';
import {parseManifest} from '../src/game/assets/manifest';
import {composeActor} from '../src/game/rendering/composition';
const root=resolve('.local-assets/game-runtime');
const manifest=parseManifest(JSON.parse(await readFile(join(root,'manifest.json'),'utf8')));
const browser=await chromium.launch();const page=await browser.newPage();
// tsx conserve les noms des fonctions locales sérialisées par Playwright.
await page.evaluate('window.__name = value => value; window.compositionImages = new Map()');
const reports:{actor:string;hat:string;cape:string;frame:number;difference:number;coveragePixels:number;errorPixels:number}[]=[];
const cache=new Map<string,string>(),sent=new Set<string>();
async function image(path:string){if(!cache.has(path))cache.set(path,(await readFile(join(root,path))).toString('base64'));return cache.get(path)!;}
try{
 for(const [actorId,actor] of Object.entries(manifest.composition!.actors)){
  for(const hat of ['none','2411','2474','8259'])for(const cape of ['none','2414','2473','8258']){
   const id=hat===cape&&hat==='none'?actorId:`appearance.${hat}.${cape}.${actorId}`;
   const folder=join(root,'_appearance/composed',id);
   const paths=await readdir(folder).catch(()=>[]);if(!paths.length)continue;
   const masked=actor.frames.flatMap((frame,index)=>frame.layers.some(layer=>layer.maskAssetId)?[index]:[]);
   for(const index of [...new Set([0,Math.floor(actor.frames.length/2),actor.frames.length-1,...(masked.length?[masked[0],masked[Math.floor(masked.length/2)],masked[masked.length-1]]:[])])]){
    const elapsed=actor.frames.slice(0,index).reduce((sum,f)=>sum+f.durationMs,0)+0.001;
    const sources:Record<string,string>={};
    const prepareImage=async(path:string)=>{if(!sent.has(path)){sent.add(path);sources[path]=await image(path);}};
    const layers=await Promise.all(composeActor(manifest,actorId,{hat,cape},elapsed).map(async layer=>{
     const asset=manifest.assets[layer.assetId],mask=layer.maskAssetId?manifest.assets[layer.maskAssetId]:undefined;
     await prepareImage(asset.frames[layer.frame].path);if(mask)await prepareImage(mask.frames[0].path);
     return {...layer,asset,mask:mask?{asset:mask}:undefined};
    }));
    const svg=await readFile(join(folder,`${String(index).padStart(3,'0')}.svg`),'utf8');
    const result=await page.evaluate(async({svg,layers,sources})=>{
     const size=600,scale=3,origin=300;
     const make=()=>{const c=document.createElement('canvas');c.width=c.height=size;return c;};
     const reference=make(),actual=make(),stage=make();
     const load=async(src:string)=>{const image=new Image();image.src=src;await image.decode();return image;};
     const root=new DOMParser().parseFromString(svg,'image/svg+xml').documentElement;
     root.querySelector('g')!.removeAttribute('transform');root.setAttribute('viewBox','-100 -100 200 200');root.setAttribute('width','600');root.setAttribute('height','600');
     const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(root)],{type:'image/svg+xml'}));
     const images=(window as unknown as {compositionImages:Map<string,HTMLImageElement>}).compositionImages;
     for(const [path,bytes] of Object.entries(sources))images.set(path,await load('data:image/png;base64,'+bytes));
     const ctx=reference.getContext('2d')!;ctx.drawImage(await load(url),0,0);URL.revokeObjectURL(url);
     const output=actual.getContext('2d')!,temp=stage.getContext('2d')!;
     const draw=async(context:CanvasRenderingContext2D,asset:typeof layers[number]['asset'],frameIndex:number)=>{
      const frame=asset.frames[frameIndex],image=images.get(frame.path)!;
      const [sx,sy,sw,sh]=frame.region??[0,0,image.width,image.height];
      context.drawImage(image,sx,sy,sw,sh,-asset.pivot[0]*asset.size[0],-asset.pivot[1]*asset.size[1],...asset.size);
     };
     for(const layer of layers){
      temp.setTransform(1,0,0,1,0,0);temp.clearRect(0,0,size,size);temp.globalCompositeOperation='source-over';temp.globalAlpha=layer.opacity;
      temp.setTransform(scale,0,0,scale,origin,origin);temp.transform(...layer.matrix);await draw(temp,layer.asset,layer.frame);
      if(layer.mask){temp.globalAlpha=1;temp.globalCompositeOperation='destination-in';temp.setTransform(scale,0,0,scale,origin,origin);await draw(temp,layer.mask.asset,0);}
      output.drawImage(stage,0,0);
     }
     const a=ctx.getImageData(0,0,size,size).data,b=output.getImageData(0,0,size,size).data;let delta=0,total=0;
     for(let i=0;i<a.length;i+=4){
      // Couleurs prémultipliées : ignorer les RGB invisibles des PNG transparents.
      delta+=Math.abs(a[i+3]-b[i+3]);total+=Math.max(a[i+3],b[i+3]);
      for(let c=0;c<3;c++)delta+=Math.abs(a[i+c]*a[i+3]/255-b[i+c]*b[i+3]/255);
     }
     // Un résidu subpixel de disparition ne doit pas devenir une erreur de 100 %.
     return {difference:delta/(4*Math.max(total,255*256)),coveragePixels:total/255,errorPixels:delta/(4*255),png:actual.toDataURL().split(',')[1],ref:reference.toDataURL().split(',')[1]};
    },{svg,layers,sources});
    reports.push({actor:actorId,hat,cape,frame:index,difference:result.difference,coveragePixels:result.coveragePixels,errorPixels:result.errorPixels});
    if(hat==='2411'&&cape==='2414'&&(actorId==='cra.idle.south'||actorId==='cra.death.R'&&index===masked[0])){
     await mkdir('.local-assets/composition-validation',{recursive:true});
     await writeFile(`.local-assets/composition-validation/${actorId}-actual.png`,Buffer.from(result.png,'base64'));
     await writeFile(`.local-assets/composition-validation/${actorId}-reference.png`,Buffer.from(result.ref,'base64'));
    }
   }
  }
 }
 reports.sort((a,b)=>b.difference-a.difference);
 await mkdir('.local-assets/composition-validation',{recursive:true});await writeFile('.local-assets/composition-validation/comparison.json',JSON.stringify(reports,null,2));
 console.log(JSON.stringify({comparisons:reports.length,worst:reports.slice(0,8),mean:reports.reduce((s,r)=>s+r.difference,0)/reports.length},null,2));
 if(!reports.length||reports.some(r=>r.difference>0.03))throw new Error('Écart visuel > 3 % : examiner les références locales.');
}finally{await browser.close();}
