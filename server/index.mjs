import http from 'node:http'
import handler from './handler.mjs'
import {initialize} from './database.mjs'
await initialize()
const server=http.createServer(handler)
server.listen(Number(process.env.MOIDA_PORT||3011),'127.0.0.1',()=>console.log(`모이다 로컬 계정 서버 http://127.0.0.1:${process.env.MOIDA_PORT||3011}`))
