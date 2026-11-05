import {randomBytes,timingSafeEqual,createHash} from 'node:crypto';
import {resolve} from 'node:path';
import type {IncomingMessage,ServerResponse} from 'node:http';
import type {Plugin,Connect} from 'vite';
import {loginPage,accountPage} from './login';
import {AccountStore,type Credentials,type Account} from './accounts';
import {derivePassword} from './passwords';
import {validateProfile} from '../src/game/save/persistence';
export {derivePassword} from './passwords';
const lifetime=8*60*60*1000;
const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
const publicAccount=(account:Account)=>({username:account.username,displayName:account.displayName,createdAt:account.createdAt,updatedAt:account.updatedAt});
const passwordValid=(value:string)=>value.length>=12&&value.length<=256;
async function body(req:IncomingMessage,limit:number):Promise<string>{
 let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>limit)throw new Error('body-limit');}return text;
}
export function createAuth(input:Credentials|AccountStore,now=Date.now):Connect.NextHandleFunction{
 const store=input instanceof AccountStore?input:new AccountStore(':memory:');
 if(!(input instanceof AccountStore))store.create(input,input.username,now());
 const attempts=new Map<string,{count:number;until:number}>();let pending=0;
 return (req,res,next)=>{void handle(req,res,next).catch(error=>{if(!res.headersSent)res.statusCode=error instanceof Error&&error.message==='body-limit'?413:500;res.end('Requête indisponible');});};
 async function handle(req:IncomingMessage,res:ServerResponse,next:Connect.NextFunction){
  const path=new URL(req.url??'/','http://localhost').pathname;
  const originalSetHeader=res.setHeader.bind(res);
  res.setHeader=(name,value)=>originalSetHeader(name,name.toLowerCase()==='cache-control'?'no-store':value);
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');
  const send=(status:number,text:string)=>{res.statusCode=status;res.end(text);};
  const json=(status:number,value:unknown)=>{res.setHeader('Content-Type','application/json');send(status,JSON.stringify(value));};
  const redirect=(to:string)=>{res.statusCode=303;res.setHeader('Location',to);res.end();};
  const page=(html:string)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Content-Security-Policy',"default-src 'none'; connect-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");send(200,html);};
  const token=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('bouftourush_session='))?.slice(20)??'';
  const key=digest(token),account=store.account(),authenticated=store.session(key,now());
  const secure=process.env.AUTH_SECURE_COOKIE==='true'||Boolean((req.socket as {encrypted?:boolean}).encrypted);
  const cookie=(value:string,age:number)=>res.setHeader('Set-Cookie',`bouftourush_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secure?'; Secure':''}`);
  const issue=()=>{store.revoke(key);const session=randomBytes(32).toString('hex');store.issue(digest(session),now()+lifetime);cookie(session,lifetime/1000);};
  const sameOrigin=()=>{
   try{const origin=new URL(req.headers.origin??'');return origin.host===req.headers.host&&['http:','https:'].includes(origin.protocol);}catch{return false;}
  };
  const limited=()=>{
   for(const [ip,entry] of attempts)if(entry.until<=now())attempts.delete(ip);
   const ip=req.socket.remoteAddress??'unknown',entry=attempts.get(ip)??{count:0,until:now()+15*60*1000};
   if(entry.count>=10||pending>=4||attempts.size>=10000){res.setHeader('Retry-After','900');send(429,'Trop de tentatives. Réessayez plus tard.');return true;}
   entry.count++;attempts.set(ip,entry);return false;
  };
  const verify=async(password:string,record:Credentials)=>{
   pending++;try{return timingSafeEqual(await derivePassword(password,record.salt),Buffer.from(record.hash,'hex'));}finally{pending--;}
  };
  if(path==='/sw.js'&&req.method==='GET'){
   res.setHeader('Content-Type','application/javascript');return send(200,"self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('bouftourush-offline-'))await caches.delete(k);await self.registration.unregister();for(const c of await self.clients.matchAll({type:'window'}))c.navigate('/login');})()));");
  }
  // Aucune inscription ni configuration publique, même sans compte provisionné.
  if(['/setup','/auth/setup','/register','/auth/register'].includes(path))return send(404,'Page introuvable');
  if(path==='/login'&&['GET','HEAD'].includes(req.method??''))return authenticated?redirect('/'):page(loginPage);
  if(path==='/auth/login'||path==='/auth/logout'){
   if(req.method!=='POST')return send(405,'Méthode refusée');
   if(!sameOrigin())return send(403,'Origine refusée');
   if(path==='/auth/logout'){store.revoke(key);cookie('',0);res.setHeader('Clear-Site-Data','"cache"');return redirect('/login');}
   if(limited())return;
   if(!req.headers['content-type']?.startsWith('application/x-www-form-urlencoded'))return send(415,'Format refusé');
   const fields=new URLSearchParams(await body(req,4096)),username=fields.get('username')??'',password=fields.get('password')??'';
   if(!account)return redirect('/login?error=1');
   if(username.length>80||password.length>256)return redirect('/login?error=1');
   if(!await verify(password,account)||username!==account.username||store.account()?.hash!==account.hash)return redirect('/login?error=1');
   attempts.delete(req.socket.remoteAddress??'unknown');issue();return redirect('/');
  }
  if(path==='/auth/session'){
   if(req.method!=='GET')return send(405,'Méthode refusée');
   return json(authenticated?200:401,{authenticated,...(authenticated&&account?{account:publicAccount(account)}:{})});
  }
  if(!authenticated){
   if((req.method==='GET'||req.method==='HEAD')&&req.headers.accept?.includes('text/html'))return redirect('/login');
   return send(401,'Authentification requise');
  }
  if(path==='/account'&&req.method==='GET')return page(accountPage);
  if(path==='/api/account'||path==='/api/account/password'||path==='/api/profile'){
   if(req.method==='GET'&&path==='/api/account')return json(200,publicAccount(store.account()!));
   if(req.method==='GET'&&path==='/api/profile')return json(200,store.profile());
   if(req.method!=='PUT')return send(405,'Méthode refusée');
   if(!sameOrigin())return send(403,'Origine refusée');
   if(!req.headers['content-type']?.startsWith('application/json'))return send(415,'Format refusé');
   let data:Record<string,unknown>;try{data=JSON.parse(await body(req,path==='/api/profile'?2*1024*1024:4096));}catch(error){if(error instanceof Error&&error.message==='body-limit')throw error;return json(400,{error:'Données invalides.'});}
   if(!data||typeof data!=='object'||Array.isArray(data))return json(400,{error:'Données invalides.'});
   if(path==='/api/account'){
    if(typeof data.displayName!=='string'||!data.displayName.trim()||data.displayName.trim().length>80)return json(400,{error:'Nom affiché invalide.'});
    store.update(data.displayName.trim(),now());return json(200,publicAccount(store.account()!));
   }
   if(path==='/api/account/password'){
    if(limited())return;
    if(typeof data.currentPassword!=='string'||data.currentPassword.length>256||typeof data.newPassword!=='string'||!passwordValid(data.newPassword))return json(400,{error:'Le nouveau mot de passe doit contenir entre 12 et 256 caractères.'});
    const current=store.account()!;
    if(!await verify(data.currentPassword,current))return json(400,{error:'Mot de passe actuel incorrect.'});
    const salt=randomBytes(16).toString('hex');pending++;let hash:string;
    try{hash=(await derivePassword(data.newPassword,salt)).toString('hex');}finally{pending--;}
    if(store.account()?.hash!==current.hash)return json(409,{error:'Le mot de passe vient de changer. Reconnectez-vous.'});
    store.password(salt,hash,now());issue();return json(200,{saved:true});
   }
   let profile;try{profile=validateProfile(data.profile);}catch{return json(400,{error:'Progression invalide.'});}
   if(!Number.isSafeInteger(data.revision)||Number(data.revision)<0)return json(400,{error:'Révision invalide.'});
   if(!store.saveProfile(profile,data.revision as number))return json(409,{error:'Progression modifiée dans une autre session. Rechargez la page.'});
   return json(200,{revision:Number(data.revision)+1});
  }
  let decoded:string;try{decoded=decodeURIComponent(path);}catch{return send(400,'Chemin invalide');}
  if(decoded.includes('.server-data')||decoded.includes('.local-auth')||decoded.includes('.local-assets')||decoded.startsWith('/server/')||decoded.startsWith('/@fs/'))return send(403,'Accès refusé');
  next();
 }
}
export function authentication():Plugin{
 let store:AccountStore|undefined;
 const load=()=>{
  const file=resolve(process.env.AUTH_DATABASE_FILE??'.server-data/game.sqlite');
  if(['public','dist'].some(folder=>file===resolve(folder)||file.startsWith(resolve(folder)+'/')))throw new Error('La base du compte doit rester hors des dossiers publics.');
  store??=new AccountStore(file);
  if(!store.account()){store.close();store=undefined;throw new Error('Aucun compte serveur provisionné. Utiliser pnpm account:provision identifiant (voir docs/AUTH.md).');}
  return createAuth(store);
 };
 return {name:'server-authentication',configureServer(server){server.middlewares.use(load());server.httpServer?.once('close',()=>{store?.close();store=undefined;});},configurePreviewServer(server){server.middlewares.use(load());server.httpServer.once('close',()=>{store?.close();store=undefined;});}};
}
