import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,chmodSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
export type Account={id:number;username:string;displayName:string;salt:string;hash:string;createdAt:number;updatedAt:number};
export type Credentials={username:string;salt:string;hash:string};
/** Une seule identité et sa progression. Aucune donnée privée dans public/ ou le navigateur. */
export class AccountStore{
 private db:DatabaseSync;
 constructor(file:string){
  if(file!==':memory:'){mkdirSync(dirname(resolve(file)),{recursive:true,mode:0o700});}
  this.db=new DatabaseSync(file);
  this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
   CREATE TABLE IF NOT EXISTS account(id INTEGER PRIMARY KEY CHECK(id=1),username TEXT NOT NULL UNIQUE,displayName TEXT NOT NULL,salt TEXT NOT NULL,hash TEXT NOT NULL,createdAt INTEGER NOT NULL,updatedAt INTEGER NOT NULL,profile TEXT,revision INTEGER NOT NULL DEFAULT 0);
   CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,accountId INTEGER NOT NULL REFERENCES account(id),expires INTEGER NOT NULL);
   PRAGMA user_version=1;`);
  if(file!==':memory:')chmodSync(file,0o600);
 }
 close(){this.db.close();}
 account():Account|undefined{return this.db.prepare('SELECT id,username,displayName,salt,hash,createdAt,updatedAt FROM account WHERE id=1').get() as Account|undefined;}
 create(credentials:Credentials,displayName:string,now:number):boolean{
  if(!credentials.username||!/^[a-f0-9]{32}$/.test(credentials.salt)||!/^[a-f0-9]{128}$/.test(credentials.hash))throw new Error('Compte serveur invalide');
  return this.db.prepare('INSERT OR IGNORE INTO account(id,username,displayName,salt,hash,createdAt,updatedAt) VALUES(1,?,?,?,?,?,?)').run(credentials.username,displayName,credentials.salt,credentials.hash,now,now).changes===1;
 }
 /** Provisionnement administratif uniquement ; conserve la progression et révoque les sessions. */
 provision(credentials:Credentials,now:number){
  if(!/^[a-zA-Z0-9_-]{3,40}$/.test(credentials.username)||!/^[a-f0-9]{32}$/.test(credentials.salt)||!/^[a-f0-9]{128}$/.test(credentials.hash))throw new Error('Compte serveur invalide');
  this.db.exec('BEGIN IMMEDIATE');
  try{
   this.db.prepare(`INSERT INTO account(id,username,displayName,salt,hash,createdAt,updatedAt) VALUES(1,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET username=excluded.username,salt=excluded.salt,hash=excluded.hash,updatedAt=excluded.updatedAt`).run(credentials.username,credentials.username,credentials.salt,credentials.hash,now,now);
   this.db.exec('DELETE FROM sessions; COMMIT');
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 update(displayName:string,now:number){this.db.prepare('UPDATE account SET displayName=?,updatedAt=? WHERE id=1').run(displayName,now);}
 password(salt:string,hash:string,now:number){
  this.db.exec('BEGIN IMMEDIATE');
  try{this.db.prepare('UPDATE account SET salt=?,hash=?,updatedAt=? WHERE id=1').run(salt,hash,now);this.db.exec('DELETE FROM sessions; COMMIT');}
  catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 session(token:string,now:number):boolean{
  this.db.prepare('DELETE FROM sessions WHERE expires<=?').run(now);
  return Boolean(this.db.prepare('SELECT 1 FROM sessions WHERE token=?').get(token));
 }
 issue(token:string,expires:number){
  this.db.prepare('INSERT INTO sessions VALUES(?,1,?)').run(token,expires);
  this.db.exec('DELETE FROM sessions WHERE token NOT IN (SELECT token FROM sessions ORDER BY expires DESC LIMIT 1000)');
 }
 revoke(token:string){this.db.prepare('DELETE FROM sessions WHERE token=?').run(token);}
 profile():{profile:unknown;revision:number}{
  const row=this.db.prepare('SELECT profile,revision FROM account WHERE id=1').get() as {profile:string|null;revision:number};
  return {profile:row.profile?JSON.parse(row.profile):null,revision:row.revision};
 }
 saveProfile(profile:unknown,revision:number):boolean{
  return this.db.prepare('UPDATE account SET profile=?,revision=revision+1 WHERE id=1 AND revision=?').run(JSON.stringify(profile),revision).changes===1;
 }
}
