import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import type {Page} from '@playwright/test';
import type {Manifest,MapDefinition} from '../src/game/assets/manifest';
/** Assemble exclusivement les pixels Remastered, avec les transformations du moteur. */
export async function composeMapPng(page:Page,root:string,map:Pick<MapDefinition,'bounds'|'layers'>,assets:Manifest['assets'],density=2):Promise<Buffer>{
 const layers=[...(map.layers??[])].sort((a,b)=>a.order-b.order);
 const used=Object.fromEntries(layers.map(layer=>[layer.assetId,assets[layer.assetId]]));
 const sources=Object.fromEntries(await Promise.all([...new Set(layers.map(layer=>assets[layer.assetId].frames[0].path))].map(async path=>[path,(await readFile(join(root,path))).toString('base64')])));
 const png=await page.evaluate(async({map,layers,assets,sources,density})=>{
  const [left,bottom,right,top]=map.bounds,canvas=document.createElement('canvas');
  canvas.width=Math.ceil((right-left)*density);canvas.height=Math.ceil((top-bottom)*density);
  const ctx=canvas.getContext('2d')!,images=new Map<string,HTMLImageElement>();
  for(const [path,data] of Object.entries(sources)){const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();images.set(path,image);}
  for(const layer of layers){
   const asset=assets[layer.assetId],frame=asset.frames[0],image=images.get(frame.path)!;
   const [sx,sy,sw,sh]=frame.region??[0,0,image.naturalWidth,image.naturalHeight],scale=layer.scale??[1,1];
   ctx.save();ctx.translate((layer.position[0]+asset.offset[0]-left)*density,(top-layer.position[1]-asset.offset[1])*density);
   ctx.rotate(-(layer.rotation??0)*Math.PI/180);ctx.scale(density*scale[0]*(layer.flipX?-1:1),density*scale[1]);
   ctx.drawImage(image,sx,sy,sw,sh,-asset.pivot[0]*asset.size[0],-asset.pivot[1]*asset.size[1],asset.size[0],asset.size[1]);ctx.restore();
  }
  return canvas.toDataURL('image/png').split(',')[1];
 },{map,layers,assets:used,sources,density});
 return Buffer.from(png,'base64');
}
