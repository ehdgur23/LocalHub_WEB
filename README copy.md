# LocalHub 부산 — Vue 홈 화면 시안

Tripadvisor의 상단 검색 중심 구조와 가로형 장소 카드 흐름을 참고하되,
브랜드·색상·콘텐츠 구조는 LocalHub 부산에 맞게 새로 구성했습니다.

## 포함 기능

- 카테고리 탭 + 장소 검색
- 부산 대표 이미지 대형 배너
- 관광지 / 문화시설 / 축제·공연·행사 / 레포츠 / 숙박 / 쇼핑 섹션
- 각 카테고리 가로 스크롤 카드
- 여행코스 지도형 미리보기와 코스 카드
- 장소 기반 리뷰 작성 흐름 안내
- 플로팅 챗봇 UI
- 반응형 모바일 화면

## 실행 방법

```bash
npm install
npm run dev
```

기본 접속 주소는 `http://localhost:5173`입니다.

## 실제 데이터 연동

현재 화면은 `src/data.js`의 목업 데이터를 사용합니다.
FastAPI와 연결할 때는 다음 API를 기준으로 교체하면 됩니다.

- `GET /api/locations`
- `GET /api/events`
- `GET /api/courses`
- `POST /api/posts`
- `POST /api/chat`

프로토타입의 이미지는 Unsplash 원격 이미지를 사용합니다.
최종 제출본에서는 제공 JSON의 이미지나 라이선스를 확인한 이미지로 교체하세요.
