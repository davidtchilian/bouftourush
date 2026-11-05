/** Mesures locales reproductibles : serveur Vite actif sur 4173. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {chromium} from '@playwright/test';
const manifest=JSON.parse(await readFile('public/assets/manifest.json','utf8'));
const paths=[...new Set<string>(Object.values(manifest.assets as Record<string,{frames:{path:string}[]}>).flatMap(a=>a.frames.map(f=>f.path)))];
let bytes=0,decodedBytes=0;for(const path of paths){const image=await readFile('public/assets/'+path);bytes+=image.length;decodedBytes+=image.readUInt32BE(16)*image.readUInt32BE(20)*4;}
const browser=await chromium.launch();
try{
 const page=await browser.newPage();const start=performance.now();await page.goto('http://127.0.0.1:4173');await page.getByRole('button',{name:'Donjons',exact:true}).waitFor();const loadMs=performance.now()-start;
 await page.getByRole('button',{name:'Donjons',exact:true}).click();await page.getByRole('button',{name:'Entrer — Donjon des Bouftous',exact:true}).click();
 const canvas=page.locator('canvas');await canvas.waitFor();await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.phase==='combat');
 const frameMs=await page.evaluate(async()=>{
  const times:number[]=[];let previous=performance.now();for(let i=0;i<120;i++){const now=await new Promise<number>(resolve=>requestAnimationFrame(resolve));times.push(now-previous);previous=now;}
  times.shift();times.sort((a,b)=>a-b);return {median:times[Math.floor(times.length/2)],p95:times[Math.floor(times.length*0.95)]};
 });
 const render=JSON.parse(await canvas.getAttribute('data-render-stats')??'{}'),enemies=await canvas.evaluate(async c=>{
  const path='/src/game/rendering/inspection.ts',{inspectSimulation}=await import(path);
  const game=inspectSimulation(c as HTMLCanvasElement) as import('../src/game/core/simulation').Simulation;
  return game.enemies.filter(e=>e.hp>0).length;
 });
 const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');const metrics=await cdp.send('Performance.getMetrics');
 const heapBytes=metrics.metrics.find(m=>m.name==='JSHeapUsedSize')?.value;
 const report={assets:Object.keys(manifest.assets).length,files:paths.length,bytes,decodedBytes,loadMs,frameMs,render,enemies,heapBytes,notes:'Chromium headless local : temps et mémoire dépendent du GPU/logiciel et du cache système. decodedBytes = RGBA sans mipmaps, toutes pages y compris UI.'};
 await mkdir('.local-assets/composition-validation',{recursive:true});await writeFile('.local-assets/composition-validation/metrics.json',JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close();}
