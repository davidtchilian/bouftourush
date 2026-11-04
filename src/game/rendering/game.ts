import * as THREE from 'three';
import {parseManifest,type Manifest,type Animation} from '../assets/manifest';
import {animationFrame} from './animation';
import {fitMapView} from './camera';
import {composeActor,type ComposedLayer} from './composition';
import {applyCompositionMask} from './compositionMask';
import {startLoop} from '../core/loop';
import {Simulation,type Actor,type Snapshot} from '../core/simulation';
import {bindPointer} from '../input/pointer';
import type {Point} from '../movement/navigation';
import {items} from '../../data/items';
import {monsters} from '../../data/monsters';
import {balance,spells,type SpellId} from '../../data/balance';
import {loadProfile,saveProfile,type StorageLike} from '../save/persistence';
import {finalStats} from '../progression/profile';
export type ScreenLabel={id:string;x:number;y:number;text:string;kind:'player'|'enemy'|'boss'|'damage'|'reward'|'loot';icon?:string;hp?:number;maxHp?:number};
export type GameController={simulation:Simulation;manifest:Manifest;dispose:()=>void};
type Node={mesh:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;asset:string};
const storage:StorageLike={getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)};
/** Tout le rendu reste en quads texturés ; simulation et navigation ne dépendent pas du GPU. */
export async function mountGame(host:HTMLElement,signal:AbortSignal,onSnapshot:(snapshot:Snapshot)=>void,onStatus:(text:string)=>void,onLabels:(labels:ScreenLabel[])=>void=()=>{}):Promise<GameController>{
 const response=await fetch('/assets/manifest.json',{signal});
 if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw new Error('Manifeste absent : lancer pnpm assets:prepare:game puis pnpm assets:import .local-assets/game-runtime. Voir docs/ASSETS.md.');
 const manifest=parseManifest(await response.json()),textures=new Map<string,THREE.Texture>(),geometries=new Map<string,THREE.PlaneGeometry>(),frameTextures=new Map<string,THREE.Texture>();
 let renderer:THREE.WebGLRenderer|undefined,stop=()=>{},removeInput=()=>{},resize=()=>{},save=()=>{};
 const nodes=new Map<string,Node>(),mapNodes:Node[]=[];let observer:ResizeObserver|undefined;
 const dispose=()=>{stop();removeInput();save();observer?.disconnect();window.removeEventListener('resize',resize);window.removeEventListener('pagehide',save);for(const n of [...nodes.values(),...mapNodes])n.mesh.material.dispose();for(const g of geometries.values())g.dispose();for(const t of frameTextures.values())t.dispose();for(const t of textures.values())t.dispose();renderer?.dispose();renderer?.domElement.remove();};
 try{
  const loader=new THREE.TextureLoader();
  const paths=[...new Set(Object.entries(manifest.assets).filter(([id])=>!id.startsWith('ui.')&&!id.startsWith('item.')&&!id.startsWith('preview.')&&(!manifest.composition||!id.startsWith('cra.'))).flatMap(([,a])=>a.frames.map(f=>f.path)))];
  let cursor=0,completed=0;
  const loaded=await Promise.allSettled(Array.from({length:Math.min(12,paths.length)},async()=>{
   while(cursor<paths.length){
    const path=paths[cursor++];const texture=await loader.loadAsync('/assets/'+path).catch(()=>{throw new Error(`Texture introuvable ou illisible : /assets/${path}. Relancer assets:import.`);});
    texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;textures.set(path,texture);completed++;
    if(completed%64===0)onStatus(`Chargement des animations : ${completed}/${paths.length}…`);
    if(signal.aborted)throw new DOMException('Annulé','AbortError');
   }
  }));
  const failed=loaded.find(r=>r.status==='rejected');if(failed?.status==='rejected')throw failed.reason;
  if(signal.aborted)throw new DOMException('Annulé','AbortError');
  const frameKey=(frame:Animation['frames'][number])=>frame.path+(frame.region?'#'+frame.region.join(','):'');
  const textureFor=(frame:Animation['frames'][number])=>frameTextures.get(frameKey(frame))??textures.get(frame.path)!;
  // Les variantes UV partagent l'image source et donc le stockage GPU de chaque atlas.
  for(const asset of Object.values(manifest.assets))for(const frame of asset.frames){
   if(!frame.region||frameTextures.has(frameKey(frame)))continue;
   const base=textures.get(frame.path);if(!base)continue;
   const texture=base.clone(),[x,y,w,h,pw,ph]=frame.region;
   texture.repeat.set(w/pw,h/ph);texture.offset.set(x/pw,1-(y+h)/ph);texture.updateMatrix();frameTextures.set(frameKey(frame),texture);
  }
  const loadedProfile=loadProfile(storage);
  const game=new Simulation(manifest,loadedProfile.profile,()=>save());
  let saveWarning=false;
  save=()=>{if(!saveProfile(storage,game.profile)&&!saveWarning){saveWarning=true;game.message('Sauvegarde locale indisponible. Votre progression reste disponible dans cet onglet.');}};
  if(loadedProfile.warning)game.message(loadedProfile.warning);
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0.1,100);camera.position.z=50;
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.domElement.setAttribute('aria-label','Scène de jeu');host.append(renderer.domElement);
  const geometryFor=(id:string)=>{
   let geometry=geometries.get(id);if(geometry)return geometry;
   const asset=manifest.assets[id];if(!asset)throw new Error(`Animation absente : ${id}`);
   geometry=new THREE.PlaneGeometry(...asset.size);geometry.translate((0.5-asset.pivot[0])*asset.size[0],(asset.pivot[1]-0.5)*asset.size[1],0);geometries.set(id,geometry);return geometry;
  };
  const create=(id:string):Node=>{
   const material=new THREE.MeshBasicMaterial({map:textureFor(manifest.assets[id].frames[0]),transparent:true,depthTest:false,depthWrite:false});
   const mesh=new THREE.Mesh(geometryFor(id),material);scene.add(mesh);return{mesh,asset:id};
  };
  const draw=(key:string,id:string,point:Point,age:number,order:number,flip?:boolean,rotation=0)=>{
   let node=nodes.get(key);if(!node){node=create(id);nodes.set(key,node);}
   if(node.asset!==id){node.mesh.geometry=geometryFor(id);node.asset=id;}
   const asset=manifest.assets[id];node.mesh.visible=true;node.mesh.material.map=textureFor(asset.frames[animationFrame(asset,age*1000)]);
   node.mesh.position.set(point[0]+asset.offset[0],point[1]+asset.offset[1],0);node.mesh.renderOrder=order;node.mesh.scale.set((flip??asset.flipX)?-1:1,1,1);node.mesh.rotation.z=rotation;
  };
  resize=()=>{
   const [left,bottom,right,top]=game.map.bounds;const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight);
   const view=fitMapView(game.map,width,height),half=view.halfHeight;
   camera.position.x=view.x;camera.position.y=view.y;camera.left=-half*width/height;camera.right=half*width/height;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();renderer!.setSize(width,height);
   renderer!.domElement.dataset.cameraBounds=JSON.stringify([view.x-view.halfWidth,view.y-half,view.x+view.halfWidth,view.y+half]);
   renderer!.domElement.dataset.mapBounds=JSON.stringify(game.map.bounds);
   const scale=height/(half*2);renderer!.setScissor((width-(right-left)*scale)/2,(height-(top-bottom)*scale)/2,(right-left)*scale,(top-bottom)*scale);renderer!.setScissorTest(true);
  };
  let mapRevision=-1;
  const rebuildMap=()=>{
   for(const node of mapNodes){scene.remove(node.mesh);node.mesh.material.dispose();}mapNodes.length=0;
   for(const layer of game.map.layers??[]){
    const node=create(layer.assetId),a=manifest.assets[layer.assetId];node.mesh.position.set(layer.position[0]+a.offset[0],layer.position[1]+a.offset[1],0);node.mesh.renderOrder=layer.order;
    node.mesh.scale.set(layer.scale[0]*(layer.flipX?-1:1),layer.scale[1],1);node.mesh.rotation.z=layer.rotation*Math.PI/180;mapNodes.push(node);
   }
   mapRevision=game.mapRevision;resize();
  };
  rebuildMap();observer=new ResizeObserver(resize);observer.observe(host);window.addEventListener('resize',resize);window.addEventListener('pagehide',save);
  const raycaster=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),0);
  let aim:Point=[game.player.position[0]+60,game.player.position[1]],cursorPoint:Point|null=null;
  const ground=(x:number,y:number):Point|null=>{
   const rect=renderer!.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1),camera);
   const p=raycaster.ray.intersectPlane(plane,new THREE.Vector3());return p?[p.x,p.y]:null;
  };
  const pointer=bindPointer(renderer.domElement,(x,y)=>{const p=ground(x,y);if(p)game.move(p);},(x,y)=>{cursorPoint=[x,y];const p=ground(x,y);if(p)aim=p;});
  const keyboard=(event:KeyboardEvent)=>{
   if(event.repeat||event.ctrlKey||event.altKey||event.metaKey||(event.target instanceof HTMLElement&&(event.target.matches('input,textarea,select')||event.target.isContentEditable)))return;
   const id=(Object.entries(spells) as [SpellId,typeof spells[SpellId]][]).find(([,spell])=>spell.key===event.key.toLowerCase())?.[0];
   if(id){
    event.preventDefault();let target=cursorPoint?ground(...cursorPoint)??aim:aim;
    // La silhouette survolée cible les pieds logiques : viser la tête ne doit pas faire tirer au-dessus.
    if(cursorPoint&&id!=='power'){
     const candidates=game.enemies.filter(e=>e.hp>0).flatMap(enemy=>{const node=nodes.get(`enemy-${enemy.id}`);return node?[{enemy,mesh:node.mesh}]:[];});
     const hit=raycaster.intersectObjects(candidates.map(c=>c.mesh)).sort((a,b)=>b.object.renderOrder-a.object.renderOrder)[0];
     const hovered=hit&&candidates.find(c=>c.mesh===hit.object)?.enemy;
     if(hovered)target=[...hovered.position];
    }
    game.cast(id,target);
   }
  };
  window.addEventListener('keydown',keyboard);removeInput=()=>{pointer.dispose();window.removeEventListener('keydown',keyboard);};
  const project=(position:Point,height=0):{x:number;y:number}=>{const p=new THREE.Vector3(position[0],position[1]+height,0).project(camera);return{x:(p.x+1)*50,y:(1-p.y)*50};};
  const side=(actor:Actor)=>{const back=['north','northwest','northeast'].includes(actor.direction);return{suffix:back?'L':'R',flip:back?actor.direction==='northeast':['west','southwest'].includes(actor.direction)};};
  let snapshotTimer=0;
  stop=startLoop(dt=>{
   pointer.tick(dt);game.update(dt);snapshotTimer+=dt;
   if(game.mapRevision!==mapRevision)rebuildMap();
   for(const node of nodes.values())node.mesh.visible=false;
   const player=game.player;
   let asset:string,flip:boolean|undefined;
   if(player.action==='idle'||player.action==='run')asset=`${game.playerClass.sprite}.${player.action}.${player.direction}`;
   else{const facing=side(player);asset=`${game.playerClass.sprite}.${player.action}.${facing.suffix}`;flip=facing.flip;}
   const worn=(slot:'hat'|'cape')=>{const instance=game.profile.inventory.find(item=>item.uid===game.profile.equipment[slot]);return instance?items[instance.item].id:'none';};
   const hat=worn('hat'),cape=worn('cape');
   const playerAge=(player.action==='cast'||player.action==='buff')?player.animationTime*manifest.assets[asset].frames.reduce((sum,frame)=>sum+frame.durationMs,0)/1000/balance.castAnimation:player.animationTime;
   const layers:ComposedLayer[]=manifest.composition?composeActor(manifest,asset,{hat,cape},playerAge*1000):[{assetId:asset,frame:animationFrame(manifest.assets[asset],playerAge*1000),matrix:[1,0,0,1,0,0],opacity:1}];
   const playerKeys:string[]=[];
   const mirror=(flip??manifest.composition?.actors[asset].flipX??manifest.assets[asset].flipX)?-1:1;
   layers.forEach((layer,index)=>{
    const key=`player-${index}`;playerKeys.push(key);
    draw(key,layer.assetId,player.position,0,2000+game.navigation.nearest(player.position).id+0.5+index*0.0001);
    const node=nodes.get(key)!,[a,b,c,d,tx,ty]=layer.matrix;
    node.mesh.material.map=textureFor(manifest.assets[layer.assetId].frames[layer.frame]);
    // S × M_flash × S : les deux moteurs ont des axes verticaux opposés.
    applyCompositionMask(node.mesh.material,layer,manifest,textureFor);
    node.mesh.matrixAutoUpdate=false;
    node.mesh.matrix.set(mirror*a,-mirror*c,0,player.position[0]+mirror*tx,-b,d,0,player.position[1]-ty,0,0,1,0,0,0,0,1);
    node.mesh.matrixWorldNeedsUpdate=true;
   });
   for(const enemy of game.enemies){const facing=side(enemy);draw(`enemy-${enemy.id}`,`mob.${monsters[enemy.kind].sprite}.${enemy.action}.${facing.suffix}`,enemy.position,enemy.animationTime,2000+game.navigation.nearest(enemy.position).id+0.3,facing.flip);}
   for(const shot of game.shots){const angle=Math.atan2(shot.target[1]-shot.start[1],shot.target[0]-shot.start[0]);draw(`shot-${shot.id}`,`spell.${shot.spell}.projectile`,shot.spell==='flaming'?shot.start:shot.position,shot.age,5000,false,angle);}
   for(const effect of game.effects)draw(`effect-${effect.id}`,effect.asset,effect.position,effect.age,5100,false,effect.asset.startsWith('spell.flaming')?effect.angle:0);
   const alive=new Set([...playerKeys,...game.enemies.map(e=>`enemy-${e.id}`),...game.shots.map(e=>`shot-${e.id}`),...game.effects.map(e=>`effect-${e.id}`)]);
   for(const [key,node] of nodes)if(!alive.has(key)){scene.remove(node.mesh);node.mesh.material.dispose();nodes.delete(key);}
   const canvas=renderer!.domElement;canvas.dataset.playerX=player.position[0].toFixed(2);canvas.dataset.playerY=player.position[1].toFixed(2);canvas.dataset.animation=hat==='none'&&cape==='none'?asset:`appearance.${hat}.${cape}.${asset}`;canvas.dataset.compositionLayers=String(layers.length);canvas.dataset.map=game.mapId;canvas.dataset.phase=game.phase;canvas.dataset.mode=game.mode;
   canvas.dataset.enemies=JSON.stringify(game.enemies.filter(e=>e.hp>0).map(e=>({id:e.id,kind:e.kind,x:e.position[0],y:e.position[1],hp:e.hp})));
   canvas.dataset.projectiles=String(game.shots.length);
   if(snapshotTimer>=0.1){
    canvas.dataset.renderStats=JSON.stringify({calls:renderer!.info.render.calls,textures:renderer!.info.memory.textures,geometries:renderer!.info.memory.geometries,quads:nodes.size+mapNodes.length,playerQuads:layers.length});
    snapshotTimer=0;onSnapshot(game.snapshot());
   }
  },()=>{
   renderer!.render(scene,camera);
   // Les étiquettes suivent exactement les positions dessinées, à chaque image.
   const labels:ScreenLabel[]=game.enemies.filter(e=>e.hp>0).map(e=>({id:`enemy-${e.id}`,...project(e.position,monsters[e.kind].boss?68:45),text:monsters[e.kind].name,hp:e.hp,maxHp:e.maxHp,kind:monsters[e.kind].boss?'boss':'enemy'}));
   if(game.dungeon)labels.push({id:'player-health',...project(game.player.position,58),text:'',hp:game.hp,maxHp:finalStats(game.profile).hp,kind:'player'});
   for(const f of game.floating){const height=f.kind==='loot'?72+f.age*20:48+f.age*20;labels.push({id:`float-${f.id}`,...project(f.position,height),text:f.text,kind:f.kind,icon:f.icon});}
   onLabels(labels);
  });
  onSnapshot(game.snapshot());onStatus('Prêt');
  return{simulation:game,manifest,dispose};
 }catch(error){dispose();throw error;}
}
