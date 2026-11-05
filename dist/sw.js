/* Migration : retire le cache public historique et exige une connexion serveur. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith('bouftourush-offline-'))await caches.delete(key);
 await self.registration.unregister();
 for(const client of await self.clients.matchAll({type:'window'}))client.navigate('/login');
})()));
