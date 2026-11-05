import {afterEach,expect,it,vi} from 'vitest';
import {openServerProfile} from '../src/game/save/serverProfile';
import {newProfile} from '../src/game/progression/profile';
afterEach(()=>vi.unstubAllGlobals());
const storage=(profile=newProfile())=>({getItem:()=>JSON.stringify({version:1,profile}),setItem:()=>{throw Error('Aucune écriture locale');}});
it('importe la progression locale une seule fois puis charge exclusivement la sauvegarde serveur',async()=>{
 const old=newProfile();old.kamas=19;const authoritative=newProfile();authoritative.kamas=80;
 const calls:unknown[]=[];vi.stubGlobal('fetch',vi.fn(async(_url:string,options?:RequestInit)=>{
  if(options?.method==='PUT'){calls.push(JSON.parse(options.body as string));return Response.json({revision:1});}
  return Response.json({profile:null,revision:0});
 }));
 const migrated=await openServerProfile(storage(old),new AbortController().signal,()=>{});expect(migrated.profile.kamas).toBe(19);expect(calls).toEqual([{profile:old,revision:0}]);
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json({profile:authoritative,revision:4})));
 const loaded=await openServerProfile(storage(old),new AbortController().signal,()=>{});expect(loaded.profile.kamas).toBe(80);expect(fetch).toHaveBeenCalledTimes(1);
});
it('sérialise les écritures, capture les mutations et attend les dernières données avant de quitter',async()=>{
 let revision=3;const saved:number[]=[];
 vi.stubGlobal('fetch',vi.fn(async(_url:string,options?:RequestInit)=>{
  if(options?.method==='PUT'){const data=JSON.parse(options.body as string);expect(data.revision).toBe(revision);saved.push(data.profile.kamas);await Promise.resolve();return Response.json({revision:++revision});}
  return Response.json({profile:newProfile(),revision});
 }));
 const session=await openServerProfile(storage(),new AbortController().signal,()=>{});session.profile.kamas=1;session.save(session.profile);session.profile.kamas=2;session.save(session.profile);session.profile.kamas=3;session.save(session.profile);await session.flush();expect(saved).toEqual([1,3]);
 session.save(session.profile);await session.flush();expect(saved).toEqual([1,3]);
});
it('signale un conflit sans écraser ni recommencer avec une ancienne progression',async()=>{
 const warning=vi.fn();vi.stubGlobal('fetch',vi.fn(async(_url:string,options?:RequestInit)=>options?.method==='PUT'?Response.json({}, {status:409}):Response.json({profile:newProfile(),revision:2})));
 const session=await openServerProfile(storage(),new AbortController().signal,warning);session.profile.kamas=1;session.save(session.profile);await expect(session.flush()).rejects.toThrow('autre onglet');expect(warning).toHaveBeenCalledOnce();session.save(session.profile);expect(fetch).toHaveBeenCalledTimes(2);
});
it('ne remplace jamais une progression serveur invalide par un profil neuf',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>Response.json({profile:{level:-1},revision:2})));
 await expect(openServerProfile(storage(),new AbortController().signal,()=>{})).rejects.toThrow();expect(fetch).toHaveBeenCalledOnce();
});
