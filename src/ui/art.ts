import type {Manifest} from '../game/assets/manifest';
export const assetImage=(manifest:Manifest,id:string)=>manifest.assets[id]?'/assets/'+manifest.assets[id].frames[0].path:undefined;
