export async function saveOfflineBundle(revision:number,storageKey='moida-plan-v2'){
 if(import.meta.env.DEV)throw Error('로컬 개발 화면에서는 저장할 수 없어요. 빌드 미리보기 주소에서 저장해 주세요.')
 if(!('serviceWorker'in navigator)||!('caches'in window))throw Error('이 브라우저는 오프라인 저장을 지원하지 않아요.')
 const raw=localStorage.getItem(storageKey);if(!raw||JSON.parse(raw).plan.revision!==revision)throw Error('현재 계획을 기기에 먼저 저장해 주세요.')
 await navigator.serviceWorker.register('/sw.js')
 await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('앱 저장이 지연되고 있어요. 연결을 확인하고 다시 시도해 주세요.')),20000))])
 if(!await caches.match('/index.html')||!await caches.match('/maps/seoul-forest.json'))throw Error('앱과 지도 저장을 마치지 못했어요. 다시 시도해 주세요.')
 localStorage.setItem(storageKey+'-route-pack',JSON.stringify({revision,savedAt:new Date().toISOString()}))
}
