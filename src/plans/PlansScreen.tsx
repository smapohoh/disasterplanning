import { useEffect, useState } from 'react'
import { ArrowLeft, Download, MapPin, Route as RouteIcon, Save, FileDown, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RadioGroup,RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { levels,plansFor,planReady,readMap,type PlanMember,type PersonalPlan,type MapData,type Coord } from './model'
import { buildRoute } from './route-engine'
import { MapDrawing } from './RouteMap'
import { exportPlansPdf } from './pdf'
import { canEditMember } from '../permissions'
import { saveOfflineBundle } from './offline'
function Box({children}:{children:React.ReactNode}){return <Card size="sm"><CardContent>{children}</CardContent></Card>}
export function PlansScreen({members,memberId,actorId,leaderId,meeting,revision,storageKey='moida-plan-v2',onSave}:{members:PlanMember[];memberId:string;actorId:string;leaderId:string;meeting:string;revision:number;storageKey?:string;onSave:(id:string,p:PersonalPlan[])=>void}){
 const [who,setWho]=useState(memberId),[level,setLevel]=useState(0),[draft,setDraft]=useState<PersonalPlan[]>(()=>plansFor(members.find(m=>m.id===memberId)!,meeting)),[map,setMap]=useState<MapData|null>(null),[pick,setPick]=useState<'origin'|'destination'>('origin'),[error,setError]=useState(''),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false),[notice,setNotice]=useState(''),[pack,setPack]=useState<number|null>(()=>{try{return JSON.parse(localStorage.getItem(storageKey+'-route-pack')||'null')?.revision||null}catch{return null}})
 const editable=canEditMember({leaderId,members},actorId,who)
 const member=members.find(m=>m.id===who)!,p=draft[level]
 useEffect(()=>{readMap().then(setMap).catch(e=>setError(e.message))},[])
 function patch(v:Partial<PersonalPlan>){if(!editable)return;setDraft(ps=>ps.map((x,i)=>i===level?{...x,...v}:x));setDirty(true);setNotice('');setError('')}
 function select(id:string){if(dirty){setError('작성 중인 계획을 먼저 저장해 주세요.');return}setWho(id);setDraft(plansFor(members.find(m=>m.id===id)!,meeting));setLevel(0);setNotice('');setError('')}
 function point(c:Coord){patch({[pick]:c,route:undefined,directions:'',reviewed:false});if(pick==='origin')setPick('destination')}
 function generate(){if(!editable)return;if(!map||!p.origin||!p.destination){setError('지도에서 출발지와 도착지를 먼저 지정해 주세요.');return}try{const route=buildRoute(map,p.origin,p.destination,p.avoidStairs);patch({route,directions:route.steps.join('\n'),reviewed:false})}catch(e){setError(e instanceof Error?e.message:'경로를 만들지 못했어요.')}}
 function save(){if(!editable)return;if(!draft[0].action.trim()){setLevel(0);setError('메인계획의 행동을 입력해 주세요.');return}for(const [i,x]of draft.entries()){if(x.action.trim()&&!x.when.trim()){setLevel(i);setError('이 계획으로 전환하는 조건을 입력해 주세요.');return}}onSave(who,structuredClone(draft));setDirty(false);setNotice('현재 기기에 저장된 계획입니다.');setError('')}
 async function offline(){if(dirty){setError('수정한 계획부터 저장해 주세요.');return}setBusy(true);setError('');try{await saveOfflineBundle(revision,storageKey);setPack(revision)}catch(e){setError(e instanceof Error?e.message:'저장하지 못했어요.')}finally{setBusy(false)}}
 async function pdf(all=false){if(dirty){setError('수정한 계획을 먼저 저장해 주세요.');return}if(!map)return;setBusy(true);setError('');try{const ms=all?members:[member];await exportPlansPdf(ms,ms.map(m=>plansFor(m,meeting)),map,revision)}catch{setError('PDF를 만들지 못했어요. 저장 공간을 확인하고 다시 시도해 주세요.')}finally{setBusy(false)}}
 return <div className="personal-plans">
 <div className="plan-member-select"><label htmlFor="plan-member">계획 대상</label><select id="plan-member" value={who} onChange={e=>select(e.target.value)}>{members.map(m=><option key={m.id} value={m.id}>{m.name} · {m.place}</option>)}</select></div>
 <RadioGroup value={String(level)} onValueChange={v=>{setLevel(Number(v));setError('');setNotice('')}} aria-label="계획 우선순위" className="plan-levels">{levels.map((label,i)=><label key={label} className={level===i?'active':''}><RadioGroupItem value={String(i)}/><span>{label}</span></label>)}</RadioGroup>
 <p className="muted">{editable?'수정 가능 · '+(actorId===leaderId?'그룹 대표':'내 계획'):'읽기 전용 · 이 계획은 본인과 대표만 수정할 수 있어요.'}</p><fieldset className="plan-edit-fields" disabled={!editable}>
 <Box><div className="section-top"><h2>{member.name}의 {levels[level]}</h2><span className="muted">{draft.filter(planReady).length}/3 준비</span></div><div className="edit-form plan-fields">
 <label>이 계획을 사용할 때<Input value={p.when} maxLength={180} onChange={e=>patch({when:e.target.value})}/></label>
 <label>내가 할 행동<Input value={p.action} maxLength={120} placeholder="예: 공원 정문에서 가족을 기다린다" onChange={e=>patch({action:e.target.value})}/></label>
 <RadioGroup value={p.mode} onValueChange={v=>patch({mode:v as 'move'|'stay'})} aria-label="계획 이동 방식" className="move-choice"><label><RadioGroupItem value="move"/>장소로 이동</label><label><RadioGroupItem value="stay"/>현재 장소에 대기</label></RadioGroup>
 </div></Box>
 {p.mode==='move'&&<>
 <Box><div className="edit-form"><label>A 출발지 이름<Input value={p.originLabel} maxLength={80} onChange={e=>patch({originLabel:e.target.value})}/></label><label>B 만날 장소 이름<Input value={p.destinationLabel} maxLength={80} onChange={e=>patch({destinationLabel:e.target.value})}/></label></div></Box>
 <h2>출발부터 만남까지</h2><p className="muted">서울숲 예시 지도 약 600m 범위입니다. 이름만 입력하면 위치가 정해지지 않으므로 지도 위의 길을 눌러 A와 B를 지정하세요.</p>
 <div className="point-actions"><Button variant={pick==='origin'?'secondary':'outline'} aria-pressed={pick==='origin'} onClick={()=>setPick('origin')}><MapPin/>A 출발지 지정</Button><Button variant={pick==='destination'?'secondary':'outline'} aria-pressed={pick==='destination'} onClick={()=>setPick('destination')}><MapPin/>B 만남 위치 지정</Button></div>
 {map&&<MapDrawing map={map} plan={p} onPick={editable?point:undefined}/>}
 <a className="map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors · ODbL</a>
 <details><summary>좌표로 지점 지정</summary><div className="coordinate-fields">{(['origin','destination'] as const).map((key,i)=><fieldset key={key}><legend>{i?'B 만남 위치':'A 출발지'}</legend><label>경도<Input type="number" step="0.00001" value={p[key]?.[0]??''} onChange={e=>patch({[key]:[Number(e.target.value),p[key]?.[1]||map?.center[1]||37.5444],route:undefined,directions:'',reviewed:false})}/></label><label>위도<Input type="number" step="0.00001" value={p[key]?.[1]??''} onChange={e=>patch({[key]:[p[key]?.[0]||map?.center[0]||127.0417,Number(e.target.value)],route:undefined,directions:'',reviewed:false})}/></label></fieldset>)}</div></details>
 <label className="check-label"><Checkbox checked={p.avoidStairs} onCheckedChange={v=>patch({avoidStairs:v===true,route:undefined,directions:'',reviewed:false})}/><span>계단을 제외한 길 찾기</span></label>
 <Button variant="secondary" disabled={!map||!p.origin||!p.destination} onClick={generate}><RouteIcon/>저장 도로망에서 경로 만들기</Button>
 {p.route&&<p className="primary-text">약 {Math.round(p.route.distanceM)}m · {p.route.steps.length}단계 안내</p>}
 </>}
 <Box><h2>지도 없이 보는 상세 안내</h2><p className="muted">{p.mode==='move'?'자동 안내를 검토하고, 횡단 위치·건물 출입구·눈에 띄는 표식을 직접 보완하세요.':'대기할 위치, 연락 방법, 이 장소를 떠나야 하는 조건을 적어 주세요.'}</p><textarea className="plan-textarea" aria-label="상세 글 안내" rows={9} maxLength={8000} value={p.directions} onChange={e=>patch({directions:e.target.value})} placeholder={p.mode==='stay'?'1. 집 안의 미리 정한 위치에서 대기\n2. 상황이 달라지면 차선책 확인':'경로를 만들면 방향과 거리가 표시됩니다. 직접 확인한 표식을 추가할 수 있어요.'}/><label className="check-label"><Checkbox checked={p.reviewed} onCheckedChange={v=>patch({reviewed:v===true})}/><span>이 계획과 이동 구간을 직접 확인했어요</span></label></Box>
 <div className="notice"><AlertTriangle/><p>저장 도로망의 거리 기준 참고 경로입니다. 재난 시 통행 가능·안전·계단 외 장애물은 판단하지 못하며, 현장 확인과 공식 안내가 우선입니다.</p></div>
 </fieldset>
 {notice&&<p role="status" className="primary-text">{notice}</p>}
 {error&&<p role="alert" className="error">{error}</p>}
 {editable&&<Button className="w-full" onClick={save}><Save/>{dirty?'3단계 계획 저장':'계획 저장'}</Button>}
 <Button variant="secondary" disabled={busy||dirty||!map} onClick={offline}><Download/>{busy?'파일 준비 중…':pack===revision?'현재 계획·지도·경로 저장됨':'지도·경로·계획 오프라인 저장'}</Button>
 <div className="export-actions"><Button variant="outline" disabled={busy||!map||dirty} onClick={()=>pdf()}><FileDown/>{busy?'PDF 생성 중…':`${member.name} 계획 PDF`}</Button><Button variant="outline" disabled={busy||!map||dirty} onClick={()=>pdf(true)}><Download/>전체 계획 PDF</Button></div>
 <p className="muted">저장한 세 계획·경로선·글 안내가 PDF에 포함됩니다. 실제 장소로 가는 경로는 해당 지역 지도 데이터가 있어야 만들 수 있어요.</p>
 </div>
}
