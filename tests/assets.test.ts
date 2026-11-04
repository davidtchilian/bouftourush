import { describe,it,expect } from 'vitest';
import { parseManifest,requiredIds } from '../src/game/assets/manifest';
import { animationFrame } from '../src/game/rendering/animation';
const animation = {frames:[{path:'a.png',durationMs:100},{path:'b.png',durationMs:200}],pivot:[0.5,1] as [number,number],size:[10,10] as [number,number],offset:[0,0] as [number,number],loop:true,flipX:false,provenance:{source:'source déclarée',version:'1.40.13-remastered' as const,originalFile:'fichier vérifié par le fournisseur',conversion:'export local',usageRights:'usage local déclaré'}};
function fixture() { return {version:1,assets:Object.fromEntries(requiredIds.map(id=>[id,structuredClone(animation)])),hub:{bounds:[0,0,100,100],spawn:[50,50],cameraHeight:100}}; }
describe('contrat des exports, sans illustration de remplacement',()=> {
 it('refuse les assets absents',()=>expect(()=>parseManifest({version:1,assets:{},hub:{bounds:[0,0,1,1],spawn:[0,0],cameraHeight:1}})).toThrow('map.astrub.zaap'));
 it('accepte les métadonnées complètes',()=>expect(parseManifest(fixture()).version).toBe(1));
 it('refuse les visuels Classic, même dans un manifeste autrement valide',()=> {const f=fixture();const input={...f,assets:Object.fromEntries(Object.entries(f.assets).map(([id,a])=>[id,{...a,provenance:{...a.provenance,version:'1.40.13-classic'}}]))};expect(()=>parseManifest(input)).toThrow('Source visuelle interdite');});
 it('accepte la source Remastered 1.40.13 demandée',()=> {const f=fixture();for(const asset of Object.values(f.assets))Object.assign(asset.provenance,{version:'1.40.13-remastered'});expect(parseManifest(f).assets['cra.run.south'].provenance.version).toBe('1.40.13-remastered');});
 it('refuse une frame sortant de son atlas',()=> {const f=fixture();const input={...f,assets:Object.fromEntries(Object.entries(f.assets).map(([id,a])=>[id,{...a,frames:a.frames.map(frame=>({...frame,region:[60,0,10,10,64,64]}))}]))};expect(()=>parseManifest(input)).toThrow('hors atlas');});
 it('refuse les chemins sortant du répertoire',()=> {const f=fixture();f.assets['cra.run.south'].frames[0].path='../private.png';expect(()=>parseManifest(f)).toThrow();});
 it('refuse une course aplatie',()=> {const f=fixture();f.assets['cra.run.south'].frames.pop();expect(()=>parseManifest(f)).toThrow('aplatie');});
 it('respecte les durées et le bouclage',()=> {expect(animationFrame(animation,99)).toBe(0);expect(animationFrame(animation,100)).toBe(1);expect(animationFrame(animation,300)).toBe(0);expect(animationFrame({...animation,loop:false},900)).toBe(1);});
});
