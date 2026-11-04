import {balance,spells,type SpellId} from '../../data/balance';
/** Réduction en points de pourcentage, bornée ; le délai est fixé au lancement. */
export function cooldownFor(spell:SpellId,reduction:number):number{
 return spells[spell].cooldown*(1-Math.max(0,Math.min(balance.maxCooldownReduction,reduction))/100);
}
