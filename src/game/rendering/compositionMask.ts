import * as THREE from 'three';
import type {Manifest,Animation} from '../assets/manifest';
import type {ComposedLayer} from './composition';
/** Masque vectoriel source rasterisé, conservé dans le repère du corps.
 * Il reste indépendant des pièces qu'il masque pendant la disparition de mort.
 */
export function applyCompositionMask(material:THREE.MeshBasicMaterial,layer:ComposedLayer,manifest:Manifest,textureFor:(frame:Animation['frames'][number])=>THREE.Texture){
 let uniforms=material.userData.compositionMask as ReturnType<typeof makeUniforms>|undefined;
 if(!uniforms){
  uniforms=makeUniforms();material.userData.compositionMask=uniforms;
  material.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,uniforms);
   shader.vertexShader='uniform mat3 compositionMaskMatrix; varying vec2 compositionMaskUv;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncompositionMaskUv=(compositionMaskMatrix*vec3(position.xy,1.0)).xy;');
   shader.fragmentShader='uniform sampler2D compositionMaskTexture; uniform vec4 compositionMaskRegion; uniform float compositionMaskEnabled; varying vec2 compositionMaskUv;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`if(compositionMaskEnabled>0.5){
    vec2 uv=compositionMaskUv;
    float inside=step(0.0,uv.x)*step(uv.x,1.0)*step(0.0,uv.y)*step(uv.y,1.0);
    diffuseColor.a*=inside*texture2D(compositionMaskTexture,uv*compositionMaskRegion.xy+compositionMaskRegion.zw).a;
   }
   #include <alphatest_fragment>`);
  };
  material.customProgramCacheKey=()=> 'remastered-composition-mask-v1';material.needsUpdate=true;
 }
 material.opacity=layer.opacity;
 uniforms.compositionMaskEnabled.value=layer.maskAssetId?1:0;
 if(!layer.maskAssetId)return;
 const mask=manifest.assets[layer.maskAssetId],frame=mask.frames[0],texture=textureFor(frame);
 uniforms.compositionMaskTexture.value=texture;
 const [a,b,c,d,tx,ty]=layer.matrix,[w,h]=mask.size,[px,py]=mask.pivot;
 uniforms.compositionMaskMatrix.value.set(a/w,-c/w,tx/w+px,-b/h,d/h,1-py-ty/h,0,0,1);
 uniforms.compositionMaskRegion.value.set(texture.repeat.x,texture.repeat.y,texture.offset.x,texture.offset.y);
}
function makeUniforms(){return {compositionMaskMatrix:{value:new THREE.Matrix3()},compositionMaskTexture:{value:null as THREE.Texture|null},compositionMaskRegion:{value:new THREE.Vector4(1,1,0,0)},compositionMaskEnabled:{value:0}};}
