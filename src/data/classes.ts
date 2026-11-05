import {balance,spells,type SpellId} from './balance';
import {directions,type Manifest} from '../game/assets/manifest';
export type ClassId='cra'|'sacrier'|'iop'|'feca';
export type ClassDefinition={id:ClassId;name:string;sprite:string;baseDamage:number;speed:number;abilities:SpellId[]};
const define=(id:ClassId,name:string,abilities:SpellId[]):ClassDefinition=>({id,name,sprite:id,baseDamage:balance.baseDamage,speed:balance.playerSpeed,abilities});
export const cra=define('cra','Crâ',['explosive','flaming','magic','power']);
export const sacrier=define('sacrier','Sacrieur',['dissolution','chastisement','transposition','punishment']);
export const iop=define('iop','Iop',['sword','jump','intimidation','wrath']);
export const feca=define('feca','Féca',['glyph','cloudy','teleport','truce']);
export const classes={cra,sacrier,iop,feca};
/** Contrat d’import : aucun remplacement visuel par une autre classe. */
export function missingClassAssets(manifest:Manifest,definition:ClassDefinition):string[]{
 if(definition.id==='cra')return [];
 const actors=[...directions.flatMap(d=>['idle','run'].map(a=>`${definition.sprite}.${a}.${d}`)),...['cast','buff','hit','death'].flatMap(a=>['R','L'].map(d=>`${definition.sprite}.${a}.${d}`))];
 return [...actors.filter(id=>!manifest.assets[id]||!manifest.composition?.actors[id]),...definition.abilities.flatMap(id=>[`ui.spell.${id}`,spells[id].effect]).filter(id=>id&&!manifest.assets[id])];
}
