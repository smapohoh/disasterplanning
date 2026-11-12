# 모이다 · 우리 가족 재난 약속

Compass 1.0.17 실제 모바일 앱 셸과 컴포넌트로 만든 React 모바일 웹 UI입니다.

## 실행

고정 폴더: `/Users/sunnie/Documents/Codex/Projects/disasterplanning`

- 처음 설치: `npm ci`
- 로컬 개발: `npm run dev` → http://localhost:3000
- 배포 빌드: `npm run build`
- 빌드 미리보기: `npm run preview` → http://localhost:3001

Vite 포트가 사용 중이면 출력되는 주소를 사용하세요. 종료는 Ctrl+C.

## 핵심 흐름

1. 지금 할 일: 역할별 행동과 예시 만남 장소를 바로 확인
2. 약속대로 움직여 보기 → 도착 표시 → 다음 행동과 가족별 계획 확인
3. 우리 약속: 첫/대체 만남 장소, 연락 두절 약속, 구성원별 상황 수정
4. 함께 확인: 각 역할로 직접 답하기 → 이해 확인 진행률 표시
5. 약속 수정 시 이전 이해 확인 전체 초기화

입력/확인/연습 기록은 이 브라우저 localStorage에 저장됩니다. 실제 초대, 메시지 전송, 위치 추적, 공식 재난 알림, 다중 사용자 동기화, 검증된 대피소 정보는 제공하지 않는 UI 프로토타입입니다.

## 파일

- `src/App.tsx`: 제품 화면과 상태/동작
- `src/app.css`: 제품별 레이아웃
- `src/foundations.css`: 공식 Compass 기본 토큰/스타일
- `src/components/ui/`: 공식 Registry 컴포넌트
- `docs/COMPASS-ADOPTION.md`: 버전, 출처, 적용 범위
- `docs/first-checklist.html`: 이전 HTML 화면 보관

## GitHub → Vercel

GitHub Desktop에서 변경 확인 → Commit to main → Push origin.
`main` Push 시 Vercel 자동 배포. Framework Vite / Build `npm run build` / Output `dist`.
배포 주소: https://disasterplanning.vercel.app
Hobby 플랜, 별도 환경 변수/API 키 불필요. Compass 인증 키는 개인 Codex 설정에만 있으며 제품에는 포함하지 않습니다.

## 대시보드 · 재난 상태 · 오프라인 지도

홈에서 구성원별 행동 계획과 입력률을 봅니다. ‘재난 상황 확인’을 켜면 안전/도움 필요/미확인 상태와 현재 계획 확인 여부를 별도로 기록합니다. 실제 다른 기기와 동기화되지는 않습니다.

지도는 서울숲 주변 약 600m의 실제 OSM 벡터 데이터를 예시로 제공합니다. 기존 계획의 장소가 다르면 불일치를 표시합니다. 다른 주소를 자동으로 검색하거나 위치를 추적하지 않습니다.

온라인에서 ‘지도 · 오프라인 저장’ → ‘이 지역 오프라인 저장’을 누르세요. 앱과 지도 저장 후 같은 브라우저·같은 주소에서 네트워크 없이 다시 열 수 있습니다. 브라우저 저장 공간 삭제/자동 정리 시 자료가 사라질 수 있습니다.

프로덕션 빌드의 `scripts/create-sw.mjs`가 내용 해시 기반 서비스 워커를 생성합니다. Vite 개발 모드는 오프라인 저장을 제공하지 않으므로 `npm run build` → `npm run preview`로 검증하세요.
