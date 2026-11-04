/** Assemble les PNG originaux, y compris les frames déjà découpées d'anciens atlas. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {chromium} from '@playwright/test';
const previews=process.argv.includes('--previews'),atlasFolder=previews?'atlases/previews':'atlases/game';
const root=resolve(process.argv[2]??'.local-assets/game-runtime');
const manifest=JSON.parse(await readFile(join(root,'manifest.json'),'utf8'));
type Frame={path:string;durationMs:number;region?:[number,number,number,number,number,number]};
type Asset={frames:Frame[]};
const assets=Object.entries(manifest.assets as Record<string,Asset>).filter(([id])=>!id.startsWith('ui.')&&!id.startsWith('item.')&&(previews?id.startsWith('preview.'):!id.startsWith('preview.')));
const key=(frame:Frame)=>frame.path+(frame.region?'#'+frame.region.join(','):'');
const frames=[...new Map(assets.flatMap(([,asset])=>asset.frames.map(frame=>[key(frame),frame] as const))).values()];
const sources=new Map(await Promise.all([...new Set(frames.map(frame=>frame.path))].map(async path=>[path,await readFile(join(root,path))] as const)));
const size=2048;
const images=frames.map(frame=>{
 const bytes=sources.get(frame.path)!,region=frame.region??[0,0,bytes.readUInt32BE(16),bytes.readUInt32BE(20)];
 return {key:key(frame),source:frame.path,sx:region[0],sy:region[1],width:region[2],height:region[3]};
}).sort((a,b)=>b.height-a.height||b.width-a.width||a.key.localeCompare(b.key));
const placements=new Map<string,{page:number;x:number;y:number;width:number;height:number}>();
let page=0,x=1,y=1,row=0;
for(const image of images){
 if(image.width+2>size||image.height+2>size)throw new Error(`Image trop grande pour l’atlas : ${image.key}`);
 if(x+image.width+1>size){x=1;y+=row+2;row=0;}
 if(y+image.height+1>size){page++;x=1;y=1;row=0;}
 placements.set(image.key,{page,x,y,width:image.width,height:image.height});x+=image.width+2;row=Math.max(row,image.height);
}
const browser=await chromium.launch({headless:true});
try{
 const tab=await browser.newPage();await tab.goto('about:blank');await mkdir(join(root,atlasFolder),{recursive:true});
 for(let n=0;n<=page;n++){
  const batch=images.filter(image=>placements.get(image.key)!.page===n).map(image=>({...image,...placements.get(image.key)!}));
  const data=Object.fromEntries([...new Set(batch.map(image=>image.source))].map(path=>[path,sources.get(path)!.toString('base64')]));
  const png=await tab.evaluate(async({batch,size,data})=>{
   const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;const ctx=canvas.getContext('2d')!;
   const decoded=new Map<string,HTMLImageElement>();
   for(const [path,bytes] of Object.entries(data)){const image=new Image();image.src='data:image/png;base64,'+bytes;await image.decode();decoded.set(path,image);}
   for(const f of batch){const img=decoded.get(f.source)!;
    ctx.drawImage(img,f.sx,f.sy,f.width,f.height,f.x,f.y,f.width,f.height);
    ctx.drawImage(img,f.sx,f.sy,f.width,1,f.x,f.y-1,f.width,1);ctx.drawImage(img,f.sx,f.sy+f.height-1,f.width,1,f.x,f.y+f.height,f.width,1);
    ctx.drawImage(img,f.sx,f.sy,1,f.height,f.x-1,f.y,1,f.height);ctx.drawImage(img,f.sx+f.width-1,f.sy,1,f.height,f.x+f.width,f.y,1,f.height);
   }
   return canvas.toDataURL('image/png').split(',')[1];
  },{batch,size,data});
  await writeFile(join(root,`${atlasFolder}/page-${n}.png`),Buffer.from(png,'base64'));
 }
}finally{await browser.close();}
for(const [,asset] of assets)for(const frame of asset.frames){const p=placements.get(key(frame))!;frame.path=`${atlasFolder}/page-${p.page}.png`;frame.region=[p.x,p.y,p.width,p.height,size,size];}
await writeFile(join(root,'manifest.json'),JSON.stringify(manifest,null,2));
console.log(`${frames.length} frames originales assemblées dans ${page+1} atlas de ${size} × ${size}.`);
