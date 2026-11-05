import type {Animation} from '../src/game/assets/manifest';
type Frame=Animation['frames'][number];
export const framePixels=(frame:Frame):string=>frame.path+(frame.region?'#'+frame.region.join(','):'');
/** Fusionne seulement les images consécutives identiques ; les durées restent exactes. */
export function compactAnimationFrames(frames:readonly Frame[]):Frame[]{
 const result:Frame[]=[];
 for(const frame of frames){
  const previous=result.at(-1);
  if(previous&&framePixels(previous)===framePixels(frame))previous.durationMs+=frame.durationMs;
  else result.push({...frame,region:frame.region?[...frame.region]:undefined});
 }
 return result;
}
