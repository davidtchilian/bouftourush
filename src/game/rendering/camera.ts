import type {MapDefinition} from '../assets/manifest';

/** Cadre toute la carte dans le viewport réservé au jeu, quel que soit son ratio.
 * cameraHeight reste une distance minimale, jamais un motif pour rogner les bords.
 */
export function fitMapView(map:Pick<MapDefinition,'bounds'|'cameraHeight'>,width:number,height:number){
 const [left,bottom,right,top]=map.bounds;
 const aspect=Math.max(1,width)/Math.max(1,height);
 const viewHeight=Math.max(map.cameraHeight,top-bottom,(right-left)/aspect);
 return {x:(left+right)/2,y:(bottom+top)/2,halfWidth:viewHeight*aspect/2,halfHeight:viewHeight/2};
}
