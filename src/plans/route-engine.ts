import type { Coord,MapData,Route } from './model'
const R=6371000
export function distance(a:Coord,b:Coord){const rad=Math.PI/180;const lat=(a[1]+b[1])/2*rad;return R*Math.hypot((b[0]-a[0])*rad*Math.cos(lat),(b[1]-a[1])*rad)}
type Edge={to:string;d:number;name:string}
export function buildRoute(map:MapData,start:Coord,end:Coord,avoidStairs=false):Route{
 const nodes=new Map<string,Coord>(),edges=new Map<string,Edge[]>()
 const allowed=new Set(['footway','path','pedestrian','residential','living_street','service','unclassified','tertiary','secondary','primary','steps','track','cycleway'])
 for(const f of map.features){const t=f.tags;if(!allowed.has(t.highway)||['private','no'].includes(t.foot)||(['private','no'].includes(t.access)&&!['yes','designated','permissive'].includes(t.foot))||t.motorroad==='yes'||(avoidStairs&&t.highway==='steps')||t.construction||t.highway==='cycleway'&&!['yes','designated','permissive'].includes(t.foot))continue
  for(let i=0;i<f.coordinates.length-1;i++){
   const a=f.coordinates[i],b=f.coordinates[i+1];if(!inside(map,a)||!inside(map,b))continue
   const ka=f.nodeIds?.[i]||a.join(','),kb=f.nodeIds?.[i+1]||b.join(',');nodes.set(ka,a);nodes.set(kb,b)
   const d=distance(a,b),name=t['name:ko']||t.name||(t.highway==='steps'?'계단':'이름 없는 보행 가능 길')
   if(!edges.has(ka))edges.set(ka,[]);if(!edges.has(kb))edges.set(kb,[])
   if(t['oneway:foot']!=='-1')edges.get(ka)!.push({to:kb,d,name});if(t['oneway:foot']!=='yes')edges.get(kb)!.push({to:ka,d,name})
  }
 }
 if(!inside(map,start)||!inside(map,end))throw Error('선택한 위치가 저장 지도 범위 밖이에요.')
 const nearest=(p:Coord)=>{let best='',d=Infinity;for(const [id,c]of nodes){const n=distance(p,c);if(n<d){best=id;d=n}}if(d>45||!best)throw Error('보행로에서 너무 멀어요. 지도 위의 길 가까이에 지점을 다시 골라주세요.');return best}
 const a=nearest(start),b=nearest(end)
 if(a===b)throw Error('출발과 도착 지점이 너무 가까워요. 서로 다른 길 지점을 골라주세요.')
 const distances=new Map<string,number>([[a,0]]),prev=new Map<string,{id:string;name:string;distance:number}>(),open=new Set([a]),done=new Set<string>()
 while(open.size){let cur='',small=Infinity;for(const k of open){const d=distances.get(k)!;if(d<small){small=d;cur=k}}open.delete(cur);if(cur===b)break;done.add(cur)
  for(const e of edges.get(cur)||[]){if(done.has(e.to))continue;const d=small+e.d;if(d<(distances.get(e.to)??Infinity)){distances.set(e.to,d);prev.set(e.to,{id:cur,name:e.name,distance:e.d});open.add(e.to)}}
 }
 if(!prev.has(b))throw Error('이 지도 범위의 연결된 보행로를 찾지 못했어요. 지점을 다시 고르거나 현장에서 확인한 경유지를 글 안내에 기록해 주세요.')
 const ids=[b],segments:{name:string;d:number;from:Coord;to:Coord}[]=[];let cur=b
 while(cur!==a){const p=prev.get(cur)!;segments.unshift({name:p.name,d:p.distance,from:nodes.get(p.id)!,to:nodes.get(cur)!});ids.unshift(p.id);cur=p.id}
 const groups:{name:string;d:number;from:Coord;to:Coord}[]=[]
 for(const seg of segments){const last=groups.at(-1);if(last&&last.name===seg.name){last.d+=seg.d;last.to=seg.to}else groups.push({...seg})}
 const dirs=['동쪽','북동쪽','북쪽','북서쪽','서쪽','남서쪽','남쪽','남동쪽']
 const steps=groups.map((g,i)=>{const angle=Math.atan2(g.to[1]-g.from[1],(g.to[0]-g.from[0])*Math.cos(g.from[1]*Math.PI/180));const dir=dirs[(Math.round(angle/(Math.PI/4))+8)%8];return `${i+1}. ${g.name}에서 ${dir}으로 약 ${Math.max(1,Math.round(g.d))}m 이동합니다.`})
 steps.push(`${steps.length+1}. 저장된 도착 지점에 도착합니다. 만남 표식과 실제 접근 가능 여부를 확인합니다.`)
 return {coordinates:ids.map(id=>nodes.get(id)!),distanceM:distances.get(b)!,steps,generatedAt:new Date().toISOString(),avoidStairs}
}
export function inside(map:MapData,p:Coord){return p[0]>=map.bbox[1]&&p[0]<=map.bbox[3]&&p[1]>=map.bbox[0]&&p[1]<=map.bbox[2]}
