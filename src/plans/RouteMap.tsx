import { useState } from 'react'
import type { Coord,MapData,PersonalPlan } from './model'
import { Button } from '@/components/ui/button'
import { MapPin, Plus, Minus } from 'lucide-react'
export function MapDrawing({map,plan,id='route-map',onPick}:{map:MapData;plan?:PersonalPlan;id?:string;onPick?:(p:Coord)=>void}){
 const [zoom,setZoom]=useState(1)
 const project=(p:Coord)=>[(p[0]-map.bbox[1])/(map.bbox[3]-map.bbox[1])*400,(map.bbox[2]-p[1])/(map.bbox[2]-map.bbox[0])*400]
 const vb=[200-216/zoom,200-216/zoom,432/zoom,432/zoom]
 return <div className="route-map" id={id}><svg viewBox={vb.join(' ')} preserveAspectRatio="none" role="img" aria-label="출발지와 만남 장소 사이 저장된 경로 지도" onClick={e=>{if(!onPick)return;const b=e.currentTarget.getBoundingClientRect();const x=vb[0]+(e.clientX-b.left)/b.width*vb[2],y=vb[1]+(e.clientY-b.top)/b.height*vb[3];onPick([map.bbox[1]+x/400*(map.bbox[3]-map.bbox[1]),map.bbox[2]-y/400*(map.bbox[2]-map.bbox[0])])}}>
 <rect x="-1000" y="-1000" width="2400" height="2400" fill="var(--muted)"/>
 {map.features.filter(f=>f.tags.leisure||f.tags.natural||f.tags.building).map(f=><polygon key={f.id} points={f.coordinates.map(p=>project(p).join(',')).join(' ')} className={f.tags.building?'map-building':f.tags.natural?'map-water':'map-green'}/>)}
 {map.features.filter(f=>f.tags.highway).map(f=><polyline key={f.id} points={f.coordinates.map(p=>project(p).join(',')).join(' ')} className="geo-road" strokeWidth={['primary','secondary','tertiary','residential'].includes(f.tags.highway)?4:1.5}/>)}
 {plan?.route&&<polyline points={plan.route.coordinates.map(p=>project(p).join(',')).join(' ')} fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>}
 {([['A',plan?.origin],['B',plan?.destination]] as const).map(([label,p])=>p&&<g key={label} transform={`translate(${project(p).join(',')})`}><circle r="10" fill={label==='A'?'var(--primary)':'var(--foreground)'} stroke="var(--background)" strokeWidth="2"/><text textAnchor="middle" y="4" fill={label==='A'?'var(--primary-foreground)':'var(--background)'} fontSize="11" fontWeight="700">{label}</text></g>)}
 </svg><div className="route-zoom"><Button variant="outline" size="icon" aria-label="경로 지도 확대" disabled={zoom>=2} onClick={()=>setZoom(z=>z+.25)}><Plus/></Button><Button variant="outline" size="icon" aria-label="경로 지도 축소" disabled={zoom<=1} onClick={()=>setZoom(z=>z-.25)}><Minus/></Button></div><span className="north">북 ↑</span></div>
}
