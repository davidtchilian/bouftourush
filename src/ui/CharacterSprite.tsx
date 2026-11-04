import {useEffect,useRef} from 'react';
import type {Manifest} from '../game/assets/manifest';
import {composeActor,layerBounds,type EquipmentAppearance} from '../game/rendering/composition';
import {frameStyle} from './AssetSprite';
/** Mêmes pièces HD, matrices, timeline et règles de visibilité que le personnage en jeu. */
export function CharacterSprite({manifest,actorId,equipment,width,height}:{manifest:Manifest;actorId:string;equipment:EquipmentAppearance;width:number;height:number}){
 const ref=useRef<HTMLDivElement>(null),actor=manifest.composition?.actors[actorId];
 const {hat,cape}=equipment;
 useEffect(()=>{
  const host=ref.current;if(!host||!actor)return;
  let live=true,raf=0,last=-1;const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const duration=actor.frames.reduce((sum,f)=>sum+f.durationMs,0);
  // Évaluer toutes les frames garde un cadrage stable, sans bitmap intermédiaire.
  let time=0;
  const sequences=actor.frames.map(frame=>{const layers=composeActor(manifest,actorId,{hat,cape},time).map(layer=>({...layer,assetId:`preview.${layer.assetId}`,maskAssetId:layer.maskAssetId?`preview.${layer.maskAssetId}`:undefined}));time+=frame.durationMs;return layers;});
  const bounds=sequences.flatMap(layers=>layers.map(layer=>layerBounds(manifest.assets[layer.assetId],layer.matrix)));
  const left=Math.min(...bounds.map(b=>b[0])),top=Math.min(...bounds.map(b=>b[1])),right=Math.max(...bounds.map(b=>b[2])),bottom=Math.max(...bounds.map(b=>b[3]));
  const scale=Math.min(width/(right-left),height/(bottom-top)),mirror=actor.flipX?-1:1;
  const originX=(width-(right-left)*scale)/2+(mirror===1?-left:right)*scale,originY=(height-(bottom-top)*scale)/2-top*scale;
  const nodes:HTMLDivElement[]=[];
  const draw=(index:number)=>{
   const layers=sequences[index];host.dataset.frame=String(index);
   for(const node of nodes)node.style.display='none';
   layers.forEach((layer,i)=>{
    const node=nodes[i]??document.createElement('div');if(!nodes[i]){nodes[i]=node;node.append(document.createElement('div'));host.append(node);}
    const sprite=node.firstElementChild as HTMLDivElement;
    const asset=manifest.assets[layer.assetId],[a,b,c,d,tx,ty]=layer.matrix;
    const mask=layer.maskAssetId?manifest.assets[layer.maskAssetId]:undefined;
    const mx=mask?-mask.pivot[0]*mask.size[0]:0,my=mask?-mask.pivot[1]*mask.size[1]:0;
    node.style.cssText='position:absolute;left:0;top:0;transform-origin:0 0';
    node.style.transform=`matrix(${mirror*scale},0,0,${scale},${originX+mirror*mx*scale},${originY+my*scale})`;
    node.style.opacity=String(layer.opacity);
    if(mask){
     const style=frameStyle(mask,0,...mask.size);
     Object.assign(node.style,{width:style.width,height:style.height,maskImage:style.backgroundImage,maskSize:style.backgroundSize,maskPosition:style.backgroundPosition,maskRepeat:'no-repeat'});
    }
    sprite.style.cssText='position:absolute;left:0;top:0;transform-origin:0 0';
    Object.assign(sprite.style,frameStyle(asset,layer.frame,...asset.size));
    const x=-asset.pivot[0]*asset.size[0],y=-asset.pivot[1]*asset.size[1];
    sprite.style.transform=`matrix(${a},${b},${c},${d},${a*x+c*y+tx-mx},${b*x+d*y+ty-my})`;

   });
  };
  host.replaceChildren();host.dataset.loaded='false';
  const paths=new Set(sequences.flatMap(layers=>layers.flatMap(layer=>[manifest.assets[layer.assetId].frames[layer.frame].path,...(layer.maskAssetId?[manifest.assets[layer.maskAssetId].frames[0].path]:[])])));
  Promise.all([...paths].map(async path=>{const image=new Image();image.src='/assets/'+path;await image.decode();})).then(()=>{
   if(!live)return;host.dataset.loaded='true';const start=performance.now();
   const tick=(now:number)=>{
    const elapsed=(now-start)%(duration+1000);let frame=0,remaining=elapsed;
    if(!preference.matches&&elapsed<duration)while(frame<actor.frames.length-1&&remaining>=actor.frames[frame].durationMs){remaining-=actor.frames[frame++].durationMs;}
    if(frame!==last){draw(frame);last=frame;}if(actor.frames.length>1)raf=requestAnimationFrame(tick);
   };tick(start);
  }).catch(()=>{if(live)host.dataset.loaded='error';});
  return()=>{live=false;cancelAnimationFrame(raf);host.replaceChildren();};
 },[manifest,actorId,actor,hat,cape,width,height]);
 const appearance=hat==='none'&&cape==='none'?actorId:`appearance.${hat}.${cape}.${actorId}`;
 if(!actor)return <p className="asset-diagnostic">Composition Remastered absente : {actorId}.</p>;
 return <div className="sprite-preview" role="img" aria-label="Aperçu du Crâ équipé" data-asset={appearance} data-render-asset={`composition.${actorId}`} style={{width,height}}><div className="atlas-sprite" ref={ref} style={{position:'relative',width,height}}/></div>;
}
