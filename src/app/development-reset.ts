import {newProfile} from '../game/progression/profile';
import {saveProfile} from '../game/save/persistence';
const marker='bouftourush.development-reset.applied';
/** Requête privée du poste de développement ; aucune remise à zéro dans le build publié. */
export async function applyDevelopmentReset():Promise<void>{
 let response:Response;
 try{response=await fetch('/__local/profile-reset',{cache:'no-store'});}catch{return;}
 if(!response.ok)return;
 let request:unknown;try{request=await response.json();}catch{return;}
 if(!request||typeof request!=='object'||!('id' in request)||typeof request.id!=='string'||!/^[a-f0-9-]{36}$/.test(request.id))return;
 const id=request.id;
 try{
  if(localStorage.getItem(marker)!==id){
   if(!saveProfile(localStorage,newProfile()))throw new Error('Sauvegarde locale indisponible : remise à zéro impossible.');
   localStorage.setItem(marker,id);localStorage.removeItem('bouftourush.help.seen');
  }
 }catch{throw new Error('Impossible de remettre la progression à zéro : vérifier l’accès au stockage local du navigateur.');}
 // Accusé de réception local ; son échec n’empêche pas de jouer après le reset.
 await fetch('/__local/profile-reset',{method:'POST',body:id}).catch(()=>{});
}

