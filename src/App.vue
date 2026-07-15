<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { categoryDefinitions, courses, heroImage } from './data'
import { sendChatMessage } from './api/chat'
import { getPlacesByCategory } from './api/places'
import FestivalCalendar from './components/FestivalCalendar.vue'
import ReviewBoard from './components/ReviewBoard.vue'
import buriburiLogo from './assets/buriburi-logo.png'

const currentView = ref('home')
const homeQuery = ref('')
const reviewBoard = ref(null)
const chatOpen = ref(false)
const chatText = ref('')
const chatLoading = ref(false)
const categoryTracks = new Map()
const categories = ref(categoryDefinitions.map((category) => ({
  ...category,
  items: [],
  currentIndex: 0,
  nextPage: 1,
  totalPages: 0,
  loadingInitial: false,
  loadingMore: false,
  error: '',
  moreError: '',
  loadedPages: [],
  isNavigating: false
})))
const chatMessages = ref([
  { from: 'bot', text: '안녕하세요! 부산 장소, 축제, 여행코스를 물어보세요.' }
])

const homeCategories = computed(() => categories.value)
const festivalCategory = computed(() => categories.value.find((category) => category.slug === 'festival'))
const searchablePlaces = computed(() => categories.value.flatMap((category) =>
  category.items.map((place) => ({ ...place, category: category.label, slug: category.slug }))
))
const homeSearchResults = computed(() => {
  const keyword = homeQuery.value.trim().toLowerCase()
  if (!keyword) return []
  return searchablePlaces.value.filter((place) =>
    `${place.title} ${place.area} ${place.category} ${place.text}`.toLowerCase().includes(keyword)
  )
})

function toPlace(item, category) {
  const rating = Number(item.avg_rating ?? 0)
  const reviews = Number(item.post_cnt ?? 0)

  return {
    title: item.title,
    contentId: String(item.content_id),
    area: item.address,
    image: normalizeImageUrl(item.first_image) || category.image,
    fallbackImage: category.image,
    rating: Number.isFinite(rating) ? rating : 0,
    reviews: Number.isFinite(reviews) ? reviews : 0,
    text: item.address,
    category: item.category || category.label,
    slug: category.slug
  }
}

function normalizeImageUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://tong.visitkorea.or.kr/')) {
    return `https://${url.slice('http://'.length)}`
  }
  return url
}

function handlePlaceImageError(event, fallbackImage) {
  const image = event.currentTarget
  if (image.dataset.fallbackApplied === 'true') return

  image.dataset.fallbackApplied = 'true'
  if (!fallbackImage) {
    image.style.display = 'none'
    return
  }
  image.src = fallbackImage
}

async function loadInitialCategory(category) {
  if (category.loadingInitial || category.loadedPages.includes(1)) return

  category.loadingInitial = true
  category.error = ''
  try {
    const result = await getPlacesByCategory(category.contentTypeId, 1)
    category.items = result.items.map((item) => toPlace(item, category))
    category.currentIndex = 0
    category.loadedPages = [result.page]
    category.totalPages = result.total_pages
    category.nextPage = result.page < result.total_pages ? result.page + 1 : null
  } catch (error) {
    category.error = error instanceof Error ? error.message : '장소 목록을 불러오지 못했습니다.'
  } finally {
    category.loadingInitial = false
    await nextTick()
  }
}

function mergeCategoryItems(category, items) {
  const existingContentIds = new Set(category.items.map((item) => item.contentId))
  category.items.push(...items.filter((item) => !existingContentIds.has(item.contentId)))
}

async function loadNextCategoryPage(category) {
  const page = category.nextPage
  if (!page || category.loadingMore || category.loadedPages.includes(page)) return false

  category.loadingMore = true
  category.moreError = ''
  try {
    const result = await getPlacesByCategory(category.contentTypeId, page)
    mergeCategoryItems(category, result.items.map((item) => toPlace(item, category)))
    category.loadedPages.push(result.page)
    category.totalPages = result.total_pages
    category.nextPage = result.page < result.total_pages ? result.page + 1 : null
    return true
  } catch (error) {
    category.moreError = error instanceof Error ? error.message : '다음 장소를 불러오지 못했습니다.'
    return false
  } finally {
    category.loadingMore = false
    await nextTick()
  }
}

function setCategoryTrack(slug, element) {
  if (element) categoryTracks.set(slug, element)
  else categoryTracks.delete(slug)
}

function getCardStep(track) {
  const card = track.querySelector('.card')
  if (!card) return 0

  const styles = getComputedStyle(track)
  const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0
  return card.getBoundingClientRect().width + gap
}

function scrollToCategoryIndex(category) {
  const track = categoryTracks.get(category.slug)
  if (!track) return

  const step = getCardStep(track)
  if (!step) return

  track.scrollTo({
    left: category.currentIndex * step,
    behavior: 'smooth'
  })
}

function syncCategoryIndexFromScroll(category) {
  const track = categoryTracks.get(category.slug)
  if (!track) return

  const step = getCardStep(track)
  if (!step) return

  category.currentIndex = Math.max(0, Math.min(
    Math.round(track.scrollLeft / step),
    Math.max(category.items.length - 1, 0)
  ))
}

async function scrollCategory(category, direction) {
  if (category.isNavigating) return

  if (direction < 0) {
    if (category.currentIndex === 0) return
    category.currentIndex -= 1
    category.isNavigating = true
    scrollToCategoryIndex(category)
    window.setTimeout(() => { category.isNavigating = false }, 350)
    return
  }

  const targetIndex = category.currentIndex + 1
  if (targetIndex >= category.items.length) {
    const loaded = await loadNextCategoryPage(category)
    if (!loaded || targetIndex >= category.items.length) return
  }

  category.currentIndex = targetIndex
  category.isNavigating = true
  scrollToCategoryIndex(category)
  window.setTimeout(() => { category.isNavigating = false }, 350)
}

function handleCategoryScroll(category) {
  syncCategoryIndexFromScroll(category)
  const track = categoryTracks.get(category.slug)
  if (!track || category.loadingMore || !category.nextPage) return

  if (category.items.length - category.currentIndex <= 2) loadNextCategoryPage(category)
}

function syncAllCategoryIndexes() {
  categories.value.forEach(syncCategoryIndexFromScroll)
}

onMounted(() => {
  categories.value.forEach(loadInitialCategory)
  window.addEventListener('resize', syncAllCategoryIndexes)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncAllCategoryIndexes)
})

function changeView(view) {
  currentView.value = view
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function goHome() {
  homeQuery.value = ''
  changeView('home')
}

async function openPlaceReviews(place) {
  currentView.value = 'detail'
  await nextTick()
  reviewBoard.value?.openPlace(place)
  window.scrollTo({ top: 0 })
}

function goBackFromDetail() {
  currentView.value = 'home'
  window.scrollTo({ top: 0 })
}

async function sendChat() {
  const value = chatText.value.trim()
  if (!value || chatLoading.value) return

  chatMessages.value.push({ from: 'user', text: value })
  chatText.value = ''
  chatLoading.value = true

  const loadingIndex = chatMessages.value.length
  chatMessages.value.push({
    from: 'bot',
    text: '답변을 불러오는 중입니다...',
    loading: true
  })

  try {
    const answer = await sendChatMessage(value)
    chatMessages.value[loadingIndex] = { from: 'bot', text: answer }
  } catch (error) {
    chatMessages.value[loadingIndex] = {
      from: 'bot',
      text: error instanceof Error ? error.message : '챗봇 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'
    }
  } finally {
    chatLoading.value = false
  }
}
</script>

<template>
  <header class="header">
    <div class="container header-inner">
      <a class="brand" href="#top" aria-label="BURIBURI 홈" @click.prevent="goHome">
        <img :src="buriburiLogo" alt="BURIBURI" />
      </a>
      <nav>
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
          관광지부터 문화시설, 축제, 레포츠, 숙박, 쇼핑까지<br />
          부산의 장소 정보와 실제 방문 후기를 한곳에서 만나보세요.
        </p>
        <div class="search">
          <span aria-hidden="true">⌕</span>
          <input v-model="homeQuery" type="search" placeholder="장소명, 지역, 카테고리를 입력하세요" aria-label="부산 장소 검색" />
          <button v-if="homeQuery" class="clear-search" type="button" aria-label="검색어 지우기" title="검색어 지우기" @click="homeQuery = ''">×</button>
        </div>
      </div>
    </section>

    <template v-if="currentView === 'home' && homeQuery.trim()">
    <section v-if="homeQuery.trim()" class="container result-section">
      <div class="section-title"><div><p>SEARCH RESULT</p><h2>‘{{ homeQuery }}’ 검색 결과 {{ homeSearchResults.length }}곳</h2></div></div>
      <div v-if="homeSearchResults.length" class="result-grid">
        <article v-for="place in homeSearchResults" :key="`${place.slug}-${place.contentId}`" class="card clickable-card" tabindex="0" role="button" @click="openPlaceReviews(place)" @keydown.enter="openPlaceReviews(place)">
          <div class="card-image"><img :src="place.image" :alt="place.title" @error="handlePlaceImageError($event, place.fallbackImage)" /><span>{{ place.category }}</span></div>
          <p class="area">{{ place.area }}</p><h3>{{ place.title }}</h3>
          <div class="rating">★ {{ place.rating.toFixed(1) }} · 리뷰 {{ place.reviews }}개</div>
        </article>
      </div>
      <div v-else class="empty">입력한 조건에 맞는 장소가 없습니다.</div>
    </section>
    </template>

    <ReviewBoard
      v-if="currentView === 'detail'"
      ref="reviewBoard"
      :categories="categories"
      detail-only
      show-back
      @back="goBackFromDetail"
    />

    <template v-if="currentView === 'home' && !homeQuery.trim()">
    <section class="container busan-banner">
      <div class="banner" :style="{ backgroundImage: `url(${heroImage})` }">
        <div class="banner-shade"></div>
        <div class="banner-copy">
          <p>BUSAN REVIEW, BURIBURI</p>
          <h2>바다와 도시가 만나는 곳,<br />부산을 더 깊게 발견하세요.</h2>
        </div>
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
          <button type="button" :disabled="category.currentIndex === 0 || category.isNavigating" :aria-label="`${category.label} 이전 장소`" @click="scrollCategory(category, -1)">‹</button>
          <button type="button" :disabled="category.isNavigating || category.loadingMore || (category.currentIndex >= category.items.length - 1 && !category.nextPage)" :aria-label="`${category.label} 다음 장소`" :aria-busy="category.loadingMore" @click="scrollCategory(category, 1)">›</button>
        </div>
      </div>

      <div v-if="category.loadingInitial && !category.items.length" class="category-state">장소 목록을 불러오는 중입니다.</div>
      <div v-else-if="category.error && !category.items.length" class="category-state"><span>{{ category.error }}</span><button type="button" @click="loadInitialCategory(category)">다시 시도</button></div>
      <div v-else-if="!category.items.length" class="category-state">표시할 장소가 없습니다.</div>
      <div v-else :id="`track-${category.slug}`" class="card-track" :ref="(element) => setCategoryTrack(category.slug, element)" @scroll.passive="handleCategoryScroll(category)">
        <article
          v-for="place in category.items"
          :key="`${category.slug}-${place.contentId}`"
          class="card clickable-card"
          tabindex="0"
          role="button"
          @click="openPlaceReviews({ ...place, category: category.label, slug: category.slug })"
          @keydown.enter="openPlaceReviews({ ...place, category: category.label, slug: category.slug })"
        >
          <div class="card-image">
            <img :src="place.image" :alt="place.title" :loading="category.items.indexOf(place) < 4 ? 'eager' : 'lazy'" @error="handlePlaceImageError($event, place.fallbackImage)" />
            <span>{{ category.label }}</span>
          </div>
          <p class="area">{{ place.area }}</p>
          <h3>{{ place.title }}</h3>
          <p v-if="place.period" class="period">{{ place.period }}</p>
          <div class="rating">★ {{ place.rating.toFixed(1) }} · 리뷰 {{ place.reviews }}개</div>
        </article>
      </div>
      <div v-if="category.loadingMore" class="category-more-status" aria-live="polite">다음 장소를 불러오는 중입니다.</div>
      <div v-else-if="category.moreError" class="category-more-status category-more-error" aria-live="polite"><span>{{ category.moreError }}</span><button type="button" @click="loadNextCategoryPage(category)">다시 시도</button></div>
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
        <div><strong>BURIBURI 챗봇</strong><small>부산 정보를 물어보세요</small></div>
        <button @click="chatOpen = false">×</button>
      </header>
      <div class="messages">
        <p
          v-for="(message, index) in chatMessages"
          :key="index"
          :class="[message.from, { loading: message.loading }]"
        >
          {{ message.text }}
        </p>
      </div>
      <form @submit.prevent="sendChat">
        <input v-model="chatText" :disabled="chatLoading" placeholder="예: 8월 축제 알려줘" />
        <button :disabled="chatLoading || !chatText.trim()">전송</button>
      </form>
    </section>
  </transition>
</template>
