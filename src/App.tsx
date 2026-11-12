import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, MapPin, ShieldCheck, Users, Check, CheckCheck, ClipboardList, Footprints, PhoneOff, Sun, Moon, Pencil, Flag, CircleCheck, Info, Home, Building2, GraduationCap, Navigation, RotateCcw } from 'lucide-react'
import { MobileAppShell, MobileScreenHeading, MobileToolbarButton } from '@/components/ui/mobile-app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import './foundations.css'
import './app.css'
import { OfflineMap } from './OfflineMap'
import { type Incident, type Report, type Safety, safetyText, timeLabel } from './dashboard'
import { LayoutDashboard, Wifi, WifiOff, AlertTriangle, ArrowUpRight } from 'lucide-react'

type Member={id:string;name:string;place:string;need:string;action?:string}
type Plan={meeting:string;address:string;backup:string;offline:string;members:Member[];revision:number}
type Saved={plan:Plan;confirmed:Record<string,number>;phase:'ready'|'moving'|'arrived';identity:string;incident?:Incident;reports?:Record<string,Report>}
const initial:Saved={plan:{meeting:'서울숲 (예시)',address:'지도에 표시한 예시 만남 위치',backup:'동네 도서관 앞',offline:'연락이 안 되면 첫 만남 장소로 가고, 접근할 수 없으면 대체 장소 확인',revision:1,members:[{id:'me',name:'나',place:'회사',action:'회사에서 약속 장소로 이동한다',need:'걸어서 이동할 수 있는 경로 확인'},{id:'mom',name:'엄마',place:'집',action:'집에서 기다린다',need:'계단 이동이 어려울 때 도움 요청'},{id:'bro',name:'동생',place:'학교',action:'',need:'학교의 인솔 안내를 먼저 확인'}]},confirmed:{},phase:'ready',identity:'me'}
const storageKey='moida-plan-v2'
function restore():Saved {try{const x=JSON.parse(localStorage.getItem(storageKey)||'null');if(x&&x.plan&&Array.isArray(x.plan.members)&&x.plan.members.length&&typeof x.plan.meeting==='string'&&x.confirmed&&x.plan.members.some((m:Member)=>m.id===x.identity))return x}catch{}return initial}
function Choice({value,onChange,options,label}:{value:string;onChange:(v:string)=>void;options:{value:string;label:string}[];label:string}){return <RadioGroup value={value} onValueChange={onChange} aria-label={label}>{options.map((o,i)=><label key={o.value} className="choice"><RadioGroupItem value={o.value} id={`${label}-${i}`}/><span>{o.label}</span></label>)}</RadioGroup>}
function Panel({children,className=''}:{children:React.ReactNode;className?:string}){return <Card size={className.includes('dashboard-member')?'sm':'default'} className={className}><CardContent>{children}</CardContent></Card>}
export default function App(){
 const [data,setData]=useState<Saved>(restore)
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
 const [memberEdit,setMemberEdit]=useState<string|null>(null)
 const [actionDraft,setActionDraft]=useState('')
 const [actionError,setActionError]=useState('')
 const previous=useRef(screen)
 const plan=data.plan
 const me=plan.members.find(m=>m.id===data.identity)!
 const entered=plan.members.filter(m=>m.action?.trim()).length
 const incident=data.incident?.active===true
 const reports=data.reports||{}
 const myReport=reports[me.id]
 const safeCount=plan.members.filter(m=>reports[m.id]?.safety==='safe').length
 const readCount=plan.members.filter(m=>reports[m.id]?.checkedRevision===plan.revision).length
 useEffect(()=>{const on=()=>setOnline(true),off=()=>setOnline(false);window.addEventListener('online',on);window.addEventListener('offline',off);return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off)}},[])
 const confirmed=plan.members.filter(m=>data.confirmed[m.id]===plan.revision).length
 useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(data))}catch{setError('저장 공간을 사용할 수 없어요. 이 창을 닫으면 계획이 사라질 수 있어요.')}},[data])
 useEffect(()=>{document.documentElement.classList.toggle('dark',dark);try{localStorage.setItem('moida-theme',dark?'dark':'light')}catch{}},[dark])
 useEffect(()=>{if(previous.current!==screen){document.querySelector('[data-slot=mobile-app-content]')?.scrollTo({top:0});previous.current=screen}},[screen])
 const update=(patch:Partial<Saved>)=>setData(x=>({...x,...patch}))
 const go=(v:string)=>{setScreen(v);setError('')}
 const edit=()=>{if(!dirty)setDraft(structuredClone(plan));go('edit')}
 const verify=(id:string)=>{setQuizPerson(id);setAnswer('');setUnderstood(false);setQuizError('');go('quiz')}
 const save=()=>{if(!draft.meeting.trim()||!draft.backup.trim()||!draft.offline.trim()||draft.members.some(m=>!m.name.trim()||!m.place.trim())){setError('만남 장소, 대체 장소, 연락 두절 약속과 구성원 이름·평소 장소를 입력해 주세요.');return}if(draft.meeting.trim()===draft.backup.trim()){setError('첫 만남 장소와 대체 장소는 다르게 정해 주세요.');return}setData(x=>({...x,identity:draft.members.some(m=>m.id===x.identity)?x.identity:draft.members[0].id,plan:{...draft,revision:x.plan.revision+1},confirmed:{},phase:'ready'}));setDirty(false);go('plan')}
 const quizMember=plan.members.find(m=>m.id===quizPerson)
 const expectedAction=quizMember?.action?.trim()||plan.meeting
 const quiz=()=>{if(answer!==expectedAction){setQuizError('정해 둔 행동과 달라요. 내 계획을 다시 확인하고 골라주세요.');return}if(!understood){setQuizError('연락이 안 될 때의 약속도 확인해 주세요.');return}setData(x=>({...x,confirmed:{...x.confirmed,[quizPerson]:plan.revision}}));go('verified')}
 const startIncident=()=>{update({incident:{id:crypto.randomUUID(),active:true,startedAt:new Date().toISOString()},reports:{}});go('dashboard')}
 const setSafety=(safety:Safety)=>setData(x=>({...x,reports:{...x.reports,[x.identity]:{...x.reports?.[x.identity],safety,safetyAt:new Date().toISOString()}}}))
 const checkIncidentPlan=()=>setData(x=>({...x,reports:{...x.reports,[x.identity]:{safety:'unknown',...x.reports?.[x.identity],checkedRevision:x.plan.revision,checkedAt:new Date().toISOString()}}}))
 const saveAction=()=>{if(!actionDraft.trim()){setActionError('내가 할 행동을 한 줄로 입력해 주세요.');return}setData(x=>({...x,plan:{...x.plan,revision:x.plan.revision+1,members:x.plan.members.map(m=>m.id===memberEdit?{...m,action:actionDraft.trim()}:m)},confirmed:{}}));setMemberEdit(null)}
 const title=screen==='dashboard'?'모이다':screen==='map'?'만남 장소 지도':screen==='now'?'지금 할 일':screen==='plan'?'우리 가족 약속':screen==='people'?'함께 확인':screen==='edit'?'약속 수정':screen==='quiz'?'서로 이해 확인':screen==='verified'?'확인 결과':'대피 연습'
 const detail=['edit','quiz','verified','moving','arrived','map','now'].includes(screen)
 const back=()=>go(screen==='edit'?'plan':screen==='quiz'||screen==='verified'?'people':'dashboard')
 const nav={items:[{value:'dashboard',label:'홈',icon:<LayoutDashboard/>},{value:'plan',label:'우리 약속',icon:<ClipboardList/>},{value:'people',label:'함께 확인',icon:<Users/>}],value:screen,onValueChange:go,'aria-label':'주요 메뉴'}
 let bottom:React.ReactNode
 if(screen==='edit')bottom=<Button className="w-full" onClick={save}>약속 저장하기</Button>
 if(screen==='quiz')bottom=<Button className="w-full" disabled={!answer} onClick={quiz}>내 답 확인하기</Button>
 if(screen==='moving')bottom=<Button className="w-full" onClick={()=>{update({phase:'arrived'});go('arrived')}}><Flag/>정한 행동을 마쳤어요</Button>
 if(screen==='arrived')bottom=<Button className="w-full" onClick={()=>go('people')}>가족의 계획 확인하기<ArrowRight/></Button>
 if(screen==='verified')bottom=<Button className="w-full" onClick={()=>go('people')}>구성원 확인 현황 보기<ArrowRight/></Button>
 return <MobileAppShell title={title} leading={detail?<MobileToolbarButton aria-label="뒤로" onClick={back}><ArrowLeft/></MobileToolbarButton>:<MobileToolbarButton aria-label="서비스 안내" onClick={()=>setAbout(true)}><Info/></MobileToolbarButton>} trailing={<MobileToolbarButton aria-label={dark?'밝은 화면으로':'어두운 화면으로'} onClick={()=>setDark(!dark)}>{dark?<Sun/>:<Moon/>}</MobileToolbarButton>} navigation={!detail?nav:undefined} bottomAction={bottom}>
 <div className="screen" key={screen}>
 {error&&<div role="alert" className="error">{error}</div>}
 {screen==='dashboard'&&<>
  <div className="section-top"><span className="context">{online?<Wifi size={18}/>:<WifiOff size={18}/>} {online?'인터넷 연결됨':'오프라인'}</span><Button variant={incident?'destructive':'secondary'} onClick={()=>incident?update({incident:{...data.incident!,active:false}}):startIncident()}>{incident?'상황 확인 종료':'재난 상황 확인'}</Button></div>
  <MobileScreenHeading>{incident?<>서로의 안전을<br/>확인해요.</>:<>우리의 준비,<br/>한눈에.</>}</MobileScreenHeading>
  {incident?<Panel className="incident-panel"><div className="icon-label"><AlertTriangle/><h2>재난 상황 확인 중</h2></div><p>{timeLabel(data.incident?.startedAt)} 시작 · 자동 재난 감지 아님</p><div className="dash-counts"><div><strong>{safeCount}<span> / {plan.members.length}</span></strong><p>안전 확인</p></div><div><strong>{readCount}<span> / {plan.members.length}</span></strong><p>현재 계획 확인</p></div></div></Panel>:<Panel><div className="section-top"><h2>행동 계획</h2><strong className="primary-text">{entered} / {plan.members.length}명 입력</strong></div><Progress value={entered/plan.members.length*100} aria-label="행동 계획 입력률"/><p>{entered===plan.members.length?'모든 구성원의 행동을 아래에서 확인하세요.':'아직 계획이 없는 구성원과 행동을 정해 주세요.'}</p></Panel>}
  {incident&&<Panel><div className="section-top"><h2>{me.name}의 상태 기록</h2><span className="muted">이 기기</span></div><div className="status-actions"><Button variant={myReport?.safety==='safe'?'secondary':'outline'} aria-pressed={myReport?.safety==='safe'} onClick={()=>setSafety('safe')}><CircleCheck/>안전해요</Button><Button variant="destructive" aria-pressed={myReport?.safety==='help'} onClick={()=>setSafety('help')}><AlertTriangle/>도움이 필요해요</Button></div><Button variant="ghost" className="w-full" onClick={()=>go('now')}>내 행동 계획 열고 확인<ArrowRight/></Button></Panel>}
  <p className="local-record">이 기기 기록 · 다른 기기와 공유되지 않아요.</p>
  <div className="section-top"><h2>가족 · 친구 {plan.members.length}명</h2><Button variant="ghost" onClick={()=>go('people')}>역할 바꾸기<ArrowRight/></Button></div>
  {plan.members.map((m,i)=>{const report=reports[m.id];const hasPlan=!!m.action?.trim();const read=report?.checkedRevision===plan.revision;return <Panel key={m.id} className="dashboard-member"><div className="member-row"><span className={`avatar a${i}`}>{m.name.slice(0,1)}</span><strong>{m.name}{m.id===me.id&&m.name!=='나'?' · 나':''}</strong><span className="ml-auto muted">{m.place}</span><Button variant="ghost" size="icon" aria-label={`${m.name} 행동 계획 ${hasPlan?'수정':'입력'}`} onClick={()=>{setMemberEdit(m.id);setActionDraft(m.action||'');setActionError('')}}><Pencil/></Button></div><p className={hasPlan?'briefing':'muted'}>{hasPlan?m.action:'아직 행동 계획을 입력하지 않았어요.'}</p>{incident&&<><div className="status-pair"><span className={'status '+(report?.safety||'unknown')}>{report?.safety==='safe'?<CircleCheck/>:report?.safety==='help'?<AlertTriangle/>:<Info/>}{safetyText[report?.safety||'unknown']}</span><span className={'status '+(read?'read':'unknown')}><ClipboardList/>{read?'현재 계획 확인':'계획 미확인'}</span></div><p className="muted">안전 기록: {timeLabel(report?.safetyAt)}</p>{report?.checkedAt&&<p className="muted">계획 확인: {timeLabel(report.checkedAt)}{!read?' · 이전 계획':''}</p>}</>}</Panel>})}
  <Panel className="meeting-preview"><div className="section-top"><div><p className="muted">첫 만남 장소</p><h2>{plan.meeting}</h2></div><MapPin className="primary-text"/></div><OfflineMap meeting={plan.meeting} compact/><Button variant="secondary" className="w-full" onClick={()=>go('map')}>지도 · 오프라인 저장<ArrowUpRight/></Button></Panel>
  {!incident&&<Button className="w-full" onClick={()=>go('now')}>내 행동 계획으로 연습하기<Footprints/></Button>}
 </>}
 {screen==='map'&&<><MobileScreenHeading>만남 장소 지도</MobileScreenHeading><OfflineMap meeting={plan.meeting} onUseExample={()=>{setData(x=>({...x,plan:{...x.plan,meeting:'서울숲 (예시)',address:'지도에 표시한 예시 만남 위치',revision:x.plan.revision+1},confirmed:{},phase:'ready'}));setDirty(false)}}/><div className="notice"><Info/><p>저장한 범위와 위치만 볼 수 있으며 경로 안내·위험 정보는 제공하지 않습니다. 실제 재난에서는 공식 안내를 우선하세요.</p></div></>}
 {screen==='now'&&<>
  <div className="section-top"><span className="context"><span className="live-dot"/>{incident?'내 행동 계획':'지진 대비 연습'}</span><Button variant="ghost" onClick={()=>setAbout(true)} aria-label="체험 안내">체험 안내</Button></div>
  <MobileScreenHeading>{me.name}의 행동 계획</MobileScreenHeading><Panel><h2>{me.action||'아직 행동 계획이 없어요'}</h2>{!me.action&&<Button variant="secondary" onClick={()=>{setMemberEdit(me.id);setActionDraft('');setActionError('')}}>행동 계획 입력</Button>}</Panel>{incident&&<Panel><h2>현재 계획 확인</h2><p>계획 {plan.revision}판 · {me.action||'행동 계획을 먼저 입력해 주세요.'}</p><Button className="w-full" disabled={!me.action?.trim()} onClick={checkIncidentPlan}>{myReport?.checkedRevision===plan.revision?'현재 계획 확인함':'계획 확인했어요'}</Button></Panel>}
  <div className="identity"><span className="avatar primary-avatar">{me.name.slice(0,1)}</span><div><strong>{me.name}의 행동 계획</strong><div className="muted">{me.place}에 있을 때</div></div><Button variant="ghost" className="ml-auto" onClick={()=>go('people')}>바꾸기</Button></div>
  <Panel><OfflineMap meeting={plan.meeting} compact/><Button variant="secondary" className="w-full" onClick={()=>go('map')}>만남 장소 지도 열기</Button></Panel>
  {!incident&&<Button className="w-full" onClick={()=>{update({phase:'moving'});go('moving')}}><Footprints/>약속대로 움직여 보기</Button>}
  <div className="steps"><h2>내가 기억할 두 가지</h2><div className="step"><span className="step-number">1</span><div><strong>내 상황에 맞게 이동 준비</strong><p>{me.need||'내가 필요한 도움을 미리 정하기'}</p></div></div><div className="step"><span className="step-number">2</span><div><strong>연락이 안 될 때</strong><p>{plan.offline}</p></div></div></div>
  <div className="notice"><ShieldCheck/><p>실제 재난에서는 현장과 관계 기관의 대피 안내를 우선하세요. 이 장소는 안전성이 검증된 대피소가 아닌 예시입니다.</p></div>
  {data.phase==='arrived'&&<Button variant="ghost" className="w-full" onClick={()=>go('arrived')}>지난 연습 결과 보기</Button>}
 </>}
 {screen==='plan'&&<>
  <MobileScreenHeading>우리의 약속</MobileScreenHeading><div className="section-top"><span className="muted">지진 · 계획 {plan.revision}판</span><Button variant="secondary" onClick={edit}><Pencil/>수정</Button></div>
  <Panel><div className="place-row"><span className="square-icon"><MapPin/></span><div><p className="muted">첫 만남 장소</p><h2>{plan.meeting}</h2><p>{plan.address}</p></div></div><div className="divider"/><div className="icon-label"><Flag className="text-icon"/><strong>갈 수 없을 때</strong></div><p>{plan.backup}</p></Panel>
  <Panel><div className="icon-label"><PhoneOff className="text-icon"/><h2>연락이 끊기면</h2></div><p>{plan.offline}</p></Panel>
  <h2>각자의 상황</h2>{plan.members.map((m,i)=><Panel key={m.id}><div className="member-row"><span className={`avatar a${i}`}>{m.name.slice(0,1)}</span><strong>{m.name}</strong><span className="ml-auto muted">{m.place}</span></div><p>{m.need||'필요한 도움을 함께 정해 주세요.'}</p></Panel>)}
  <div className="notice"><Info/><p>장소와 행동은 가족이 직접 정한 약속입니다. 실제 대피소와 이동 가능 여부를 별도로 확인하세요.</p></div>
  <Button className="w-full" onClick={()=>go('people')}>서로 같은 뜻으로 이해했나요?<ArrowRight/></Button>
 </>}
 {screen==='people'&&<>
  <MobileScreenHeading>같이 정하고,<br/>같이 기억해요.</MobileScreenHeading>
  <p className="muted">이 기기에서 역할을 바꾸며 체험합니다. 실제 초대나 가족에게 전송되는 기능은 없습니다.</p>
  <Panel className="readiness"><div className="section-top"><h2>이해 확인</h2><strong className="primary-text">{confirmed} / {plan.members.length}명</strong></div><Progress value={confirmed/plan.members.length*100} aria-label="가족 이해 확인율"/><p>{confirmed===plan.members.length?'모두 같은 만남 장소와 연락 두절 약속을 확인했어요.':'각자 약속을 기억하는지 직접 답해 보세요.'}</p></Panel>
  {plan.members.map((m,i)=><Panel key={m.id}><div className="member-row"><span className={`avatar a${i}`}>{m.name.slice(0,1)}</span><div><strong>{m.name}</strong><p className="muted">{m.place}</p></div>{data.confirmed[m.id]===plan.revision?<span className="confirmed ml-auto"><CircleCheck/>확인</span>:<span className="ml-auto muted">확인 전</span>}</div><div className="member-actions"><Button variant="secondary" onClick={()=>verify(m.id)}>{m.name} 역할로 답하기</Button>{data.identity!==m.id&&<Button variant="ghost" onClick={()=>update({identity:m.id})}>내 역할로 선택</Button>}</div></Panel>)}
  <Button variant="outline" className="w-full" onClick={edit}><Users/>구성원과 상황 수정</Button>
 </>}
 {screen==='edit'&&<>
  <MobileScreenHeading>함께 지킬 약속을<br/>정해 주세요.</MobileScreenHeading>
  <form onSubmit={e=>{e.preventDefault();save()}} className="edit-form">
  <label>첫 만남 장소<Input value={draft.meeting} maxLength={60} onChange={e=>{setDirty(true);setDraft({...draft,meeting:e.target.value})}}/></label>
  <label>정확히 만날 위치<Input value={draft.address} maxLength={100} onChange={e=>{setDirty(true);setDraft({...draft,address:e.target.value})}} placeholder="출입구나 눈에 띄는 표식"/></label>
  <label>첫 장소에 갈 수 없을 때<Input value={draft.backup} maxLength={60} onChange={e=>{setDirty(true);setDraft({...draft,backup:e.target.value})}}/></label>
  <label>연락이 안 될 때의 약속<Input value={draft.offline} maxLength={150} onChange={e=>{setDirty(true);setDraft({...draft,offline:e.target.value})}}/></label>
  <h2>구성원과 평소 상황</h2>
  {draft.members.map((m,i)=><Panel key={m.id}><label>이름<Input aria-label={`구성원 ${i+1} 이름`} maxLength={20} value={m.name} onChange={e=>{setDirty(true);setDraft({...draft,members:draft.members.map(n=>n.id===m.id?{...n,name:e.target.value}:n)})}}/></label><label>한 줄 행동 계획<Input aria-label={`구성원 ${i+1} 행동 계획`} maxLength={100} placeholder="예: 집에서 기다린다" value={m.action||''} onChange={e=>{setDirty(true);setDraft({...draft,members:draft.members.map(n=>n.id===m.id?{...n,action:e.target.value}:n)})}}/></label><label>평소 장소<Input aria-label={`구성원 ${i+1} 평소 장소`} maxLength={40} value={m.place} onChange={e=>{setDirty(true);setDraft({...draft,members:draft.members.map(n=>n.id===m.id?{...n,place:e.target.value}:n)})}}/></label><label>이동할 때 필요한 준비·도움<Input aria-label={`구성원 ${i+1} 필요한 도움`} maxLength={120} value={m.need} onChange={e=>{setDirty(true);setDraft({...draft,members:draft.members.map(n=>n.id===m.id?{...n,need:e.target.value}:n)})}}/></label>{draft.members.length>1&&<Button variant="destructive" onClick={()=>{setDirty(true);setDraft({...draft,members:draft.members.filter(n=>n.id!==m.id)})}}>구성원 삭제</Button>}</Panel>)}
  <Button variant="outline" disabled={draft.members.length>=6} type="button" onClick={()=>{setDirty(true);setDraft({...draft,members:[...draft.members,{id:crypto.randomUUID(),name:'',place:'',need:''}]})}}>구성원 추가</Button>
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
  <div className="result-icon"><CheckCheck/></div><MobileScreenHeading>내 행동과,<br/>공통 약속을 기억해요.</MobileScreenHeading>
  <Panel><h2>{expectedAction}</h2><p>만남 장소: {plan.meeting}</p><p>{plan.offline}</p></Panel>
  <Panel><div className="section-top"><h2>함께 확인한 사람</h2><strong>{confirmed} / {plan.members.length}명</strong></div><Progress value={confirmed/plan.members.length*100} aria-label="함께 확인한 비율"/><div className="face-stack">{plan.members.map((m,i)=><span key={m.id} className={`avatar a${i} ${data.confirmed[m.id]===plan.revision?'':'unconfirmed'}`} title={m.name}>{m.name.slice(0,1)}</span>)}</div></Panel>
  <Button variant="secondary" onClick={()=>{update({identity:quizPerson,phase:'moving'});go('moving')}}>이 역할로 대피 연습하기<Footprints/></Button>
 </>}
 {screen==='moving'&&<>
  <div className="context"><Footprints size={18}/>지진 대비 연습 · {me.name}</div><MobileScreenHeading>내가 할 일은<br/>{me.action||plan.meeting}.</MobileScreenHeading>
  <Panel className="route-summary"><span className="square-icon"><Navigation/></span><p className="muted">{me.place}에 있을 때</p><h2>{me.action||'내 행동 계획을 먼저 정해 주세요'}</h2></Panel><Panel><OfflineMap meeting={plan.meeting} compact/><Button variant="secondary" className="w-full" onClick={()=>go('map')}>공통 만남 장소 지도</Button></Panel>
  <Panel><h2>이동 전 확인</h2><p>{me.need||'내 상황에서 필요한 도움을 확인하세요.'}</p><div className="divider"/><p>이동 가능 여부는 현장과 관계 기관 안내로 판단하세요. 이 화면은 실제 경로나 안전 여부를 안내하지 않습니다.</p></Panel>
  <Panel><div className="icon-label"><PhoneOff className="text-icon"/><strong>연락이 안 되면</strong></div><p>{plan.offline}</p></Panel>
 </>}
 {screen==='arrived'&&<>
  <div className="result-icon"><Flag/></div><div className="context">{me.name}의 연습 결과</div><MobileScreenHeading>약속대로,<br/>내 행동을 확인했어요.</MobileScreenHeading>
  <Panel><div className="icon-label"><CircleCheck className="primary-text"/><h2>{me.action||plan.meeting}</h2></div><p>공통 만남 장소: {plan.meeting}</p><div className="divider"/><p>연락이 안 될 때의 약속: {plan.offline}</p></Panel>
  <h2>가족은 어떻게 움직일까요?</h2>{plan.members.filter(m=>m.id!==me.id).map((m,i)=><Panel key={m.id}><div className="member-row"><span className={`avatar a${i+1}`}>{m.name.slice(0,1)}</span><div><strong>{m.name}</strong><p>{m.action||'행동 계획 입력 전'}</p></div></div><p className="muted">{data.confirmed[m.id]===plan.revision?'이 계획을 이해했어요':'아직 이해 확인 전이에요'}</p></Panel>)}
  <p className="muted">연습 기록이며 실제 위치나 가족의 도착 상태가 아닙니다.</p><Button variant="ghost" onClick={()=>{update({phase:'ready'});go('now')}}><RotateCcw/>다시 연습하기</Button>
 </>}
 </div>
 <Sheet open={memberEdit!==null} onOpenChange={open=>{if(!open)setMemberEdit(null)}}><SheetContent side="bottom"><SheetHeader><SheetTitle>{plan.members.find(m=>m.id===memberEdit)?.name}의 행동 계획</SheetTitle><SheetDescription className="text-base">어디에서 무엇을 할지 한 줄로 정해 주세요. 변경하면 구성원들의 이해 확인을 다시 받아야 합니다.</SheetDescription></SheetHeader><div className="sheet-body"><label className="edit-form">한 줄 행동<Input aria-label="한 줄 행동" placeholder="예: 집에서 기다린다" maxLength={100} value={actionDraft} onChange={e=>{setActionDraft(e.target.value);setActionError('')}}/></label>{actionError&&<p role="alert" className="error">{actionError}</p>}<Button className="w-full" onClick={saveAction}>행동 계획 저장</Button></div></SheetContent></Sheet>
 <Sheet open={about} onOpenChange={setAbout}><SheetContent side="bottom"><SheetHeader><SheetTitle>가족 · 친구 재난 약속 체험</SheetTitle><SheetDescription className="text-base">가상 가족의 예시 계획으로 시작합니다. 이름과 장소를 바꾸고, 각자의 역할로 이해 확인과 대피 연습을 해보세요.</SheetDescription></SheetHeader><div className="sheet-body"><p>계획과 기록은 이 브라우저에만 저장됩니다. 실제 초대·메시지·위치 공유·재난 알림은 제공하지 않습니다.</p><p>안전성이 검증된 대피소나 경로를 제공하지 않으므로 실제 재난에서는 공식 안내를 따르세요.</p><Button className="w-full" onClick={()=>setAbout(false)}>체험 계속하기</Button></div></SheetContent></Sheet>
 </MobileAppShell>
}
