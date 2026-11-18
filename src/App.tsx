import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, MapPin, ShieldCheck, Users, Check, CheckCheck, ClipboardList, Footprints, PhoneOff, Sun, Moon, Pencil, Flag, CircleCheck, Info, Home, Building2, GraduationCap, Navigation, RotateCcw } from 'lucide-react'
import { MobileAppShell, MobileScreenHeading, MobileToolbarButton } from '@/components/ui/mobile-app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import './foundations.css'
import './app.css'
import { OfflineMap } from './OfflineMap'
import { canEditMember, isGroupLeader } from './permissions'
import { PlansScreen } from './plans/PlansScreen'
import { plansFor,planReady,type PersonalPlan,type PlanMember } from './plans/model'
import { type Incident, type Report, type Safety, safetyText, timeLabel } from './dashboard'
import { LayoutDashboard, Wifi, WifiOff, AlertTriangle, ArrowUpRight, BellRing, Bell } from 'lucide-react'

type Member=PlanMember
type Plan={leaderId:string;meeting:string;address:string;backup:string;offline:string;members:Member[];revision:number}
type Reminder={id:string;from:string;to:string;revision:number;createdAt:string;completedAt?:string}
export type Saved={plan:Plan;confirmed:Record<string,number>;phase:'ready'|'moving'|'arrived';identity:string;incident?:Incident;reports?:Record<string,Report>;reminders?:Reminder[];reviewedAt?:Record<string,string>}
const initial:Saved={plan:{leaderId:'me',meeting:'서울숲 (예시)',address:'지도에 표시한 예시 만남 위치',backup:'동네 도서관 앞',offline:'연락이 안 되면 첫 만남 장소로 가고, 접근할 수 없으면 대체 장소 확인',revision:1,members:[{id:'me',name:'나',place:'회사',action:'회사에서 약속 장소로 이동한다',need:'걸어서 이동할 수 있는 경로 확인'},{id:'mom',name:'엄마',place:'집',action:'집에서 기다린다',need:'계단 이동이 어려울 때 도움 요청'},{id:'bro',name:'동생',place:'학교',action:'',need:'학교의 인솔 안내를 먼저 확인'}]},confirmed:{},phase:'ready',identity:'me'}
const storageKey='moida-plan-v2'
function restore():Saved {try{const x=JSON.parse(localStorage.getItem(storageKey)||'null');if(x&&x.plan&&Array.isArray(x.plan.members)&&x.plan.members.length&&typeof x.plan.meeting==='string'&&x.confirmed&&x.plan.members.some((m:Member)=>m.id===x.identity)){if(!x.plan.members.some((m:Member)=>m.id===x.plan.leaderId))x.plan.leaderId=x.plan.members[0].id;return x}}catch{}return initial}
function Choice({value,onChange,options,label}:{value:string;onChange:(v:string)=>void;options:{value:string;label:string}[];label:string}){return <RadioGroup value={value} onValueChange={onChange} aria-label={label}>{options.map((o,i)=><label key={o.value} className="choice"><RadioGroupItem value={o.value} id={`${label}-${i}`}/><span>{o.label}</span></label>)}</RadioGroup>}
function Panel({children,className=''}:{children:React.ReactNode;className?:string}){return <Card size={className.includes('dashboard-member')?'sm':'default'} className={className}><CardContent>{children}</CardContent></Card>}
export default function App({bootstrap,groupId,groupName,onPersist,onInvite,groupControls}:{bootstrap?:Saved;groupId?:string;groupName?:string;onPersist?:(data:Saved)=>void;onInvite?:()=>void;groupControls?:React.ReactNode}={}){
 const [data,setData]=useState<Saved>(()=>bootstrap||restore())
 const lastPersisted=useRef(JSON.stringify(bootstrap||data))
 useEffect(()=>{if(bootstrap){lastPersisted.current=JSON.stringify(bootstrap);setData(bootstrap)}},[bootstrap?.plan,bootstrap?.confirmed,bootstrap?.reports,bootstrap?.reminders])
 const [screen,setScreen]=useState('dashboard')
 const [draft,setDraft]=useState<Plan>(data.plan)
 const [dirty,setDirty]=useState(false)
 const [dark,setDark]=useState(()=>localStorage.getItem('moida-theme')==='dark')
 const [about,setAbout]=useState(false)
 const [quizPerson,setQuizPerson]=useState(data.identity)
 const [answer,setAnswer]=useState('')
 const [understood,setUnderstood]=useState(false)
 const [quizError,setQuizError]=useState('')
 const [error,setError]=useState('')
 const [online,setOnline]=useState(navigator.onLine)
 const [plansMember,setPlansMember]=useState(data.identity)
 const [memberEdit,setMemberEdit]=useState<string|null>(null)
 const [actionDraft,setActionDraft]=useState('')
 const [actionError,setActionError]=useState('')
 const [remindTo,setRemindTo]=useState<string|null>(null)
 const [activeReminder,setActiveReminder]=useState<string|null>(null)
 const previous=useRef(screen)
 const plan=data.plan
 const me=plan.members.find(m=>m.id===data.identity)!
 const isLeader=isGroupLeader(plan,me.id)
 const entered=plan.members.filter(m=>m.action?.trim()).length
 const incident=data.incident?.active===true
 const reports=data.reports||{}
 const myReport=reports[me.id]
 const safeCount=plan.members.filter(m=>reports[m.id]?.safety==='safe').length
 const readCount=plan.members.filter(m=>reports[m.id]?.checkedRevision===plan.revision).length
 useEffect(()=>{const on=()=>setOnline(true),off=()=>setOnline(false);window.addEventListener('online',on);window.addEventListener('offline',off);return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off)}},[])
 const reminders=(data.reminders||[]).filter(r=>plan.members.some(m=>m.id===r.from)&&plan.members.some(m=>m.id===r.to))
 const inbox=reminders.filter(r=>r.to===me.id&&r.revision===plan.revision&&!r.completedAt)
 const sent=reminders.filter(r=>r.from===me.id&&r.revision===plan.revision)
 const confirmed=plan.members.filter(m=>data.confirmed[m.id]===plan.revision).length
 useEffect(()=>{try{localStorage.setItem(groupId?'moida-group-'+groupId:storageKey,JSON.stringify(data));if(JSON.stringify(data)!==lastPersisted.current){lastPersisted.current=JSON.stringify(data);onPersist?.(data)}}catch{setError('저장 공간을 사용할 수 없어요. 이 창을 닫으면 계획이 사라질 수 있어요.')}},[data])
 useEffect(()=>{document.documentElement.classList.toggle('dark',dark);try{localStorage.setItem('moida-theme',dark?'dark':'light')}catch{}},[dark])
 useEffect(()=>{if(previous.current!==screen){document.querySelector('[data-slot=mobile-app-content]')?.scrollTo({top:0});previous.current=screen}},[screen])
 const update=(patch:Partial<Saved>)=>setData(x=>({...x,...patch}))
 const go=(v:string)=>{setScreen(v);setError('')}
 const edit=()=>{if(!isLeader)return;if(!dirty)setDraft(structuredClone(plan));go('edit')}
 const verify=(id:string,reminderId?:string)=>{if(id!==me.id)return;const person=plan.members.find(m=>m.id===id);if(!person?.action?.trim()){setMemberEdit(id);setActionDraft('');setActionError('행동 계획을 먼저 입력해 주세요.');return}setActiveReminder(reminderId||null);setQuizPerson(id);setAnswer('');setUnderstood(false);setQuizError('');go('quiz')}
 const leaveReminder=()=>{if(!isLeader||!remindTo)return;setData(x=>{if(!isGroupLeader(x.plan,x.identity)||remindTo===x.identity||!x.plan.members.some(m=>m.id===remindTo&&m.action?.trim())||(x.reminders||[]).some(r=>r.from===x.identity&&r.to===remindTo&&r.revision===x.plan.revision&&!r.completedAt))return x;return {...x,reminders:[...(x.reminders||[]),{id:crypto.randomUUID(),from:x.identity,to:remindTo,revision:x.plan.revision,createdAt:new Date().toISOString()}]}});setRemindTo(null);go('people')}
 const save=()=>{if(!isLeader)return;if(!draft.members.some(m=>m.id===draft.leaderId)){setError('그룹 대표를 지정해 주세요.');return;}if(!draft.meeting.trim()||!draft.backup.trim()||!draft.offline.trim()||draft.members.some(m=>!m.name.trim()||!m.place.trim())){setError('만남 장소, 대체 장소, 연락 두절 약속과 구성원 이름·평소 장소를 입력해 주세요.');return}if(draft.meeting.trim()===draft.backup.trim()){setError('첫 만남 장소와 대체 장소는 다르게 정해 주세요.');return}setData(x=>({...x,identity:draft.members.some(m=>m.id===x.identity)?x.identity:draft.members[0].id,plan:{...draft,members:draft.members.map(m=>({...m,plans:m.plans?.map((p,i)=>i===0?{...p,action:m.action||''}:p)})),revision:x.plan.revision+1},confirmed:{},phase:'ready'}));setDirty(false);go('plan')}
 const quizMember=plan.members.find(m=>m.id===quizPerson)
 const expectedAction=quizMember?.action?.trim()||plan.meeting
 const quiz=()=>{if(quizPerson!==me.id)return;if(answer!==expectedAction){setQuizError('정해 둔 행동과 달라요. 내 계획을 다시 확인하고 골라주세요.');return}if(!understood){setQuizError('연락이 안 될 때의 약속도 확인해 주세요.');return}setData(x=>({...x,confirmed:{...x.confirmed,[quizPerson]:plan.revision},reviewedAt:{...x.reviewedAt,[quizPerson]:new Date().toISOString()},reminders:(x.reminders||[]).map(r=>r.to===quizPerson&&r.revision===plan.revision&&!r.completedAt?{...r,completedAt:new Date().toISOString()}:r)}));go('verified')}
 const startIncident=()=>{update({incident:{id:crypto.randomUUID(),active:true,startedAt:new Date().toISOString()},reports:{}});go('dashboard')}
 const setSafety=(safety:Safety)=>setData(x=>({...x,reports:{...x.reports,[x.identity]:{...x.reports?.[x.identity],safety,safetyAt:new Date().toISOString()}}}))
 const checkIncidentPlan=()=>setData(x=>({...x,reports:{...x.reports,[x.identity]:{safety:'unknown',...x.reports?.[x.identity],checkedRevision:x.plan.revision,checkedAt:new Date().toISOString()}}}))
 const saveAction=()=>{if(!memberEdit||!canEditMember(plan,me.id,memberEdit))return;if(!actionDraft.trim()){setActionError('내가 할 행동을 한 줄로 입력해 주세요.');return}setData(x=>({...x,plan:{...x.plan,revision:x.plan.revision+1,members:x.plan.members.map(m=>m.id===memberEdit?{...m,action:actionDraft.trim(),plans:m.plans?.map((p,i)=>i===0?{...p,action:actionDraft.trim()}:p)}:m)},confirmed:{}}));setMemberEdit(null)}
 const openPlans=(id:string)=>{setPlansMember(id);go('personal')}
 const savePersonal=(id:string,plans:PersonalPlan[])=>{if(!canEditMember(plan,me.id,id))return;setData(x=>({...x,plan:{...x.plan,revision:x.plan.revision+1,members:x.plan.members.map(m=>m.id===id?{...m,plans,action:plans[0].action}:m)},confirmed:{}}));setDirty(false)}
 const title=screen==='personal'?'3단계 행동 계획':screen==='dashboard'?'모이다':screen==='map'?'만남 장소 지도':screen==='now'?'지금 할 일':screen==='plan'?'우리 가족 약속':screen==='people'?'서로 리마인드':screen==='edit'?'약속 수정':screen==='quiz'?'서로 이해 확인':screen==='verified'?'확인 결과':'리마인드'
 const detail=['edit','quiz','verified','map','now','personal'].includes(screen)
 const back=()=>go(screen==='edit'?'plan':screen==='quiz'||screen==='verified'?'people':'dashboard')
 const nav={items:[{value:'dashboard',label:'홈',icon:<LayoutDashboard/>},{value:'plan',label:'우리 약속',icon:<ClipboardList/>},{value:'people',label:'리마인드',icon:<BellRing/>}],value:screen,onValueChange:go,'aria-label':'주요 메뉴'}
 let bottom:React.ReactNode
 if(screen==='edit')bottom=<Button className="w-full" onClick={save}>약속 저장하기</Button>
 if(screen==='quiz')bottom=<Button className="w-full" disabled={!answer} onClick={quiz}>내 답 확인하기</Button>
 if(screen==='verified')bottom=<Button className="w-full" onClick={()=>go('people')}>리마인드 현황 보기<ArrowRight/></Button>
 return <MobileAppShell title={title} leading={detail?<MobileToolbarButton aria-label="뒤로" onClick={back}><ArrowLeft/></MobileToolbarButton>:<MobileToolbarButton aria-label="서비스 안내" onClick={()=>setAbout(true)}><Info/></MobileToolbarButton>} trailing={<MobileToolbarButton aria-label={dark?'밝은 화면으로':'어두운 화면으로'} onClick={()=>setDark(!dark)}>{dark?<Sun/>:<Moon/>}</MobileToolbarButton>} navigation={!detail?nav:undefined} bottomAction={bottom}>
 <div className="screen" key={screen}>
 {error&&<div role="alert" className="error">{error}</div>}
 {screen==='dashboard'&&<>
  {groupControls}
  <div className="section-top"><span className="context">{online?<Wifi size={18}/>:<WifiOff size={18}/>} {online?'인터넷 연결됨':'오프라인'}</span><Button variant={incident?'destructive':'secondary'} onClick={()=>incident?update({incident:{...data.incident!,active:false}}):startIncident()}>{incident?'상황 확인 종료':'재난 상황 확인'}</Button></div>
  <MobileScreenHeading>{incident?<>서로의 안전을<br/>확인해요.</>:<>계획을 세우고,<br/>서로 기억해요.</>}</MobileScreenHeading>
  {incident?<Panel className="incident-panel"><div className="icon-label"><AlertTriangle/><h2>재난 상황 확인 중</h2></div><p>{timeLabel(data.incident?.startedAt)} 시작 · 자동 재난 감지 아님</p><div className="dash-counts"><div><strong>{safeCount}<span> / {plan.members.length}</span></strong><p>안전 확인</p></div><div><strong>{readCount}<span> / {plan.members.length}</span></strong><p>현재 계획 확인</p></div></div></Panel>:<Panel className="plan-readiness"><div className="section-top"><h2>행동 계획</h2><strong className="primary-text">{entered} / {plan.members.length}명 입력</strong></div><Progress value={entered/plan.members.length*100} aria-label="행동 계획 입력률"/><div className="section-top"><span>현재 약속 다시 확인</span><strong>{confirmed} / {plan.members.length}명</strong></div></Panel>}
  {incident&&<Panel><div className="section-top"><h2>{me.name}의 상태 기록</h2><span className="muted">이 기기</span></div><div className="status-actions"><Button variant={myReport?.safety==='safe'?'secondary':'outline'} aria-pressed={myReport?.safety==='safe'} onClick={()=>setSafety('safe')}><CircleCheck/>안전해요</Button><Button variant="destructive" aria-pressed={myReport?.safety==='help'} onClick={()=>setSafety('help')}><AlertTriangle/>도움이 필요해요</Button></div><Button variant="ghost" className="w-full" onClick={()=>go('now')}>내 행동 계획 열고 확인<ArrowRight/></Button></Panel>}
  {!incident&&<div className="reminder-inline"><span className="icon-label"><Bell size={18}/>리마인드 {inbox.length}건</span><Button variant="ghost" onClick={()=>go('people')}>{inbox.length?'확인하기':'보기'}<ArrowRight/></Button></div>}
  <p className="local-record">{groupId?'그룹에 계획과 확인 상태를 공유해요. 외부 알림은 전송되지 않아요.':'기기 내 체험 · 실제 알림은 전송되지 않아요.'}</p>
  <div className="section-top"><h2>{groupName||'가족 · 친구'} {plan.members.length}명</h2>{onInvite?(isLeader&&<Button variant="secondary" onClick={onInvite} disabled={plan.members.length>=6}><Users/>멤버 초대</Button>):<Button variant="ghost" onClick={()=>go('people')}>역할 바꾸기<ArrowRight/></Button>}</div>
  <div className="compact-members">{plan.members.map((m,i)=>{const report=reports[m.id];const ps=plansFor(m,plan.meeting);const ready=ps.filter(planReady).length;const checked=data.confirmed[m.id]===plan.revision;return <button key={m.id} className="compact-member" onClick={()=>openPlans(m.id)} aria-label={`${m.name} 3단계 계획 열기`}><span className={`avatar a${i}`}>{m.name.slice(0,1)}</span><span className="compact-info"><span className="compact-name"><strong>{m.name}</strong>{m.id===plan.leaderId&&<Badge variant="tag" className="member-status-label leader-label">대표</Badge>}<span className="muted">{m.place}</span></span><span className="compact-brief">{m.action||'메인계획 입력 전'}</span><span className="compact-meta"><span>{ready}/3 계획 준비</span><Badge variant={m.action?.trim()?'secondary':'outline'} className={`member-status-label ${m.action?.trim()?'is-complete':'is-pending'}`}>{m.action?.trim()?'입력 완료':'입력 전'}</Badge><Badge variant={checked?'secondary':'outline'} className={`member-status-label ${checked?'is-complete':'is-pending'}`}>{checked?'확인 완료':'확인 전'}</Badge>{incident&&<Badge variant={report?.safety==='help'?'destructive':'outline'} className="member-status-label">{safetyText[report?.safety||'unknown']}</Badge>}</span></span></button>})}</div>
  <Button variant="secondary" className="w-full" onClick={()=>openPlans(me.id)}>계획과 경로를 확인하기<ArrowRight/></Button>
  <Panel className="meeting-preview"><div className="section-top"><div><p className="muted">첫 만남 장소</p><h2>{plan.meeting}</h2></div><MapPin className="primary-text"/></div><OfflineMap meeting={plan.meeting} compact/><Button variant="secondary" className="w-full" onClick={()=>go('map')}>지도 · 오프라인 저장<ArrowUpRight/></Button></Panel>

 </>}
 {screen==='personal'&&<PlansScreen key={plansMember} members={plan.members} memberId={plansMember} actorId={me.id} leaderId={plan.leaderId} meeting={plan.meeting} revision={plan.revision} storageKey={groupId?'moida-group-'+groupId:storageKey} onSave={savePersonal}/>}
 {screen==='map'&&<><MobileScreenHeading>만남 장소 지도</MobileScreenHeading><OfflineMap meeting={plan.meeting} onUseExample={isLeader?()=>{setData(x=>({...x,plan:{...x.plan,meeting:'서울숲 (예시)',address:'지도에 표시한 예시 만남 위치',revision:x.plan.revision+1},confirmed:{},phase:'ready'}));setDirty(false)}:undefined}/><div className="notice"><Info/><p>저장한 범위와 위치만 볼 수 있으며 경로 안내·위험 정보는 제공하지 않습니다. 실제 재난에서는 공식 안내를 우선하세요.</p></div></>}
 {screen==='now'&&<>
  <div className="section-top"><span className="context"><span className="live-dot"/>{incident?'내 행동 계획':'지진 대비 연습'}</span><Button variant="ghost" onClick={()=>setAbout(true)} aria-label="체험 안내">체험 안내</Button></div>
  <MobileScreenHeading>{me.name}의 행동 계획</MobileScreenHeading><Panel><h2>{me.action||'아직 행동 계획이 없어요'}</h2>{!me.action&&<Button variant="secondary" onClick={()=>{setMemberEdit(me.id);setActionDraft('');setActionError('')}}>행동 계획 입력</Button>}</Panel>{incident&&<Panel><h2>현재 계획 확인</h2><p>계획 {plan.revision}판 · {me.action||'행동 계획을 먼저 입력해 주세요.'}</p><Button className="w-full" disabled={!me.action?.trim()} onClick={checkIncidentPlan}>{myReport?.checkedRevision===plan.revision?'현재 계획 확인함':'계획 확인했어요'}</Button></Panel>}
  <div className="identity"><span className="avatar primary-avatar">{me.name.slice(0,1)}</span><div><strong>{me.name}의 행동 계획</strong><div className="muted">{me.place}에 있을 때</div></div><Button variant="ghost" className="ml-auto" onClick={()=>go('people')}>바꾸기</Button></div>
  <Panel><OfflineMap meeting={plan.meeting} compact/><Button variant="secondary" className="w-full" onClick={()=>go('map')}>만남 장소 지도 열기</Button></Panel>
  {!incident&&<Button className="w-full" onClick={()=>verify(me.id)}>내 약속 다시 확인하기<CheckCheck/></Button>}
  <div className="steps"><h2>내가 기억할 두 가지</h2><div className="step"><span className="step-number">1</span><div><strong>내 상황에 맞게 이동 준비</strong><p>{me.need||'내가 필요한 도움을 미리 정하기'}</p></div></div><div className="step"><span className="step-number">2</span><div><strong>연락이 안 될 때</strong><p>{plan.offline}</p></div></div></div>
  <div className="notice"><ShieldCheck/><p>실제 재난에서는 현장과 관계 기관의 대피 안내를 우선하세요. 이 장소는 안전성이 검증된 대피소가 아닌 예시입니다.</p></div>

 </>}
 {screen==='plan'&&<>
  <MobileScreenHeading>우리의 약속</MobileScreenHeading><div className="section-top"><span className="muted">지진 · 계획 {plan.revision}판</span>{isLeader?<Button variant="secondary" onClick={edit}><Pencil/>수정</Button>:<Badge variant="outline">공통 약속 · 읽기 전용</Badge>}</div>
  <Panel><div className="place-row"><span className="square-icon"><MapPin/></span><div><p className="muted">첫 만남 장소</p><h2>{plan.meeting}</h2><p>{plan.address}</p></div></div><div className="divider"/><div className="icon-label"><Flag className="text-icon"/><strong>갈 수 없을 때</strong></div><p>{plan.backup}</p></Panel>
  <Panel><div className="icon-label"><PhoneOff className="text-icon"/><h2>연락이 끊기면</h2></div><p>{plan.offline}</p></Panel>
  <Button className="w-full" onClick={()=>openPlans(me.id)}>3단계 계획 · 경로 · PDF<ArrowRight/></Button><h2>각자의 상황</h2>{plan.members.map((m,i)=><Panel key={m.id}><div className="member-row"><span className={`avatar a${i}`}>{m.name.slice(0,1)}</span><strong>{m.name}</strong><span className="ml-auto muted">{m.place}</span></div><p>{m.action||'행동 계획 입력 전'}</p><p className="muted">{m.need||'필요한 도움을 함께 정해 주세요.'}</p></Panel>)}
  <div className="notice"><Info/><p>장소와 행동은 가족이 직접 정한 약속입니다. 실제 대피소와 이동 가능 여부를 별도로 확인하세요.</p></div>
  <Button className="w-full" onClick={()=>go('people')}>서로 같은 뜻으로 이해했나요?<ArrowRight/></Button>
 </>}
 {screen==='people'&&<>
  <MobileScreenHeading>떨어져 있어도,<br/>서로의 계획을 기억해요.</MobileScreenHeading>
  <div className="identity"><span className="avatar primary-avatar">{me.name.slice(0,1)}</span><div><strong>{me.name} · {isLeader?'대표':'멤버'}{!groupId&&' 역할로 체험 중'}</strong><p className="muted">실제 메시지는 전송되지 않아요.</p></div></div>
  <h2>받은 리마인드 {inbox.length}건</h2>
  {inbox.length?inbox.map(r=><Panel key={r.id}><div className="icon-label"><BellRing/><strong>{plan.members.find(m=>m.id===r.from)?.name} → {me.name}</strong></div><p>{me.action||'행동 계획 입력 전'}</p><p className="muted">{timeLabel(r.createdAt)} · 계획 {r.revision}판</p><Button className="w-full" onClick={()=>verify(me.id,r.id)}>내 약속 다시 확인하기</Button></Panel>):<Panel><p>지금 확인할 요청이 없어요.</p><Button variant="secondary" disabled={!me.action?.trim()} onClick={()=>verify(me.id)}>내 약속 먼저 확인하기</Button></Panel>}
  <h2>{isLeader?'가족 · 친구에게 리마인드':'가족 · 친구의 계획'}</h2>{!isLeader&&<p className="muted">리마인드는 대표만 보낼 수 있어요. 다른 멤버의 계획은 보기만 할 수 있어요.</p>}
  {plan.members.map((m,i)=><Panel key={m.id}><div className="member-row"><span className={`avatar a${i}`}>{m.name.slice(0,1)}</span><div><strong>{m.name}</strong><p className="muted">{m.place}</p></div>{data.confirmed[m.id]===plan.revision?<span className="confirmed ml-auto"><CircleCheck/>확인</span>:<span className="ml-auto muted">확인 전</span>}</div><p>{m.action||'행동 계획 입력 전'}</p><div className="member-actions">{m.id===me.id?<Button variant="secondary" onClick={()=>verify(m.id)}>{m.action?.trim()?'내 약속 다시 확인':'행동 계획 작성'}</Button>:<>{isLeader&&<Button variant="secondary" disabled={!m.action?.trim()||reminders.some(r=>r.from===me.id&&r.to===m.id&&r.revision===plan.revision&&!r.completedAt)} onClick={()=>setRemindTo(m.id)}><Bell/>리마인드 남기기</Button>}<Button variant="outline" onClick={()=>openPlans(m.id)}>계획 보기</Button>{!groupId&&<Button variant="ghost" onClick={()=>{update({identity:m.id});setActiveReminder(null)}}>{m.name} 역할로 전환</Button>}</>}</div></Panel>)}
  {sent.length>0&&<><h2>내가 남긴 리마인드</h2>{sent.map(r=><Panel key={r.id}><div className="section-top"><strong>{plan.members.find(m=>m.id===r.to)?.name}</strong><span className={r.completedAt?'confirmed':'muted'}>{r.completedAt?'다시 확인함':'확인 기다리는 중'}</span></div><p>{timeLabel(r.completedAt||r.createdAt)}</p></Panel>)}</>}
  {reminders.some(r=>r.revision!==plan.revision)&&<p className="muted">변경 전 계획의 리마인드는 현재 확인 현황에서 제외됩니다.</p>}
  {isLeader&&<Button variant="outline" className="w-full" onClick={edit}><Users/>구성원과 상황 수정</Button>}
 </>}
 {screen==='edit'&&isLeader&&<>
  <MobileScreenHeading>함께 지킬 약속을<br/>정해 주세요.</MobileScreenHeading>
  <form onSubmit={e=>{e.preventDefault();save()}} className="edit-form">
  <label>첫 만남 장소<Input value={draft.meeting} maxLength={60} onChange={e=>{setDirty(true);setDraft({...draft,meeting:e.target.value})}}/></label>
  <label>정확히 만날 위치<Input value={draft.address} maxLength={100} onChange={e=>{setDirty(true);setDraft({...draft,address:e.target.value})}} placeholder="출입구나 눈에 띄는 표식"/></label>
  <label>첫 장소에 갈 수 없을 때<Input value={draft.backup} maxLength={60} onChange={e=>{setDirty(true);setDraft({...draft,backup:e.target.value})}}/></label>
  <label>연락이 안 될 때의 약속<Input value={draft.offline} maxLength={150} onChange={e=>{setDirty(true);setDraft({...draft,offline:e.target.value})}}/></label>
  <label>그룹 대표<select className="leader-select" value={draft.leaderId} onChange={e=>{setDirty(true);setDraft({...draft,leaderId:e.target.value})}}>{draft.members.map(m=><option key={m.id} value={m.id}>{m.name||'이름 입력 전'}</option>)}</select></label><p className="muted">대표는 모든 계획과 공통 약속을 수정하고 리마인드를 보낼 수 있어요. 대표 변경은 저장 후 적용됩니다.</p><h2>구성원과 평소 상황</h2>
  {draft.members.map((m,i)=><Panel key={m.id}><label>이름<Input aria-label={`구성원 ${i+1} 이름`} maxLength={20} value={m.name} onChange={e=>{setDirty(true);setDraft({...draft,members:draft.members.map(n=>n.id===m.id?{...n,name:e.target.value}:n)})}}/></label><label>한 줄 행동 계획<Input aria-label={`구성원 ${i+1} 행동 계획`} maxLength={100} placeholder="예: 집에서 기다린다" value={m.action||''} onChange={e=>{setDirty(true);setDraft({...draft,members:draft.members.map(n=>n.id===m.id?{...n,action:e.target.value}:n)})}}/></label><label>평소 장소<Input aria-label={`구성원 ${i+1} 평소 장소`} maxLength={40} value={m.place} onChange={e=>{setDirty(true);setDraft({...draft,members:draft.members.map(n=>n.id===m.id?{...n,place:e.target.value}:n)})}}/></label><label>이동할 때 필요한 준비·도움<Input aria-label={`구성원 ${i+1} 필요한 도움`} maxLength={120} value={m.need} onChange={e=>{setDirty(true);setDraft({...draft,members:draft.members.map(n=>n.id===m.id?{...n,need:e.target.value}:n)})}}/></label>{draft.members.length>1&&<Button variant="destructive" onClick={()=>{setDirty(true);setDraft({...draft,members:draft.members.filter(n=>n.id!==m.id)})}} disabled={m.id===draft.leaderId}>구성원 삭제</Button>}</Panel>)}
  {onInvite?<Button variant="outline" type="button" onClick={onInvite}><Users/>초대 링크로 멤버 추가</Button>:null}
  <div className="notice"><Info/><p>약속을 저장하면 이전 이해 확인이 초기화됩니다. 구성원 모두 새 계획을 다시 확인해야 합니다.</p></div>
  </form>
 </>}
 {screen==='quiz'&&<>
  <div className="context"><Users size={18}/>{plan.members.find(m=>m.id===quizPerson)?.name} 역할로 확인</div>
  <MobileScreenHeading>재난이 나면,<br/>나는 무엇을 할까요?</MobileScreenHeading>
  <Choice label="내 행동 선택" value={answer} onChange={v=>{setAnswer(v);setQuizError('')}} options={[{value:'__other__',label:'정한 계획과 관계없이 이동한다'},{value:expectedAction,label:expectedAction},{value:'__contact__',label:'연락이 올 때까지 계획을 확인하지 않는다'}]}/>
  <Panel><div className="icon-label"><PhoneOff className="text-icon"/><h2>연락 두절 약속</h2></div><p>{plan.offline}</p><label className="check-label"><Checkbox checked={understood} onCheckedChange={v=>setUnderstood(v===true)}/><span>이 약속을 이해했어요</span></label></Panel>
  {quizError&&<p className="error" role="alert">{quizError}</p>}
  <Button variant="ghost" onClick={()=>go('plan')}>계획 다시 보기</Button>
 </>}
 {screen==='verified'&&<>
  <div className="result-icon"><CheckCheck/></div><MobileScreenHeading>내 약속을,<br/>다시 기억했어요.</MobileScreenHeading>
  <Panel><h2>{expectedAction}</h2><p>만남 장소: {plan.meeting}</p><p>{plan.offline}</p></Panel>
  <Panel><div className="section-top"><h2>함께 확인한 사람</h2><strong>{confirmed} / {plan.members.length}명</strong></div><Progress value={confirmed/plan.members.length*100} aria-label="함께 확인한 비율"/><div className="face-stack">{plan.members.map((m,i)=><span key={m.id} className={`avatar a${i} ${data.confirmed[m.id]===plan.revision?'':'unconfirmed'}`} title={m.name}>{m.name.slice(0,1)}</span>)}</div></Panel>
  <Panel><div className="icon-label"><BellRing/><h2>리마인드 확인</h2></div><p>{activeReminder?'이 계획에 대한 다시 확인 요청을 완료했어요.':isLeader?'가족·친구에게도 각자의 계획을 다시 확인해 달라고 남겨 보세요.':'내 계획의 확인 상태가 기록됐어요. 대표가 이 결과를 볼 수 있어요.'}</p></Panel>
 </>}
 </div>
 <Sheet open={remindTo!==null} onOpenChange={open=>{if(!open)setRemindTo(null)}}><SheetContent side="bottom"><SheetHeader><SheetTitle>{plan.members.find(m=>m.id===remindTo)?.name}에게 리마인드</SheetTitle><SheetDescription className="text-base">현재 행동과 만남 장소를 다시 기억해 달라는 요청을 남깁니다. 이 기기에서만 기록되며 실제 알림은 전송되지 않아요.</SheetDescription></SheetHeader><div className="sheet-body"><Panel><h2>{plan.members.find(m=>m.id===remindTo)?.action}</h2><p>만남 장소: {plan.meeting}</p><p>연락 두절 약속: {plan.offline}</p></Panel><Button className="w-full" onClick={leaveReminder}>리마인드 남기기</Button></div></SheetContent></Sheet>
 <Sheet open={memberEdit!==null} onOpenChange={open=>{if(!open)setMemberEdit(null)}}><SheetContent side="bottom"><SheetHeader><SheetTitle>{plan.members.find(m=>m.id===memberEdit)?.name}의 행동 계획</SheetTitle><SheetDescription className="text-base">어디에서 무엇을 할지 한 줄로 정해 주세요. 변경하면 구성원들의 이해 확인을 다시 받아야 합니다.</SheetDescription></SheetHeader><div className="sheet-body"><label className="edit-form">한 줄 행동<Input aria-label="한 줄 행동" placeholder="예: 집에서 기다린다" maxLength={100} value={actionDraft} onChange={e=>{setActionDraft(e.target.value);setActionError('')}}/></label>{actionError&&<p role="alert" className="error">{actionError}</p>}<Button className="w-full" onClick={saveAction}>행동 계획 저장</Button></div></SheetContent></Sheet>
 <Sheet open={about} onOpenChange={setAbout}><SheetContent side="bottom"><SheetHeader><SheetTitle>가족 · 친구 재난 약속 체험</SheetTitle><SheetDescription className="text-base">가상 가족의 예시 계획으로 시작합니다. 이름과 장소를 바꾸고, 계획을 작성하고 리마인드를 남긴 뒤, 받는 사람의 역할로 전환해 다시 확인해 보세요.</SheetDescription></SheetHeader><div className="sheet-body"><p>계획과 기록은 이 브라우저에만 저장됩니다. 실제 초대·메시지·위치 공유·재난 알림은 제공하지 않습니다.</p><p>안전성이 검증된 대피소나 경로를 제공하지 않으므로 실제 재난에서는 공식 안내를 따르세요.</p><Button className="w-full" onClick={()=>setAbout(false)}>체험 계속하기</Button></div></SheetContent></Sheet>
 </MobileAppShell>
}
