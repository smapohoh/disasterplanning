import http from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto'
const dbPath=process.env.MOIDA_DB||resolve('.local/moida.sqlite')
mkdirSync(dirname(dbPath),{recursive:true,mode:0o700})
const db=new DatabaseSync(dbPath)
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS groups_data(id TEXT PRIMARY KEY,name TEXT NOT NULL,document TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS memberships(group_id TEXT REFERENCES groups_data(id),user_id TEXT REFERENCES users(id),PRIMARY KEY(group_id,user_id));
CREATE TABLE IF NOT EXISTS invites(token TEXT PRIMARY KEY,group_id TEXT REFERENCES groups_data(id),created_by TEXT NOT NULL,expires INTEGER NOT NULL);`)
if(!db.prepare('PRAGMA table_info(groups_data)').all().some(c=>c.name==='created_by')){db.exec('ALTER TABLE groups_data ADD COLUMN created_by TEXT');for(const g of db.prepare('SELECT id,document FROM groups_data').all()){const d=JSON.parse(g.document);db.prepare('UPDATE groups_data SET created_by=? WHERE id=?').run(d.plan.members[0]?.id||d.plan.leaderId,g.id)}}
const hash=s=>createHash('sha256').update(s).digest('hex')
const token=()=>randomBytes(32).toString('base64url')
const sessionMs=1000*60*60*24*7
function password(value,salt=randomBytes(16).toString('hex')){return salt+':'+scryptSync(value,salt,64).toString('hex')}
function matches(value,stored){const actual=password(value,stored.split(':')[0]);return timingSafeEqual(Buffer.from(actual),Buffer.from(stored))}
const safeUser=u=>({id:u.id,name:u.name,email:u.email})
function fail(status,message){throw Object.assign(new Error(message),{status})}
function user(req){const raw=req.headers.cookie?.match(/(?:^|;\s*)moida_session=([^;]+)/)?.[1];const u=raw&&db.prepare('SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?').get(hash(raw),Date.now());if(!u)fail(401,'로그인이 필요해요.');return safeUser(u)}
function groupFor(id,uid){const row=db.prepare('SELECT g.* FROM groups_data g JOIN memberships m ON g.id=m.group_id WHERE g.id=? AND m.user_id=?').get(id,uid);if(!row)fail(404,'참여한 그룹을 찾을 수 없어요.');return {...row,document:JSON.parse(row.document)}}
function leader(g,uid){if(g.document.plan.leaderId!==uid)fail(403,'대표만 할 수 있어요.')}
function write(g,doc){db.prepare('UPDATE groups_data SET document=?,version=version+1 WHERE id=?').run(JSON.stringify(doc),g.id);return {id:g.id,name:g.name,document:doc,version:g.version+1}}
function inviteFor(raw){const row=db.prepare('SELECT * FROM invites WHERE token=? AND expires>?').get(hash(raw),Date.now());if(!row)fail(410,'초대 링크가 만료되었거나 유효하지 않아요. 대표에게 새 링크를 요청해 주세요.');const g=db.prepare('SELECT * FROM groups_data WHERE id=?').get(row.group_id);if(!g)fail(410,'그룹을 찾을 수 없어요.');const doc=JSON.parse(g.document);if(doc.plan.leaderId!==row.created_by)fail(410,'대표가 변경되어 새 초대 링크가 필요해요.');return {row,g:{...g,document:doc}}}
const attempts=new Map()
function limit(req){const key=req.socket.remoteAddress;const a=attempts.get(key)||[];const current=a.filter(t=>Date.now()-t<60000);if(current.length>=12)fail(429,'잠시 후 다시 시도해 주세요.');current.push(Date.now());attempts.set(key,current)}
async function body(req){let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>1000000)fail(413,'계획 데이터가 너무 커요.')}try{return JSON.parse(raw||'{}')}catch{fail(400,'입력 내용을 확인해 주세요.')}}
function clean(s,max){return typeof s==='string'?s.trim().slice(0,max):''}
const server=http.createServer(async(req,res)=>{res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');const send=(value,status=200)=>{res.writeHead(status);res.end(JSON.stringify(value))};try{
 const url=new URL(req.url,'http://localhost'),path=url.pathname.split('/').filter(Boolean),method=req.method
 if(!url.pathname.startsWith('/api/'))fail(404,'경로를 찾을 수 없어요.')
 if(method!=='GET'){const origin=req.headers.origin;if(!origin||!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))fail(403,'허용되지 않은 요청이에요.');if(!req.headers['content-type']?.startsWith('application/json'))fail(415,'JSON 요청만 지원합니다.')}
 const b=method==='GET'?{}:await body(req)
 if(path[1]==='signup'||path[1]==='login'){
  if(method!=='POST')fail(405,'허용되지 않은 요청이에요.');limit(req)
  const email=clean(b.email,254).toLowerCase(),pass=typeof b.password==='string'?b.password:''
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||pass.length<10||pass.length>128)fail(400,'이메일과 10~128자 비밀번호를 확인해 주세요.')
  let u
  if(path[1]==='signup'){const name=clean(b.name,20);if(!name)fail(400,'이름을 입력해 주세요.');if(db.prepare('SELECT id FROM users WHERE email=?').get(email))fail(409,'이미 가입된 이메일이에요. 로그인해 주세요.');const id=randomUUID();db.prepare('INSERT INTO users VALUES(?,?,?,?)').run(id,name,email,password(pass));u={id,name,email}}
  else {u=db.prepare('SELECT * FROM users WHERE email=?').get(email);if(!u||!matches(pass,u.password))fail(401,'이메일 또는 비밀번호가 맞지 않아요.')}
  const t=token();db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(t),u.id,Date.now()+sessionMs);res.setHeader('Set-Cookie',`moida_session=${t}; HttpOnly; SameSite=Lax; Path=/api; Max-Age=${sessionMs/1000}`);return send({user:safeUser(u)})
 }
 if(path[1]==='invites'&&path[2]&&method==='GET'){const {g}=inviteFor(path[2]);return send({name:g.name,count:g.document.plan.members.length,leaderName:g.document.plan.members.find(m=>m.id===g.document.plan.leaderId)?.name})}
 const u=user(req)
 if(path[1]==='me')return send({user:u})
 if(path[1]==='logout'&&method==='POST'){const raw=req.headers.cookie?.match(/(?:^|;\s*)moida_session=([^;]+)/)?.[1];if(raw)db.prepare('DELETE FROM sessions WHERE token=?').run(hash(raw));res.setHeader('Set-Cookie','moida_session=; HttpOnly; SameSite=Lax; Path=/api; Max-Age=0');return send({ok:true})}
 if(path[1]==='groups'&&!path[2]){
  if(method==='GET')return send({createdCount:db.prepare('SELECT COUNT(*) AS n FROM groups_data WHERE created_by=?').get(u.id).n,groups:db.prepare('SELECT g.* FROM groups_data g JOIN memberships m ON g.id=m.group_id WHERE m.user_id=? ORDER BY g.rowid DESC').all(u.id).map(g=>({id:g.id,name:g.name,count:JSON.parse(g.document).plan.members.length,leader:JSON.parse(g.document).plan.leaderId===u.id}))})
  if(method==='POST'){if(db.prepare('SELECT COUNT(*) AS n FROM groups_data WHERE created_by=?').get(u.id).n>=3)fail(409,'그룹은 계정당 최대 3개까지 만들 수 있어요.');const name=clean(b.name,40),place=clean(b.place,40);if(!name||!place)fail(400,'그룹 이름과 평소 장소를 입력해 주세요.');const id=randomUUID(),doc={plan:{leaderId:u.id,meeting:'만남 장소를 정해 주세요',address:'',backup:'',offline:'연락이 안 될 때의 약속을 함께 정해 주세요',revision:1,members:[{id:u.id,name:u.name,place,action:'',need:''}]},confirmed:{},phase:'ready'};db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO groups_data(id,name,document,version,created_by) VALUES(?,?,?,1,?)').run(id,name,JSON.stringify(doc),u.id);db.prepare('INSERT INTO memberships VALUES(?,?)').run(id,u.id);db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}return send({id,name,document:doc,version:1},201)}
 }
 if(path[1]==='groups'&&path[2]){
  const g=groupFor(path[2],u.id)
  if(path[3]==='invites'&&method==='POST'){leader(g,u.id);if(g.document.plan.members.length>=6)fail(409,'그룹 정원은 6명이에요.');const t=token(),expires=Date.now()+sessionMs;db.prepare('INSERT INTO invites VALUES(?,?,?,?)').run(hash(t),g.id,u.id,expires);return send({token:t,expires})}
  if(path[3])fail(404,'경로를 찾을 수 없어요.')
  if(method==='GET')return send(g)
  if(method==='PUT'){
   if(b.version!==g.version)fail(409,'다른 멤버가 계획을 변경했어요. 그룹을 다시 열어 최신 계획을 확인해 주세요.')
   const next=b.document,prev=g.document
   if(!next?.plan||!Array.isArray(next.plan.members)||!next.plan.members.length||new Set(next.plan.members.map(m=>m.id)).size!==next.plan.members.length||next.plan.members.some(m=>!prev.plan.members.some(p=>p.id===m.id)))fail(400,'멤버는 초대 링크로 추가해 주세요.')
   if(next.plan.members.some(m=>!clean(m.name,20)||!clean(m.place,40))||!next.plan.members.some(m=>m.id===next.plan.leaderId))fail(400,'이름·장소·대표를 확인해 주세요.')
   const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b)
   if(prev.plan.leaderId!==u.id){
    if(next.plan.members.length!==prev.plan.members.length)fail(403,'구성원은 대표만 관리할 수 있어요.')
    const foreign=x=>({...x.plan,members:x.plan.members.filter(m=>m.id!==u.id),revision:0})
    if(!eq(foreign(next),foreign(prev)))fail(403,'다른 멤버의 계획과 공통 약속은 대표만 수정할 수 있어요.')
    if(!eq(prev.plan.members.find(m=>m.id===u.id)?.name,next.plan.members.find(m=>m.id===u.id)?.name))fail(403,'구성원 정보는 대표만 수정할 수 있어요.')
   }
   // Every member can acknowledge only their own plan and report only their own safety.
   for(const field of ['confirmed','reviewedAt','reports']){for(const id of new Set([...Object.keys(prev[field]||{}),...Object.keys(next[field]||{})])){if(id!==u.id&&!eq(prev[field]?.[id],next[field]?.[id])){if(field==='confirmed'&&next.plan.revision>prev.plan.revision&&Object.keys(next.confirmed||{}).length===0)continue;fail(403,'다른 멤버의 확인·안전 상태는 바꿀 수 없어요.')}}}
   const oldReminders=prev.reminders||[],newReminders=next.reminders||[]
   if(newReminders.some(r=>!oldReminders.some(p=>p.id===r.id)&&(prev.plan.leaderId!==u.id||r.from!==u.id||r.to===u.id||!prev.plan.members.some(m=>m.id===r.to))))fail(403,'리마인드는 대표만 보낼 수 있어요.')
   for(const r of oldReminders){const n=newReminders.find(n=>n.id===r.id);if(!n)fail(403,'리마인드 기록은 삭제할 수 없어요.');if(!eq(r,n)&&!(r.to===u.id&&eq({...n,completedAt:r.completedAt},r)))fail(403,'내 리마인드만 확인할 수 있어요.')}
   const planChanged=!eq({...next.plan,revision:0},{...prev.plan,revision:0})
   if(next.plan.revision!==prev.plan.revision+(planChanged?1:0)&&!(!planChanged&&next.plan.revision===prev.plan.revision+1))fail(400,'계획 판 번호가 올바르지 않아요.')
   db.exec('BEGIN IMMEDIATE');try{for(const m of prev.plan.members){if(!next.plan.members.some(n=>n.id===m.id))db.prepare('DELETE FROM memberships WHERE group_id=? AND user_id=?').run(g.id,m.id)}const result=write(g,next);db.exec('COMMIT');return send(result)}catch(e){db.exec('ROLLBACK');throw e}
  }
 }
 if(path[1]==='invites'&&path[2]&&path[3]==='join'&&method==='POST'){
  const {g}=inviteFor(path[2]);if(g.document.plan.members.some(m=>m.id===u.id))return send(g)
  if(g.document.plan.members.length>=6)fail(409,'그룹 정원이 가득 찼어요.');const place=clean(b.place,40);if(!place)fail(400,'평소 장소를 입력해 주세요.')
  const doc={...g.document,plan:{...g.document.plan,revision:g.document.plan.revision+1,members:[...g.document.plan.members,{id:u.id,name:u.name,place,action:'',need:''}]},confirmed:{}}
  db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO memberships VALUES(?,?)').run(g.id,u.id);const joined=write(g,doc);db.exec('COMMIT');return send(joined)}catch(e){db.exec('ROLLBACK');throw e}
 }
 fail(404,'요청한 기능을 찾을 수 없어요.')
 }catch(e){send({error:e.status?e.message:'요청을 처리하지 못했어요. 다시 시도해 주세요.'},e.status||500)}})
server.listen(Number(process.env.MOIDA_PORT||3011),'127.0.0.1',()=>console.log(`모이다 로컬 계정 서버 http://127.0.0.1:${process.env.MOIDA_PORT||3011}`))
