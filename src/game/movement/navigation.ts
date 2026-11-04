export type Point = [number, number];
export type Cell = { id: number; position: Point };
const distance = (a: Point, b: Point) => Math.hypot(a[0]-b[0],a[1]-b[1]);
/** Données de navigation explicites issues des cellules source, jamais de l'image. */
export class Navigation {
  private buckets=new Map<string,Cell[]>();
  private adjacency=new Map<number,Cell[]>();
  constructor(readonly cells: Cell[]) {
    for(const c of cells){const key=`${Math.floor(c.position[0]/53)},${Math.floor(c.position[1]/27)}`;const bucket=this.buckets.get(key)??[];bucket.push(c);this.buckets.set(key,bucket);}
  }
  private neighbors(cell:Cell):Cell[]{
    let result=this.adjacency.get(cell.id);if(result)return result;
    const p=cell.position;
    result=this.cells.filter(c=>{const dx=Math.abs(p[0]-c.position[0]),dy=Math.abs(p[1]-c.position[1]);return c.id!==cell.id&&dx<=53.01&&dy<=27.01&&dx/26.5+dy/13.5<=2.01&&this.clear(p,c.position);});
    this.adjacency.set(cell.id,result);return result;
  }
  nearest(point: Point): Cell {
    if (!this.cells.length) throw new Error('Aucune zone traversable définie pour Astrub.');
    return this.cells.reduce((best,c) => distance(c.position,point)<distance(best.position,point)?c:best);
  }
  contains(point: Point): boolean {
    const x=Math.floor(point[0]/53),y=Math.floor(point[1]/27);
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(const c of this.buckets.get(`${x+dx},${y+dy}`)??[])if(Math.abs(c.position[0]-point[0])/26.5+Math.abs(c.position[1]-point[1])/13.5<=1.001)return true;
    return false;
  }
  clear(a: Point,b: Point): boolean {
    const steps=Math.ceil(distance(a,b)/3);
    for(let i=0;i<=steps;i++) { const t=steps===0?0:i/steps; if(!this.contains([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])) return false; }
    return true;
  }
  route(start: Point, target: Point): Point[] {
    const from=this.nearest(start), goal=this.nearest(target);
    const end=this.contains(target)?target:goal.position;
    if(this.clear(start,end)) return [end];
    const open=new Set([from.id]), costs=new Map([[from.id,0]]), parent=new Map<number,number>();
    const byId=new Map(this.cells.map(c=>[c.id,c]));
    while(open.size) {
      const current=[...open].reduce((a,b)=>(costs.get(a)!+distance(byId.get(a)!.position,goal.position))<(costs.get(b)!+distance(byId.get(b)!.position,goal.position))?a:b);
      if(current===goal.id) {
        const path:Point[]=[end]; let id=current;
        while(id!==from.id) {path.unshift(byId.get(id)!.position); id=parent.get(id)!;}
        path.unshift(from.position);
        // Supprime les angles inutiles quand le segment reste dans la zone libre.
        const result:Point[]=[]; let anchor=start;
        while(path.length) {let last=0;for(let i=0;i<path.length;i++){if(this.clear(anchor,path[i])) last=i;else break;} anchor=path[last];result.push(anchor);path.splice(0,last+1);}
        return result;
      }
      open.delete(current);
      const p=byId.get(current)!.position;
      for(const cell of this.neighbors(byId.get(current)!)) {
        const next=costs.get(current)!+distance(p,cell.position);
        if(next<(costs.get(cell.id)??Infinity)) {costs.set(cell.id,next);parent.set(cell.id,current);open.add(cell.id);}
      }
    }
    return [];
  }
}
