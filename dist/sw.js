/* Fichiers locaux uniquement. Installé exclusivement dans la compilation production. */
const prefix='bouftourush-offline-';
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const response=await fetch('/offline-manifest.json',{cache:'no-store'});
 if(!response.ok)throw new Error('Manifeste hors connexion absent');
 const manifest=await response.clone().json(),cache=await caches.open(prefix+manifest.version);
 await cache.put('/offline-manifest.json',response);
 for(let i=0;i<manifest.paths.length;i+=12)await cache.addAll(manifest.paths.slice(i,i+12));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const response=await fetch('/offline-manifest.json',{cache:'no-store'}).catch(()=>null);
 const current=response?.ok?prefix+(await response.json()).version:null;
 if(current)for(const key of await caches.keys())if(key.startsWith(prefix)&&key!==current)await caches.delete(key);
 await self.clients.claim();
 for(const client of await self.clients.matchAll())client.postMessage({type:'offline-ready'});
})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cached=await caches.match(event.request,{ignoreVary:true});if(cached)return cached;
  try{return await fetch(event.request);}catch(error){if(event.request.mode==='navigate'){const index=await caches.match('/');if(index)return index;}throw error;}
 })());
});

/* compilation e2beef423f66ca1e */
