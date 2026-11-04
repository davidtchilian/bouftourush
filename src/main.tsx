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
  }).catch((error:unknown)=>{if(!abort.signal.aborted)useAppStore.setState({status:'Assets requis',error:error instanceof Error?error.message:String(error)});});
  return()=>{abort.abort();runtime?.dispose();updateLabels([]);};
 },[]);
  return <main><GameUI controller={controller}/><div className="viewport" ref={host} onContextMenu={e=>e.preventDefault()} aria-label="Scène de jeu"><div className="labels" ref={labelsHost} aria-hidden="true"/></div>{!controller&&<aside aria-live="polite"><h1>Bouftourush</h1><p>{status}</p>{error&&<><p>{error}</p><p>Installer les sources locales avec assets:prepare:game et assets:import. Voir docs/ASSETS.md.</p></>}</aside>}</main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
if(import.meta.env.PROD&&'serviceWorker' in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{});});
