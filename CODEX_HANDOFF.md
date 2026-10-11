# HBJangi 인계

- 목표/단계: HBEngine 로컬 2인 장기, 실행 가능한 첫 버전.
- 구현: C++ 규칙과 대국 상태, 기존 엔진 위젯/BP 입력, 독립 release Player 패키지. 엔진 소스·설치본 수정 없음.
- UI: 나무판·팔각 기물·청홍 구분, 금색 이동/선택 표시, 무르기·한 수 쉼·빅장 무승부·배치 선택·확인 후 새 대국.
- 검증 명령: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/test.ps1`, `npm run build`, `node tools/smoke.mjs`.
- 증거: `docs/qa/acceptance.json`, `player-1280.png`, `player-960.png`. 실제 Player 포인터 입력·C++ 연결·리셋·배율·정상 종료와 서버 종료 통과.
- 제한: 로컬 2인, 저장/AI/온라인/음향 없음. 점수승 미구현. 반복 국면은 일괄 무승부이며 대회별 연속 장군/추격 규정 미구현. 대회 규정 및 장시간 사람 대국 미검증.
- 제작 파일: `Source`, `Assets`, `Settings`, `tools`, `tests`, `README.md`, `Play.cmd`.
- DEBUG_HANDOFF.md: 반복 미해결 결함이 없어 생성하지 않음.
- Git: 사용자 지정 계정명과 인증 일치 확인 전에는 원격 생성·푸시 금지. 공개 저장소, 한글 커밋, 타 계정 인증/전역 설정 변경 금지.
- 다음 안전한 작업: 사용자가 입력한 GitHub 계정으로 인증 계정을 확인하고 공개 HBJangi 저장소 생성·푸시. 이후 실제 사람 대국으로 규칙 사례 보강.
