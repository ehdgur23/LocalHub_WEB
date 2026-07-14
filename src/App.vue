<script setup>
import { computed, ref } from 'vue'
import { categories, courses, heroImage } from './data'
import FestivalCalendar from './components/FestivalCalendar.vue'
import ReviewBoard from './components/ReviewBoard.vue'
import buriburiLogo from './assets/buriburi-logo.png'

const currentView = ref('home')
const chatOpen = ref(false)
const chatText = ref('')
const chatMessages = ref([
  { from: 'bot', text: '안녕하세요! 부산 장소, 축제, 여행코스를 물어보세요.' }
])

const homeCategories = computed(() => categories)
const festivalCategory = computed(() => categories.find((category) => category.slug === 'festival'))

function scrollSection(slug, amount) {
  document.querySelector(`#track-${slug}`)?.scrollBy({ left: amount, behavior: 'smooth' })
}

function changeView(view) {
  currentView.value = view
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function sendChat() {
  const value = chatText.value.trim()
  if (!value) return
  chatMessages.value.push({ from: 'user', text: value })
  chatText.value = ''
  window.setTimeout(() => {
    chatMessages.value.push({
      from: 'bot',
      text: '현재는 프론트 시안의 예시 답변입니다. FastAPI /api/chat과 연결하면 부산 데이터 기반 답변을 제공할 수 있어요.'
    })
  }, 350)
}
</script>

<template>
  <header class="header">
    <div class="container header-inner">
      <a class="brand" href="#top" aria-label="BURIBURI 홈" @click.prevent="changeView('home')">
        <img :src="buriburiLogo" alt="BURIBURI" />
      </a>
      <nav>
        <button :class="{ active: currentView === 'reviews' }" @click="changeView('reviews')">리뷰 게시판</button>
        <button :class="{ active: currentView === 'courses' }" @click="changeView('courses')">여행코스</button>
        <button :class="{ active: currentView === 'festival' }" @click="changeView('festival')">축제 일정</button>
      </nav>
    </div>
  </header>

  <main id="top">
    <section v-if="currentView === 'home'" class="hero">
      <div class="container hero-inner">
        <p class="eyebrow">부산의 장소와 사람을 연결하는 로컬 커뮤니티</p>
        <h1>부산, 어디부터 가볼까요?</h1>
        <p class="hero-copy">
          관광지부터 문화시설, 축제, 레포츠, 숙박, 쇼핑, 음식점까지<br />
          부산의 장소 정보와 실제 방문 후기를 한곳에서 만나보세요.
        </p>
      </div>
    </section>

    <ReviewBoard v-if="currentView === 'reviews'" :categories="categories" />

    <template v-if="currentView === 'home'">
    <section class="container busan-banner">
      <div class="banner" :style="{ backgroundImage: `url(${heroImage})` }">
        <div class="banner-shade"></div>
        <div class="banner-copy">
          <p>LOCALHUB BUSAN</p>
          <h2>바다와 도시가 만나는 곳,<br />부산을 더 깊게 발견하세요.</h2>
          <div>
            <a href="#places">부산 장소 둘러보기</a>
          </div>
        </div>
        <div class="banner-badge"><strong>7</strong><span>개의 카테고리</span></div>
      </div>
    </section>

    <section id="places" class="container intro">
      <p>EXPLORE BUSAN</p>
      <h2>관심 있는 카테고리부터 부산을 둘러보세요.</h2>
    </section>

    <section
      v-for="category in homeCategories"
      :key="category.slug"
      class="container category-section"
    >
      <div class="section-title">
        <div>
          <p>{{ category.label }}</p>
          <h2>{{ category.subtitle }}</h2>
        </div>
        <div class="section-buttons">
          <button @click="scrollSection(category.slug, -590)">←</button>
          <button @click="scrollSection(category.slug, 590)">→</button>
        </div>
      </div>

      <div :id="`track-${category.slug}`" class="card-track">
        <article v-for="place in category.items" :key="place.title" class="card">
          <div class="card-image">
            <img :src="place.image" :alt="place.title" loading="lazy" />
            <button class="heart" aria-label="저장">♡</button>
            <span>{{ category.label }}</span>
          </div>
          <p class="area">{{ place.area }}</p>
          <h3>{{ place.title }}</h3>
          <p class="card-text">{{ place.text }}</p>
          <p v-if="place.period" class="period">{{ place.period }}</p>
          <div class="rating">
            <strong>{{ place.rating.toFixed(1) }}</strong>
            <i v-for="n in 5" :key="n"></i>
            <span>({{ place.reviews }})</span>
          </div>
        </article>
      </div>
    </section>
    </template>

    <section v-if="currentView === 'courses'" class="page-heading container">
      <p>TRIP COURSE</p>
      <h1>부산 여행코스</h1>
      <span>테마와 동선을 확인하고 나에게 맞는 부산 여행을 골라보세요.</span>
    </section>

    <section v-if="currentView === 'courses'" id="courses" class="course-section standalone">
      <div class="container">
        <div class="course-heading">
          <div>
            <p>TRIP COURSE</p>
            <h2>어디부터 갈지 고민될 때,<br />순서대로 따라가는 부산 여행코스</h2>
          </div>
          <a href="#course-list">모든 코스 보기 →</a>
        </div>

        <div class="course-layout">
          <div class="route-map">
            <div class="map-grid"></div>
            <svg viewBox="0 0 600 410" aria-hidden="true">
              <path
                d="M90 315 C160 250, 155 155, 278 165 S420 120, 510 70"
                fill="none"
                stroke="#16e1b2"
                stroke-width="10"
                stroke-linecap="round"
                stroke-dasharray="2 18"
              />
            </svg>
            <span class="marker m1">1</span>
            <span class="marker m2">2</span>
            <span class="marker m3">3</span>
            <span class="marker m4">4</span>
            <div class="route-caption">
              <strong>부산 바다 하루 코스</strong>
              <span>광안리 → 해운대 → 청사포 → 송정</span>
            </div>
          </div>

          <div id="course-list" class="course-list">
            <article v-for="course in courses" :key="course.title" class="course-card">
              <img :src="course.image" :alt="course.title" />
              <div>
                <p>{{ course.theme }} · {{ course.duration }}</p>
                <h3>{{ course.title }}</h3>
                <ol>
                  <li v-for="(stop, index) in course.stops" :key="stop">
                    {{ index + 1 }}. {{ stop }}
                  </li>
                </ol>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>

    <template v-if="currentView === 'festival' && festivalCategory">
      <section class="page-heading container">
        <p>FESTIVAL & EVENTS</p>
        <h1>부산 축제 일정</h1>
        <span>부산 곳곳에서 열리는 축제와 공연 일정을 한눈에 확인해 보세요.</span>
      </section>

      <section class="container calendar-section">
        <FestivalCalendar :festivals="festivalCategory.items" />
      </section>
    </template>

  </main>

  <button class="chat-fab" @click="chatOpen = !chatOpen">
    <span>💬</span><strong>여행 질문</strong>
  </button>

  <transition name="chat">
    <section v-if="chatOpen" class="chat">
      <header>
        <div><strong>LocalHub 챗봇</strong><small>부산 정보를 물어보세요</small></div>
        <button @click="chatOpen = false">×</button>
      </header>
      <div class="messages">
        <p v-for="(message, index) in chatMessages" :key="index" :class="message.from">
          {{ message.text }}
        </p>
      </div>
      <form @submit.prevent="sendChat">
        <input v-model="chatText" placeholder="예: 8월 축제 알려줘" />
        <button>전송</button>
      </form>
    </section>
  </transition>
</template>
