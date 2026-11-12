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
