import { create } from 'zustand';
import type {Snapshot} from '../game/core/simulation';
import type {Manifest} from '../game/assets/manifest';
export const useAppStore=create<{status:string;error:string|null;snapshot:Snapshot|null;manifest:Manifest|null}>(()=>({status:'Chargement des assets…',error:null,snapshot:null,manifest:null}));
