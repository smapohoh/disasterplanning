import {createClient} from '@libsql/client'
import {AsyncLocalStorage} from 'node:async_hooks'
import {mkdirSync} from 'node:fs'
import {dirname,resolve} from 'node:path'
const remote=process.env.TURSO_DATABASE_URL
if(process.env.VERCEL&&!remote)throw new Error('TURSO_DATABASE_URL is required in production')
const path=process.env.MOIDA_DB||resolve('.local/moida.sqlite')
if(!remote)mkdirSync(dirname(path),{recursive:true,mode:0o700})
const client=createClient({url:remote||'file:'+path,authToken:process.env.TURSO_AUTH_TOKEN})
const context=new AsyncLocalStorage()
export const db={prepare(sql){return {async get(...args){return (await (context.getStore()||client).execute({sql,args})).rows[0]},async all(...args){return (await (context.getStore()||client).execute({sql,args})).rows},async run(...args){return (context.getStore()||client).execute({sql,args})}}}}
let ready
export function initialize(){return ready??=(async()=>{
 if(!remote)await client.execute('PRAGMA journal_mode=WAL')
 await client.executeMultiple(`
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS groups_data(id TEXT PRIMARY KEY,name TEXT NOT NULL,document TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,created_by TEXT);
 CREATE TABLE IF NOT EXISTS memberships(group_id TEXT REFERENCES groups_data(id),user_id TEXT REFERENCES users(id),PRIMARY KEY(group_id,user_id));
 CREATE TABLE IF NOT EXISTS invites(token TEXT PRIMARY KEY,group_id TEXT REFERENCES groups_data(id),created_by TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS auth_attempts(ip TEXT NOT NULL,window INTEGER NOT NULL,count INTEGER NOT NULL,PRIMARY KEY(ip,window));`)
 if(!(await db.prepare('PRAGMA table_info(groups_data)').all()).some(c=>c.name==='created_by')){await client.execute('ALTER TABLE groups_data ADD COLUMN created_by TEXT');for(const g of await db.prepare('SELECT id,document FROM groups_data').all()){const d=JSON.parse(g.document);await db.prepare('UPDATE groups_data SET created_by=? WHERE id=?').run(d.plan.members[0]?.id||d.plan.leaderId,g.id)}}
})()}
export async function withDatabase(write,fn){
 if(!write)return context.run(client,fn)
 const tx=await client.transaction('write')
 try{const result=await context.run(tx,fn);if(result.status>=400)await tx.rollback();else await tx.commit();return result}finally{tx.close()}
}
