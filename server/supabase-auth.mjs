import {createClient} from '@supabase/supabase-js'
import {db} from './database.mjs'
const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL
const key=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const usesSupabase=Boolean(url||key)
let client
function reject(status,message){throw Object.assign(new Error(message),{status})}
export function verifiedProfile(user){
 if(!user?.id||!user.email||!user.email_confirmed_at||user.is_anonymous)reject(401,'이메일 확인을 완료한 뒤 로그인해 주세요.')
 return {providerId:user.id,email:user.email.trim().toLowerCase(),name:String(user.user_metadata?.display_name||user.user_metadata?.name||user.email.split('@')[0]).slice(0,20)}
}
export async function resolveProfile(profile,namespace=url){
 const providerId=namespace+'#'+profile.providerId
 const linked=await db.prepare('SELECT u.id,u.name,u.email FROM users u JOIN auth_identities a ON a.user_id=u.id WHERE a.provider_id=?').get(providerId)
 if(linked)return linked
 // Only a server-verified, confirmed Supabase identity can claim an existing email's plans.
 await db.prepare('INSERT OR IGNORE INTO users(id,name,email,password) VALUES(?,?,?,?)').run(profile.providerId,profile.name,profile.email,'!supabase-managed')
 const row=await db.prepare('SELECT id,name,email FROM users WHERE email=?').get(profile.email)
 if(!row)reject(409,'계정을 연결하지 못했어요. 관리자에게 문의해 주세요.')
 await db.prepare('INSERT OR IGNORE INTO auth_identities(provider_id,user_id) VALUES(?,?)').run(providerId,row.id)
 return row
}
export async function supabaseUser(req){
 const token=req.headers.authorization?.match(/^Bearer ([^\s]+)$/)?.[1]
 if(!token)reject(401,'로그인이 필요해요.')
 if(!url||!key)reject(503,'이메일 인증 설정을 확인하고 있어요. 잠시 후 다시 시도해 주세요.')
 client??=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})
 const {data,error}=await client.auth.getUser(token)
 if(error||!data.user)reject(401,'로그인이 만료됐어요. 다시 로그인해 주세요.')
 return resolveProfile(verifiedProfile(data.user))
}
