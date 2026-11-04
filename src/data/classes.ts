import {balance,type SpellId} from './balance';
/** La simulation consomme cette définition ; les futures classes réutilisent les mêmes types de capacités. */
export type ClassDefinition={id:string;name:string;sprite:string;baseDamage:number;speed:number;abilities:SpellId[]};
export const cra:ClassDefinition={id:'cra',name:'Crâ',sprite:'cra',baseDamage:balance.baseDamage,speed:balance.playerSpeed,abilities:['explosive','flaming','magic','power']};
