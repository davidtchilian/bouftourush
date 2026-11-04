import {useEffect,useRef,type CSSProperties} from 'react';
import type {Animation,Manifest} from '../game/assets/manifest';
import {animationFrame} from '../game/rendering/animation';

export function frameStyle(asset:Animation,index:number,width:number,height:number):CSSProperties{
 const frame=asset.frames[index],scale=Math.min(width/asset.size[0],height/asset.size[1]);
 const displayWidth=asset.size[0]*scale,displayHeight=asset.size[1]*scale;
 const style:CSSProperties={width:`${displayWidth}px`,height:`${displayHeight}px`,backgroundImage:`url("/assets/${frame.path}")`};
 if(frame.region){
  const [x,y,w,h,pw,ph]=frame.region,sx=displayWidth/w,sy=displayHeight/h;
  style.backgroundSize=`${pw*sx}px ${ph*sy}px`;style.backgroundPosition=`${-x*sx}px ${-y*sy}px`;
 }else{style.backgroundSize='100% 100%';style.backgroundPosition='0 0';}
 return style;
}

/** Découpe les atlas originaux en HTML ; aucun dessin ni contexte WebGL supplémentaire. */
export function AssetSprite({manifest,assetId,label,width=160,height=200,restMs=1000}:{manifest:Manifest;assetId:string;label:string;width?:number;height?:number;restMs?:number}){
 const ref=useRef<HTMLDivElement>(null),asset=manifest.assets[`preview.${assetId}`];
 useEffect(()=>{
  if(!asset||!ref.current)return;
  const element=ref.current,preference=matchMedia('(prefers-reduced-motion: reduce)');let raf=0,start=performance.now(),last=-1,live=true;
  const duration=asset.frames.reduce((sum,frame)=>sum+frame.durationMs,0);
  const tick=(now:number)=>{
   const elapsed=(now-start)%(duration+restMs);
   const index=preference.matches||elapsed>=duration?0:animationFrame({...asset,loop:false},elapsed);
   if(index!==last){Object.assign(element.style,frameStyle(asset,index,width,height));element.dataset.frame=String(index);last=index;}
   if(asset.frames.length>1)raf=requestAnimationFrame(tick);
  };
  const reset=()=>{start=performance.now();};preference.addEventListener('change',reset);element.dataset.loaded='false';
  // Précharger les pages de l'animation évite les apparitions vides lors d'un changement de frame.
  Promise.all([...new Set(asset.frames.map(frame=>frame.path))].map(async path=>{const image=new Image();image.src='/assets/'+path;await image.decode();})).then(()=>{if(live){element.dataset.loaded='true';start=performance.now();tick(start);}}).catch(()=>{if(live)element.dataset.loaded='error';});
  return()=>{live=false;cancelAnimationFrame(raf);preference.removeEventListener('change',reset);};
 },[asset,width,height,restMs]);
 if(!asset)return <p className="asset-diagnostic">Aperçu Remastered haute définition absent : {assetId}. Relancer assets:prepare:game et assets:import.</p>;
 return <div className="sprite-preview" role="img" aria-label={label} data-asset={assetId} data-render-asset={`preview.${assetId}`} style={{width,height}}><div ref={ref} className="atlas-sprite" style={frameStyle(asset,0,width,height)}/></div>;
}
