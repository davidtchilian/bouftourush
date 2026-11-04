import {useState} from 'react';
import type {GameController} from '../game/rendering/game';
import type {Snapshot} from '../game/core/simulation';
import {items,sets,slotNames,type Slot} from '../data/items';
import {planDuplicateSale} from '../game/progression/resale';
import {CharacterSprite} from './CharacterSprite';
import {assetImage} from './art';

const views=['southeast','south','southwest','west','northwest','north','northeast','east'] as const;
const recharge=(value=0)=>value?` · −${value} % recharge`:'';
const leftSlots:Slot[]=['hat','cape','amulet','weapon'],rightSlots:Slot[]=['ring1','ring2','belt','boots'];
export function InventoryPanel({controller,s,onClose}:{controller:GameController;s:Snapshot;onClose:()=>void}){
 const equippedUids=new Set(Object.values(s.equipment)),bag=s.inventory.filter(instance=>!equippedUids.has(instance.uid));
 const manifest=controller.manifest,[selected,setSelected]=useState<string|null>(bag[0]?.uid??null),[view,setView]=useState(0),[filter,setFilter]=useState('all'),[saleMessage,setSaleMessage]=useState('');
 const image=(id:string)=>assetImage(manifest,id);
 const worn=(slot:Slot)=>s.inventory.find(item=>item.uid===s.equipment[slot]);
 const hat=worn('hat')?.item??'none',cape=worn('cape')?.item??'none';
 const actor=`cra.idle.${views[view]}`;
 const visible=bag.filter(instance=>filter==='all'||items[instance.item].set===filter);
 const instance=visible.find(item=>item.uid===selected)??(selected?visible[0]:undefined),definition=instance&&items[instance.item];
 const countSet=(id:string)=>new Set(Object.values(s.equipment).flatMap(uid=>{const item=s.inventory.find(item=>item.uid===uid);return item&&items[item.item].set===id?[item.item]:[];})).size;
 const equipmentColumn=(slots:Slot[])=><div className="equipment-column">{slots.map(slot=>{
  const instance=worn(slot),item=instance&&items[instance.item];
  return <div className="equipment-slot" key={slot}><span>{slotNames[slot]}</span><button type="button" className="slot" disabled={!instance} title={item?`${item.name} — cliquer pour retirer`:slotNames[slot]} aria-label={instance?`Retirer ${slotNames[slot]}`:slotNames[slot]} onClick={()=>controller.simulation.unequip(slot)}>{item?<img src={image(item.icon)} alt={item.name}/>:<span>Vide</span>}</button></div>;
 })}</div>;
 const duplicateSale=planDuplicateSale(s);
 return <section className="dialog inventory-dialog" role="dialog" aria-modal="true" aria-label="Inventaire et équipement">
  <header className="dialog-heading"><div><span className="eyebrow">Votre personnage · Niveau {s.level}</span><h2>Inventaire et équipement</h2></div><button type="button" onClick={onClose}>Fermer inventaire</button></header>
  <div className="inventory-layout">
   <section className="character-sheet" aria-label="Équipement du Crâ">
    <div className="sheet-heading"><h3>Crâ</h3><span>Archer</span></div>
    <div className="equipment-around-preview">{equipmentColumn(leftSlots)}<div className="character-portrait"><CharacterSprite manifest={manifest} actorId={actor} equipment={{hat,cape}} width={126} height={245}/><button type="button" className="rotate-preview" onClick={()=>setView(index=>(index+1)%views.length)}>Tourner</button></div>{equipmentColumn(rightSlots)}</div>
    <dl className="character-stats"><div><dt>Vie maximale</dt><dd>{s.maxHp}</dd></div><div><dt>Puissance</dt><dd>{s.power}</dd></div><div><dt>Réduction recharge</dt><dd>{s.cooldownReduction} %</dd></div><div><dt>Kamas</dt><dd>{s.kamas}</dd></div></dl>
    <p className="muted equipment-help">Cliquez sur un équipement porté pour le retirer.</p>
   </section>
   <section className="inventory-items" aria-label="Sac et détails des objets">
    <div className="bag-heading"><h3>Votre sac <span className="muted">{bag.length} objet{bag.length>1?'s':''}</span></h3><span className="muted">Double-cliquez sur un objet pour l’équiper.</span></div>
    <div className="inventory-filters" aria-label="Filtrer les objets">{[['all','Tous'],['adventurer','Aventurier'],['mousse','Mousse'],['bouftou','Bouftou']].map(([id,label])=><button type="button" key={id} aria-pressed={filter===id} onClick={()=>{setFilter(id);setSelected(null);}}>{label}</button>)}</div>
    <div className="item-grid">
     {visible.map(instance=>{const item=items[instance.item],equipped=Object.values(s.equipment).includes(instance.uid);return <button className="item-cell" type="button" key={instance.uid} aria-pressed={selected===instance.uid} aria-label={`${item.name}${equipped?' équipé':''}`} title={`${item.name} — double-cliquer pour équiper`} onClick={()=>setSelected(instance.uid)} onDoubleClick={()=>{if(!Object.values(controller.simulation.profile.equipment).includes(instance.uid))controller.simulation.equipItem(instance.uid);}}><img src={image(item.icon)} alt=""/><span>{equipped?'Équipé':item.name}</span></button>;})}
     {visible.length>0&&Array.from({length:Math.max(0,18-visible.length)},(_,index)=><span key={`empty-${index}`} className="empty-item-slot" aria-hidden="true"/>)}
     {!visible.length&&<div className="empty-bag"><h3>{bag.length?'Aucun objet de cette panoplie':s.inventory.length?'Votre sac est vide':'Votre aventure commence ici'}</h3><p>{bag.length?'Essayez un autre filtre.':s.inventory.length?'Vos équipements portés restent visibles autour du personnage. Retirez-en un pour le remettre dans le sac.':'Les monstres des donjons peuvent laisser tomber des équipements.'}</p></div>}
    </div>
    <div className="item-details">
     {definition&&instance?<div className="tooltip" role="tooltip"><img className="selected-item-icon" src={image(definition.icon)} alt=""/><div><span className="eyebrow">{sets[definition.set].name}</span><h3>{definition.name}</h3><p className="item-stat-line">+{definition.stats.hp} Vie <span>+{definition.stats.power} Puissance{recharge(definition.stats.cooldownReduction)}</span></p><p className="muted">{countSet(definition.set)} pièce(s) distincte(s) équipée(s)</p><div className="equip-actions">{definition.category==='ring'?(['ring1','ring2'] as const).map((slot,index)=><button type="button" key={slot} onClick={()=>controller.simulation.equipItem(instance.uid,slot)}>Équiper anneau {index+1}</button>):<button type="button" onClick={()=>controller.simulation.equipItem(instance.uid)}>Équiper</button>}</div></div></div>:<div className="selection-hint"><h3>Un équipement à examiner ?</h3><p>Sélectionnez un objet pour consulter ses bonus et l’équiper.</p></div>}
    </div>
   </section>
  </div>
  <footer className="set-bonuses">{Object.entries(sets).filter(([id])=>countSet(id)>0||definition?.set===id).map(([id,set])=>{
   const count=countSet(id),thresholds=Object.keys(set.thresholds).map(Number).sort((a,b)=>a-b),active=thresholds.filter(n=>n<=count).at(-1),next=thresholds.find(n=>n>count),bonus=active?set.thresholds[active]:{hp:0,power:0};
   return <div className="set-summary" key={id}><strong>{set.name} <span>{count}/{thresholds.at(-1)}</span></strong><span>{active?`Bonus actif : +${bonus.hp} Vie · +${bonus.power} Puissance${recharge(bonus.cooldownReduction)}`:'Rassemblez les pièces pour activer les bonus.'}</span>{next&&<span className="muted">À {next} pièces : +{set.thresholds[next].hp} Vie · +{set.thresholds[next].power} Puissance{recharge(set.thresholds[next].cooldownReduction)}</span>}</div>;
  })}</footer>
  <div className="inventory-sale">
   <div><p className="muted">Tout le sac : un exemplaire par objet. Les équipements portés sont conservés.</p><p aria-live="polite">{saleMessage||(!duplicateSale.sold?'Aucun doublon à vendre.':`${duplicateSale.sold} doublon${duplicateSale.sold>1?'s':''} · +${duplicateSale.kamas} kamas`)}</p></div>
   <button type="button" disabled={!duplicateSale.sold} title="Revendre les exemplaires supplémentaires à petit prix, dans tout le sac." onClick={()=>{
    const item=instance?.item,sale=controller.simulation.sellDuplicates();
    if(sale.sold){setSelected(controller.simulation.profile.inventory.find(instance=>instance.item===item)?.uid??null);setSaleMessage(`${sale.sold} doublon${sale.sold>1?'s':''} vendu${sale.sold>1?'s':''} : +${sale.kamas} kamas.`);}
   }}>Vendre doublons</button>
  </div>
 </section>;
}
