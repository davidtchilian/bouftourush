import {test,expect} from './fixtures';
import {readFileSync} from 'node:fs';
import type {GameController} from '../../src/game/rendering/game';
import {parseManifest} from '../../src/game/assets/manifest';
import {worldTexturePaths} from '../../src/game/assets/worldTextures';

test('attend les textures du donjon sans faire avancer le combat',async({page})=>{
 test.setTimeout(120000);
 const manifest=parseManifest(JSON.parse(readFileSync('public/assets/manifest.json','utf8')));
 const initial=new Set(worldTexturePaths(manifest,manifest.hub,[]));
 const blockedPath=worldTexturePaths(manifest,manifest.maps!.scara,['goldScara']).find(path=>!initial.has(path))!;
 expect(blockedPath).toBeTruthy();
 let release!:()=>void;const held=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/assets/'+blockedPath,async route=>{await held;await route.continue();});
 await page.route('**/loading-fixture',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body style="margin:0;width:800px;height:600px"></body></html>'}));
 await page.goto('/loading-fixture');
 await page.evaluate(async()=>{
  const path='/src/game/rendering/game.ts';const {mountGame}=await import(path);
  const controller=await mountGame(document.body,new AbortController().signal,()=>{},()=>{});
  (window as unknown as {loadingGame:GameController}).loadingGame=controller;controller.simulation.enter('scara');
 });
 const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-loading','true',{timeout:30000});
 const before=await page.evaluate(()=>{const g=(window as unknown as {loadingGame:GameController}).loadingGame.simulation;return {time:g.time,hp:g.hp,wave:g.director?.index};});
 await page.waitForTimeout(250);
 expect(await page.evaluate(()=>{const g=(window as unknown as {loadingGame:GameController}).loadingGame.simulation;return {time:g.time,hp:g.hp,wave:g.director?.index};})).toEqual(before);
 release();await expect(canvas).toHaveAttribute('data-map','scara',{timeout:30000});
 await expect(canvas).toHaveAttribute('data-loading','false');
 await page.evaluate(()=>(window as unknown as {loadingGame:GameController}).loadingGame.dispose());
});
