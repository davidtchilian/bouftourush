import {test,expect} from '@playwright/test';
import type {GameController} from '../../src/game/rendering/game';
import {newProfile} from '../../src/game/progression/profile';

test('affiche le lancer et la lance Remastered de Raul Mops, puis accélère le Royal',async({page},testInfo)=>{
 test.setTimeout(120000);
 await page.setViewportSize({width:1100,height:800});
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(profile=>localStorage.setItem('bouftourush.save.v1',JSON.stringify({version:1,profile})),newProfile());
 await page.route('**/enemy-fixture',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body style="margin:0;width:100vw;height:100vh"></body></html>'}));
 await page.goto('/enemy-fixture');
 await page.evaluate(async()=>{
  const path='/src/game/rendering/game.ts',module=await import(path);
  const controller=await module.mountGame(document.body,new AbortController().signal,()=>{},()=>{});
  controller.simulation.paused=true;(window as unknown as {enemyGame:GameController}).enemyGame=controller;
 });
 const result=await page.evaluate(()=>{
  const game=(window as unknown as {enemyGame:GameController}).enemyGame.simulation;
  game.enter('ensable');game.paused=true;game.director=null;game['spawn'](['raulMops']);
  const player=game.player.position,enemy=game.enemies[0];
  const cell=game.navigation.cells.find(cell=>{const distance=Math.hypot(cell.position[0]-player[0],cell.position[1]-player[1]);return distance>130&&distance<180&&game.navigation.clear(cell.position,player);});
  if(!cell)throw new Error('Aucun couloir de test sur la carte Ensablé.');
  enemy.position=[...cell.position];enemy.attackAt=0;const hp=game.hp;
  game.paused=false;for(let step=0;step<56;step++)game.update(0.01);game.paused=true;
  return {hp,afterHp:game.hp,count:game.enemyShots.length,asset:game.enemyShots[0]?.asset,action:enemy.action};
 });
 expect(result).toMatchObject({count:1,asset:'spell.raulMops.spear',action:'attack'});expect(result.afterHp).toBe(result.hp);
 await expect(page.locator('canvas')).toHaveAttribute('data-enemy-projectiles','1');
 await page.screenshot({path:testInfo.outputPath('raul-spear-desktop.png')});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:testInfo.outputPath('raul-spear-mobile.png')});
 const speeds=await page.evaluate(()=>{
  const game=(window as unknown as {enemyGame:GameController}).enemyGame.simulation;
  game.enemyShots=[];game['spawn'](['royal']);const royal=game.enemies.find(e=>e.kind==='royal')!;
  const original=game.enemies[0].position;royal.position=[...original];game.enemies=[royal];
  const target=game.navigation.cells.find(cell=>Math.hypot(cell.position[0]-original[0],cell.position[1]-original[1])>60&&game.navigation.clear(original,cell.position))!.position;
  game.player.position=[...target];royal.attackAt=Infinity;royal.pathAt=Infinity;
  const measure=(age:number)=>{
   game.time=royal.spawnedAt+age;royal.position=[...original];royal.route=[[...target]];royal.actionUntil=0;game.paused=false;game.update(0.1);game.paused=true;
   return Math.hypot(royal.position[0]-original[0],royal.position[1]-original[1]);
  };
  return [measure(5),measure(6)];
 });
 expect(speeds[0]).toBeCloseTo(9.8);expect(speeds[1]).toBeCloseTo(4.9);expect(errors).toEqual([]);
 await page.evaluate(()=>(window as unknown as {enemyGame:GameController}).enemyGame.dispose());
});
