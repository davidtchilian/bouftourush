import type {ItemDefinition} from './items';
export const developerHatId='devHat';
/** Objet personnalisé demandé par le joueur ; seul son graphisme est celui du Champion 8069. */
export const developerHat:ItemDefinition={id:developerHatId,name:'Coiffe du dev',category:'hat',set:'developer',icon:'item.devHat',stats:{hp:10000,power:10000,movementSpeed:150,cooldownReduction:90},statLimits:{movementSpeed:150,cooldownReduction:90}};
