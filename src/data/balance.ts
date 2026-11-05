/** Équilibrage MVP provisoire, aucune prétention de fidélité aux chiffres Dofus. */
export const balance = { maxLevel:100, startingHp:180, hpPerLevel:12, powerPerLevel:4, baseDamage:16, playerSpeed:95, waveDelay:1.8, castLock:0.12, castAnimation:0.4, enemyAttackAnimation:0.4, enemyHitAnimation:0.16, enemyDeathAnimation:1.6, buffMultiplier:1.6, buffDuration:8, maxCooldownReduction:30, maxMovementSpeedBonus:60, lootChance:0.05, bossLootChance:0.4 } as const;
export const xpForLevel = (level:number):number => Math.floor(25*Math.pow(level,1.4));
export const spells = {
 explosive:{key:'a',name:'Flèche explosive',coefficient:2.3,cooldown:3.2,range:260,speed:310,radius:63,kind:'area',effect:'spell.explosive.impact'},
 flaming:{key:'z',name:'Flèche enflammée',coefficient:1.7,cooldown:1.7,range:245,speed:370,radius:20,kind:'line',effect:'spell.flaming.impact'},
 magic:{key:'e',name:'Flèche magique',coefficient:1.2,cooldown:0.48,range:280,speed:410,radius:12,kind:'single',effect:'spell.magic.impact'},
 power:{key:'r',name:'Tir puissant',coefficient:0,cooldown:16,range:0,speed:0,radius:0,kind:'buff',effect:'spell.power.cast'},
 dissolution:{key:'a',name:'Dissolution',coefficient:1.8,cooldown:3,range:0,speed:0,radius:65,kind:'drain',effect:''},
 chastisement:{key:'z',name:'Châtiment',coefficient:0,cooldown:15,range:0,speed:0,radius:0,kind:'chastisement',effect:'spell.chastisement.cast'},
 transposition:{key:'e',name:'Transposition',coefficient:0,cooldown:8,range:Infinity,speed:0,radius:0,kind:'swap',effect:'spell.transposition.cast'},
 punishment:{key:'r',name:'Punition',coefficient:5,cooldown:10,range:50,speed:0,radius:0,kind:'punishment',effect:''},
 sword:{key:'a',name:'Épée de Iop',coefficient:2.8,cooldown:2,range:85,speed:0,radius:0,kind:'cone',effect:'spell.sword.cast'},
 jump:{key:'z',name:'Bond',coefficient:0,cooldown:5,range:150,speed:0,radius:0,kind:'teleport',effect:'spell.jump.cast'},
 intimidation:{key:'e',name:'Intimidation',coefficient:0.8,cooldown:5,range:0,speed:0,radius:65,kind:'push',effect:'spell.intimidation.cast'},
 wrath:{key:'r',name:'Colère de Iop',coefficient:9,cooldown:25,range:60,speed:0,radius:0,kind:'wrath',effect:'spell.wrath.cast'},
 glyph:{key:'a',name:'Glyphe enflammé',coefficient:0.7,cooldown:10,range:200,speed:0,radius:65,kind:'glyph',effect:'spell.glyph.zone'},
 cloudy:{key:'z',name:'Attaque nuageuse',coefficient:2,cooldown:1.5,range:Infinity,speed:0,radius:0,kind:'direct',effect:'spell.cloudy.cast'},
 teleport:{key:'e',name:'Téléportation',coefficient:0,cooldown:6,range:110,speed:0,radius:0,kind:'teleport',effect:''},
 truce:{key:'r',name:'Trêve',coefficient:0,cooldown:18,range:0,speed:0,radius:0,kind:'truce',effect:'spell.truce.cast'},
} as const;
export const classBalance={drainRatio:0.5,chastisementDuration:5,chastisementPowerPerDamage:0.25,lowHpMaximumBonus:0.5,lowHpThreshold:0.1,pushDistance:80,wrathGrowth:1.5,truceDuration:2,glyphInterval:1,coneCosine:0.5,targetRadius:45} as const;
export type SpellId=keyof typeof spells;
