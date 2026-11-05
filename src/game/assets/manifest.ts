import { z } from 'zod';
import {items} from '../../data/items';
import {monsters} from '../../data/monsters';
const positive = z.number().finite().positive();
const point = z.tuple([z.number().finite(), z.number().finite()]);
export const directions = ['south', 'southwest', 'west', 'northwest', 'north', 'northeast', 'east', 'southeast'] as const;
export const requiredIds = ['map.astrub.zaap', ...directions.flatMap(d => [`cra.idle.${d}`, `cra.run.${d}`])];
const safePath = z.string().regex(/^[a-zA-Z0-9_/-]+\.png$/).refine(p => !p.startsWith('/') && !p.split('/').includes('..'), 'Chemin PNG relatif requis');
const animation = z.object({
  frames: z.array(z.object({ path: safePath, durationMs: positive, region:z.tuple([z.number().int().nonnegative(),z.number().int().nonnegative(),positive.int(),positive.int(),positive.int(),positive.int()]).optional() })).min(1),
  pivot: point, size: z.tuple([positive, positive]), offset: point,
  loop: z.boolean(), flipX: z.boolean().default(false),
  provenance: z.object({ source: z.string().min(1), version: z.literal('1.40.13-remastered',{error:'Source visuelle interdite : seuls les assets Dofus Retro Remastered 1.40.13 sont acceptés.'}), originalFile: z.string().min(1), conversion: z.string().min(1), usageRights: z.string().min(1) }),
});
const layerSchema=z.object({assetId:z.string(),position:point,order:z.number().finite(),flipX:z.boolean().default(false),rotation:z.number().finite().default(0),scale:z.tuple([positive,positive]).default([1,1])});
export const mapSchema=z.object({
 bounds:z.tuple([z.number().finite(),z.number().finite(),z.number().finite(),z.number().finite()]),spawn:point,cameraHeight:positive,
 layers:z.array(layerSchema).optional(),walkable:z.array(z.object({id:z.number().int().nonnegative(),position:point})).optional(),
 enemySpawns:z.array(point).optional(),mapSource:z.string().optional(),backgroundAssetId:z.string().optional(),
});
export type MapDefinition=z.infer<typeof mapSchema>;
const affine=z.tuple([z.number().finite(),z.number().finite(),z.number().finite(),z.number().finite(),z.number().finite(),z.number().finite()]);
const compositionLayer=z.object({assetId:z.string().optional(),slot:z.enum(['hat','cape','bow']).optional(),label:z.string().optional(),maskAssetId:z.string().optional(),opacity:z.number().min(0).max(1).default(1),matrix:affine,hideWithHat:z.boolean().default(false),sourceCharacterId:z.number().int().optional()}).superRefine((layer,ctx)=>{
 if(Boolean(layer.assetId)===Boolean(layer.slot)||layer.slot&&!layer.label)ctx.addIssue({code:'custom',message:'Couche : pièce ou attache directionnelle requise'});
});
const compositionSchema=z.object({version:z.literal(1),actors:z.record(z.string(),z.object({loop:z.boolean(),flipX:z.boolean(),frames:z.array(z.object({durationMs:positive,layers:z.array(compositionLayer)})).min(1)})),accessories:z.record(z.string(),z.object({slot:z.enum(['hat','cape','bow']),views:z.record(z.string(),z.string())}))});
export const manifestSchema=z.object({version:z.literal(1),composition:compositionSchema.optional(),assets:z.record(z.string(),animation),hub:mapSchema,maps:z.record(z.string(),mapSchema).optional(),gameplayReady:z.boolean().default(false),
}).superRefine((m, ctx) => {
  for (const id of requiredIds) if (!m.assets[id]) ctx.addIssue({ code: 'custom', message: `Asset absent : ${id}`, path: ['assets', id] });
  for (const [id, a] of Object.entries(m.assets)) if (id.startsWith('cra.run.') && a.frames.length < 2) ctx.addIssue({code: 'custom', message: `Animation de course aplatie : ${id}`, path: ['assets', id]});
  for (const layer of [m.hub,...Object.values(m.maps??{})].flatMap(map=>map.layers??[])) if (!m.assets[layer.assetId]) ctx.addIssue({code:'custom',message:`Couche absente : ${layer.assetId}`,path:['hub','layers']});
  for(const map of [m.hub,...Object.values(m.maps??{})])if(map.backgroundAssetId&&!m.assets[map.backgroundAssetId])ctx.addIssue({code:'custom',message:`Fond composé absent : ${map.backgroundAssetId}`,path:['maps']});
  if(m.gameplayReady){
    for(const id of ['incarnam','bouftou','ensable','tofu','scara','chefBwork','blopMulti']) if(!m.maps?.[id]?.enemySpawns?.length || !m.maps[id].walkable?.length)ctx.addIssue({code:'custom',message:`Carte de donjon incomplète : ${id}`,path:['maps',id]});
    const required=['ui.spell.explosive','ui.spell.flaming','ui.spell.magic','ui.spell.power','ui.button.hover','ui.button.down','ui.portrait','ui.selection','ui.window','ui.button','ui.slot','ui.heart','spell.magic.projectile','spell.magic.impact','spell.explosive.projectile','spell.explosive.impact','spell.flaming.projectile','spell.flaming.impact','spell.power.cast'];
    for(const sprite of new Set(Object.values(monsters).map(monster=>monster.sprite)))for(const action of ['idle','run','attack','hit','death'])for(const direction of ['R','L'])required.push(`mob.${sprite}.${action}.${direction}`);
    for(const action of ['cast','buff','hit','death'])for(const direction of ['R','L'])required.push(`cra.${action}.${direction}`);
    for(const monster of Object.values(monsters))if(monster.rangedAttack){
     required.push(monster.rangedAttack.asset);
     for(const direction of ['R','L']){
      const id=`${monster.rangedAttack.animation}.${direction}`;required.push(id);
      if(m.assets[id]?.frames.length===1)ctx.addIssue({code:'custom',message:`Animation de lancer aplatie : ${id}`,path:['assets',id]});
     }
    }
    for(const id of Object.keys(items))required.push(`item.${id}`);
    const actors=[...directions.flatMap(direction=>[`cra.idle.${direction}`,`cra.run.${direction}`]),...['cast','buff','hit','death'].flatMap(action=>['R','L'].map(direction=>`cra.${action}.${direction}`))];
    if(!m.composition)ctx.addIssue({code:'custom',message:'Composition Crâ absente : lancer assets:prepare:game',path:['composition']});
    for(const actor of actors)if(!m.composition?.actors[actor])ctx.addIssue({code:'custom',message:`Composition absente : ${actor}`,path:['composition','actors',actor]});
    for(const [item,slot] of [['devHat','hat'],['6813','hat'],['6811','cape'],['8114','hat'],['8133','hat'],['8112','cape'],['8134','cape']])if(m.composition?.accessories[item]?.slot!==slot)ctx.addIssue({code:'custom',message:`Accessoire requis absent : ${item}`,path:['composition','accessories',item]});
    const previewActors=Object.values(monsters).filter(monster=>monster.boss).flatMap(monster=>['idle','attack'].map(action=>`mob.${monster.sprite}.${action}.R`));
    for(const actor of previewActors)required.push(`preview.${actor}`);
    for(const id of required)if(!m.assets[id])ctx.addIssue({code:'custom',message:`Asset de jeu absent : ${id}`,path:['assets',id]});
  }
  if(m.composition){
   const issue=(message:string)=>ctx.addIssue({code:'custom',message,path:['composition']});
   for(const [item,accessory] of Object.entries(m.composition.accessories))for(const [label,id] of Object.entries(accessory.views))if(!m.assets[id])issue(`Pièce accessoire absente : ${item}:${label} → ${id}`);
   for(const [id,actor] of Object.entries(m.composition.actors)){
    if(!m.assets[id])issue(`Animation de référence absente : ${id}`);
    if(m.assets[id]?.frames.length!==actor.frames.length)issue(`Timeline de composition désynchronisée : ${id}`);
    for(const frame of actor.frames)for(const layer of frame.layers){
     if(layer.maskAssetId&&!m.assets[layer.maskAssetId])issue(`Masque source absent : ${id} → ${layer.maskAssetId}`);
     if(m.gameplayReady&&/^(cra|sacrier|iop|feca)\.idle\./.test(id)){
      const pieces=layer.assetId?[layer.assetId]:Object.values(m.composition.accessories).filter(a=>a.slot===layer.slot).map(a=>a.views[layer.label!]);
      if(layer.maskAssetId)pieces.push(layer.maskAssetId);
      for(const piece of pieces)if(piece&&!m.assets[`preview.${piece}`])issue(`Pièce d’aperçu HD absente : ${piece}`);
     }
     if(layer.assetId&&!m.assets[layer.assetId])issue(`Couche de corps absente : ${id} → ${layer.assetId}`);
     if(layer.slot)for(const [item,accessory] of Object.entries(m.composition.accessories))if(accessory.slot===layer.slot&&!accessory.views[layer.label!])issue(`Vue d’attache absente : ${id} → ${item}:${layer.label}`);
     const [a,b,c,d]=layer.matrix;if(Math.abs(a*d-b*c)<1e-10)issue(`Matrice d’attache singulière : ${id}`);
    }
   }
   for(const [item,slot] of [['2411','hat'],['2474','hat'],['8259','hat'],['2414','cape'],['2473','cape'],['8258','cape'],['2438','hat'],['2445','cape'],['bow','bow']])if(m.composition.accessories[item]?.slot!==slot)issue(`Accessoire requis absent : ${item} (${slot})`);
  }
  for(const [id,asset] of Object.entries(m.assets))for(const frame of asset.frames)if(frame.region){const [x,y,w,h,pw,ph]=frame.region;if(x+w>pw||y+h>ph)ctx.addIssue({code:'custom',message:`Frame hors atlas : ${id}`,path:['assets',id]});}
  const [left, bottom, right, top] = m.hub.bounds;
  const [x,y] = m.hub.spawn;
  if (left >= right || bottom >= top || x < left || x > right || y < bottom || y > top) ctx.addIssue({code:'custom', message:'Limites ou point de départ invalides',path:['hub']});
});
export type Manifest = z.infer<typeof manifestSchema>;
export type Animation = Manifest['assets'][string];
export function parseManifest(input: unknown): Manifest { return manifestSchema.parse(input); }
