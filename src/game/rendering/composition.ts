import type {Animation,Manifest} from '../assets/manifest';
import {animationFrame} from './animation';
export type Affine=[number,number,number,number,number,number];
export type EquipmentAppearance={hat:string;cape:string};
export type ComposedLayer={assetId:string;frame:number;matrix:Affine;maskAssetId?:string;opacity:number};
/** Coordonnées Flash (y vers le bas) partagées entre Three.js et les portraits HTML. */
export function composeActor(manifest:Manifest,actorId:string,equipment:EquipmentAppearance,elapsedMs:number):ComposedLayer[]{
 const composition=manifest.composition,actor=composition?.actors[actorId];
 if(!composition||!actor)throw new Error(`Composition Remastered absente : ${actorId}. Relancer assets:prepare:game.`);
 const index=animationFrame(actor,elapsedMs);
 return actor.frames[index].layers.flatMap(layer=>{
  if(layer.hideWithHat&&equipment.hat!=='none')return [];
  let assetId=layer.assetId;
  if(layer.slot){
   const item=layer.slot==='bow'?'bow':equipment[layer.slot];if(item==='none')return [];
   const accessory=composition.accessories[item];
   if(accessory?.slot!==layer.slot)throw new Error(`Accessoire Remastered absent : ${item} (${layer.slot})`);
   assetId=accessory.views[layer.label!];
  }
  const asset=assetId&&manifest.assets[assetId];if(!asset||!assetId)throw new Error(`Pièce Remastered absente : ${assetId??layer.label}`);
  // Les clips GAC sont réappliqués à chaque frame du corps ; les cycles imbriqués
  // suivent le numéro de frame source, comme dans les exports de référence.
  return [{assetId,frame:layer.slot?index%asset.frames.length:0,matrix:layer.matrix,maskAssetId:layer.maskAssetId,opacity:layer.opacity}];
 });
}
/** Rectangle natif après transformation, pour un cadrage commun et stable du portrait. */
export function layerBounds(asset:Animation,m:Affine):[number,number,number,number]{
 const x=-asset.pivot[0]*asset.size[0],y=-asset.pivot[1]*asset.size[1];
 const points=[[x,y],[x+asset.size[0],y],[x,y+asset.size[1]],[x+asset.size[0],y+asset.size[1]]].map(([x,y])=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]]);
 return [Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
}
