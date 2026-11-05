import {scrypt} from 'node:crypto';
export const derivePassword=(password:string,salt:string):Promise<Buffer>=>new Promise((resolve,reject)=>{
 scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024},(error,key)=>error?reject(error):resolve(key));
});
