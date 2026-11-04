import {existsSync,readFileSync} from 'node:fs';
import {test,expect} from '@playwright/test';
import type {GameController} from '../../src/game/rendering/game';
import {newProfile} from '../../src/game/progression/profile';
test('compose toutes les animations équipées dans Three.js, dont les masques de mort',async({page},testInfo)=>{
 test.skip(!existsSync('public/assets/manifest.json'),'Assets Remastered nécessaires.');
 const manifest=JSON.parse(readFileSync('public/assets/manifest.json','utf8'));
 const [x,y]=manifest.hub.spawn;manifest.hub={...manifest.hub,layers:[],bounds:[x-80,y-80,x+80,y+80],cameraHeight:160};
 await page.route('**/assets/manifest.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(manifest)}));
 const profile=newProfile();profile.inventory=[{uid:'hat',item:'2411'},{uid:'cape',item:'2414'}];profile.equipment={hat:'hat',cape:'cape'};
 await page.addInitScript(profile=>localStorage.setItem('bouftourush.save.v1',JSON.stringify({version:1,profile})),profile);
 await page.route('**/composition-fixture',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body style="margin:0;width:800px;height:600px"></body></html>'}));
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 await page.goto('/composition-fixture');
 await page.evaluate(async()=>{
  const path='/src/game/rendering/game.ts',module=await import(path);
  const controller=await module.mountGame(document.body,new AbortController().signal,()=>{},()=>{});
  controller.simulation.paused=true;(window as unknown as {testGame:GameController}).testGame=controller;
 });
 for(const [id,actor] of Object.entries(manifest.composition.actors) as [string,{frames:{durationMs:number;layers:{maskAssetId?:string}[]}[]}][]){
  const masked=actor.frames.flatMap((frame,index)=>frame.layers.some(layer=>layer.maskAssetId)?[index]:[]);
  for(const frame of [...new Set([0,Math.floor(actor.frames.length/2),actor.frames.length-1,...(masked.length?[masked[0],masked[Math.floor(masked.length/2)],masked[masked.length-1]]:[])])]){
   await page.evaluate(async({id,frame,frames})=>{
    const game=(window as unknown as {testGame:GameController}).testGame,player=game.simulation.player;
    const [,action,direction]=id.split('.');player.action=action as typeof player.action;
    player.direction=(direction==='L'?'north':direction==='R'?'south':direction) as typeof player.direction;
    const elapsed=frames.slice(0,frame).reduce((sum,f)=>sum+f.durationMs,0)+0.1,total=frames.reduce((sum,f)=>sum+f.durationMs,0);
    const path='/src/data/balance.ts',module=await import(path);
    player.animationTime=action==='cast'||action==='buff'?elapsed/total*module.balance.castAnimation:elapsed/1000;
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   },{id,frame,frames:actor.frames});
   await expect(page.locator('canvas')).toHaveAttribute('data-animation',`appearance.2411.2414.${id}`);
   if(frame===masked[0])await page.screenshot({path:testInfo.outputPath(`${id}-masque.png`)});
  }
 }
 await page.screenshot({path:testInfo.outputPath('mort-composee.png')});
 expect(errors).toEqual([]);
 await page.evaluate(()=>(window as unknown as {testGame:GameController}).testGame.dispose());
});
