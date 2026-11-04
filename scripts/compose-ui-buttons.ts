/** Assemble les trois parties des boutons Flash originaux à leur position finale. */
import {readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {chromium} from '@playwright/test';
import {globSync} from 'node:fs';
const root=resolve('.local-assets/game-runtime');
const manifest=JSON.parse(await readFile(join(root,'manifest.json'),'utf8'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 for(const id of ['ui.button','ui.button.hover','ui.button.down']){
  const source=[...globSync(join(root,'_conversion',id,'svg','**','*.svg'))][0];
  if(!source)throw new Error(`Bouton original absent : ${id}. Lancer prepare-game.py.`);
  const png=await page.evaluate(async text=>{
   const root=new DOMParser().parseFromString(text,'image/svg+xml').documentElement;
   const group=root.querySelector('g')!;group.removeAttribute('transform');let x=0;
   for(const name of ['left_mc','middle_mc','right_mc']){
    const part=group.querySelector(`[id="${name}"]`);if(!part)throw new Error(`Partie de bouton absente : ${name}`);
    part.setAttribute('transform',`translate(${x} 0)`);x+=Number(part.getAttribute('width'));
   }
   root.setAttribute('viewBox',`0 0 ${x} 18`);root.setAttribute('width',String(x*6));root.setAttribute('height','108');
   const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(root)],{type:'image/svg+xml'}));
   try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;canvas.getContext('2d')!.drawImage(image,0,0);return canvas.toDataURL('image/png').split(',')[1];}finally{URL.revokeObjectURL(url);}
  },await readFile(source,'utf8'));
  const asset=manifest.assets[id];await writeFile(join(root,asset.frames[0].path),Buffer.from(png,'base64'));
  asset.size=[48,18];asset.provenance.conversion=asset.provenance.conversion.split(' ; assemblage')[0]+' ; assemblage gauche/milieu/droite original, export ×6 pour découpe en trois zones';
 }
 // Relire le manifeste pour conserver les autres imports locaux effectués pendant la conversion.
 const current=JSON.parse(await readFile(join(root,'manifest.json'),'utf8'));
 for(const id of ['ui.button','ui.button.hover','ui.button.down'])current.assets[id]=manifest.assets[id];
 await writeFile(join(root,'manifest.json'),JSON.stringify(current,null,2));
 console.log('Trois états de boutons orange originaux assemblés.');
}finally{await browser.close();}
