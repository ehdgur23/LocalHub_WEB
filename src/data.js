export const heroImage =
  'https://images.unsplash.com/photo-1701947783953-80bbb7ecdee6?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=2400'

const haeundae =
  'https://images.unsplash.com/photo-1741370386192-81d7e0c79664?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=1600'

const gamcheon =
  'https://images.unsplash.com/photo-1538574027501-286b64ee38f8?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=1600'

const generic = {
  culture: 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=1600&q=80',
  festival: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1600&q=80',
  leisure: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1600&q=80',
  stay: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80',
  shopping: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80'
}

export const categories = [
  {
    slug: 'attraction',
    label: '관광지',
    icon: '⌂',
    subtitle: '부산을 처음 방문한다면 놓치기 어려운 대표 명소',
    items: [
      { title: '해운대해수욕장', area: '해운대구', image: haeundae, rating: 4.8, reviews: 124, text: '부산을 대표하는 해변과 도심 풍경을 한 번에 즐겨보세요.' },
      { title: '감천문화마을', area: '사하구', image: gamcheon, rating: 4.7, reviews: 86, text: '알록달록한 골목과 전망 포인트가 이어지는 마을 여행지.' },
      { title: '광안리해수욕장', area: '수영구', image: heroImage, rating: 4.9, reviews: 173, text: '낮에는 바다, 밤에는 광안대교 야경을 만나는 도심 해변.' },
      { title: '태종대', area: '영도구', image: haeundae, rating: 4.6, reviews: 74, text: '기암절벽과 바다를 따라 걷는 부산의 대표 자연 명소.' }
    ]
  },
  {
    slug: 'culture',
    label: '문화시설',
    icon: '▣',
    subtitle: '전시와 건축, 지역의 이야기를 만나는 문화 공간',
    items: [
      { title: '부산시립미술관', area: '해운대구', image: generic.culture, rating: 4.5, reviews: 52, text: '현대미술 전시와 문화 프로그램을 편안하게 즐겨보세요.' },
      { title: '영화의전당', area: '해운대구', image: generic.festival, rating: 4.7, reviews: 65, text: '독특한 건축미와 다양한 영화 프로그램을 만나는 공간.' },
      { title: '국립해양박물관', area: '영도구', image: heroImage, rating: 4.8, reviews: 91, text: '바다와 해양문화를 전시와 체험으로 만나는 가족 여행 장소.' },
      { title: '부산현대미술관', area: '사하구', image: gamcheon, rating: 4.4, reviews: 43, text: '을숙도의 자연과 동시대 미술을 함께 즐기는 공간.' }
    ]
  },
  {
    slug: 'festival',
    label: '축제·공연·행사',
    icon: '✦',
    subtitle: '날짜를 확인하고 즐기는 부산의 축제와 공연',
    items: [
      { title: '부산바다축제', area: '부산 주요 해수욕장', image: generic.festival, rating: 4.7, reviews: 71, text: '공연과 체험으로 부산의 여름 바다를 즐기는 대표 축제.', period: '2026.08.01 - 08.03' },
      { title: '부산국제록페스티벌', area: '삼락생태공원', image: generic.festival, rating: 4.8, reviews: 95, text: '다양한 아티스트의 무대를 야외에서 즐기는 음악 축제.', period: '2026.09.18 - 09.20' },
      { title: '광안리 드론 라이트쇼', area: '광안리해수욕장', image: heroImage, rating: 4.9, reviews: 188, text: '광안대교를 배경으로 펼쳐지는 부산의 야간 드론 공연.', period: '매주 토요일' },
      { title: '부산불꽃축제', area: '광안리해수욕장', image: heroImage, rating: 4.9, reviews: 241, text: '부산의 밤바다를 화려하게 수놓는 대규모 불꽃 행사.', period: '2026.11 예정' }
    ]
  },
  {
    slug: 'leisure',
    label: '레포츠',
    icon: '◒',
    subtitle: '바다와 도시를 더 활동적으로 즐기는 방법',
    items: [
      { title: '송정 서핑 체험', area: '해운대구', image: generic.leisure, rating: 4.8, reviews: 68, text: '초보자도 강습과 함께 부산 바다에서 서핑을 경험해요.' },
      { title: '해운대 블루라인파크', area: '해운대구', image: haeundae, rating: 4.7, reviews: 143, text: '해안선을 따라 열차와 스카이캡슐로 풍경을 감상해요.' },
      { title: '오륙도 트레킹', area: '남구', image: heroImage, rating: 4.6, reviews: 37, text: '바다 절경을 따라 걸으며 부산의 해안 지형을 만나는 코스.' },
      { title: '광안리 패들보드', area: '수영구', image: generic.leisure, rating: 4.5, reviews: 29, text: '도심 해변에서 가볍게 즐기는 수상 레포츠 프로그램.' }
    ]
  },
  {
    slug: 'stay',
    label: '숙박',
    icon: '▤',
    subtitle: '여행의 하루를 편안하게 마무리할 부산 숙소',
    items: [
      { title: '해운대 오션뷰 호텔', area: '해운대구', image: generic.stay, rating: 4.7, reviews: 112, text: '객실에서 해운대 바다를 바라보며 쉬기 좋은 숙소.' },
      { title: '광안리 감성 스테이', area: '수영구', image: heroImage, rating: 4.6, reviews: 76, text: '광안대교 야경과 가까운 위치의 소규모 감성 숙소.' },
      { title: '영도 바다 게스트하우스', area: '영도구', image: haeundae, rating: 4.4, reviews: 41, text: '여행자들과 부산의 골목과 바다 이야기를 나누는 숙소.' },
      { title: '전포 시티 호텔', area: '부산진구', image: generic.stay, rating: 4.3, reviews: 59, text: '카페거리와 대중교통 이용이 편리한 도심형 숙소.' }
    ]
  },
  {
    slug: 'shopping',
    label: '쇼핑',
    icon: '◇',
    subtitle: '시장부터 복합 쇼핑몰까지 부산에서 만나는 쇼핑',
    items: [
      { title: '신세계 센텀시티', area: '해운대구', image: generic.shopping, rating: 4.6, reviews: 132, text: '쇼핑과 식사, 문화생활을 한곳에서 즐기는 복합시설.' },
      { title: '국제시장', area: '중구', image: gamcheon, rating: 4.5, reviews: 106, text: '다양한 먹거리와 생활용품을 만나는 부산의 대표 시장.' },
      { title: '부평깡통시장', area: '중구', image: generic.shopping, rating: 4.6, reviews: 119, text: '야시장 먹거리와 활기찬 골목 분위기가 매력적인 시장.' },
      { title: '서면 지하상가', area: '부산진구', image: generic.shopping, rating: 4.2, reviews: 47, text: '패션과 잡화를 편리하게 둘러볼 수 있는 도심 쇼핑 공간.' }
    ]
  }
]

export const courses = [
  { title: '부산 바다 하루 코스', theme: '바다 · 산책', duration: '약 6시간', image: heroImage, stops: ['광안리', '해운대', '청사포', '송정'] },
  { title: '원도심 문화 산책', theme: '문화 · 골목', duration: '약 5시간', image: gamcheon, stops: ['감천문화마을', '국제시장', '흰여울', '영도'] },
  { title: '부산 야경 집중 코스', theme: '야경 · 사진', duration: '약 4시간', image: haeundae, stops: ['더베이101', '해운대', '민락수변공원', '광안리'] }
]
