export type GroupAccess = { leaderId: string; members: { id: string }[] }
export function isGroupLeader(group: GroupAccess, actor: string) {
 return group.leaderId === actor && group.members.some(m => m.id === actor)
}
export function canEditMember(group: GroupAccess, actor: string, target: string) {
 return group.members.some(m => m.id === actor) && group.members.some(m => m.id === target) && (actor === target || isGroupLeader(group, actor))
}
