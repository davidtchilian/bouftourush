import {balance,spells,type SpellId} from '../../data/balance';
/** Réduction en points de pourcentage, bornée ; le délai est fixé au lancement. */
export function cooldownFor(spell:SpellId,reduction:number,maximum:number=balance.maxCooldownReduction):number{
 return spells[spell].cooldown*(1-Math.max(0,Math.min(Math.min(90,maximum),reduction))/100);
}
