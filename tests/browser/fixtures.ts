import {test as base,expect} from '@playwright/test';
/** Les tests de rendu gardent une progression isolée ; les tests serveur utilisent l'API réelle. */
export const test=base.extend({page:async({page},use)=>{
 let profile:unknown=null,revision=0;
 await page.route('**/api/profile',async route=>{
  const request=route.request();
  if(request.method()==='PUT'){
   const data=request.postDataJSON();
   if(data.revision!==revision)return route.fulfill({status:409,json:{error:'conflit'}});
   profile=data.profile;revision++;return route.fulfill({json:{revision}});
  }
  return route.fulfill({json:{profile,revision}});
 });
 await use(page);
}});
export {expect};
