import type {ItemDefinition,Stats} from './items';
/** Équilibrage provisoire du fangame, selon TODO.md. */
export const tofuScaraItems:Record<string,ItemDefinition>={
"8108":{"id": "8108", "name": "Amulette du Tofu", "category": "amulet", "stats": {"hp": 16, "power": 16, "movementSpeed": 4, "cooldownReduction": 1}, "set": "tofu", "icon": "item.8108"},
"8109":{"id": "8109", "name": "Anneau du Tofu", "category": "ring", "stats": {"hp": 16, "power": 16, "movementSpeed": 4, "cooldownReduction": 1}, "set": "tofu", "icon": "item.8109"},
"8110":{"id": "8110", "name": "Baguette du Tofu", "category": "weapon", "stats": {"hp": 16, "power": 16, "movementSpeed": 4, "cooldownReduction": 1}, "set": "tofu", "icon": "item.8110"},
"8111":{"id": "8111", "name": "Pantoufles du Tofu", "category": "boots", "stats": {"hp": 16, "power": 16, "movementSpeed": 4, "cooldownReduction": 1}, "set": "tofu", "icon": "item.8111"},
"8112":{"id": "8112", "name": "Cape du Tofu", "category": "cape", "stats": {"hp": 16, "power": 16, "movementSpeed": 4, "cooldownReduction": 1}, "set": "tofu", "icon": "item.8112"},
"8113":{"id": "8113", "name": "Ceinture du Tofu", "category": "belt", "stats": {"hp": 16, "power": 16, "movementSpeed": 4, "cooldownReduction": 1}, "set": "tofu", "icon": "item.8113"},
"8114":{"id": "8114", "name": "Kaskofu", "category": "hat", "stats": {"hp": 16, "power": 16, "movementSpeed": 4, "cooldownReduction": 1}, "set": "tofu", "icon": "item.8114"},
"8132":{"id": "8132", "name": "Scarature Noire", "category": "belt", "stats": {"hp": 100, "power": 48, "movementSpeed": 1, "cooldownReduction": 1}, "set": "blackScara", "icon": "item.8132"},
"8133":{"id": "8133", "name": "Scaracoiffe Noire", "category": "hat", "stats": {"hp": 100, "power": 48, "movementSpeed": 1, "cooldownReduction": 1}, "set": "blackScara", "icon": "item.8133"},
"8134":{"id": "8134", "name": "Scaracape Noire", "category": "cape", "stats": {"hp": 100, "power": 48, "movementSpeed": 1, "cooldownReduction": 1}, "set": "blackScara", "icon": "item.8134"},
"8136":{"id": "8136", "name": "Scaranneau Noir", "category": "ring", "stats": {"hp": 100, "power": 48, "movementSpeed": 1, "cooldownReduction": 1}, "set": "blackScara", "icon": "item.8136"},
};
export const tofuScaraSets:Record<string,{name:string;thresholds:Record<number,Stats>}>= {"tofu": {"name": "Panoplie du Tofu", "thresholds": {"2": {"hp": 16, "power": 18, "movementSpeed": 6, "cooldownReduction": 2}, "3": {"hp": 24, "power": 27, "movementSpeed": 9, "cooldownReduction": 3}, "4": {"hp": 32, "power": 36, "movementSpeed": 12, "cooldownReduction": 4}, "5": {"hp": 40, "power": 45, "movementSpeed": 15, "cooldownReduction": 5}, "6": {"hp": 48, "power": 54, "movementSpeed": 18, "cooldownReduction": 6}, "7": {"hp": 56, "power": 63, "movementSpeed": 21, "cooldownReduction": 7}}}, "blackScara": {"name": "Panoplie du Scarafeuille Noir", "thresholds": {"2": {"hp": 90, "power": 56, "movementSpeed": 2, "cooldownReduction": 2}, "3": {"hp": 135, "power": 84, "movementSpeed": 3, "cooldownReduction": 3}, "4": {"hp": 180, "power": 112, "movementSpeed": 4, "cooldownReduction": 4}}}};
