function invalid(message='가져올 계획 파일을 확인해 주세요.'){throw Object.assign(new Error(message),{status:400})}
export function prepareImport(input,user){
 if(input?.format!=='moida-local-group-v1'||typeof input.sourceGroupId!=='string'||input.sourceGroupId.length>100||!input.sourceGroupId)invalid()
 if(typeof input.ownerEmail!=='string'||input.ownerEmail.trim().toLowerCase()!==user.email.toLowerCase())throw Object.assign(new Error('로컬에서 사용한 이메일과 같은 계정으로 로그인해 주세요.'),{status:403})
 const {document:doc,sourceUserId:oldId}=input,plan=doc?.plan
 if(typeof oldId!=='string'||!oldId||plan?.leaderId!==oldId||!Array.isArray(plan.members)||plan.members.length!==1||plan.members[0].id!==oldId)invalid('현재는 본인 혼자 있는 로컬 그룹만 가져올 수 있어요. 다른 멤버는 초대 링크로 참여해 주세요.')
 if(typeof input.name!=='string'||!input.name.trim()||input.name.length>40||!Number.isSafeInteger(plan.revision)||plan.revision<1)invalid()
 for(const k of ['meeting','address','backup','offline'])if(typeof plan[k]!=='string'||plan[k].length>1000)invalid()
 const member=plan.members[0]
 if(typeof member.name!=='string'||!member.name||typeof member.place!=='string'||!member.place||typeof member.need!=='string'||(member.action!==undefined&&typeof member.action!=='string'))invalid()
 if(member.plans!==undefined){if(!Array.isArray(member.plans)||member.plans.length!==3)invalid();for(const p of member.plans){if(!['move','stay'].includes(p.mode)||typeof p.action!=='string'||typeof p.when!=='string'||typeof p.directions!=='string'||p.directions.length>8000)invalid();for(const point of [p.origin,p.destination,...(p.route?.coordinates||[])])if(point!==undefined&&(!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite)))invalid();if(p.route&&(!Number.isFinite(p.route.distanceM)||!Array.isArray(p.route.steps)||p.route.steps.some(x=>typeof x!=='string')))invalid()}}
 const remap=record=>record?.[oldId]!==undefined?{[user.id]:record[oldId]}:{}
 const document={plan:{...plan,leaderId:user.id,members:[{...member,id:user.id}]},confirmed:remap(doc.confirmed),phase:['ready','moving','arrived'].includes(doc.phase)?doc.phase:'ready',reports:remap(doc.reports),reviewedAt:remap(doc.reviewedAt),reminders:[]}
 if(doc.incident)document.incident=doc.incident
 return {sourceGroupId:input.sourceGroupId,name:input.name.trim(),document}
}
