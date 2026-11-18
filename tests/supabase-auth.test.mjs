import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
const dir=await mkdtemp(join(tmpdir(),'moida-auth-'))
process.env.MOIDA_DB=join(dir,'test.sqlite')
const {verifiedProfile,resolveProfile}=await import('../server/supabase-auth.mjs')
const {initialize,db,closeDatabase}=await import('../server/database.mjs')
try{
 await initialize()
 await test('unconfirmed or anonymous Supabase identities cannot access groups',()=>{
  assert.throws(()=>verifiedProfile({id:'remote',email:'person@example.test'}),e=>e.status===401)
  assert.throws(()=>verifiedProfile({id:'remote',email:'person@example.test',email_confirmed_at:'now',is_anonymous:true}),e=>e.status===401)
 })
 await test('verified email retains an existing owner ID and group access',async()=>{
  await db.prepare('INSERT INTO users VALUES(?,?,?,?)').run('old-owner','Existing','person@example.test','legacy-hash')
  const profile=verifiedProfile({id:'supabase-id',email:'Person@example.test',email_confirmed_at:'now',user_metadata:{display_name:'Sunnie'}})
  const resolved=await resolveProfile(profile,'https://test.supabase.co')
  assert.equal(resolved.id,'old-owner')
  assert.equal((await resolveProfile(profile,'https://test.supabase.co')).id,'old-owner')
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM users').get()).n,1)
  assert.equal((await db.prepare('SELECT user_id FROM auth_identities').get()).user_id,'old-owner')
 })
 await test('new verified identities get an internal account without a usable legacy password',async()=>{
  const result=await resolveProfile(verifiedProfile({id:'new-remote',email:'new@example.test',email_confirmed_at:'now',user_metadata:{display_name:'New'}}),'https://test.supabase.co')
  assert.equal(result.id,'new-remote')
  assert.equal((await db.prepare('SELECT password FROM users WHERE id=?').get(result.id)).password,'!supabase-managed')
 })
}finally{closeDatabase();await rm(dir,{recursive:true,force:true})}
