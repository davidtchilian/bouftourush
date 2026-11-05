import {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {useAppStore} from './app/store';
import {applyDevelopmentReset} from './app/development-reset';
import {mountGame,type GameController} from './game/rendering/game';
import {GameUI} from './ui/GameUI';
import {assetImage} from './ui/art';
import {createWorldLabels} from './ui/worldLabels';
import './style.css';
function App(){
 const host=useRef<HTMLDivElement>(null),labelsHost=useRef<HTMLDivElement>(null),[controller,setController]=useState<GameController|null>(null);
 const {status,error}=useAppStore();
 useEffect(()=>{
  const abort=new AbortController();let runtime:GameController|undefined;
  const updateLabels=createWorldLabels(labelsHost.current!,id=>{const manifest=useAppStore.getState().manifest;return manifest?assetImage(manifest,id):undefined;});
  const reset=import.meta.env.DEV?applyDevelopmentReset():Promise.resolve();
  reset.then(()=>{
   if(abort.signal.aborted)throw new DOMException('Annulé','AbortError');
   return mountGame(host.current!,abort.signal,snapshot=>useAppStore.setState({snapshot}),status=>useAppStore.setState({status}),updateLabels);
  }).then(game=>{
   if(abort.signal.aborted){game.dispose();return;}runtime=game;useAppStore.setState({manifest:game.manifest});setController(game);
  }).catch((error:unknown)=>{if(!abort.signal.aborted)useAppStore.setState({status:'Chargement impossible',error:error instanceof Error?error.message:String(error)});});
  return()=>{abort.abort();runtime?.dispose();updateLabels([]);};
 },[]);
  return <main><form className="session-logout" method="post" action="/auth/logout" onSubmit={async event=>{event.preventDefault();const form=event.currentTarget;try{await controller?.flush();form.submit();}catch(error){window.alert(error instanceof Error?error.message:String(error));}}}><a href="/account" onClick={async event=>{event.preventDefault();try{await controller?.flush();location.assign('/account');}catch(error){window.alert(error instanceof Error?error.message:String(error));}}}>Mon compte</a><button type="submit">Déconnexion</button></form><GameUI controller={controller}/><div className="viewport" ref={host} onContextMenu={e=>e.preventDefault()} aria-label="Scène de jeu"><div className="labels" ref={labelsHost} aria-hidden="true"/></div>{!controller&&<aside aria-live="polite"><h1>Bouftourush</h1><p>{status}</p>{error&&<><p>{error}</p></>}</aside>}</main>;
}
const appRoot=createRoot(document.getElementById('root')!);
appRoot.render(<App/>);
let locked=false;
function requireLogin(){
 if(locked)return;
 locked=true;appRoot.unmount();
 document.body.textContent='Connexion au serveur requise. Rechargez la page pour vous reconnecter.';
 location.replace('/login');
}
// Toute session expirée ou révoquée ferme le jeu, y compris dans un onglet déjà ouvert.
async function checkSession(){
 try{const response=await fetch('/auth/session',{cache:'no-store'});if(!response.ok)requireLogin();}
 catch{requireLogin();}
}
window.setInterval(()=>{void checkSession();},15000);
window.addEventListener('focus',()=>{void checkSession();});
window.addEventListener('offline',requireLogin);
