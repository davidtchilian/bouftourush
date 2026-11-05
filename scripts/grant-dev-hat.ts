import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {AccountStore} from '../server/accounts';
import {developerHatId} from '../src/data/developerItem';
import {newProfile} from '../src/game/progression/profile';
import {validateProfile} from '../src/game/save/persistence';
const username=process.argv[2];if(!username)throw new Error('Usage : pnpm account:grant-dev-hat identifiant');
const store=new AccountStore(resolve(process.env.AUTH_DATABASE_FILE??'.server-data/game.sqlite'));
try{
 if(store.account()?.username!==username)throw new Error('Compte serveur demandé introuvable.');
 let granted=false;
 for(let attempt=0;attempt<5;attempt++){
  const saved=store.profile(),profile=saved.profile===null?newProfile():validateProfile(saved.profile);
  if(profile.inventory.some(instance=>instance.item===developerHatId)){console.log('Coiffe du dev déjà présente ; aucun doublon ajouté.');granted=true;break;}
  if(profile.inventory.length>=10000)throw new Error('Inventaire plein.');
  profile.inventory.push({uid:'admin-dev-hat-'+randomUUID(),item:developerHatId});
  if(store.saveProfile(profile,saved.revision)){console.log(`Coiffe du dev ajoutée à l’inventaire de ${username}. Équipement et progression conservés.`);granted=true;break;}
 }
 if(!granted)throw new Error('Progression modifiée simultanément ; relancer l’attribution.');
}finally{store.close();}
