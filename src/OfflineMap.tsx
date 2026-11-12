import { useEffect, useState } from 'react'
import { Download, MapPin, Minus, Plus, RotateCcw, WifiOff, CircleCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Feature={id:number;tags:Record<string,string>;coordinates:number[][]}
type MapData={name:string;bbox:number[];center:number[];source:string;sourceUrl:string;fetchedAt:string;features:Feature[]}
const file='/maps/seoul-forest.json'
const mapKey='moida-offline-map-v1'
function loadSaved(){try{const x=JSON.parse(localStorage.getItem(mapKey)||'null');return x?.features?.length?x as MapData:null}catch{return null}}
export function OfflineMap({meeting,compact=false,onUseExample}:{meeting:string;compact?:boolean;onUseExample?:()=>void}){
 const [map,setMap]=useState<MapData|null>(loadSaved)
 const [saved,setSaved]=useState(()=>!!loadSaved())
 const [zoom,setZoom]=useState(1)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [offline,setOffline]=useState(!navigator.onLine)
 const matched=meeting==='서울숲 (예시)'
 useEffect(()=>{if(!map)fetch(file).then(r=>{if(!r.ok)throw Error();return r.json()}).then(setMap).catch(()=>setError('지도를 불러오지 못했어요. 인터넷 연결 후 다시 열어 주세요.'))},[map])
 useEffect(()=>{const change=()=>setOffline(!navigator.onLine);addEventListener('online',change);addEventListener('offline',change);return()=>{removeEventListener('online',change);removeEventListener('offline',change)}},[])
 async function save(){
  if(!map)return
  setBusy(true);setError('')
  try{
   if(!('serviceWorker'in navigator)||!('caches'in window))throw Error('이 브라우저는 오프라인 저장을 지원하지 않아요.')
   if(import.meta.env.DEV)throw Error('오프라인 저장은 배포 사이트 또는 빌드 미리보기에서 사용할 수 있어요.')
   await navigator.serviceWorker.register('/sw.js')
   await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('앱 저장이 지연되고 있어요. 잠시 후 다시 시도해 주세요.')),20000))])
   const cached=await caches.match('/index.html')
   const cachedMap=await caches.match(file)
   if(!cached||!cachedMap)throw Error('앱과 지도를 모두 저장하지 못했어요. 다시 시도해 주세요.')
   localStorage.setItem(mapKey,JSON.stringify(map));setSaved(true)
  }catch(e){setError(e instanceof Error?e.message:'저장 공간을 사용할 수 없어요.')}finally{setBusy(false)}
 }
 function retry(){setError('');fetch(file).then(r=>{if(!r.ok)throw Error();return r.json()}).then(setMap).catch(()=>setError('지도를 불러오지 못했어요. 연결 후 다시 시도해 주세요.'))}
 const project=(p:number[])=>map?[(p[0]-map.bbox[1])/(map.bbox[3]-map.bbox[1])*400,(map.bbox[2]-p[1])/(map.bbox[2]-map.bbox[0])*400]:[0,0]
 const point=map?project(map.center):[200,200]
 const vb=[point[0]-200/zoom,point[1]-150/zoom,400/zoom,300/zoom].join(' ')
 return <div className="offline-map-block">
  {(!compact||!matched)&&<div className="section-top"><strong>{matched?meeting:'서울숲 예시 지도'}</strong>{offline?<span className="icon-label"><WifiOff size={16}/>오프라인</span>:saved?<span className="icon-label confirmed"><CircleCheck size={16}/>기기에 저장됨</span>:null}</div>}
  {!matched&&<p className="map-mismatch">현재 약속 장소 ‘{meeting}’의 위치는 아직 연결되지 않았어요.</p>}
  <div className={'geo-map '+(compact?'compact':'')}>
   {map?<svg viewBox={vb} role="img" aria-label={matched?`${meeting} 주변 도로·건물 지도`:'서울숲 주변 예시 지도. 현재 약속 장소와 다름'} preserveAspectRatio="xMidYMid slice"><rect x="-500" y="-500" width="1400" height="1400" className="map-land"/>
    {map.features.filter(f=>f.tags.leisure||f.tags.natural).map(f=><polygon key={f.id} points={f.coordinates.map(p=>project(p).join(',')).join(' ')} className={f.tags.natural?'map-water':'map-green'}/>)}
    {map.features.filter(f=>f.tags.building).map(f=><polygon key={f.id} points={f.coordinates.map(p=>project(p).join(',')).join(' ')} className="map-building"/>)}
    {map.features.filter(f=>f.tags.highway).map(f=><polyline key={f.id} points={f.coordinates.map(p=>project(p).join(',')).join(' ')} className={'geo-road '+(['primary','secondary','tertiary','residential'].includes(f.tags.highway)?'major-road':'minor-road')}/>)}
    {map.features.filter(f=>f.tags.highway&&f.tags.name&&!['footway','path','service','steps'].includes(f.tags.highway)).filter((f,i,a)=>a.findIndex(n=>n.tags.name===f.tags.name)===i).slice(0,9).map(f=>{const p=project(f.coordinates[Math.floor(f.coordinates.length/2)]);return <text key={f.id} x={p[0]} y={p[1]} className="geo-label" textAnchor="middle">{f.tags.name}</text>})}
    <g transform={`translate(${point[0]},${point[1]})`}><circle r="17" className="pin-halo"/><circle r="7" className="geo-pin"/><text y="-24" textAnchor="middle" className="pin-label">{matched?'만남 위치 · 예시':'서울숲 · 예시'}</text></g>
   </svg>:<div className="map-empty">{error?'지도 없음':'지도 불러오는 중…'}</div>}
   {!compact&&<div className="map-controls"><Button variant="outline" size="icon" disabled={zoom>=3} aria-label="지도 확대" onClick={()=>setZoom(x=>Math.min(3,x+.5))}><Plus/></Button><Button variant="outline" size="icon" disabled={zoom<=.75} aria-label="지도 축소" onClick={()=>setZoom(x=>Math.max(.75,x-.5))}><Minus/></Button><Button variant="outline" size="icon" aria-label="기본 지도 범위" onClick={()=>setZoom(1)}><RotateCcw/></Button></div>}
  </div>
  <a className="map-credit" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors · ODbL</a>
  {!compact&&<>
   {map&&<p className="muted">{new Date(map.fetchedAt).toLocaleDateString('ko')} 저장 자료 · 서울숲 주변 약 600m 범위</p>}
   {!matched&&onUseExample&&<Button variant="outline" className="w-full" onClick={onUseExample}><MapPin/>서울숲 예시로 만남 장소 변경</Button>}
   <Button className="w-full" disabled={!map||busy} onClick={save}><Download/>{busy?'앱과 지도 저장 중…':saved?'오프라인 저장 다시 확인':'이 지역 오프라인 저장'}</Button>
   <p className="muted">인터넷이 될 때 한 번 저장하세요. 이후 이 주소를 다시 열면 저장된 지도와 계획을 볼 수 있어요. 브라우저 저장 공간을 지우면 삭제됩니다.</p>
  </>}
  {error&&<><p className="error" role="alert">{error}</p>{!map&&<Button variant="outline" onClick={retry}>지도 다시 불러오기</Button>}</>}
 </div>
}
