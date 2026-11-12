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

type Member={id:string;name:string;place:string;need:string}
type Plan={meeting:string;address:string;backup:string;offline:string;members:Member[];revision:number}
type Saved={plan:Plan;confirmed:Record<string,number>;phase:'ready'|'moving'|'arrived';identity:string}
const initial:Saved={plan:{meeting:'중앙공원 정문',address:'큰 시계탑 아래',backup:'동네 도서관 앞',offline:'연락이 안 되면 첫 만남 장소로 가고, 접근할 수 없으면 대체 장소 확인',revision:1,members:[{id:'me',name:'나',place:'회사',need:'걸어서 이동할 수 있는 경로 확인'},{id:'mom',name:'엄마',place:'집',need:'계단 이동이 어려울 때 도움 요청'},{id:'bro',name:'동생',place:'학교',need:'학교의 인솔 안내를 먼저 확인'}]},confirmed:{},phase:'ready',identity:'me'}
const storageKey='moida-plan-v2'
function restore():Saved {try{const x=JSON.parse(localStorage.getItem(storageKey)||'null');if(x&&x.plan&&Array.isArray(x.plan.members)&&x.plan.members.length&&typeof x.plan.meeting==='string'&&x.confirmed&&x.plan.members.some((m:Member)=>m.id===x.identity))return x}catch{}return initial}
function Choice({value,onChange,options,label}:{value:string;onChange:(v:string)=>void;options:{value:string;label:string}[];label:string}){return <RadioGroup value={value} onValueChange={onChange} aria-label={label}>{options.map((o,i)=><label key={o.value} className="choice"><RadioGroupItem value={o.value} id={`${label}-${i}`}/><span>{o.label}</span></label>)}</RadioGroup>}
function Panel({children,className=''}:{children:React.ReactNode;className?:string}){return <Card className={className}><CardContent>{children}</CardContent></Card>}
export default function App(){
 const [data,setData]=useState<Saved>(restore)
 const [screen,setScreen]=useState('now')
 const [draft,setDraft]=useState<Plan>(data.plan)
 const [dirty,setDirty]=useState(false)
 const [dark,setDark]=useState(()=>localStorage.getItem('moida-theme')==='dark')
 const [about,setAbout]=useState(false)
 const [quizPerson,setQuizPerson]=useState(data.identity)
 const [answer,setAnswer]=useState('')
 const [understood,setUnderstood]=useState(false)
 const [quizError,setQuizError]=useState('')
 const [error,setError]=useState('')
 const previous=useRef(screen)
 const plan=data.plan
 const me=plan.members.find(m=>m.id===data.identity)!
 const confirmed=plan.members.filter(m=>data.confirmed[m.id]===plan.revision).length
 useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(data))}catch{setError('저장 공간을 사용할 수 없어요. 이 창을 닫으면 계획이 사라질 수 있어요.')}},[data])
 useEffect(()=>{document.documentElement.classList.toggle('dark',dark);try{localStorage.setItem('moida-theme',dark?'dark':'light')}catch{}},[dark])
 useEffect(()=>{if(previous.current!==screen){document.querySelector('[data-slot=mobile-app-content]')?.scrollTo({top:0});previous.current=screen}},[screen])
 const update=(patch:Partial<Saved>)=>setData(x=>({...x,...patch}))
 const go=(v:string)=>{setScreen(v);setError('')}
 const edit=()=>{if(!dirty)setDraft(structuredClone(plan));go('edit')}
 const verify=(id:string)=>{setQuizPerson(id);setAnswer('');setUnderstood(false);setQuizError('');go('quiz')}
 const save=()=>{if(!draft.meeting.trim()||!draft.backup.trim()||!draft.offline.trim()||draft.members.some(m=>!m.name.trim()||!m.place.trim())){setError('만남 장소, 대체 장소, 연락 두절 약속과 구성원 이름·평소 장소를 입력해 주세요.');return}if(draft.meeting.trim()===draft.backup.trim()){setError('첫 만남 장소와 대체 장소는 다르게 정해 주세요.');return}setData(x=>({...x,identity:draft.members.some(m=>m.id===x.identity)?x.identity:draft.members[0].id,plan:{...draft,revision:x.plan.revision+1},confirmed:{},phase:'ready'}));setDirty(false);go('plan')}
 const quiz=()=>{if(answer!==plan.meeting){setQuizError('약속한 첫 만남 장소가 아니에요. 계획을 다시 확인하고 골라주세요.');return}if(!understood){setQuizError('연락이 안 될 때의 약속도 확인해 주세요.');return}setData(x=>({...x,confirmed:{...x.confirmed,[quizPerson]:plan.revision}}));go('verified')}
 const title=screen==='now'?'모이다':screen==='plan'?'우리 가족 약속':screen==='people'?'함께 확인':screen==='edit'?'약속 수정':screen==='quiz'?'서로 이해 확인':screen==='verified'?'확인 결과':'대피 연습'
 const detail=['edit','quiz','verified','moving','arrived'].includes(screen)
 const back=()=>go(screen==='edit'?'plan':screen==='quiz'||screen==='verified'?'people':'now')
 const nav={items:[{value:'now',label:'지금 할 일',icon:<ShieldCheck/>},{value:'plan',label:'우리 약속',icon:<ClipboardList/>},{value:'people',label:'함께 확인',icon:<Users/>}],value:screen,onValueChange:go,'aria-label':'주요 메뉴'}
 let bottom:React.ReactNode
 if(screen==='edit')bottom=<Button className="w-full" onClick={save}>약속 저장하기</Button>
 if(screen==='quiz')bottom=<Button className="w-full" disabled={!answer} onClick={quiz}>내 답 확인하기</Button>
 if(screen==='moving')bottom=<Button className="w-full" onClick={()=>{update({phase:'arrived'});go('arrived')}}><Flag/>약속 장소에 도착 표시</Button>
 if(screen==='arrived')bottom=<Button className="w-full" onClick={()=>go('people')}>가족의 계획 확인하기<ArrowRight/></Button>
 if(screen==='verified')bottom=<Button className="w-full" onClick={()=>go('people')}>구성원 확인 현황 보기<ArrowRight/></Button>
 return <MobileAppShell title={title} leading={detail?<MobileToolbarButton aria-label="뒤로" onClick={back}><ArrowLeft/></MobileToolbarButton>:<MobileToolbarButton aria-label="서비스 안내" onClick={()=>setAbout(true)}><Info/></MobileToolbarButton>} trailing={<MobileToolbarButton aria-label={dark?'밝은 화면으로':'어두운 화면으로'} onClick={()=>setDark(!dark)}>{dark?<Sun/>:<Moon/>}</MobileToolbarButton>} navigation={!detail?nav:undefined} bottomAction={bottom}>
 <div className="screen" key={screen}>
 {error&&<div role="alert" className="error">{error}</div>}
 {screen==='now'&&<>
  <div className="section-top"><span className="context"><span className="live-dot"/>지진 대비 연습</span><Button variant="ghost" onClick={()=>setAbout(true)} aria-label="체험 안내">체험 안내</Button></div>
  <MobileScreenHeading>떨어져 있어도,<br/>같은 약속대로.</MobileScreenHeading>
  <div className="identity"><span className="avatar primary-avatar">{me.name.slice(0,1)}</span><div><strong>{me.name}의 행동 계획</strong><div className="muted">{me.place}에 있을 때</div></div><Button variant="ghost" className="ml-auto" onClick={()=>go('people')}>바꾸기</Button></div>
  <Panel className="destination"><div className="map-art" aria-hidden="true"><div className="park"><span>만남 장소</span><MapPin/><span>{plan.meeting}</span></div><div className="map-road horizontal"/><div className="map-road vertical"/><div className="map-house"><Building2/></div><div className="map-home"><Home/></div><div className="map-route"/><div className="map-dot"/></div><div className="destination-body"><h2>{plan.meeting}</h2><p>{plan.address}</p><Button className="w-full" onClick={()=>{update({phase:'moving'});go('moving')}}><Footprints/>약속대로 움직여 보기</Button></div></Panel>
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
  {draft.members.map((m,i)=><Panel key={m.id}><label>이름<Input aria-label={`구성원 ${i+1} 이름`} maxLength={20} value={m.name} onChange={e=>{setDirty(true);setDraft({...draft,members:draft.members.map(n=>n.id===m.id?{...n,name:e.target.value}:n)})}}/></label><label>평소 장소<Input aria-label={`구성원 ${i+1} 평소 장소`} maxLength={40} value={m.place} onChange={e=>{setDirty(true);setDraft({...draft,members:draft.members.map(n=>n.id===m.id?{...n,place:e.target.value}:n)})}}/></label><label>이동할 때 필요한 준비·도움<Input aria-label={`구성원 ${i+1} 필요한 도움`} maxLength={120} value={m.need} onChange={e=>{setDirty(true);setDraft({...draft,members:draft.members.map(n=>n.id===m.id?{...n,need:e.target.value}:n)})}}/></label>{draft.members.length>1&&<Button variant="destructive" onClick={()=>{setDirty(true);setDraft({...draft,members:draft.members.filter(n=>n.id!==m.id)})}}>구성원 삭제</Button>}</Panel>)}
  <Button variant="outline" disabled={draft.members.length>=6} type="button" onClick={()=>{setDirty(true);setDraft({...draft,members:[...draft.members,{id:crypto.randomUUID(),name:'',place:'',need:''}]})}}>구성원 추가</Button>
  <div className="notice"><Info/><p>약속을 저장하면 이전 이해 확인이 초기화됩니다. 구성원 모두 새 계획을 다시 확인해야 합니다.</p></div>
  </form>
 </>}
 {screen==='quiz'&&<>
  <div className="context"><Users size={18}/>{plan.members.find(m=>m.id===quizPerson)?.name} 역할로 확인</div>
  <MobileScreenHeading>연락이 안 된다면,<br/>어디에서 만날까요?</MobileScreenHeading>
  <Choice label="첫 만남 장소 선택" value={answer} onChange={v=>{setAnswer(v);setQuizError('')}} options={[{value:plan.backup,label:plan.backup+' (대체 장소)'},{value:plan.meeting,label:plan.meeting},{value:'__home__',label:'각자 집으로 돌아가기'}]}/>
  <Panel><div className="icon-label"><PhoneOff className="text-icon"/><h2>연락 두절 약속</h2></div><p>{plan.offline}</p><label className="check-label"><Checkbox checked={understood} onCheckedChange={v=>setUnderstood(v===true)}/><span>이 약속을 이해했어요</span></label></Panel>
  {quizError&&<p className="error" role="alert">{quizError}</p>}
  <Button variant="ghost" onClick={()=>go('plan')}>계획 다시 보기</Button>
 </>}
 {screen==='verified'&&<>
  <div className="result-icon"><CheckCheck/></div><MobileScreenHeading>같은 장소,<br/>같은 행동을 기억해요.</MobileScreenHeading>
  <Panel><div className="icon-label"><MapPin className="text-icon"/><h2>{plan.meeting}</h2></div><p>{plan.offline}</p></Panel>
  <Panel><div className="section-top"><h2>함께 확인한 사람</h2><strong>{confirmed} / {plan.members.length}명</strong></div><Progress value={confirmed/plan.members.length*100} aria-label="함께 확인한 비율"/><div className="face-stack">{plan.members.map((m,i)=><span key={m.id} className={`avatar a${i} ${data.confirmed[m.id]===plan.revision?'':'unconfirmed'}`} title={m.name}>{m.name.slice(0,1)}</span>)}</div></Panel>
  <Button variant="secondary" onClick={()=>{update({identity:quizPerson,phase:'moving'});go('moving')}}>이 역할로 대피 연습하기<Footprints/></Button>
 </>}
 {screen==='moving'&&<>
  <div className="context"><Footprints size={18}/>지진 대비 연습 · {me.name}</div><MobileScreenHeading>내가 갈 곳은<br/>{plan.meeting}.</MobileScreenHeading>
  <Panel className="route-summary"><span className="square-icon"><Navigation/></span><p className="muted">출발 상황</p><h2>{me.place}</h2><div className="route-line"><span/><span/><span/></div><p className="muted">약속 장소</p><h2>{plan.meeting}</h2><p>{plan.address}</p></Panel>
  <Panel><h2>이동 전 확인</h2><p>{me.need||'내 상황에서 필요한 도움을 확인하세요.'}</p><div className="divider"/><p>이동 가능 여부는 현장과 관계 기관 안내로 판단하세요. 이 화면은 실제 경로나 안전 여부를 안내하지 않습니다.</p></Panel>
  <Panel><div className="icon-label"><PhoneOff className="text-icon"/><strong>연락이 안 되면</strong></div><p>{plan.offline}</p></Panel>
 </>}
 {screen==='arrived'&&<>
  <div className="result-icon"><Flag/></div><div className="context">{me.name}의 연습 결과</div><MobileScreenHeading>망설이지 않고,<br/>약속한 곳으로.</MobileScreenHeading>
  <Panel><div className="icon-label"><CircleCheck className="primary-text"/><h2>{plan.meeting}</h2></div><p>{plan.address}</p><div className="divider"/><p>다음 행동: {plan.offline}</p></Panel>
  <h2>가족은 어떻게 움직일까요?</h2>{plan.members.filter(m=>m.id!==me.id).map((m,i)=><Panel key={m.id}><div className="member-row"><span className={`avatar a${i+1}`}>{m.name.slice(0,1)}</span><div><strong>{m.name}</strong><p>{m.place} → {plan.meeting}</p></div></div><p className="muted">{data.confirmed[m.id]===plan.revision?'이 계획을 이해했어요':'아직 이해 확인 전이에요'}</p></Panel>)}
  <p className="muted">연습 기록이며 실제 위치나 가족의 도착 상태가 아닙니다.</p><Button variant="ghost" onClick={()=>{update({phase:'ready'});go('now')}}><RotateCcw/>다시 연습하기</Button>
 </>}
 </div>
 <Sheet open={about} onOpenChange={setAbout}><SheetContent side="bottom"><SheetHeader><SheetTitle>가족 재난 약속 체험</SheetTitle><SheetDescription className="text-base">가상 가족의 예시 계획으로 시작합니다. 이름과 장소를 바꾸고, 각자의 역할로 이해 확인과 대피 연습을 해보세요.</SheetDescription></SheetHeader><div className="sheet-body"><p>계획과 기록은 이 브라우저에만 저장됩니다. 실제 초대·메시지·위치 공유·재난 알림은 제공하지 않습니다.</p><p>안전성이 검증된 대피소나 경로를 제공하지 않으므로 실제 재난에서는 공식 안내를 따르세요.</p><Button className="w-full" onClick={()=>setAbout(false)}>체험 계속하기</Button></div></SheetContent></Sheet>
 </MobileAppShell>
}
