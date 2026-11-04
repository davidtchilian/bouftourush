import {afterEach,describe,it,expect,vi} from 'vitest';
import {applyDevelopmentReset} from '../src/app/development-reset';
import {newProfile} from '../src/game/progression/profile';
const id='11111111-1111-4111-8111-111111111111';
function fixture(){
 const memory=new Map([['bouftourush.save.v1',JSON.stringify({version:1,profile:{level:42,kamas:999,inventory:[{uid:'hat',item:'2411'}],equipment:{hat:'hat'},completed:['incarnam']}})],['bouftourush.help.seen','1'],['other.application','keep']]);
 vi.stubGlobal('localStorage',{getItem:(key:string)=>memory.get(key)??null,setItem:(key:string,value:string)=>memory.set(key,value),removeItem:(key:string)=>memory.delete(key)});
 vi.stubGlobal('fetch',vi.fn(async(_url:string,options?:RequestInit)=>options?.method==='POST'?new Response(null,{status:204}):new Response(JSON.stringify({id}),{status:200})));
 return memory;
}
afterEach(()=>vi.unstubAllGlobals());
describe('remise à zéro locale explicite et unique',()=>{
 it('efface toute la progression, garde les données étrangères et accuse réception',async()=>{
  const memory=fixture();await applyDevelopmentReset();
  expect(JSON.parse(memory.get('bouftourush.save.v1')!)).toEqual({version:1,profile:newProfile()});
  expect(memory.has('bouftourush.help.seen')).toBe(false);expect(memory.get('other.application')).toBe('keep');
  expect(fetch).toHaveBeenLastCalledWith('/__local/profile-reset',{method:'POST',body:id});
 });
 it('ne réinitialise jamais les progrès suivants pour la même requête',async()=>{
  const memory=fixture();await applyDevelopmentReset();const profile=newProfile();profile.level=2;profile.kamas=17;
  memory.set('bouftourush.save.v1',JSON.stringify({version:1,profile}));await applyDevelopmentReset();
  expect(JSON.parse(memory.get('bouftourush.save.v1')!).profile).toEqual(profile);
 });
 it('préserve la sauvegarde sans requête locale valide',async()=>{
  const memory=fixture(),before=memory.get('bouftourush.save.v1');
  for(const response of [new Response('{}',{status:404}),new Response('{}'),new Response(JSON.stringify({id:'invalid'}))]){
   vi.stubGlobal('fetch',vi.fn(async()=>response));await applyDevelopmentReset();expect(memory.get('bouftourush.save.v1')).toBe(before);
  }
  vi.stubGlobal('fetch',vi.fn(async()=>{throw new Error('offline');}));await applyDevelopmentReset();expect(memory.get('bouftourush.save.v1')).toBe(before);
 });
 it('signale un stockage refusé sans marquer la requête comme appliquée',async()=>{
  const memory=fixture();vi.stubGlobal('localStorage',{getItem:(key:string)=>memory.get(key)??null,setItem:()=>{throw new Error('quota');}});
  await expect(applyDevelopmentReset()).rejects.toThrow('Impossible de remettre la progression à zéro');expect(memory.has('bouftourush.development-reset.applied')).toBe(false);
 });
});
