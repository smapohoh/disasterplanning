export type Coord=[number,number]
export type MapFeature={id:number;tags:Record<string,string>;coordinates:Coord[];nodeIds?:string[]}
export type MapData={name:string;bbox:number[];center:Coord;source:string;sourceUrl:string;fetchedAt:string;features:MapFeature[]}
export type Route={coordinates:Coord[];distanceM:number;steps:string[];generatedAt:string;avoidStairs:boolean}
export type PersonalPlan={id:string;action:string;when:string;mode:'move'|'stay';originLabel:string;destinationLabel:string;origin?:Coord;destination?:Coord;avoidStairs:boolean;route?:Route;directions:string;reviewed:boolean}
export type PlanMember={id:string;name:string;place:string;need:string;action?:string;plans?:PersonalPlan[]}
export const levels=['메인계획','차선책','차차선책']
export function plansFor(m:PlanMember,meeting:string):PersonalPlan[]{return [0,1,2].map(i=>m.plans?.[i]||{id:['primary','secondary','tertiary'][i],action:i===0?m.action||'':'',when:i===0?'평소 장소에서 재난이 발생하면':i===1?'메인계획을 실행할 수 없으면':'차선책도 실행할 수 없으면',mode:i===0&&/기다|대기|머무/.test(m.action||'')?'stay':'move',originLabel:m.place,destinationLabel:meeting,avoidStairs:false,directions:'',reviewed:false})}
export function planReady(p:PersonalPlan){return !!p.action.trim()&&!!p.when.trim()&&(p.mode==='stay'||!!p.route)&&!!p.directions.trim()}
export const mapFile='/maps/seoul-forest.json'
export async function readMap():Promise<MapData>{const r=await fetch(mapFile);if(!r.ok)throw Error('지도 자료를 불러오지 못했어요. 오프라인 저장 여부를 확인해 주세요.');return r.json()}
