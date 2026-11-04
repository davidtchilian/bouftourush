import type {ScreenLabel} from '../game/rendering/game';

/** Réutilise les nœuds DOM : le suivi par image ne déclenche aucun rendu React. */
export function createWorldLabels(host:HTMLElement,iconPath:(id:string)=>string|undefined){
 const nodes=new Map<string,{element:HTMLSpanElement;content:HTMLSpanElement;hp?:HTMLSpanElement;fill?:HTMLSpanElement;signature:string}>();
 return (labels:ScreenLabel[])=>{
  const alive=new Set<string>();
  const width=host.clientWidth,height=host.clientHeight;
  for(const label of labels){
   alive.add(label.id);
   let node=nodes.get(label.id);
   if(!node){
    const element=document.createElement('span'),content=document.createElement('span');
    element.className=`world-label ${label.kind}`;element.dataset.id=label.id;element.append(content);
    node={element,content,signature:''};
    if(label.hp!==undefined){
     content.className='monster-name';
     const health=document.createElement('span'),hp=document.createElement('span'),track=document.createElement('span'),fill=document.createElement('span');
     health.className='monster-health';hp.className='monster-hp';track.className='monster-health-track';fill.className='monster-health-fill';
     track.append(fill);health.append(hp,track);element.append(health);node.hp=hp;node.fill=fill;
    }
    nodes.set(label.id,node);host.append(element);
   }
   // Les coordonnées en pixels permettent de déplacer les étiquettes par transform.
   node.element.style.transform=`translate(${label.x*width/100}px,${label.y*height/100}px) translate(-50%,-100%)`;
   const signature=JSON.stringify([label.text,label.icon,label.hp,label.maxHp]);
   if(signature!==node.signature){
    node.signature=signature;node.content.textContent=label.text;
    const src=label.icon&&iconPath(label.icon);
    if(src){const icon=document.createElement('img');icon.src=src;icon.alt='';node.content.prepend(icon);}
    if(node.hp&&node.fill){
     node.hp.textContent=String(Math.ceil(label.hp!));
     node.fill.style.transform=`scaleX(${Math.max(0,Math.min(1,label.hp!/Math.max(1,label.maxHp??1)))})`;
    }
   }
  }
  for(const [id,node] of nodes)if(!alive.has(id)){node.element.remove();nodes.delete(id);}
 };
}
