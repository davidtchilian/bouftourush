import {randomBytes, scrypt, timingSafeEqual, createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import type {IncomingMessage, ServerResponse} from 'node:http';
import type {Plugin, Connect} from 'vite';
import {loginPage} from './login';

type Account = {username:string;salt:string;hash:string};
const lifetime=8*60*60*1000;
export const derivePassword=(password:string,salt:string):Promise<Buffer>=>new Promise((resolve,reject)=>{
 scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024},(error,key)=>error?reject(error):resolve(key));
});
const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
export function createAuth(account:Account, now=Date.now):Connect.NextHandleFunction{
 if(!account.username||!/^[a-f0-9]{32}$/.test(account.salt)||!/^[a-f0-9]{128}$/.test(account.hash))throw new Error('Compte serveur invalide');
 const sessions=new Map<string,number>(),attempts=new Map<string,{count:number;until:number}>();
 let pending=0;
 return (req,res,next)=>{void handle(req,res,next).catch(()=>{if(!res.headersSent)res.statusCode=500;res.end('Connexion indisponible');});};
 async function handle(req:IncomingMessage,res:ServerResponse,next:Connect.NextFunction){
  const url=new URL(req.url??'/','http://localhost'),path=url.pathname;
  const setHeader=res.setHeader.bind(res);
  res.setHeader=(name,value)=>setHeader(name,name.toLowerCase()==='cache-control'?'no-store':value);
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');
  const send=(status:number,body:string)=>{res.statusCode=status;res.end(body);};
  const redirect=(to:string)=>{res.statusCode=303;res.setHeader('Location',to);res.end();};
  const token=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('bouftourush_session='))?.slice(20)??'';
  const key=digest(token);
  for(const [id,expiry] of sessions)if(expiry<=now())sessions.delete(id);
  const authenticated=sessions.has(key);
  const secure=process.env.AUTH_SECURE_COOKIE==='true'||Boolean((req.socket as {encrypted?:boolean}).encrypted);
  const cookie=(value:string,age:number)=>res.setHeader('Set-Cookie',`bouftourush_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secure?'; Secure':''}`);
  // Retire l'ancien cache public, même avant la connexion.
  if(path==='/sw.js'&&req.method==='GET'){
   res.setHeader('Content-Type','application/javascript');res.end("self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('bouftourush-offline-'))await caches.delete(k);await self.registration.unregister();for(const c of await self.clients.matchAll({type:'window'}))c.navigate('/login');})()));");return;
  }
  if(path==='/login'&&['GET','HEAD'].includes(req.method??'')){
   if(authenticated)return redirect('/');
   res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");res.end(loginPage);return;
  }
  if(path==='/auth/login'||path==='/auth/logout'){
   if(req.method!=='POST')return send(405,'Méthode refusée');
   // Origin obligatoire : aucune connexion/déconnexion initiée par un autre site.
   let origin:URL;try{origin=new URL(req.headers.origin??'');}catch{return send(403,'Origine refusée');}
   if(origin.host!==req.headers.host||!['http:','https:'].includes(origin.protocol))return send(403,'Origine refusée');
   if(path==='/auth/logout'){sessions.delete(key);cookie('',0);res.setHeader('Clear-Site-Data','"cache"');return redirect('/login');}
   for(const [ip,entry] of attempts)if(entry.until<=now())attempts.delete(ip);
   const ip=req.socket.remoteAddress??'unknown',entry=attempts.get(ip)??{count:0,until:now()+15*60*1000};
   if(entry.count>=10||pending>=4||attempts.size>=10000){res.setHeader('Retry-After','900');return send(429,'Trop de tentatives. Réessayez plus tard.');}
   entry.count++;attempts.set(ip,entry);
   if(!req.headers['content-type']?.startsWith('application/x-www-form-urlencoded'))return send(415,'Format refusé');
   let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>4096)return send(413,'Requête trop volumineuse');}
   const fields=new URLSearchParams(body),username=fields.get('username')??'',password=fields.get('password')??'';
   if(username.length>80||password.length>256)return redirect('/login?error=1');
   pending++;let hash:Buffer;try{hash=await derivePassword(password,account.salt);}finally{pending--;}
   if(!timingSafeEqual(hash,Buffer.from(account.hash,'hex'))||username!==account.username)return redirect('/login?error=1');
   attempts.delete(ip);sessions.delete(key);
   if(sessions.size>=1000)sessions.delete(sessions.keys().next().value!);
   const session=randomBytes(32).toString('hex');sessions.set(digest(session),now()+lifetime);cookie(session,lifetime/1000);return redirect('/');
  }
  if(path==='/auth/session'){res.setHeader('Content-Type','application/json');return send(authenticated?200:401,JSON.stringify({authenticated}));}
  if(!authenticated){
   if((req.method==='GET'||req.method==='HEAD')&&req.headers.accept?.includes('text/html'))return redirect('/login');
   return send(401,'Authentification requise');
  }
  // Les secrets ne sont jamais servis, même à un joueur connecté.
  let decoded:string;try{decoded=decodeURIComponent(path);}catch{return send(400,'Chemin invalide');}
  if(decoded.includes('.local-auth')||decoded.includes('.local-assets')||decoded.startsWith('/server/')||decoded.startsWith('/@fs/'))return send(403,'Accès refusé');
  next();
 }
}
export function authentication():Plugin{
 const load=()=>{
  try{return createAuth(JSON.parse(readFileSync(resolve(process.env.AUTH_ACCOUNT_FILE??'.local-auth/account.json'),'utf8')) as Account);}
  catch{throw new Error('Authentification : fournir .local-auth/account.json (voir docs/AUTH.md). Démarrage refusé.');}
 };
 return {name:'server-authentication',configureServer(server){server.middlewares.use(load());},configurePreviewServer(server){server.middlewares.use(load());}};
}
