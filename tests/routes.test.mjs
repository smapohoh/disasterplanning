import {test} from 'node:test'
import assert from 'node:assert/strict'
import {buildRoute} from '../src/plans/route-engine.ts'
const A=[127.04,37.544],B=[127.0404,37.544],C=[127.0408,37.544]
const map=(tags={})=>({bbox:[37.54,127.03,37.55,127.05],features:[{id:1,tags:{highway:'footway',name:'예시 보행로',...tags},coordinates:[A,B,C],nodeIds:['a','b','c']}]})
test('connected geometry produces actual node path and text distances',()=>{const r=buildRoute(map(),A,C);assert.deepEqual(r.coordinates,[A,B,C]);assert.ok(r.distanceM>60&&r.distanceM<80);assert.match(r.steps[0],/예시 보행로.*동쪽/);assert.equal(r.steps.length,2)})
test('private access is excluded',()=>assert.throws(()=>buildRoute(map({access:'private'}),A,C),/보행로/))
test('stairs excluded when requested',()=>assert.throws(()=>buildRoute(map({highway:'steps'}),A,C,true),/보행로/))
test('out of map endpoints do not silently become a straight line',()=>assert.throws(()=>buildRoute(map(),[128,38],C),/범위 밖/))
test('one way walking respected',()=>{assert.throws(()=>buildRoute(map({'oneway:foot':'yes'}),C,A),/연결된/);assert.ok(buildRoute(map({'oneway:foot':'yes'}),A,C).distanceM>0)})
test('disconnected ways do not jump between nearby nodes',()=>{const m=map();m.features=[{id:1,tags:{highway:'footway'},coordinates:[A,B],nodeIds:['a','b']},{id:2,tags:{highway:'footway'},coordinates:[C,[127.0412,37.544]],nodeIds:['c','d']}];assert.throws(()=>buildRoute(m,A,[127.0412,37.544]),/연결된/)})
