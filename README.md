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

## 내 컴퓨터 개발 환경

- 고정 작업 폴더: `/Users/sunnie/Documents/Codex/Projects/disasterplanning`
- 로컬 주소: http://localhost:3000
- 배포 주소: https://disasterplanning.vercel.app
- GitHub: https://github.com/smapohoh/disasterplanning

### 작업 순서
1. Cursor 또는 Codex에서 이 프로젝트 폴더를 엽니다.
2. 프로젝트 터미널에서 `npm run dev`를 실행합니다. 추가 패키지 설치는 필요 없습니다.
3. `public/index.html`을 수정하고 저장한 뒤 로컬 브라우저를 새로고침합니다.
4. GitHub Desktop에서 변경 내용을 확인하고 설명을 적어 **Commit to main**을 누릅니다.
5. **Push origin**을 누르면 GitHub에 기록되고 Vercel이 자동 배포합니다.
6. Vercel에서 배포 성공을 확인한 뒤 배포 주소를 새로고침합니다.

로컬 수정이나 커밋만으로는 배포되지 않습니다. Push가 배포를 시작합니다.
터미널 서버는 Ctrl+C로 종료합니다. `.env`와 인증 파일은 저장소에 올리지 않습니다.
Hobby 플랜을 유지하며, 유료 기능 또는 플랜 전환은 별도 확인이 필요합니다.
