import {afterEach,beforeAll,describe,expect,it} from 'vitest';
import {createServer,type Server} from 'node:http';
import {createAuth,derivePassword} from '../server/auth';
let hash:string;const salt='1234567890abcdef1234567890abcdef';
const servers:Server[]=[];
beforeAll(async()=>{hash=(await derivePassword('test-password',salt)).toString('hex');});
afterEach(async()=>{await Promise.all(servers.splice(0).map(server=>new Promise<void>(resolve=>{server.closeAllConnections();server.close(()=>resolve());})));});
async function setup(){
 let time=Date.now();const auth=createAuth({username:'tester',salt,hash},()=>time);
 const server=createServer((req,res)=>auth(req,res,()=>res.end('protected')));servers.push(server);
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address();if(!address||typeof address==='string')throw Error('port');
 const base=`http://127.0.0.1:${address.port}`;
 const request=(path:string,init:RequestInit={})=>fetch(base+path,{redirect:'manual',...init});
 const login=(password='test-password',origin=base)=>request('/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({username:'tester',password})});
 return {request,login,base,expire:()=>{time+=9*60*60*1000;}};
}
describe('Authentification serveur',()=>{
 it('bloque le jeu, les assets et les sources, sans inscription',async()=>{
  const {request}=await setup();
  for(const path of ['/','/assets/manifest.json','/src/main.tsx','/%2elocal-auth/account.json'])expect((await request(path)).status).toBe(401);
  expect((await request('/',{headers:{Accept:'text/html'}})).headers.get('location')).toBe('/login');
  expect((await request('/auth/register')).status).toBe(404);
  expect(await (await request('/login')).text()).toContain('Inscription indisponible');
 });
 it('refuse les identifiants invalides et les origines externes',async()=>{
  const {login,request}=await setup();
  expect((await login('wrong')).headers.get('set-cookie')).toBeNull();
  expect((await login('test-password','https://evil.example')).status).toBe(403);
  expect((await request('/auth/login',{method:'POST'})).status).toBe(403);
 });
 it('autorise une session, protège les secrets, révoque à la déconnexion',async()=>{
  const {login,request,base}=await setup();const response=await login();
  const cookie=response.headers.get('set-cookie')!;
  expect(cookie).toContain('HttpOnly');expect(cookie).toContain('SameSite=Strict');expect(cookie).not.toContain('test-password');
  const headers={Cookie:cookie.split(';')[0]};
  expect(await (await request('/',{headers})).text()).toBe('protected');
  expect((await request('/.local-auth/account.json',{headers})).status).toBe(403);
  expect((await request('/auth/session',{headers})).status).toBe(200);
  expect((await request('/auth/logout',{method:'POST',headers:{...headers,Origin:base}})).status).toBe(303);
  expect((await request('/',{headers})).status).toBe(401);
 });
 it('refuse les cookies inventés et les sessions expirées',async()=>{
  const {login,request,expire}=await setup();const cookie=(await login()).headers.get('set-cookie')!.split(';')[0];
  expect((await request('/',{headers:{Cookie:'bouftourush_session=fake'}})).status).toBe(401);
  expire();expect((await request('/',{headers:{Cookie:cookie}})).status).toBe(401);
 });
 it('limite les tentatives et refuse les requêtes trop volumineuses',async()=>{
  const {login,request,base}=await setup();
  expect((await request('/auth/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/x-www-form-urlencoded'},body:'a'.repeat(5000)})).status).toBe(413);
  for(let i=0;i<9;i++)await login('wrong');
  expect((await login()).status).toBe(429);
 });
});
