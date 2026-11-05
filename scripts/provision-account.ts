/** Administration du compte serveur ; mot de passe reçu sur stdin, jamais en argument. */
import {createInterface} from 'node:readline';
import {randomBytes} from 'node:crypto';
import {resolve} from 'node:path';
import {AccountStore} from '../server/accounts';
import {derivePassword} from '../server/passwords';
const username=process.argv[2];
if(!username||!/^[a-zA-Z0-9_-]{3,40}$/.test(username))throw new Error('Usage : pnpm account:provision identifiant < fichier-prive-de-mot-de-passe');
const reader=createInterface({input:process.stdin});
let password='';for await(const line of reader){password=line;break;}reader.close();process.stdin.pause();
if(password.length<12||password.length>256)throw new Error('Mot de passe requis : entre 12 et 256 caractères sur stdin.');
const file=resolve(process.env.AUTH_DATABASE_FILE??'.server-data/game.sqlite');
if(['public','dist'].some(folder=>file===resolve(folder)||file.startsWith(resolve(folder)+'/')))throw new Error('La base doit rester hors des dossiers publics.');
const salt=randomBytes(16).toString('hex'),hash=(await derivePassword(password,salt)).toString('hex');
const store=new AccountStore(file);
try{store.provision({username,salt,hash},Date.now());console.log(`Compte serveur ${username} configuré ; progression préservée, anciennes sessions révoquées.`);}finally{store.close();}
