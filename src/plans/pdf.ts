import { jsPDF } from 'jspdf'
import { levels, type MapData,type PersonalPlan,type PlanMember } from './model'
export async function exportPlansPdf(members:PlanMember[],plans:PersonalPlan[][],map:MapData,revision:number){
 await document.fonts.ready
 const pdf=new jsPDF({unit:'mm',format:'a4',compress:true})
 const width=1240,height=1754,margin=78,line=40
 let canvas=document.createElement('canvas');canvas.width=width;canvas.height=height
 let ctx=canvas.getContext('2d')!,y=margin,page=0
 const pages:HTMLCanvasElement[]=[]
 function init(){ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.fillStyle='#152535';ctx.textBaseline='top';y=margin}
 function finish(){ctx.font='22px "Pretendard Variable",sans-serif';ctx.fillStyle='#68717b';ctx.fillText(`모이다 · 계획 ${revision}판 · ${++page}`,margin,height-54);pages.push(canvas);canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;ctx=canvas.getContext('2d')!;init()}
 function text(s:string,size=28,bold=false){ctx.font=`${bold?650:400} ${size}px "Pretendard Variable",sans-serif`;ctx.fillStyle='#152535';let buf='';const rows:string[]=[];for(const para of s.split('\n')){buf='';for(const ch of para){if(ctx.measureText(buf+ch).width>width-2*margin&&buf){rows.push(buf);buf=ch}else buf+=ch}rows.push(buf)}for(const row of rows){if(y+size>height-110){finish();ctx.font=`${bold?650:400} ${size}px "Pretendard Variable",sans-serif`;ctx.fillStyle='#152535'}ctx.fillText(row,margin,y);y+=size*1.48}}
 function gap(n=18){y+=n}
 init();text('모이다 · 오프라인 행동 계획',46,true);gap();text(`${new Date().toLocaleString('ko')} · 계획 ${revision}판`,24);text('이 문서는 저장 당시 자료입니다. 실제 재난에서는 현장 안전과 관계 기관의 안내를 우선하세요.',26);gap(30)
 for(let i=0;i<members.length;i++){text(`${members[i].name} · ${members[i].place}`,32,true);for(let j=0;j<3;j++){const p=plans[i][j];text(`${levels[j]}: ${p.action||'작성 전'}`,27);if(p.action)text(`전환 조건: ${p.when}`,25)}gap(22)}
 text('지도 범위: 서울숲 예시 지역 약 600m. 지도 밖 경로와 실시간 위험·통제 정보는 포함하지 않습니다.',25);text('지도 데이터 © OpenStreetMap contributors · ODbL',24);text('https://www.openstreetmap.org/copyright',23)
 for(let i=0;i<members.length;i++)for(let j=0;j<3;j++){
  const p=plans[i][j];if(!p.action.trim())continue
  finish();text(`${members[i].name} · ${levels[j]}`,42,true);gap();text(p.action,34,true);text(`사용 조건: ${p.when}`,27);if(p.mode==='move'){text(`A 출발: ${p.originLabel||'미지정'}`,27);text(`B 만남 장소: ${p.destinationLabel||'미지정'}`,27)}text(`경로: ${p.mode==='stay'?'이동 없이 머무르기':p.route?`약 ${Math.round(p.route.distanceM)}m · ${p.route.avoidStairs?'계단 제외':'계단 포함 가능'}`:'아직 저장되지 않음'}`,27);text(`현장 확인: ${p.reviewed?'사용자가 확인했다고 기록함':'직접 확인 전'}`,25);gap()
  if(p.mode==='move'&&p.route){const mh=450,pad=24;const px=(c:number[])=>[margin+pad+(c[0]-map.bbox[1])/(map.bbox[3]-map.bbox[1])*(width-margin*2-pad*2),y+pad+(map.bbox[2]-c[1])/(map.bbox[2]-map.bbox[0])*(mh-pad*2)]
   ctx.save();ctx.beginPath();ctx.rect(margin,y,width-2*margin,mh);ctx.clip();ctx.fillStyle='#f1f3f2';ctx.fillRect(margin,y,width-2*margin,mh)
   for(const f of map.features){if(!f.coordinates.length)continue;ctx.beginPath();for(const [k,c]of f.coordinates.entries()){const v=px(c);if(!k)ctx.moveTo(v[0],v[1]);else ctx.lineTo(v[0],v[1])}if(f.tags.highway){ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke()}else{ctx.fillStyle=f.tags.leisure?'#deebdf':f.tags.natural?'#d9e9f8':'#dce0e1';ctx.fill()}}
   ctx.beginPath();p.route.coordinates.forEach((c,k)=>{const v=px(c);if(k)ctx.lineTo(v[0],v[1]);else ctx.moveTo(v[0],v[1])});ctx.strokeStyle='#007aff';ctx.lineWidth=6;ctx.lineJoin='round';ctx.stroke()
   for(const [label,c]of [['A',p.route.coordinates[0]],['B',p.route.coordinates.at(-1)!]] as const){const v=px(c);ctx.beginPath();ctx.arc(v[0],v[1],16,0,Math.PI*2);ctx.fillStyle='#132c44';ctx.fill();ctx.font='bold 21px sans-serif';ctx.fillStyle='#fff';ctx.fillText(label,v[0]-7,v[1]-10)}ctx.restore();y+=mh+14;text('© OpenStreetMap contributors · ODbL | 북쪽이 위',22);gap()
  }
  text('글로 보는 경로 · 행동 안내',30,true);gap(8);text(p.directions||'아직 안내가 입력되지 않았습니다.',27);gap();text('자동 경로는 저장 도로망의 거리 기준 참고안이며 안전을 보장하지 않습니다. 보행 가능 여부·통제·파손·건물 출입구는 직접 확인하세요.',24)
 }
 finish();for(const [i,c]of pages.entries()){if(i)pdf.addPage();pdf.addImage(c.toDataURL('image/jpeg',.92),'JPEG',0,0,210,297,undefined,'FAST')}
 pdf.setProperties({title:'모이다 오프라인 행동 계획',subject:`계획 ${revision}판`,author:'모이다'})
 pdf.save(`모이다_${members.length===1?members[0].name:'전체'}_계획${revision}.pdf`)
}
