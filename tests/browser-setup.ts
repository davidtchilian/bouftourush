import {request,type FullConfig} from '@playwright/test';
export default async function setup(config:FullConfig){
 const baseURL=config.projects[0].use.baseURL!;const client=await request.newContext({baseURL});
 const response=await client.post('/auth/login',{headers:{Origin:baseURL},form:{username:'browser-test',password:process.env.BROWSER_TEST_PASSWORD!},maxRedirects:0});
 if(response.status()!==303||response.headers().location!=='/')throw new Error('Connexion du compte de test refusée');
 await client.storageState({path:'.local-auth/browser-state.json'});await client.dispose();
}
