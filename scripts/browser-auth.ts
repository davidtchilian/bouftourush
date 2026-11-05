import {mkdirSync,unlinkSync,existsSync} from 'node:fs';
import {AccountStore} from '../server/accounts';
import {randomBytes,scryptSync} from 'node:crypto';
import {resolve} from 'node:path';
// Compte isolé, exclusivement utilisé par le serveur Playwright (jamais celui de :5173).
export const testAccountFile=resolve('.local-auth/browser-test.sqlite');
export const testPassword=randomBytes(24).toString('hex');
export function prepareBrowserAccount(){
 if(process.env.BROWSER_TEST_PASSWORD)return;
 const salt=randomBytes(16).toString('hex');
 const hash=scryptSync(testPassword,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024}).toString('hex');
 mkdirSync('.local-auth',{recursive:true,mode:0o700});
 if(existsSync(testAccountFile))unlinkSync(testAccountFile);
 const store=new AccountStore(testAccountFile);store.create({username:'browser-test',salt,hash},'Joueur de test',Date.now());store.close();
 process.env.BROWSER_TEST_PASSWORD=testPassword;
}
