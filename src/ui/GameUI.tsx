import {equipmentLimits} from '../game/progression/profile';
import {useEffect,useState,type ReactNode} from 'react';
import {useAppStore} from '../app/store';
import type {GameController} from '../game/rendering/game';
import {spells,type SpellId} from '../data/balance';
import {cooldownFor} from '../game/combat/cooldowns';
import {dungeons,type DungeonId,type DungeonMode} from '../data/dungeons';
import {InventoryPanel} from './InventoryPanel';
import {DungeonPanel} from './DungeonPanel';
const spellLabels:Record<SpellId,string>={explosive:'Explosive',flaming:'Enflammée',magic:'Magique',power:'Puissant'};
export function GameUI({controller}:{controller:GameController|null}){
 const {snapshot:s,manifest,status}=useAppStore();
 const [menu,setMenu]=useState(false),[inventory,setInventory]=useState(false);
 const [help,setHelp]=useState(false),[journalVisible,setJournalVisible]=useState(false);
 const latestMessage=s?.log[0];
 useEffect(()=>{
  if(!latestMessage)return;
  setJournalVisible(true);const timer=window.setTimeout(()=>setJournalVisible(false),5500);
  return()=>window.clearTimeout(timer);
 },[latestMessage]);
 useEffect(()=>{try{setHelp(localStorage.getItem('bouftourush.help.seen')!=='1');}catch{setHelp(true);}},[]);
 const dismissHelp=()=>{setHelp(false);try{localStorage.setItem('bouftourush.help.seen','1');}catch{/* L’aide reste utilisable sans stockage. */}};
 const image=(id:string)=>manifest?.assets[id]?'/assets/'+manifest.assets[id].frames[0].path:undefined;
 useEffect(()=>{if(controller)controller.simulation.paused=menu||inventory;},[controller,menu,inventory]);
 useEffect(()=>{
  const keys=(e:KeyboardEvent)=>{if(e.target instanceof HTMLElement&&(e.target.matches('input,textarea,select')||e.target.isContentEditable))return;
   if(e.key.toLowerCase()==='i'){e.preventDefault();setInventory(v=>!v);setMenu(false);}
   if(e.key==='Escape'){setInventory(false);setMenu(false);setHelp(false);}
  };
  window.addEventListener('keydown',keys);return()=>window.removeEventListener('keydown',keys);
 },[]);
 if(!s||!controller)return null;
 const button=(text:string,onClick:()=>void,extra:Record<string,unknown>={})=><button type="button" onClick={onClick} {...extra}>{text}</button>;
 const panel=(children:ReactNode,label:string)=><section className="dialog" role="dialog" aria-modal="true" aria-label={label}>{children}</section>;
 const enter=(id:DungeonId,mode:DungeonMode='normal')=>{setMenu(false);setInventory(false);controller.simulation.enter(id,mode);};
 return <>
  {status!=='Prêt'&&<p className="world-loading" role="status">{status}</p>}
  {(menu||inventory||s.phase==='victory'||s.phase==='death')&&<div className="dialog-backdrop" aria-hidden="true"/>}
  <footer className="spellbar">
   <div className="player-vitals">
    <div className="health-readout">{image('ui.heart')&&<img className="heart" src={image('ui.heart')} alt=""/>}<div><span className="eyebrow">Crâ · Niveau {s.level}</span><strong aria-label={`Vie ${s.hp} sur ${s.maxHp}`}>{s.hp}<span> / {s.maxHp} PV</span></strong></div></div>
    <div className="experience-readout"><progress className="xp-meter" value={s.xp} max={s.nextXp} aria-label="Expérience avant le prochain niveau"/><span className="experience" title={`Prochain niveau : ${s.xp} / ${s.nextXp} XP`}>XP {s.xp} / {s.nextXp}</span></div>
   </div>
   <div className="spell-deck" role="group" aria-label="Sorts AZER">
    {(Object.entries(spells) as [SpellId,typeof spells[SpellId]][]).map(([id,spell])=><div key={id} className="spell" tabIndex={0} aria-label={`${spell.name} · ${spell.key.toUpperCase()} · ${s.cooldowns[id]>0?`${s.cooldowns[id].toFixed(1)} secondes`:'Prêt'}`} data-ready={s.cooldowns[id]<=0}>
     <img className="spell-icon" src={image(`ui.spell.${id}`)} alt=""/><span className="spell-key">{spell.key.toUpperCase()}</span><span className="spell-short-name">{spellLabels[id]}</span>
     <span className="spell-timer">{s.cooldowns[id]>0?`${s.cooldowns[id].toFixed(1)} s`:id==='power'&&s.buffRemaining>0?`${s.buffRemaining.toFixed(1)} s`:'Prêt'}</span>
     <span className="spell-tooltip" role="tooltip"><strong>{spell.name}</strong><span>{id==='power'?'Augmente temporairement vos dégâts.':'Visez avec la souris, puis appuyez sur '+spell.key.toUpperCase()+'.'}</span><span>Recharge : {Number(cooldownFor(id,s.cooldownReduction,equipmentLimits(controller.simulation.profile).cooldownReduction).toFixed(3))} s{s.cooldownReduction>0?` (−${s.cooldownReduction} %)` : ''}</span></span>
    </div>)}
   </div>
   <div className="adventure-tools">
   <div className="adventure-status"><span className="adventure-location">{s.dungeon?`${dungeons[s.dungeon].name}${s.mode==='extreme'?' · Extrême':''}`:'Astrub'}</span><strong>{s.kamas.toLocaleString('fr-FR')} kamas</strong><span>{s.buffRemaining>0?`Tir puissant · ${s.buffRemaining.toFixed(1)} s`:s.phase==='combat'?(s.living===0&&s.waveDelay>0?`Prochaine vague · ${s.waveDelay.toFixed(1)} s`:`Vague ${s.wave||1}/${s.totalWaves}${s.boss?' · Boss':''} · ${s.living} ennemi${s.living>1?'s':''}`):'Astrub · Zone de repos'}</span><span className="save-status" title="Votre progression est liée au compte et enregistrée sur le serveur">Sauvegarde serveur</span></div>
   <nav className="actions" aria-label="Menu du jeu">{s.phase==='hub'&&button('Donjons',()=>{setMenu(true);setInventory(false);setHelp(false);},{className:'primary-action'})}{button('Inventaire (I)',()=>{setInventory(v=>!v);setMenu(false);setHelp(false);})}{s.phase==='combat'&&button('Abandonner',()=>{controller.simulation.returnHub();setMenu(false);setInventory(false);})}{button('Aide',()=>setHelp(v=>!v),{'aria-expanded':help,'aria-controls':'game-help',className:'help-toggle'})}</nav>
   </div>
  </footer>
  <div className="journal" aria-live="polite" data-visible={journalVisible}>{s.log.slice(0,2).map((line,index)=><p key={index}>{line}</p>)}</div>
  {help&&<aside id="game-help" className="game-help" aria-label="Comment jouer"><span className="eyebrow">Premiers pas à Astrub</span><h2>À vous de jouer</h2><dl><div><dt>Clic droit</dt><dd>Déplacez-vous. Maintenez pour suivre le curseur.</dd></div><div><dt>A Z E</dt><dd>Visez avec la souris et décochez vos flèches.</dd></div><div><dt>R</dt><dd>Renforcez vos dégâts avec Tir puissant.</dd></div><div><dt>I</dt><dd>Ouvrez votre inventaire et équipez votre butin.</dd></div></dl><p>Prêt à partir ? Choisissez un donjon dans le menu en bas de l’écran.</p>{button('Compris',dismissHelp)}</aside>}
  {menu&&<DungeonPanel manifest={controller.manifest} completed={s.completed} onEnter={enter} onClose={()=>setMenu(false)}/>}
  {inventory&&<InventoryPanel controller={controller} s={s} onClose={()=>setInventory(false)}/>}
  {(s.phase==='victory'||s.phase==='death')&&!inventory&&panel(<><h2>{s.phase==='victory'?'Donjon terminé !':'Vous êtes tombé'}</h2><p>{s.phase==='victory'?'Vos récompenses sont sauvegardées.':'Vos XP, kamas et objets sont conservés. La prochaine tentative repart à la première vague.'}</p><p>Niveau {s.level} · {s.kamas} kamas · {s.inventory.length} objets</p>{button('Retour à Astrub',()=>controller.simulation.returnHub())}{s.dungeon&&button('Recommencer',()=>enter(s.dungeon!,s.mode))}{button('Voir l’inventaire',()=>setInventory(true))}</>,s.phase==='victory'?'Victoire':'Défaite')}
 </>;
}
