# HBJangi 인계

- 목표/단계: HBEngine 로컬 2인 장기, 실행 가능한 첫 버전.
- 구현: C++ 규칙과 대국 상태, 기존 엔진 위젯/BP 입력, 독립 release Player 패키지. 엔진 소스·설치본 수정 없음.
- UI: 실제 GLB 판/팔각 기물·한자 텍스처·조명/그림자, 정면 직교 시점, 진영별 0/180도 글자 방향. 궁중 판타지 캐릭터 일러스트와 이름표/차례/하단 버튼 HUD. 우주와 사이드바 제거.
- 입력: 실제 3D 광선/판 교차점, 마우스·방향키/Enter, 엔진 PooledActor로 기물/선택/이동 고리 표시.
- 검증 명령: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/test.ps1`, `npm run build`, `node tools/smoke.mjs`.
- 증거: `docs/qa/acceptance.json`, `player-1280.png`, `player-960.png`, `initial-3d.png`. 실제 Player 3D 입력·방향·키보드·C++ 연결·리셋·배율·정상 종료와 서버 종료 통과.
- 제한: 로컬 2인, 저장/AI/온라인/음향 없음. 점수승 미구현. 반복 국면은 일괄 무승부이며 대회별 연속 장군/추격 규정 미구현. 대회 규정 및 장시간 사람 대국 미검증.
- 제작 파일: `Source`, `Assets`, `Settings`, `tools`, `tests`, `README.md`, `Play.cmd`.
- DEBUG_HANDOFF.md: 프레임 입력 폴링 및 검사 경합 기록. Input Event Pressed 직접 연결과 실제 좌표 완료 대기로 마우스/키보드 경로 모두 통과. 미해결 결함 없음.
- Git: 사용자 지정 `kirby47navercom-ai`, 인증 API 일치 확인. 공개 저장소 `https://github.com/kirby47navercom-ai/HBJangi`. 한글 커밋, 타 계정 인증/전역 설정 변경 금지.
- 다음 안전한 작업: 실제 사람 대국으로 규칙 사례 보강. 캐릭터 일러스트의 미세한 취향 조정은 현재 게임 HUD/시점 기준을 유지한다.
