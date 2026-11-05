import type {Simulation} from '../core/simulation';
const simulations=new WeakMap<HTMLCanvasElement,Simulation>();
/** Enregistrement en développement uniquement ; aucune copie ni sérialisation dans la boucle de jeu. */
export function registerSimulationInspection(canvas:HTMLCanvasElement,simulation:Simulation):()=>void{
 simulations.set(canvas,simulation);return()=>{simulations.delete(canvas);};
}
/** Les outils lisent uniquement ce dont ils ont besoin, au moment de leur requête. */
export function inspectSimulation(canvas:HTMLCanvasElement):Simulation{
 const simulation=simulations.get(canvas);
 if(!simulation)throw new Error('Inspection indisponible : serveur de développement et scène active requis.');
 return simulation;
}
