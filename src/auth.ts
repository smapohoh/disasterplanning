import {createClient} from '@supabase/supabase-js'
const url=import.meta.env.VITE_SUPABASE_URL
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const supabase=url&&key?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}}):null
export const emailRedirectTo=()=>location.origin+'/auth/confirm'
let confirmation:Promise<boolean>|undefined
export function confirmEmailFromUrl(){
 return confirmation??=(async()=>{
  if(location.pathname!=='/auth/confirm')return false
  const params=new URLSearchParams(location.search),hasError=params.has('error')||params.has('error_description')
  if(!supabase)throw new Error('이메일 인증 설정이 필요해요.')
  // The SDK exchanges the one-time PKCE code and persists its session exactly once.
  const {data,error}=await supabase.auth.getSession()
  if(hasError||error||!data.session){history.replaceState(null,'','/auth/confirm');throw new Error('확인 링크가 만료되었거나 가입한 브라우저와 달라요. 이메일 확인 후 로그인해 주세요.')}
  history.replaceState(null,'','/')
  return true
 })()
}
export function authError(error:unknown){
 const code=(error as {code?:string})?.code
 const messages:Record<string,string>={invalid_credentials:'이메일 또는 비밀번호가 맞지 않아요.',email_not_confirmed:'이메일 확인을 먼저 완료해 주세요.',over_email_send_rate_limit:'확인 메일 발송 한도에 도달했어요. 잠시 후 다시 시도해 주세요.',over_request_rate_limit:'요청이 많아요. 잠시 후 다시 시도해 주세요.',user_already_exists:'이미 가입한 이메일이에요. 로그인해 주세요.',weak_password:'비밀번호를 더 길고 복잡하게 입력해 주세요.',signup_disabled:'현재 회원가입을 사용할 수 없어요.'}
 return messages[code||'']||'인증 요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.'
}
