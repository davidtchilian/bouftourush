import {useState} from 'react';
import type {Manifest} from '../game/assets/manifest';
import {dungeons,dungeonModes,type DungeonId,type DungeonMode,type DungeonDefinition} from '../data/dungeons';
import {monsters} from '../data/monsters';
import {items,sets} from '../data/items';
import {AssetSprite} from './AssetSprite';
import {assetImage} from './art';

function DungeonCard({dungeon,manifest,completed,onEnter}:{dungeon:DungeonDefinition;manifest:Manifest;completed:boolean;onEnter:(mode:DungeonMode)=>void}){
 const [active,setActive]=useState(false),bossId=dungeon.bossWave.find(id=>monsters[id].boss),boss=bossId&&monsters[bossId];
 return <article className="dungeon-card" onMouseEnter={()=>setActive(true)} onMouseLeave={()=>setActive(false)} onFocusCapture={()=>setActive(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setActive(false);}}>
  <div className="dungeon-card-heading"><span className="eyebrow">{`Palier ${dungeon.tier}${completed?' · Accompli':''}`}</span><span className="dungeon-entry">Entrée libre</span></div>
  <h3>{dungeon.name}</h3>
  <div className="boss-portrait">{boss&&<AssetSprite manifest={manifest} assetId={`mob.${boss.sprite}.${active?'attack':'idle'}.R`} label={`Gardien : ${boss.name}`} width={230} height={164} restMs={1600}/>}</div>
  {boss&&<div className="boss-caption"><span className="eyebrow">Gardien du donjon</span><strong>{boss.name}</strong></div>}
  <p className="dungeon-waves">{dungeon.normalWaves.length} vagues <span>+ boss · {dungeon.normalWaves.reduce((sum,wave)=>sum+wave.length,0)+dungeon.bossWave.length} ennemis</span></p>
  <div className="dungeon-loot"><span className="muted">Butin à découvrir</span><div>{boss&&boss.loot.slice(0,4).map(drop=><img key={drop.item} src={assetImage(manifest,items[drop.item].icon)} alt={items[drop.item].name} title={items[drop.item].name}/>)}</div></div>
  {boss?.bonusLoot&&<p className="muted">Chaque {boss.name} : {boss.bonusLoot.chance*100} % de chances de trouver une pièce de la panoplie du Bouftou Royal, en plus du butin habituel.</p>}
  <button type="button" className="enter-dungeon" disabled={!manifest.gameplayReady} aria-label={`Entrer — ${dungeon.name}`} onClick={()=>onEnter('normal')}>Partir à l’aventure</button>
  <div className="extreme-info"><p className="extreme-description">Extrême : monstres ×{dungeonModes.extreme.monsterCount}, PV ×1,5.</p><p className="muted">Victoire : {sets[dungeon.rewardSet].name} complète.</p></div>
  <button type="button" className="enter-extreme" disabled={!manifest.gameplayReady} aria-label={`Entrer en Extrême — ${dungeon.name}`} onClick={()=>onEnter('extreme')}>Défier en Extrême</button>
 </article>;
}

export function DungeonPanel({manifest,completed,onEnter,onClose}:{manifest:Manifest;completed:string[];onEnter:(id:DungeonId,mode:DungeonMode)=>void;onClose:()=>void}){
 return <section className="dialog dungeon-dialog" role="dialog" aria-modal="true" aria-label="Choisir un donjon">
  <header className="dialog-heading"><div><span className="eyebrow">Le départ de votre prochaine aventure</span><h2>Choisir un donjon</h2><p className="muted">Choisissez votre destination et votre défi. Entrée libre, sans clef ni prérequis.</p></div><button type="button" onClick={onClose}>Fermer</button></header>
  <div className="dungeon-grid">{Object.values(dungeons).map(dungeon=><DungeonCard key={dungeon.id} dungeon={dungeon} manifest={manifest} completed={completed.includes(dungeon.id)} onEnter={mode=>onEnter(dungeon.id,mode)}/>)}</div>
  <p className="dungeon-footer">Explorez les donjons pour compléter vos panoplies. Même en cas de défaite, vos gains sont conservés.</p>
  {!manifest.gameplayReady&&<p>Assets de combat incomplets : consulter docs/ASSETS.md.</p>}
 </section>;
}
