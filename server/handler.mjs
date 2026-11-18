import {randomBytes,randomUUID,scryptSync,timingSafeEqual,createHash} from 'node:crypto'
import {db,initialize,withDatabase} from './database.mjs'
const hash=s=>createHash('sha256').update(s).digest('hex')
const token=()=>randomBytes(32).toString('base64url')
const sessionMs=1000*60*60*24*7
function password(value,salt=randomBytes(16).toString('hex')){return salt+':'+scryptSync(value,salt,64).toString('hex')}
function matches(value,stored){const actual=password(value,stored.split(':')[0]);return timingSafeEqual(Buffer.from(actual),Buffer.from(stored))}
const safeUser=u=>({id:u.id,name:u.name,email:u.email})
function fail(status,message){throw Object.assign(new Error(message),{status})}
async function user(req){const raw=req.headers.cookie?.match(/(?:^|;\s*)moida_session=([^;]+)/)?.[1];const u=raw&&(await db.prepare('SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?').get(hash(raw),Date.now()));if(!u)fail(401,'로그인이 필요해요.');return safeUser(u)}
async function groupFor(id,uid){const row=(await db.prepare('SELECT g.* FROM groups_data g JOIN memberships m ON g.id=m.group_id WHERE g.id=? AND m.user_id=?').get(id,uid));if(!row)fail(404,'참여한 그룹을 찾을 수 없어요.');return {...row,document:JSON.parse(row.document)}}
function leader(g,uid){if(g.document.plan.leaderId!==uid)fail(403,'대표만 할 수 있어요.')}
async function write(g,doc){(await db.prepare('UPDATE groups_data SET document=?,version=version+1 WHERE id=?').run(JSON.stringify(doc),g.id));return {id:g.id,name:g.name,document:doc,version:g.version+1}}
async function inviteFor(raw){const row=(await db.prepare('SELECT * FROM invites WHERE token=? AND expires>?').get(hash(raw),Date.now()));if(!row)fail(410,'초대 링크가 만료되었거나 유효하지 않아요. 대표에게 새 링크를 요청해 주세요.');const g=(await db.prepare('SELECT * FROM groups_data WHERE id=?').get(row.group_id));if(!g)fail(410,'그룹을 찾을 수 없어요.');const doc=JSON.parse(g.document);if(doc.plan.leaderId!==row.created_by)fail(410,'대표가 변경되어 새 초대 링크가 필요해요.');return {row,g:{...g,document:doc}}}
async function limit(req){const key=hash(req.headers['x-forwarded-for']?.split(',')[0]||req.socket?.remoteAddress||'unknown'),window=Math.floor(Date.now()/60000);await db.prepare('DELETE FROM auth_attempts WHERE window<?').run(window-2);await db.prepare('INSERT INTO auth_attempts(ip,window,count) VALUES(?,?,1) ON CONFLICT(ip,window) DO UPDATE SET count=count+1').run(key,window);const row=await db.prepare('SELECT count FROM auth_attempts WHERE ip=? AND window=?').get(key,window);if(row.count>12)fail(429,'잠시 후 다시 시도해 주세요.')}
async function body(req){if(req.body!==undefined){const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(Buffer.byteLength(raw)>1000000)fail(413,'요청이 너무 커요.');try{return JSON.parse(raw)}catch{fail(400,'입력 내용을 확인해 주세요.')}}let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>1000000)fail(413,'계획 데이터가 너무 커요.')}try{return JSON.parse(raw||'{}')}catch{fail(400,'입력 내용을 확인해 주세요.')}}
function clean(s,max){return typeof s==='string'?s.trim().slice(0,max):''}
async function handle(req,res){res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');const send=(value,status=200)=>({status,value});try{
 const url=requestUrl(req),path=url.pathname.split('/').filter(Boolean),method=req.method
 if(!url.pathname.startsWith('/api/'))fail(404,'경로를 찾을 수 없어요.')
 if(method!=='GET'){const origin=req.headers.origin;if(!allowedOrigin(origin))fail(403,'허용되지 않은 요청이에요.');if(!req.headers['content-type']?.startsWith('application/json'))fail(415,'JSON 요청만 지원합니다.')}
 const b=method==='GET'?{}:await body(req)
 if(path[1]==='signup'||path[1]==='login'){
  if(method!=='POST')fail(405,'허용되지 않은 요청이에요.');
  const email=clean(b.email,254).toLowerCase(),pass=typeof b.password==='string'?b.password:''
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||pass.length<10||pass.length>128)fail(400,'이메일과 10~128자 비밀번호를 확인해 주세요.')
  let u
  if(path[1]==='signup'){const name=clean(b.name,20);if(!name)fail(400,'이름을 입력해 주세요.');if((await db.prepare('SELECT id FROM users WHERE email=?').get(email)))fail(409,'이미 가입된 이메일이에요. 로그인해 주세요.');const id=randomUUID();(await db.prepare('INSERT INTO users VALUES(?,?,?,?)').run(id,name,email,password(pass)));u={id,name,email}}
  else {u=(await db.prepare('SELECT * FROM users WHERE email=?').get(email));if(!u||!matches(pass,u.password))fail(401,'이메일 또는 비밀번호가 맞지 않아요.')}
  const t=token();(await db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(t),u.id,Date.now()+sessionMs));res.setHeader('Set-Cookie',`moida_session=${t}; HttpOnly; SameSite=Lax; ${process.env.VERCEL?'Secure; ':''}Path=/api; Max-Age=${sessionMs/1000}`);return send({user:safeUser(u)})
 }
 if(path[1]==='invites'&&path[2]&&method==='GET'){const {g}=await inviteFor(path[2]);return send({name:g.name,count:g.document.plan.members.length,leaderName:g.document.plan.members.find(m=>m.id===g.document.plan.leaderId)?.name})}
 const u=await user(req)
 if(path[1]==='me')return send({user:u})
 if(path[1]==='logout'&&method==='POST'){const raw=req.headers.cookie?.match(/(?:^|;\s*)moida_session=([^;]+)/)?.[1];if(raw)(await db.prepare('DELETE FROM sessions WHERE token=?').run(hash(raw)));res.setHeader('Set-Cookie',`moida_session=; HttpOnly; SameSite=Lax; ${process.env.VERCEL?'Secure; ':''}Path=/api; Max-Age=0`);return send({ok:true})}
 if(path[1]==='groups'&&!path[2]){
  if(method==='GET')return send({createdCount:(await db.prepare('SELECT COUNT(*) AS n FROM groups_data WHERE created_by=?').get(u.id)).n,groups:(await db.prepare('SELECT g.* FROM groups_data g JOIN memberships m ON g.id=m.group_id WHERE m.user_id=? ORDER BY g.rowid DESC').all(u.id)).map(g=>({id:g.id,name:g.name,count:JSON.parse(g.document).plan.members.length,leader:JSON.parse(g.document).plan.leaderId===u.id}))})
  if(method==='POST'){if((await db.prepare('SELECT COUNT(*) AS n FROM groups_data WHERE created_by=?').get(u.id)).n>=3)fail(409,'그룹은 계정당 최대 3개까지 만들 수 있어요.');const name=clean(b.name,40),place=clean(b.place,40);if(!name||!place)fail(400,'그룹 이름과 평소 장소를 입력해 주세요.');const id=randomUUID(),doc={plan:{leaderId:u.id,meeting:'만남 장소를 정해 주세요',address:'',backup:'',offline:'연락이 안 될 때의 약속을 함께 정해 주세요',revision:1,members:[{id:u.id,name:u.name,place,action:'',need:''}]},confirmed:{},phase:'ready'};(await db.prepare('INSERT INTO groups_data(id,name,document,version,created_by) VALUES(?,?,?,1,?)').run(id,name,JSON.stringify(doc),u.id));(await db.prepare('INSERT INTO memberships VALUES(?,?)').run(id,u.id));return send({id,name,document:doc,version:1},201)}
 }
 if(path[1]==='groups'&&path[2]){
  const g=await groupFor(path[2],u.id)
  if(path[3]==='invites'&&method==='POST'){leader(g,u.id);if(g.document.plan.members.length>=6)fail(409,'그룹 정원은 6명이에요.');const t=token(),expires=Date.now()+sessionMs;(await db.prepare('INSERT INTO invites VALUES(?,?,?,?)').run(hash(t),g.id,u.id,expires));return send({token:t,expires})}
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
   for(const m of prev.plan.members){if(!next.plan.members.some(n=>n.id===m.id))(await db.prepare('DELETE FROM memberships WHERE group_id=? AND user_id=?').run(g.id,m.id))}const result=await write(g,next);return send(result)
  }
 }
 if(path[1]==='invites'&&path[2]&&path[3]==='join'&&method==='POST'){
  const {g}=await inviteFor(path[2]);if(g.document.plan.members.some(m=>m.id===u.id))return send(g)
  if(g.document.plan.members.length>=6)fail(409,'그룹 정원이 가득 찼어요.');const place=clean(b.place,40);if(!place)fail(400,'평소 장소를 입력해 주세요.')
  const doc={...g.document,plan:{...g.document.plan,revision:g.document.plan.revision+1,members:[...g.document.plan.members,{id:u.id,name:u.name,place,action:'',need:''}]},confirmed:{}}
  ;(await db.prepare('INSERT INTO memberships VALUES(?,?)').run(g.id,u.id));const joined=await write(g,doc);return send(joined)
 }
 fail(404,'요청한 기능을 찾을 수 없어요.')
 }catch(e){return send({error:e.status?e.message:'요청을 처리하지 못했어요. 다시 시도해 주세요.'},e.status||500)}}

function requestUrl(req){const url=new URL(req.url,'http://localhost');const route=url.searchParams.get('__route')||req.query?.__route;if(typeof route==='string')url.pathname='/api/'+route;return url}
function allowedOrigin(origin){
 if(!origin)return false
 if(!process.env.VERCEL)return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin||'')
 return [process.env.MOIDA_PUBLIC_ORIGIN||'https://disasterplanning.vercel.app',process.env.VERCEL_URL&&'https://'+process.env.VERCEL_URL,process.env.VERCEL_BRANCH_URL&&'https://'+process.env.VERCEL_BRANCH_URL].includes(origin)
}
export default async function handler(req,res){
 try{await initialize();if(req.method==='POST'&&['/api/signup','/api/login'].includes(requestUrl(req).pathname))await withDatabase(true,async()=>{await limit(req);return {status:200}});const result=await withDatabase(req.method!=='GET',()=>handle(req,res));res.writeHead(result.status);res.end(JSON.stringify(result.value))}
 catch(e){console.error('Account request failed:',e.code||e.name);res.writeHead(503,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify({error:'계정 서버에 잠시 연결할 수 없어요. 다시 시도해 주세요.'}))}
}
