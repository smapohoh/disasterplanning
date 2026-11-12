# 안전한 내일 · Disaster Planning

개인용 재난 대비 체크리스트. 체크 상태는 브라우저 localStorage에만 저장됩니다.

## 구조
- `public/index.html`: 한국어 반응형 화면, 스타일, 체크리스트 동작
- `vercel.json`: Vercel 정적 사이트 설정

## 로컬 실행
프로젝트 폴더에서 `python3 -m http.server 8000 --directory public` 실행 후 http://localhost:8000 접속.

## Vercel
- Framework Preset: Other
- Root Directory: 저장소 루트
- Build Command: 없음 (Override를 사용하는 경우 빈 값)
- Output Directory: public
- Install Command: 없음
- 환경 변수: 필요 없음
- 외부 라이브러리, 데이터베이스, 서버 함수 없음

개인 프로젝트의 Hobby 플랜 배포를 목표로 합니다. 실제 재난에서는 관계 기관의 최신 안내를 따르세요.
