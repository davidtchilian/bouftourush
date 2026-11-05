import {afterEach,expect,it} from 'vitest';
import {createServer,type Server} from 'node:http';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {AccountStore} from '../server/accounts';
import {createAuth,derivePassword} from '../server/auth';
import {newProfile} from '../src/game/progression/profile';
const resources:{server:Server;store:AccountStore;folder:string}[]=[];
afterEach(async()=>{for(const {server,store,folder} of resources.splice(0)){server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));store.close();rmSync(folder,{recursive:true,force:true});}});
async function setup(provisioned=true){
 const folder=mkdtempSync(join(tmpdir(),'bouftourush-account-')),file=join(folder,'account.sqlite');let store=new AccountStore(file);
 if(provisioned){const salt='1234567890abcdef1234567890abcdef';store.create({username:'player',salt,hash:(await derivePassword('a-long-password',salt)).toString('hex')},'Joueur',Date.now());}
 let auth=createAuth(store);
 const server=createServer((req,res)=>auth(req,res,()=>res.end('protected')));
 const resource={server,store,folder};resources.push(resource);
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address();if(!address||typeof address==='string')throw Error('port');const base=`http://127.0.0.1:${address.port}`;
 const request=(path:string,options:RequestInit={})=>fetch(base+path,{redirect:'manual',...options});
 const form=(path:string,fields:Record<string,string>)=>request(path,{method:'POST',headers:{Origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(fields)});
 const login=()=>form('/auth/login',{username:'player',password:'a-long-password'});
 const put=(path:string,value:unknown,cookie:string,origin=base)=>request(path,{method:'PUT',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(value)});
 const restart=()=>{store.close();store=new AccountStore(file);resource.store=store;auth=createAuth(store);};
 return {request,form,login,put,restart,file};
}
it('supprime toutes les routes de création même lorsque la base ne contient aucun compte',async()=>{
 const {request,form}=await setup(false);
 expect((await request('/login')).status).toBe(200);
 expect(await (await request('/login')).text()).not.toContain('Créer mon compte');
 for(const path of ['/setup','/auth/setup','/register','/auth/register']){
  expect((await request(path)).status).toBe(404);
  expect((await form(path,{username:'intrus',password:'a-long-password'})).status).toBe(404);
 }
 const login=await form('/auth/login',{username:'intrus',password:'a-long-password'});
 expect(login.headers.get('set-cookie')).toBeNull();expect(login.headers.get('location')).toBe('/login?error=1');
});
it('expose uniquement les informations publiques du compte existant, sans mot de passe en clair',async()=>{
 const {request,login,file}=await setup(),cookie=(await login()).headers.get('set-cookie')!.split(';')[0];
 const account=await (await request('/api/account',{headers:{Cookie:cookie}})).json();
 expect(account).toMatchObject({username:'player',displayName:'Joueur'});expect(account).not.toHaveProperty('salt');expect(account).not.toHaveProperty('hash');
 expect(readFileSync(file).includes(Buffer.from('a-long-password'))).toBe(false);
 for(const path of ['/setup','/auth/setup'])expect((await request(path,{headers:{Cookie:cookie}})).status).toBe(404);
});
it('le provisionnement administratif préserve la progression et remplace les identifiants en révoquant les sessions',async()=>{
 const store=new AccountStore(':memory:'),salt='1234567890abcdef1234567890abcdef',hash=(await derivePassword('test-admin-password',salt)).toString('hex');
 try{
  store.create({username:'previous',salt,hash},'Nom conservé',1);const profile=newProfile();profile.kamas=456;store.saveProfile(profile,0);store.issue('old-session',Date.now()+10000);
  store.provision({username:'fredi',salt,hash},2);
  expect(store.account()).toMatchObject({username:'fredi',displayName:'Nom conservé',createdAt:1,updatedAt:2});
  expect(store.profile()).toEqual({profile,revision:1});expect(store.session('old-session',Date.now())).toBe(false);
 }finally{store.close();}
});
it('persiste compte, sessions et progression après redémarrage, sans navigateur ni fichier de compte local',async()=>{
 const {login,request,put,restart}=await setup(),cookie=(await login()).headers.get('set-cookie')!.split(';')[0];
 const profile=newProfile();profile.level=12;profile.kamas=345;profile.inventory=[{uid:'bwork',item:'6813'}];profile.equipment.hat='bwork';profile.completed=['chefBwork'];
 expect((await put('/api/profile',{profile,revision:0},cookie)).status).toBe(200);
 expect((await put('/api/account',{displayName:'Nouveau nom'},cookie)).status).toBe(200);
 restart();
 expect(await (await request('/api/profile',{headers:{Cookie:cookie}})).json()).toEqual({profile,revision:1});
 expect(await (await request('/auth/session',{headers:{Cookie:cookie}})).json()).toMatchObject({authenticated:true,account:{displayName:'Nouveau nom'}});
 expect((await request('/api/profile')).status).toBe(401);
 for(const path of ['/.server-data/account.sqlite','/server/accounts.ts','/%2eserver-data/account.sqlite'])expect((await request(path,{headers:{Cookie:cookie}})).status).toBe(403);
});
it('révoque les autres sessions en changeant le mot de passe et exige le mot de passe actuel',async()=>{
 const {login,form,put,request}=await setup(),first=(await login()).headers.get('set-cookie')!.split(';')[0];
 const second=(await form('/auth/login',{username:'player',password:'a-long-password'})).headers.get('set-cookie')!.split(';')[0];
 expect((await put('/api/account/password',{currentPassword:'wrong',newPassword:'a-new-password'},first)).status).toBe(400);
 const changed=await put('/api/account/password',{currentPassword:'a-long-password',newPassword:'a-new-password'},first);expect(changed.status).toBe(200);
 const current=changed.headers.get('set-cookie')!.split(';')[0];
 for(const cookie of [first,second])expect((await request('/auth/session',{headers:{Cookie:cookie}})).status).toBe(401);
 expect((await request('/auth/session',{headers:{Cookie:current}})).status).toBe(200);
 expect((await form('/auth/login',{username:'player',password:'a-long-password'})).headers.get('set-cookie')).toBeNull();
 expect((await form('/auth/login',{username:'player',password:'a-new-password'})).headers.get('set-cookie')).toBeTruthy();
});
it('rejette les progressions invalides, les écrasements concurrents et les origines externes',async()=>{
 const {login,put,request}=await setup(),cookie=(await login()).headers.get('set-cookie')!.split(';')[0],profile=newProfile();
 expect((await put('/api/profile',{profile,revision:0},cookie,'https://evil.example')).status).toBe(403);
 expect((await put('/api/profile',{profile:{...profile,equipment:{hat:'absent'}},revision:0},cookie)).status).toBe(400);
 const results=await Promise.all([put('/api/profile',{profile,revision:0},cookie),put('/api/profile',{profile:{...profile,kamas:3},revision:0},cookie)]);
 expect(results.map(r=>r.status).sort()).toEqual([200,409]);
 expect((await put('/api/account',{displayName:''},cookie)).status).toBe(400);
 expect((await request('/api/account',{method:'DELETE',headers:{Cookie:cookie}})).status).toBe(405);
});
