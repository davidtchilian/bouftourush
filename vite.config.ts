import {defineConfig,type Plugin} from 'vite';
import {readFile,realpath,writeFile} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
const localAssets:Plugin={
 name:'local-assets-after-import',apply:'serve',
 configureServer(server){
  const root=resolve(server.config.root,'public/assets');
  // Le renommage atomique d'un import sur NTFS invalide mal l'index public de Vite.
  server.middlewares.use(async(req,res,next)=>{
   const pathname=new URL(req.url??'/','http://localhost').pathname;
   // Signal local explicite, stocké hors du dépôt et absent du build de production.
   if(pathname==='/__local/profile-reset'){
    const address=server.httpServer?.address();
    res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
    // Le reset demandé concerne le serveur de jeu local, pas les navigateurs de test.
    if(!address||typeof address==='string'||address.port!==5173){res.statusCode=404;res.end('{}');return;}
    const requestPath=resolve(server.config.root,'.local-assets/profile-reset.json');
    if(req.method==='GET'){
     try{res.end(await readFile(requestPath));}catch{res.statusCode=404;res.end('{}');}
    }else if(req.method==='POST'){
     let id='';for await(const chunk of req){id+=chunk;if(id.length>36){res.statusCode=413;res.end('{}');return;}}
     try{
      const request=JSON.parse(await readFile(requestPath,'utf8'));
      if(id!==request.id){res.statusCode=400;res.end('{}');return;}
      await writeFile(resolve(server.config.root,'.local-assets/profile-reset-applied.json'),JSON.stringify({id,appliedAt:new Date().toISOString()}));
      res.statusCode=204;res.end();
     }catch{res.statusCode=404;res.end('{}');}
    }else{res.statusCode=405;res.end('{}');}
    return;
   }
   if(!pathname.startsWith('/assets/')||!['GET','HEAD'].includes(req.method??''))return next();
   try{
    const file=await realpath(resolve(root,decodeURIComponent(pathname.slice('/assets/'.length))));
    if(!file.startsWith(root+sep)||!file.endsWith('.png')&&!file.endsWith('.json'))return next();
    const bytes=await readFile(file);res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'application/json');res.setHeader('Cache-Control','no-cache');res.statusCode=200;res.end(req.method==='HEAD'?undefined:bytes);
   }catch{next();}
  });
 },
};
export default defineConfig({
 plugins:[localAssets],
 server:{watch:{usePolling:true,interval:750,ignored:['**/.local-assets/**','**/dist/**','**/test-results/**','**/public/assets/**','**/public/.assets-staging/**']}},
 optimizeDeps:{entries:['index.html']},
});
