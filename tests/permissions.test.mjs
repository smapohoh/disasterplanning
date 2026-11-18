import test from 'node:test'
import assert from 'node:assert/strict'
import {canEditMember,isGroupLeader} from '../src/permissions.ts'
const group={leaderId:'a',members:[{id:'a'},{id:'b'},{id:'c'}]}
test('representative edits every member and owns group administration',()=>{for(const m of group.members)assert.equal(canEditMember(group,'a',m.id),true);assert.equal(isGroupLeader(group,'a'),true)})
test('member edits own plan and cannot edit others or send reminders',()=>{assert.equal(canEditMember(group,'b','b'),true);assert.equal(canEditMember(group,'b','a'),false);assert.equal(canEditMember(group,'b','c'),false);assert.equal(isGroupLeader(group,'b'),false)})
test('transfer removes former representative privileges',()=>{const transferred={...group,leaderId:'b'};assert.equal(canEditMember(transferred,'a','c'),false);assert.equal(isGroupLeader(transferred,'a'),false);assert.equal(canEditMember(transferred,'b','c'),true)})
test('unknown members and deleted representatives have no permission',()=>{assert.equal(canEditMember(group,'outside','outside'),false);assert.equal(canEditMember(group,'a','outside'),false);assert.equal(isGroupLeader({...group,members:[]},'a'),false)})
