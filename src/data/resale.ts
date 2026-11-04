import type {ItemDefinition} from './items';

/** Prix volontairement faibles, adaptés au fangame et sans fidélité aux prix officiels. */
export const resalePrices:Record<ItemDefinition['category'],number>={
 hat:3,cape:3,amulet:2,ring:1,ring1:1,ring2:1,belt:2,boots:2,weapon:4,
};
