import {loadProfile,validateProfile,type StorageLike} from './persistence';
import type {Profile} from '../progression/profile';
/** Une file par onglet : les révisions empêchent un ancien onglet d'écraser le serveur. */
export async function openServerProfile(storage:StorageLike,signal:AbortSignal,onError:(message:string)=>void){
 async function request(options?:RequestInit){
  const response=await fetch('/api/profile',{cache:'no-store',...options});
  if(!response.ok)throw new Error(response.status===409?'Progression modifiée dans un autre onglet. Rechargez la page.':response.status===401?'Session expirée. Reconnectez-vous.':'Sauvegarde serveur indisponible. Rechargez la page avant de poursuivre.');
  return await response.json() as {profile?:unknown;revision:number};
 }
 const saved=await request({signal});let revision=saved.revision;
 if(!Number.isSafeInteger(revision)||revision<0)throw new Error('Révision serveur invalide.');
 const legacy=saved.profile===null?loadProfile(storage):undefined;
 const profile=saved.profile===null?legacy!.profile:validateProfile(saved.profile);
 if(saved.profile===null){
  const initialized=await request({method:'PUT',signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({profile,revision})});revision=initialized.revision;
 }
 let last=JSON.stringify(profile),pending:string|undefined,running:Promise<void>|undefined,failure:Error|undefined;
 async function drain(){
  try{
   while(pending!==undefined){
    const snapshot=pending;pending=undefined;
    const payload=JSON.stringify({profile:JSON.parse(snapshot),revision});
    const result=await request({method:'PUT',headers:{'Content-Type':'application/json'},body:payload,keepalive:new Blob([payload]).size<60000});
    revision=result.revision;last=snapshot;
   }
  }catch(error){failure=error instanceof Error?error:new Error(String(error));onError(failure.message);}
  finally{running=undefined;}
 }
 return {profile,warning:legacy?.warning,
  save(current:Profile){if(failure)return;const snapshot=JSON.stringify(current);if(snapshot===last&&pending===undefined&&!running)return;pending=snapshot;running??=drain();},
  async flush(){while(running)await running;if(failure)throw failure;},
 };
}
