/** Équilibrage MVP provisoire, aucune prétention de fidélité aux chiffres Dofus. */
export const balance = { maxLevel:100, startingHp:180, hpPerLevel:12, powerPerLevel:4, baseDamage:16, playerSpeed:95, waveDelay:1.8, castLock:0.12, castAnimation:0.4, buffMultiplier:1.6, buffDuration:8, maxCooldownReduction:30, lootChance:0.05, bossLootChance:0.4 } as const;
export const xpForLevel = (level:number):number => Math.floor(25*Math.pow(level,1.4));
export const spells = {
 explosive:{key:'a',name:'Flèche explosive',coefficient:2.3,cooldown:3.2,range:260,speed:310,radius:63,kind:'area',effect:'spell.explosive.impact'},
 flaming:{key:'z',name:'Flèche enflammée',coefficient:1.7,cooldown:1.7,range:245,speed:370,radius:20,kind:'line',effect:'spell.flaming.impact'},
 magic:{key:'e',name:'Flèche magique',coefficient:1.2,cooldown:0.48,range:280,speed:410,radius:12,kind:'single',effect:'spell.magic.impact'},
 power:{key:'r',name:'Tir puissant',coefficient:0,cooldown:16,range:0,speed:0,radius:0,kind:'buff',effect:'spell.power.cast'},
} as const;
export type SpellId=keyof typeof spells;
