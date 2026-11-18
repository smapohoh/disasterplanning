import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
const dir=await mkdtemp(join(tmpdir(),'moida-supabase-mode-'))
process.env.MOIDA_DB=join(dir,'test.sqlite')
process.env.VITE_SUPABASE_URL='https://example.supabase.co'
process.env.VITE_SUPABASE_PUBLISHABLE_KEY='sb_publishable_unit_test'
const {default:handler}=await import('../server/handler.mjs')
const {initialize,db,closeDatabase}=await import('../server/database.mjs')
async function request(url,method='GET',body,cookie){let status=0,value;const res={setHeader(){},writeHead(n){status=n},end(s){value=JSON.parse(s)}};await handler({url,method,body,headers:{origin:'http://localhost:3000','content-type':'application/json',cookie},socket:{remoteAddress:'test'}},res);return {status,value}}
try{
 await initialize()
 await test('Supabase mode refuses an otherwise-valid old cookie session',async()=>{
  await db.prepare('INSERT INTO users VALUES(?,?,?,?)').run('old','Old','old@example.test','old-hash')
  const token='old-valid-session'
  await db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(createHash('sha256').update(token).digest('hex'),'old',Date.now()+60000)
  assert.equal((await request('/api/me','GET',undefined,'moida_session='+token)).status,401)
 })
 await test('Supabase mode rejects legacy signup without creating or emailing a real user',async()=>{
  const result=await request('/api/signup','POST',{email:'not-sent@example.test',password:'test-only-password',name:'Test'})
  assert.equal(result.status,410)
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM users').get()).n,1)
 })
}finally{closeDatabase();await rm(dir,{recursive:true,force:true})}
