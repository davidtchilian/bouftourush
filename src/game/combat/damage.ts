/** 1 Puissance = +1 %. Arrondi inférieur après tous les multiplicateurs. */
export function damage(base:number,multiplier:number,power:number,buff=1,resistance=0):number {
 return Math.max(0,Math.floor(base*multiplier*(1+power/100)*buff*(1-Math.min(1,Math.max(0,resistance)))));
}
export function segmentDistance(p:[number,number],a:[number,number],b:[number,number]):number {
 const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
 const t=length?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)):0;
 return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
}
