<script setup>
import { computed, ref } from 'vue'
import { createRandomRoute } from '../api/routes'
import TmapRouteMap from './TmapRouteMap.vue'

const routeData = ref(null)
const loading = ref(false)
const errorMessage = ref('')
const places = computed(() => [...(routeData.value?.places || [])].sort((a, b) => a.order - b.order))
const totalDistance = computed(() => `${((Number(routeData.value?.totalDistance) || 0) / 1000).toFixed(1)}km`)
const totalTime = computed(() => {
  const totalMinutes = Math.round((Number(routeData.value?.totalTime) || 0) / 60)
  return `${Math.floor(totalMinutes / 60)}시간 ${totalMinutes % 60}분`
})

async function generateRoute() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await createRandomRoute()
    console.info('[RandomRouteView] Random route API response received.', {
      totalDistance: data?.totalDistance,
      totalTime: data?.totalTime,
      placesCount: data?.places?.length || 0,
      routeFeatureCount: data?.routeGeoJson?.features?.length || 0,
      routeData: data
    })
    if (!data?.routeGeoJson?.features?.length) throw new Error('생성된 경로 정보가 없습니다. 다시 시도해 주세요.')
    if (!data?.places?.length) throw new Error('추천 장소가 없습니다. 다시 시도해 주세요.')
    routeData.value = data
  } catch (error) {
    console.error('[RandomRouteView] Random route generation failed.', error)
    errorMessage.value = error instanceof Error ? error.message : '여행코스를 생성하지 못했습니다.'
    routeData.value = null
  } finally {
    loading.value = false
  }
}

function handleMapError(message) { errorMessage.value = message }
function hideBrokenImage(event) { event.currentTarget.closest('.place-image').classList.add('image-unavailable') }
</script>

<template>
  <section class="random-route-hero">
    <div class="container">
      <p class="route-eyebrow">RANDOM BUSAN TRIP</p>
      <h1>어디부터 갈지 고민될 때,<br />순서대로 따라가는 부산 여행코스</h1>
      <p>버튼 한 번으로 추천받는 랜덤 부산 여행</p>
      <button class="random-route-button" :disabled="loading" @click="generateRoute">
        {{ loading ? '여행코스 생성 중...' : '랜덤 여행코스 생성' }}
      </button>
    </div>
  </section>

  <section class="container random-route-content">
    <p v-if="errorMessage" class="route-error" role="alert">{{ errorMessage }}</p>
    <template v-if="routeData">
      <div class="route-summary" aria-label="여행코스 요약">
        <div><span>총 거리</span><strong>{{ totalDistance }}</strong></div>
        <div><span>총 소요시간</span><strong>{{ totalTime }}</strong></div>
      </div>

      <!-- 반드시 서버 응답의 routeGeoJson.features로 지도 경로를 렌더링합니다. -->
      <TmapRouteMap :route-data="routeData" @error="handleMapError" />

      <section class="recommended-places">
        <div class="route-section-heading"><p>RECOMMENDED PLACES</p><h2>순서대로 방문해 보세요</h2></div>
        <div class="place-grid">
          <article v-for="(place, index) in places" :key="place.placeId || place.order" class="place-card">
            <div class="place-order">{{ place.order || index + 1 }}번째 방문 장소</div>
            <div class="place-image">
              <img v-if="place.firstImage" :src="place.firstImage" :alt="place.name" @error="hideBrokenImage" />
              <span v-else>이미지 준비 중</span>
            </div>
            <div class="place-copy"><h3>{{ place.name }}</h3><p>{{ place.address }}</p></div>
          </article>
        </div>
      </section>
    </template>
    <div v-else-if="!loading && !errorMessage" class="route-empty">랜덤 여행코스를 생성해 부산 여행을 시작해 보세요.</div>
  </section>
</template>
