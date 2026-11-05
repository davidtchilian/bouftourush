import {movementSpeedBonus,equipmentLimits} from '../progression/profile';
import {classes,missingClassAssets,type ClassId,type ClassDefinition} from '../../data/classes';
import {balance,classBalance,spells,type SpellId,xpForLevel} from '../../data/balance';
import {dungeons,dungeonModes,waveMultipliers,type DungeonId,type DungeonMode} from '../../data/dungeons';
import {monsters,type MonsterId} from '../../data/monsters';
import {items,sets,type Slot} from '../../data/items';
import type {Manifest,MapDefinition} from '../assets/manifest';
import {cooldownFor} from '../combat/cooldowns';
import {damage,segmentDistance} from '../combat/damage';
import {WaveDirector} from '../dungeons/waves';
import {Navigation,type Point} from '../movement/navigation';
import {awardXp,equip,finalStats,type Profile} from '../progression/profile';
import {sellDuplicates as sellDuplicateItems} from '../progression/resale';
import {seededRandom,monsterLoot} from '../progression/loot';
import {enemyMovementSpeed} from '../ai/speedBurst';
export type Phase='hub'|'combat'|'victory'|'death';
export type Actor={id:number;position:Point;direction:string;action:'idle'|'run'|'cast'|'buff'|'attack'|'hit'|'death';animationTime:number;actionUntil:number;route:Point[]};
export type Enemy=Actor&{kind:MonsterId;hp:number;maxHp:number;damage:number;spawnedAt:number;attackAt:number;pathAt:number;deadAt:number;rewarded:boolean;rangedTarget?:{position:Point;releaseAt:number};rangedAnimationUntil?:number};
export type Shot={id:number;spell:'explosive'|'flaming'|'magic';position:Point;start:Point;target:Point;power:number;buff:number;hit:Set<number>;age:number};
export type EnemyShot={id:number;asset:string;position:Point;start:Point;target:Point;damage:number;speed:number;radius:number;age:number};
export type Effect={id:number;asset:string;position:Point;age:number;ttl:number;angle:number;followPlayer?:boolean};
export type Floating={id:number;position:Point;text:string;age:number;kind:'damage'|'reward'|'loot';icon?:string};
const emptyCooldowns=()=>Object.fromEntries(Object.keys(spells).map(id=>[id,0])) as Record<SpellId,number>;
export type Snapshot={classId:ClassId;classStatus:string;phase:Phase;mode:DungeonMode;dungeon:DungeonId|null;hp:number;maxHp:number;power:number;cooldownReduction:number;level:number;xp:number;nextXp:number;kamas:number;inventory:Profile['inventory'];equipment:Profile['equipment'];completed:string[];wave:number;totalWaves:number;boss:boolean;living:number;waveDelay:number;cooldowns:Record<SpellId,number>;buffRemaining:number;log:string[];paused:boolean;kills:number};
const distance=(a:Point,b:Point)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function directionFor(dx:number,dy:number):string {return ['east','northeast','north','northwest','west','southwest','south','southeast'][(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8];}
/** Simulation pure à pas fixe, sans DOM, Three.js ou React. */
export class Simulation {
 phase:Phase='hub';mode:DungeonMode='normal';dungeon:DungeonId|null=null;mapId='hub';map:MapDefinition;navigation:Navigation;
 player:Actor;hp:number;enemies:Enemy[]=[];shots:Shot[]=[];enemyShots:EnemyShot[]=[];effects:Effect[]=[];floating:Floating[]=[];
 time=0;paused=false;buffUntil=0;castUntil=0;kills=0;mapRevision=0;
 cooldowns=emptyCooldowns();
 chastisementUntil=0;combatPower=0;wrathMultiplier=1;truceUntil=0;glyphs:{position:Point;cells:Point[];nextTick:number}[]=[];
 director:WaveDirector|null=null;log:string[]=[];private serial=0;private random:()=>number;private saveTimer=0;private lastDestination:Point|null=null;
 constructor(readonly manifest:Manifest,readonly profile:Profile,readonly persist:()=>void=()=>{},private seed=Date.now(),private testLootChance?:number,public playerClass:ClassDefinition=classes[profile.classId??'cra']){
  if(missingClassAssets(manifest,this.playerClass).length&&profile.classId){this.playerClass=classes.cra;}
  this.random=seededRandom(seed);this.serial=profile.inventory.reduce((highest,item)=>{const prefix=`drop-${seed}-`,value=item.uid.startsWith(prefix)?Number(item.uid.slice(prefix.length)):0;return Number.isSafeInteger(value)?Math.max(highest,value):highest;},0);
  this.map=manifest.hub;this.navigation=new Navigation(this.map.walkable??[]);
  this.player={id:0,position:[...this.map.spawn],direction:'southeast',action:'idle',animationTime:0,actionUntil:0,route:[]};
  this.hp=finalStats(profile).hp;this.message('Bienvenue à Astrub. Clic droit maintenu : suivre le curseur. AZER : sorts.');
 }
 message(text:string){this.log=[text,...this.log].slice(0,8);}
 snapshot():Snapshot{
  const stats=finalStats(this.profile);
  return {classId:this.playerClass.id,classStatus:this.time<this.truceUntil?`Trêve · ${(this.truceUntil-this.time).toFixed(1)} s`:this.playerClass.id==='sacrier'?`Châtiment : +${this.combatPower.toFixed(1)} Puissance${this.time<this.chastisementUntil?` · ${(this.chastisementUntil-this.time).toFixed(1)} s`:''}`:this.playerClass.id==='iop'?`Colère ×${this.wrathMultiplier.toFixed(2)}`:this.playerClass.id==='feca'?`${this.glyphs.length} glyphe(s)`:'',phase:this.phase,mode:this.mode,dungeon:this.dungeon,hp:this.hp,maxHp:stats.hp,power:stats.power+this.combatPower,cooldownReduction:stats.cooldownReduction,level:this.profile.level,xp:this.profile.xp,nextXp:xpForLevel(this.profile.level),kamas:this.profile.kamas,
   inventory:this.profile.inventory.map(i=>({...i})),equipment:{...this.profile.equipment},completed:[...this.profile.completed],wave:Math.max(0,(this.director?.index??-1)+1),totalWaves:this.director?.total??0,boss:this.director?.boss??false,living:this.enemies.filter(e=>e.hp>0).length,waveDelay:Math.max(0,this.director?.remainingDelay??0),
   cooldowns:Object.fromEntries(Object.entries(this.cooldowns).map(([id,t])=>[id,Math.max(0,t-this.time)])) as Record<SpellId,number>,buffRemaining:Math.max(0,this.buffUntil-this.time),log:this.log,paused:this.paused,kills:this.kills};
 }
 enter(id:DungeonId,mode:DungeonMode='normal'){
  if(!this.manifest.gameplayReady){this.message('Assets de combat incomplets : lancer assets:prepare:game puis assets:import .local-assets/game-runtime.');return;}
  if(this.phase==='combat')return;
  const definition=dungeons[id],map=this.manifest.maps?.[definition.map];
  if(!map){this.message(`Carte absente : ${definition.map}`);return;}
  this.changeMap(definition.map,map);this.dungeon=id;this.mode=mode;this.phase='combat';this.director=new WaveDirector(definition,mode);this.paused=false;
  this.message(`${definition.name} · ${dungeonModes[mode].label} — vague 1 dans quelques instants.`);
 }
 returnHub(){this.changeMap('hub',this.manifest.hub);this.phase='hub';this.mode='normal';this.dungeon=null;this.director=null;this.paused=false;this.persist();}
 private changeMap(id:string,map:MapDefinition){
  this.mapId=id;this.map=map;this.navigation=new Navigation(map.walkable??[]);this.mapRevision++;
  this.player.position=[...map.spawn];this.player.route=[];this.player.action='idle';this.player.actionUntil=0;this.player.animationTime=0;
  this.enemies=[];this.shots=[];this.enemyShots=[];this.effects=[];this.floating=[];this.hp=finalStats(this.profile).hp;this.buffUntil=0;this.castUntil=0;
  this.cooldowns=emptyCooldowns();this.resetCombat();this.lastDestination=null;
 }
 move(target:Point){if(this.paused||this.phase==='death'||this.phase==='victory')return;if(this.lastDestination&&distance(this.lastDestination,target)<3&&this.player.route.length)return;this.lastDestination=[...target];this.player.route=this.navigation.route(this.player.position,target);}
 changeClass(id:ClassId):boolean{
  if(this.phase!=='hub'||this.paused)return false;
  const definition=classes[id],missing=missingClassAssets(this.manifest,definition);
  if(missing.length){this.message(`${definition.name} indisponible : ${missing.length} ressources Remastered à importer (${missing[0]}).`);return false;}
  this.playerClass=definition;this.profile.classId=id;this.changeMap('hub',this.manifest.hub);this.persist();this.message(`Classe : ${definition.name}. Progression conservée.`);return true;
 }
 private resetCombat(){this.chastisementUntil=0;this.combatPower=0;this.wrathMultiplier=1;this.truceUntil=0;this.glyphs=[];this.effects=this.effects.filter(effect=>!Object.values(spells).some(spell=>spell.effect===effect.asset&& !['area','line','single','buff'].includes(spell.kind)));}
 private classDamage(coefficient:number):number{
  const ratio=this.hp/finalStats(this.profile).hp;
  const bonus=this.playerClass.id==='sacrier'?classBalance.lowHpMaximumBonus*Math.min(1,Math.max(0,(1-ratio)/(1-classBalance.lowHpThreshold))):0;
  return damage(this.playerClass.baseDamage,coefficient,finalStats(this.profile).power+this.combatPower,1+bonus);
 }
 private nearestTarget(target:Point){return this.enemies.filter(e=>e.hp>0).sort((a,b)=>distance(a.position,target)-distance(b.position,target)||a.id-b.id)[0];}
 private landing(target:Point,range:number):Point|null{
  const start=this.player.position,dx=target[0]-start[0],dy=target[1]-start[1],length=Math.hypot(dx,dy);
  if(length<1)return null;
  for(let travel=Math.min(length,range);travel>=1;travel-=2){const point:Point=[start[0]+dx/length*travel,start[1]+dy/length*travel];if(this.navigation.contains(point)&&this.navigation.route(start,point).length)return point;}
  return null;
 }
 cast(id:SpellId,target:Point):boolean{
  if(!this.playerClass.abilities.includes(id)||this.paused||!this.manifest.gameplayReady||this.phase==='death'||this.phase==='victory'||(id!=='power'&&this.time<this.castUntil)||this.time<this.cooldowns[id])return false;
  const spell=spells[id];
  const victim=this.nearestTarget(target),destination=spell.kind==='teleport'?this.landing(target,spell.range):null;
  if(this.playerClass.id!=='cra'&&this.phase!=='combat')return false;
  if((spell.kind==='swap'||spell.kind==='direct'||spell.kind==='punishment')&&(!victim||(spell.kind!=='swap'&&distance(victim.position,target)>classBalance.targetRadius)||distance(victim.position,this.player.position)>spell.range))return false;
  if(spell.kind==='swap'&&victim&&(!this.navigation.contains(victim.position)||!this.navigation.route(this.player.position,victim.position).length))return false;
  if(spell.kind==='teleport'&&!destination)return false;
  if(spell.kind==='glyph'&&(!this.navigation.contains(target)||distance(target,this.player.position)>spell.range))return false;
  this.cooldowns[id]=this.time+cooldownFor(id,finalStats(this.profile).cooldownReduction,equipmentLimits(this.profile).cooldownReduction);this.castUntil=this.time+balance.castLock;
  this.player.actionUntil=this.time+balance.castAnimation;this.setAction(this.player,id==='power'?'buff':'cast');this.player.animationTime=0;
  if(id==='power'){
   this.buffUntil=this.time+balance.buffDuration;this.effect(spell.effect,[...this.player.position],0,true);this.message('Tir puissant : dégâts augmentés pendant 8 s.');return true;
  }
  const start:Point=[...this.player.position];let dx=target[0]-start[0],dy=target[1]-start[1];let length=Math.hypot(dx,dy);
  if(length<1){dx=1;dy=0;length=1;}
  this.player.direction=directionFor(dx,dy);
  if(id!=='explosive'&&id!=='flaming'&&id!=='magic'){
   const amount=this.classDamage(spell.coefficient),canHit=(enemy:Enemy)=>enemy.hp>0&&this.navigation.clear(start,enemy.position);
   const cone=(enemy:Enemy)=>{const length=distance(start,enemy.position);return length<=spell.range&&(length<1||((enemy.position[0]-start[0])*dx+(enemy.position[1]-start[1])*dy)/(length*Math.hypot(dx,dy))>=classBalance.coneCosine);};
   switch(spell.kind){
    case 'drain': {let drained=0;for(const enemy of this.enemies)if(canHit(enemy)&&distance(start,enemy.position)<=spell.radius){if(this.time>=this.truceUntil)drained+=Math.min(enemy.hp,amount);this.hit(enemy,amount);}this.hp=Math.min(finalStats(this.profile).hp,this.hp+Math.floor(drained*classBalance.drainRatio));break;}
    case 'chastisement':this.chastisementUntil=this.time+classBalance.chastisementDuration;break;
    case 'swap':if(victim){this.player.position=[...victim.position];victim.position=start;victim.route=[];victim.pathAt=0;delete victim.rangedTarget;this.player.route=[];this.lastDestination=null;}break;
    case 'punishment':if(victim)this.hit(victim,this.classDamage(spell.coefficient*(1-Math.abs(this.hp/finalStats(this.profile).hp-0.5)*2)));break;
    case 'cone':case 'wrath':for(const enemy of this.enemies)if(canHit(enemy)&&cone(enemy))this.hit(enemy,this.classDamage(spell.coefficient*(spell.kind==='wrath'?this.wrathMultiplier:1)));if(spell.kind==='wrath')this.wrathMultiplier*=classBalance.wrathGrowth;break;
    case 'teleport':if(destination){this.player.position=destination;this.player.route=[];this.lastDestination=null;}break;
    case 'push':for(const enemy of this.enemies)if(canHit(enemy)&&distance(start,enemy.position)<=spell.radius){this.hit(enemy,amount);const length=distance(start,enemy.position),ux=length?(enemy.position[0]-start[0])/length:dx/Math.hypot(dx,dy),uy=length?(enemy.position[1]-start[1])/length:dy/Math.hypot(dx,dy);for(let step=0;step<classBalance.pushDistance;step+=2){const next:Point=[enemy.position[0]+ux*2,enemy.position[1]+uy*2];if(!this.navigation.clear(enemy.position,next))break;enemy.position=next;}enemy.route=[];enemy.pathAt=0;}break;
    case 'glyph':this.glyphs.push({position:[...target],cells:this.navigation.cells.filter(cell=>distance(cell.position,target)<=spell.radius).map(cell=>[...cell.position]),nextTick:this.time+classBalance.glyphInterval});break;
    case 'direct':if(victim)this.hit(victim,amount);break;
    case 'truce':this.truceUntil=this.time+classBalance.truceDuration;break;
   }
   if(spell.kind==='swap'&&spell.effect)this.effect(spell.effect,start);
   if(spell.kind!=='glyph'&&spell.effect){const position:Point=(spell.kind==='cone'||spell.kind==='wrath')?[start[0]+dx/Math.hypot(dx,dy)*spell.range/2,start[1]+dy/Math.hypot(dx,dy)*spell.range/2]:spell.kind==='direct'&&victim?victim.position:this.player.position;this.effect(spell.effect,position);}
   return true;
  }
  const travel=spell.kind==='line'?spell.range:Math.min(spell.range,length);
  const end:Point=[start[0]+dx/length*travel,start[1]+dy/length*travel];
  this.shots.push({id:++this.serial,spell:id,position:[...start],start,target:end,power:finalStats(this.profile).power,buff:this.time<this.buffUntil?balance.buffMultiplier:1,hit:new Set(),age:0});
  return true;
 }
 equipItem(uid:string,slot?:Slot){if(equip(this.profile,uid,slot)){this.hp=Math.min(this.hp,finalStats(this.profile).hp);this.persist();}}
 unequip(slot:Slot){delete this.profile.equipment[slot];this.hp=Math.min(this.hp,finalStats(this.profile).hp);this.persist();}
 sellDuplicates(){
  const sale=sellDuplicateItems(this.profile);
  if(sale.sold){this.hp=Math.min(this.hp,finalStats(this.profile).hp);this.message(`${sale.sold} doublon${sale.sold>1?'s':''} vendu${sale.sold>1?'s':''} : +${sale.kamas} kamas.`);this.persist();}
  return sale;
 }
 private setAction(actor:Actor,action:Actor['action']){if(actor.action!==action){actor.action=action;actor.animationTime=0;}}
 private moveActor(actor:Actor,speed:number,dt:number):boolean{
  while(actor.route.length&&distance(actor.position,actor.route[0])<0.5)actor.route.shift();
  if(!actor.route.length)return false;
  const target=actor.route[0],dx=target[0]-actor.position[0],dy=target[1]-actor.position[1],length=Math.hypot(dx,dy),step=Math.min(speed*dt,length);
  const next:Point=[actor.position[0]+dx/length*step,actor.position[1]+dy/length*step];
  if(!this.navigation.clear(actor.position,next)){actor.route=[];return false;}
  actor.position=next;actor.direction=directionFor(dx,dy);return true;
 }
 private effect(asset:string,position:Point,angle=0,followPlayer=false){
  const clip=this.manifest.assets[asset];const ttl=clip?clip.frames.reduce((sum,f)=>sum+f.durationMs,0)/1000:0.8;
  this.effects.push({id:++this.serial,asset,position:[...position],age:0,ttl,angle,followPlayer});
 }
 private float(text:string,position:Point,kind:Floating['kind']='damage',icon?:string){this.floating.push({id:++this.serial,text,position:[...position],age:0,kind,icon});}
 private hit(enemy:Enemy,amount:number){
  if(enemy.hp<=0||this.time<this.truceUntil)return;enemy.hp=Math.max(0,enemy.hp-amount);this.float(String(amount),enemy.position);
  if(enemy.hp>0){this.setAction(enemy,'hit');enemy.actionUntil=this.time+balance.enemyHitAnimation;return;}
  this.setAction(enemy,'death');enemy.deadAt=this.time;enemy.route=[];delete enemy.rangedTarget;
  if(enemy.rewarded)return;enemy.rewarded=true;this.kills++;
  const definition=monsters[enemy.kind],old=this.profile.level;this.hp+=awardXp(this.profile,definition.xp);this.profile.kamas+=definition.kamas;
  this.float(`+${definition.xp} XP · ${definition.kamas} k`,enemy.position,'reward');
  if(this.profile.level>old)this.message(`Niveau ${this.profile.level} ! Vie et Puissance augmentées.`);
  const loot=this.dungeon?dungeons[this.dungeon].loot:{normalChance:balance.lootChance,bossChance:balance.bossLootChance};
  const drops=monsterLoot(definition,this.testLootChance??(definition.boss?loot.bossChance:loot.normalChance),this.random);
  for(const drop of drops){const item=items[drop];this.float(item.name,enemy.position,'loot',item.icon);this.giveItem(drop);this.message(`Butin : ${item.name}. Ouvrir l’inventaire pour l’équiper.`);}
  this.persist();
 }
 private giveItem(item:string){this.profile.inventory.push({uid:`drop-${this.seed}-${++this.serial}`,item});}
 private rewardCompletion(){
  if(!this.dungeon||!dungeonModes[this.mode].completeSet)return;
  const setId=dungeons[this.dungeon].rewardSet,complete=Object.values(items).filter(item=>item.set===setId);
  for(const item of complete)this.giveItem(item.id);
  this.message(`Victoire Extrême : ${sets[setId].name} complète obtenue (${complete.length} objets) !`);
 }
 private spawn(wave:MonsterId[]){
  const positions=this.map.enemySpawns??[];
  this.enemies=this.enemies.filter(e=>e.hp>0);
  const multipliers=this.director?waveMultipliers(this.director.dungeon,this.director.index,this.mode):{hp:1,damage:1};
  const occupied=new Set<number>();
  wave.forEach((kind,index)=>{
   const anchor=positions[index%positions.length]??this.map.spawn;
   // Répartir les groupes renforcés sur les cellules traversables autour des ancres
   // authored, avec une cellule distincte sans comparaison de distance entre monstres.
   const candidates=this.navigation.cells.filter(cell=>!occupied.has(cell.id)&&distance(cell.position,this.map.spawn)>=70&&distance(cell.position,this.player.position)>=70).sort((a,b)=>distance(a.position,anchor)-distance(b.position,anchor));
   const cell=candidates.find(cell=>this.navigation.clear(anchor,cell.position))??candidates.find(cell=>this.navigation.route(anchor,cell.position).length);
   const point=cell?.position??anchor;if(cell)occupied.add(cell.id);
   const maxHp=Math.round(monsters[kind].hp*multipliers.hp),attackDamage=Math.round(monsters[kind].damage*multipliers.damage);
   this.enemies.push({id:++this.serial,kind,position:[...point],direction:'south',action:'idle',animationTime:0,actionUntil:0,route:[],hp:maxHp,maxHp,damage:attackDamage,spawnedAt:this.time,attackAt:this.time+0.6+index*0.13,pathAt:0,deadAt:0,rewarded:false});
  });
  this.message(this.director?.boss?`Dernière vague : ${monsters[wave[0]].name} !`:`Vague ${(this.director?.index??0)+1}/${this.director?.total}.`);
 }
 private updateShots(dt:number){
  const survivors:Shot[]=[];
  for(const shot of this.shots){
   const spell=spells[shot.spell],old:Point=[...shot.position],remaining=distance(old,shot.target),step=Math.min(spell.speed*dt,remaining);
   if(remaining>0)shot.position=[old[0]+(shot.target[0]-old[0])/remaining*step,old[1]+(shot.target[1]-old[1])/remaining*step];
   shot.age+=dt;
   const blocked=!this.navigation.clear(old,shot.position);
   let arrived=remaining<=step+0.1||blocked;
   if(spell.kind!=='area'){
    for(const enemy of this.enemies){
     if(enemy.hp<=0||shot.hit.has(enemy.id)||segmentDistance(enemy.position,old,shot.position)>spell.radius)continue;
     shot.hit.add(enemy.id);this.hit(enemy,damage(this.playerClass.baseDamage,spell.coefficient,shot.power,shot.buff));
     this.effect(spell.effect,enemy.position,Math.atan2(shot.target[1]-shot.start[1],shot.target[0]-shot.start[0]));
     if(spell.kind==='single'){arrived=true;break;}
    }
   }
   if(arrived){
    if(spell.kind==='area'){
     for(const enemy of this.enemies)if(enemy.hp>0&&distance(enemy.position,shot.position)<=spell.radius)this.hit(enemy,damage(this.playerClass.baseDamage,spell.coefficient,shot.power,shot.buff));
     this.effect(spell.effect,shot.position);
    }
   }else survivors.push(shot);
  }
  this.shots=survivors;
 }
 private damagePlayer(amount:number){
  if(this.time<this.truceUntil)return;
  if(this.time<this.chastisementUntil)this.combatPower+=Math.min(this.hp,amount)*classBalance.chastisementPowerPerDamage;
  this.hp=Math.max(0,this.hp-amount);this.float(String(amount),this.player.position);
  if(this.hp>0){
   if(this.player.action!=='cast'&&this.player.action!=='buff'){this.setAction(this.player,'hit');this.player.actionUntil=this.time+0.16;}
   return;
  }
  this.resetCombat();this.phase='death';this.player.route=[];this.setAction(this.player,'death');this.player.actionUntil=Infinity;this.shots=[];this.enemyShots=[];
  this.message('Vous êtes tombé. Les gains sont conservés ; une nouvelle tentative repart à la première vague.');this.persist();
 }
 private updateEnemyShots(dt:number){
  const survivors:EnemyShot[]=[];
  for(const shot of this.enemyShots){
   const old:Point=[...shot.position],remaining=distance(old,shot.target),step=Math.min(shot.speed*dt,remaining);
   if(remaining>0)shot.position=[old[0]+(shot.target[0]-old[0])/remaining*step,old[1]+(shot.target[1]-old[1])/remaining*step];
   shot.age+=dt;
   if(!this.navigation.clear(old,shot.position))continue;
   if(segmentDistance(this.player.position,old,shot.position)<=shot.radius){
    this.damagePlayer(shot.damage);if(this.phase==='death')return;
   }else if(remaining>step+0.1)survivors.push(shot);
  }
  this.enemyShots=survivors;
 }
 private updateEnemies(dt:number){
  for(const enemy of this.enemies){
   if(enemy.hp<=0)continue;
   const data=monsters[enemy.kind],length=distance(enemy.position,this.player.position);
   if(enemy.rangedTarget&&this.time>=enemy.rangedTarget.releaseAt&&data.rangedAttack){
    const attack=data.rangedAttack,start:Point=[...enemy.position];
    this.enemyShots.push({id:++this.serial,asset:attack.asset,start,position:[...start],target:[...enemy.rangedTarget.position],damage:enemy.damage,speed:attack.speed,radius:attack.radius,age:0});
    delete enemy.rangedTarget;
   }
   if(this.time<(enemy.rangedAnimationUntil??0))continue;
   if(length>data.detect){this.setAction(enemy,'idle');continue;}
   enemy.direction=directionFor(this.player.position[0]-enemy.position[0],this.player.position[1]-enemy.position[1]);
   if(length<=(data.rangedAttack?.range??data.range)&&this.navigation.clear(enemy.position,this.player.position)){
    enemy.route=[];
    if(this.time>=enemy.attackAt){
     enemy.attackAt=this.time+data.interval;enemy.actionUntil=this.time+balance.enemyAttackAnimation;this.setAction(enemy,'attack');
     enemy.animationTime=0;
     if(data.rangedAttack&&length>data.range){
      enemy.rangedTarget={position:[...this.player.position],releaseAt:this.time+data.rangedAttack.windup};
      enemy.rangedAnimationUntil=enemy.actionUntil=this.time+data.rangedAttack.animationDuration;
     }else{delete enemy.rangedAnimationUntil;this.damagePlayer(enemy.damage);}
    }else if(this.time>=enemy.actionUntil)this.setAction(enemy,'idle');
   }else if(this.time>=enemy.actionUntil){
    if(this.time>=enemy.pathAt){
     enemy.route=this.navigation.clear(enemy.position,this.player.position)?[[...this.player.position]]:this.navigation.route(enemy.position,this.player.position);
     enemy.pathAt=this.time+0.65;
    }
    const speed=enemyMovementSpeed(data,this.time-dt-enemy.spawnedAt,this.time-enemy.spawnedAt);
    this.setAction(enemy,this.moveActor(enemy,speed,dt)?'run':'idle');
   }
   if(this.phase==='death')break;
  }
 }
 update(dt:number){
  if(this.paused)return;
  this.time+=dt;this.saveTimer+=dt;this.player.animationTime+=dt;for(const enemy of this.enemies)enemy.animationTime+=dt;
  this.enemies=this.enemies.filter(e=>e.hp>0||this.time-e.deadAt<balance.enemyDeathAnimation);
  if(this.phase!=='death'&&this.phase!=='victory'){
   // Conserve la destination, mais immobilise le Crâ pendant la fenêtre d’incantation.
   const movementDt=Math.min(dt,Math.max(0,this.time-this.castUntil));
   const moving=movementDt>0&&this.moveActor(this.player,this.playerClass.speed*(1+movementSpeedBonus(this.profile)/100),movementDt);
   if(this.time>=this.player.actionUntil)this.setAction(this.player,moving?'run':'idle');
  }
  if(this.phase==='hub')this.updateShots(dt);
  if(this.phase==='combat'){
   for(const glyph of this.glyphs)while(glyph.nextTick<=this.time){const tick=glyph.nextTick;glyph.nextTick+=classBalance.glyphInterval;if(tick<this.truceUntil)continue;for(const enemy of this.enemies)if(enemy.hp>0&&distance(enemy.position,glyph.position)<=spells.glyph.radius)this.hit(enemy,this.classDamage(spells.glyph.coefficient));}
   this.updateShots(dt);this.updateEnemyShots(dt);if(this.phase==='combat')this.updateEnemies(dt);
   if(this.phase==='combat'){
    const wave=this.director?.update(dt,this.enemies.filter(e=>e.hp>0).length);if(wave)this.spawn(wave);
    if(this.director?.completed){this.resetCombat();this.phase='victory';this.enemyShots=[];this.player.route=[];this.setAction(this.player,'idle');if(this.dungeon&&!this.profile.completed.includes(this.dungeon))this.profile.completed.push(this.dungeon);this.message('Donjon terminé ! Les récompenses sont sauvegardées.');this.rewardCompletion();this.persist();}
   }
  }
  for(const effect of this.effects){effect.age+=dt;if(effect.followPlayer)effect.position=[...this.player.position];}
  this.effects=this.effects.filter(e=>e.age<e.ttl);
  for(const f of this.floating)f.age+=dt;this.floating=this.floating.filter(f=>f.age<(f.kind==='loot'?1.8:1.2));
  if(this.saveTimer>=8){this.saveTimer=0;this.persist();}
 }
}
