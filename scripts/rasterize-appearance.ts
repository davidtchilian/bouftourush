/** Recadrage et composition des graphismes SWF originaux, sans illustration de substitution. */
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {chromium} from '@playwright/test';
const root=resolve(process.argv.find(arg=>arg.startsWith('--root='))?.slice(7)??'.local-assets/game-runtime');
const manifest=JSON.parse(await readFile(join(root,'manifest.json'),'utf8'));
const previews=process.argv.includes('--previews'),density=previews?6:2;
const jobs: {id:string;svgs:string[];icon:boolean;density?:number;maxDimension?:number;pivot?:[number,number]}[]=JSON.parse(await readFile(join(root,process.argv.find(arg=>arg.startsWith('--jobs='))?.slice(7)??(process.argv.includes('--dungeon-vectors')?'_appearance/dungeon-vector-jobs.json':process.argv.includes('--enemy-abilities')?'_appearance/enemy-ability-jobs.json':process.argv.includes('--spell-icons')?'_appearance/spell-icon-jobs.json':previews?'_appearance/preview-jobs.json':'_appearance/jobs.json')),'utf8'));
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
const cacheRoot=join(root,'_appearance/raster-cache');await mkdir(cacheRoot,{recursive:true});
try{
 let completed=0,nextJob=0,aborted=false;
 const workerCount=Math.min(2,Math.max(1,Number(process.argv.find(arg=>arg.startsWith('--workers='))?.slice(10))||1));
 const batchJobs=Math.max(1,Number(process.argv.find(arg=>arg.startsWith('--batch-jobs='))?.slice(13))||16);
 const worker=async()=>{
 let page=await browser.newPage(),processed=0;
 try{
 while(!aborted&&nextJob<jobs.length){
  const job=jobs[nextJob++];
  const exportDensity=job.density??density;
  const svgs=await Promise.all(job.svgs.map(path=>readFile(path,'utf8')));
  const uniqueSvgs:string[]=[],svgIndices=new Map<string,number>();
  const indices=svgs.map(svg=>{let index=svgIndices.get(svg);if(index===undefined){index=uniqueSvgs.length;uniqueSvgs.push(svg);svgIndices.set(svg,index);}return index;});
  const folder='textures/'+job.id.replaceAll('.','-');
  const uniquePaths=uniqueSvgs.map((_,index)=>`${folder}/${String(index).padStart(3,'0')}.png`),paths=indices.map(index=>uniquePaths[index]);
  const signature=createHash('sha256').update('raster-v5-unique-isolated-bounds:'+exportDensity+':'+job.maxDimension+':'+job.icon+svgs.join('\0')).digest('hex');
  const cachePath=join(cacheRoot,job.id+'.json');
  const cached=await readFile(cachePath,'utf8').then(JSON.parse).catch(()=>null);
  const present=await Promise.all(paths.map(path=>stat(join(root,path)).catch(()=>null)));
  // prepare-game recopie les PNG bruts des objets et du Crâ : leur seule présence ne suffit pas.
  const validCache=cached?.signature===signature&&cached.outputs?.length===paths.length&&present.every(Boolean)
   &&(await Promise.all(paths.map(async(path,index)=>createHash('sha256').update(await readFile(join(root,path))).digest('hex')===cached.outputs[index]))).every(Boolean);
  let reuseSize:number[]|null=null;
  // Reprise explicite d'un export interrompu avant la création des marqueurs.
  if(process.argv.includes('--resume')&&uniqueSvgs.length===svgs.length&&present.every(Boolean)){
   const sources=await Promise.all(job.svgs.map(path=>stat(path)));
   if(present.every(file=>file!.mtimeMs>=Math.max(...sources.map(file=>file.mtimeMs)))){
    const png=await readFile(join(root,paths[0]));reuseSize=[png.readUInt32BE(16),png.readUInt32BE(20)];
   }
  }
  const result: {pngs:string[];width:number;height:number;pivot:number[]}=validCache?{...cached,pngs:[]}:await page.evaluate(async({svgs,icon,reuseSize,density,maxDimension})=>{
   const roots=svgs.map(text=>{
    const root=new DOMParser().parseFromString(text,'image/svg+xml').documentElement as unknown as SVGSVGElement;
    if(root.querySelector('parsererror'))throw new Error('SVG original illisible');
    const group=root.querySelector('g')!;group.removeAttribute('transform');
    // Le fond blanc de la scène Flash n'appartient pas au dessin de l'objet.
    if(icon)for(const child of [...group.children])if(child.tagName==='rect'&&child.getAttribute('fill')==='#ffffff')child.remove();
    return root;
   });
   // Les exports JPEXS réutilisent les mêmes IDs de symboles à chaque frame.
   // Mesurer séparément évite que <use> résolve les définitions d'une autre frame.
   const bounds=roots.map(root=>{document.body.append(root);const b=root.querySelector('g')!.getBBox();const box={x:b.x,y:b.y,width:b.width,height:b.height};root.remove();return box;});
   const left=Math.floor(Math.min(...bounds.map(b=>b.x)))-1,top=Math.floor(Math.min(...bounds.map(b=>b.y)))-1;
   const width=Math.ceil(Math.max(...bounds.map(b=>b.x+b.width)))-left+1,height=Math.ceil(Math.max(...bounds.map(b=>b.y+b.height)))-top+1;
   if(width<=2||height<=2)throw new Error('Graphisme original vide');
   const scale=icon?Math.min(192/width,192/height):Math.min(density,maxDimension?maxDimension/Math.max(width,height):density);
   // Après la mesure, détacher les arbres évite de recalculer des milliers de chemins à chaque frame.
   roots.forEach(root=>root.remove());
   if(reuseSize?.[0]===Math.ceil(width*scale)&&reuseSize[1]===Math.ceil(height*scale))return {pngs:[],width,height,pivot:[-left/width,-top/height]};
   const pngs:string[]=new Array(roots.length);
   for(let start=0;start<roots.length;start+=12)await Promise.all(roots.slice(start,start+12).map(async(root,index)=>{
    root.setAttribute('viewBox',`${left} ${top} ${width} ${height}`);root.setAttribute('width',String(Math.ceil(width*scale)));root.setAttribute('height',String(Math.ceil(height*scale)));
    const image=new Image();const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(root)],{type:'image/svg+xml'}));
    try{image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;canvas.getContext('2d')!.drawImage(image,0,0);pngs[start+index]=canvas.toDataURL('image/png').split(',')[1];}
    finally{URL.revokeObjectURL(url);root.remove();}
   }));
   return {pngs,width,height,pivot:[-left/width,-top/height]};
  },{svgs:uniqueSvgs,icon:job.icon,reuseSize,density:exportDensity,maxDimension:job.maxDimension}).catch(error=>{throw new Error(`Raster ${job.id} : ${error instanceof Error?error.message:String(error)}`);});
  await mkdir(join(root,folder),{recursive:true});
  const asset=manifest.assets[job.id];
  if(result.pngs.length)await Promise.all(uniquePaths.map((path,index)=>writeFile(join(root,path),Buffer.from(result.pngs[index],'base64'))));
  asset.frames=paths.map((path,index)=>({path,durationMs:asset.frames[index]?.durationMs??asset.frames[0].durationMs}));
  asset.size=[result.width,result.height];asset.pivot=job.pivot??result.pivot;
  const uniqueOutputs=await Promise.all(uniquePaths.map(async(path,index)=>createHash('sha256').update(result.pngs.length?Buffer.from(result.pngs[index],'base64'):await readFile(join(root,path))).digest('hex')));
  const outputs=indices.map(index=>uniqueOutputs[index]);
  await writeFile(cachePath,JSON.stringify({signature,width:result.width,height:result.height,pivot:result.pivot,outputs}));
  if(job.icon)asset.provenance.conversion+=' ; recadrage transparent aux limites du dessin original';
  if(++completed%16===0)console.log(`Composition : ${completed}/${jobs.length}`);
  // Les caches SVG natifs peuvent retenir beaucoup de mémoire après les longues timelines.
  if(++processed%batchJobs===0&&nextJob<jobs.length){await page.close();page=await browser.newPage();}
 }
 }catch(error){aborted=true;throw error;}finally{await page.close();}
 };
 const workers=await Promise.allSettled(Array.from({length:workerCount},()=>worker()));
 const failed=workers.find(result=>result.status==='rejected');if(failed?.status==='rejected')throw failed.reason;
 await writeFile(join(root,'manifest.json'),JSON.stringify(manifest,null,2));
 console.log(`${jobs.length} séquences originales recadrées/composées.`);
}finally{await browser.close();}
