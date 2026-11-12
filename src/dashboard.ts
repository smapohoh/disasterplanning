export type Safety='unknown'|'safe'|'help'
export type Report={safety:Safety;safetyAt?:string;checkedRevision?:number;checkedAt?:string}
export type Incident={id:string;active:boolean;startedAt:string}
export const safetyText:Record<Safety,string>={unknown:'안전 미확인',safe:'안전해요',help:'도움 필요'}
export function timeLabel(value?:string){return value?new Intl.DateTimeFormat('ko',{hour:'2-digit',minute:'2-digit',month:'numeric',day:'numeric'}).format(new Date(value)):'기록 없음'}
