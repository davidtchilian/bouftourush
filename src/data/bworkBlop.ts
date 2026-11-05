import type {ItemDefinition,Stats} from './items';
/** Identités du catalogue Remastered vérifié ; équilibre temps réel provisoire. */
export const bworkBlopItems:Record<string,ItemDefinition>={
  "6799": {
    "id": "6799",
    "name": "Lame du Chef Bwork",
    "category": "weapon",
    "stats": {
      "hp": 95,
      "power": 40,
      "movementSpeed": 2,
      "cooldownReduction": 2
    },
    "set": "chefBwork",
    "icon": "item.6799"
  },
  "6804": {
    "id": "6804",
    "name": "Amulette du Chef Bwork",
    "category": "amulet",
    "stats": {
      "hp": 95,
      "power": 40,
      "movementSpeed": 2,
      "cooldownReduction": 2
    },
    "set": "chefBwork",
    "icon": "item.6804"
  },
  "6805": {
    "id": "6805",
    "name": "Bracelet du Chef Bwork",
    "category": "ring",
    "stats": {
      "hp": 95,
      "power": 40,
      "movementSpeed": 2,
      "cooldownReduction": 2
    },
    "set": "chefBwork",
    "icon": "item.6805"
  },
  "6807": {
    "id": "6807",
    "name": "Bottes du Chef Bwork",
    "category": "boots",
    "stats": {
      "hp": 95,
      "power": 40,
      "movementSpeed": 2,
      "cooldownReduction": 2
    },
    "set": "chefBwork",
    "icon": "item.6807"
  },
  "6811": {
    "id": "6811",
    "name": "Cape du Chef Bwork",
    "category": "cape",
    "stats": {
      "hp": 95,
      "power": 40,
      "movementSpeed": 2,
      "cooldownReduction": 2
    },
    "set": "chefBwork",
    "icon": "item.6811"
  },
  "6812": {
    "id": "6812",
    "name": "Slip du Chef Bwork",
    "category": "belt",
    "stats": {
      "hp": 95,
      "power": 40,
      "movementSpeed": 2,
      "cooldownReduction": 2
    },
    "set": "chefBwork",
    "icon": "item.6812"
  },
  "6813": {
    "id": "6813",
    "name": "Casque du Chef Bwork",
    "category": "hat",
    "stats": {
      "hp": 95,
      "power": 40,
      "movementSpeed": 2,
      "cooldownReduction": 2
    },
    "set": "chefBwork",
    "icon": "item.6813"
  },
  "9148": {
    "id": "9148",
    "name": "Blopanneau Multicolore Royal",
    "category": "ring",
    "stats": {
      "hp": 110,
      "power": 90,
      "movementSpeed": 2,
      "cooldownReduction": 4
    },
    "set": "blopMulti",
    "icon": "item.9148"
  },
  "9157": {
    "id": "9157",
    "name": "Amublop Multicolore Royale",
    "category": "amulet",
    "stats": {
      "hp": 110,
      "power": 90,
      "movementSpeed": 2,
      "cooldownReduction": 4
    },
    "set": "blopMulti",
    "icon": "item.9157"
  },
  "9166": {
    "id": "9166",
    "name": "Bloptes Multicolores Royales",
    "category": "boots",
    "stats": {
      "hp": 110,
      "power": 90,
      "movementSpeed": 2,
      "cooldownReduction": 4
    },
    "set": "blopMulti",
    "icon": "item.9166"
  },
  "9175": {
    "id": "9175",
    "name": "Blopture Multicolore Royale",
    "category": "belt",
    "stats": {
      "hp": 110,
      "power": 90,
      "movementSpeed": 2,
      "cooldownReduction": 4
    },
    "set": "blopMulti",
    "icon": "item.9175"
  }
};
export const bworkBlopSets:Record<string,{name:string;thresholds:Record<number,Stats>}>={
  "chefBwork": {
    "name": "Panoplie du Chef Bwork",
    "thresholds": {
      "2": {
        "hp": 80,
        "power": 36,
        "movementSpeed": 4,
        "cooldownReduction": 2
      },
      "3": {
        "hp": 120,
        "power": 54,
        "movementSpeed": 6,
        "cooldownReduction": 3
      },
      "4": {
        "hp": 160,
        "power": 72,
        "movementSpeed": 8,
        "cooldownReduction": 4
      },
      "5": {
        "hp": 200,
        "power": 90,
        "movementSpeed": 10,
        "cooldownReduction": 5
      },
      "6": {
        "hp": 240,
        "power": 108,
        "movementSpeed": 12,
        "cooldownReduction": 6
      },
      "7": {
        "hp": 280,
        "power": 126,
        "movementSpeed": 14,
        "cooldownReduction": 7
      }
    }
  },
  "blopMulti": {
    "name": "Panoplie Blop Multicolore Royale",
    "thresholds": {
      "2": {
        "hp": 90,
        "power": 80,
        "movementSpeed": 4,
        "cooldownReduction": 6
      },
      "3": {
        "hp": 135,
        "power": 120,
        "movementSpeed": 6,
        "cooldownReduction": 9
      },
      "4": {
        "hp": 180,
        "power": 160,
        "movementSpeed": 8,
        "cooldownReduction": 12
      }
    }
  }
};
