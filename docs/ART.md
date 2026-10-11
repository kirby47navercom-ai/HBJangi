# 판과 기물 아트 기준

배경 그림·캐릭터·풍경 없이 장기판 자체가 중심이다. 서브컬처 느낌은 상아색 판면과 옻칠색 입체 받침, 청록·홍색 궁성 구획과 상감 문양, 금색 테두리, 은색/황동색 팔각 기물에 적용한다. 작은 문양은 외곽에 두어 교차점과 이동 표시를 가리지 않는다. 카메라는 좌우 회전 없는 65도 직교이며 한자 기물은 각 진영을 향한다.

3D 모델은 tools/models.mjs, 한자와 판 텍스처는 tools/textures.py로 직접 작성한다. Windows 맑은 고딕의 래스터 결과만 사용하며 글꼴 파일은 배포하지 않는다. 캐릭터 일러스트와 관련 모델은 제거했다. UI의 수제 밑줄·패널·깃발 프레임도 제거했다. 화면 바탕은 그림 없는 일정한 청록색이다.

## 생성 UI 아트

내장 ImageGen 도구로 생성한 투명 PNG: Assets/Art/PorcelainButton.png. 생성 알파를 보존하여 원본을 복사했다. 백자·청옥·금색 버튼 위에 실제 엔진 버튼과 한국어 텍스트를 배치해 대국 상태/접근성/입력을 유지한다.

최종 생성 프롬프트:

Create one production-ready game UI button asset, isolated on a truly transparent background. Original premium Korean fantasy anime/subculture strategy board-game art direction, elegant ivory porcelain button with softly rounded sculpted edges, luminous pale celadon jade inlay along the perimeter, tiny warm champagne-gold fittings, one subtle sculpted plum-blossom motif integrated at the left end. Wide horizontal pill / ceramic plaque silhouette, width to height ratio 3:1, centered, fills most of canvas. Large clean empty ivory center for readable live game text, no lettering at all. Beautiful finely painted 2D game UI sprite with convincing soft bevels and dimensional highlights, refined restrained finish, cohesive pastel ivory, pale jade, warm gold. This is an actual clickable button art asset, not a UI mockup. No characters, no scenery, no backdrop, no multiple assets, no sample text, no icons in the center, no ornamental lines outside the shape, no harsh wire frames, no angular polygons, no stars, no purple neon. Transparent alpha around entire isolated button.
