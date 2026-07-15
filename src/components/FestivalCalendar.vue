<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { categoryDefinitions } from '../data'
import { getFestivals } from '../api/festivals'

const today = new Date()
const viewDate = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const selectedDate = ref(formatDate(today))
const festivals = ref([])
const loading = ref(false)
const error = ref('')
const activeFestival = ref(null)
const loadedYear = ref(null)
const loadedMonth = ref(null)
let latestRequestId = 0
const weekDays = ['일', '월', '화', '수', '목', '금', '토']
const fallbackImage = categoryDefinitions.find((category) => category.slug === 'festival')?.image || ''
const detailLabels = { program: '프로그램', subevent: '부대 행사', sponsor1: '주최', sponsor1tel: '주최 문의', sponsor2: '주관', sponsor2tel: '주관 문의', eventhomepage: '웹사이트', bookingplace: '예매처', agelimit: '관람 연령', festivalgrade: '축제 등급', placeinfo: '행사장 위치 안내', spendtimefestival: '관람 소요 시간', discountinfofestival: '할인 정보', usetimefestival: '이용 요금' }

const year = computed(() => viewDate.value.getFullYear())
const month = computed(() => viewDate.value.getMonth() + 1)
const monthLabel = computed(() => `${year.value}년 ${month.value}월`)
const monthFestivals = computed(() => loadedYear.value === year.value && loadedMonth.value === month.value ? festivals.value : [])
const longRunningFestivals = computed(() => monthFestivals.value.filter((festival) => durationDays(festival) > 31))
const selectedNormalEvents = computed(() => eventsForDate(selectedDate.value))
const selectedLongEvents = computed(() => longRunningFestivals.value.filter((festival) => isActiveOn(festival, selectedDate.value)))
const selectedLabel = computed(() => formatDisplayDate(selectedDate.value))
const calendarDays = computed(() => {
  const firstDay = new Date(year.value, month.value - 1, 1).getDay()
  const lastDate = new Date(year.value, month.value, 0).getDate()
  const previousLastDate = new Date(year.value, month.value - 1, 0).getDate()
  const cells = firstDay + lastDate > 35 ? 42 : 35
  return Array.from({ length: cells }, (_, index) => {
    const offset = index - firstDay + 1
    const date = offset <= 0 ? new Date(year.value, month.value - 2, previousLastDate + offset) : new Date(year.value, month.value - 1, offset)
    const key = formatDate(date)
    return { key, day: date.getDate(), currentMonth: date.getMonth() === month.value - 1, today: key === formatDate(today), events: eventsForDate(key) }
  })
})

function formatDate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
function isValidDate(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) }
function hasValue(value) { return value !== null && value !== undefined && String(value).trim() !== '' }
function isActiveOn(festival, key) { return isValidDate(festival.startDate) && isValidDate(festival.endDate) && festival.startDate <= key && key <= festival.endDate }
function durationDays(festival) { if (!isValidDate(festival.startDate) || !isValidDate(festival.endDate)) return 0; return Math.round((Date.parse(`${festival.endDate}T00:00:00`) - Date.parse(`${festival.startDate}T00:00:00`)) / 86400000) + 1 }
function eventsForDate(key) { return monthFestivals.value.filter((festival) => durationDays(festival) <= 31 && isActiveOn(festival, key)) }
function formatDisplayDate(key) { if (!isValidDate(key)) return ''; const [y, m, d] = key.split('-').map(Number); return `${y}. ${m}. ${d}.` }
function formatPeriod(festival) { return festival.startDate === festival.endDate ? formatDisplayDate(festival.startDate) : `${formatDisplayDate(festival.startDate)} ~ ${formatDisplayDate(festival.endDate)}` }
function detailFields(festival) { return Object.entries(detailLabels).filter(([key]) => hasValue(festival[key])).map(([key, label]) => ({ key, label, value: festival[key] })) }
function isSafeUrl(value) { return typeof value === 'string' && /^https?:\/\//i.test(value.trim()) }
function normalizeImage(url) { return url?.startsWith('http://tong.visitkorea.or.kr/') ? `https://${url.slice(7)}` : url || '' }
function openDetails(festival) { activeFestival.value = festival }
function closeDetails() { activeFestival.value = null }
function handleImageError(event, festival) { const image = event.currentTarget; const stage = image.dataset.stage || 'first'; const next = stage === 'first' ? normalizeImage(festival.firstImage2) : stage === 'second' ? fallbackImage : ''; if (!next || image.dataset.failed === next) { image.style.display = 'none'; return }; image.dataset.stage = stage === 'first' ? 'second' : 'fallback'; image.dataset.failed = next; image.src = next }
async function loadFestivals() { const requestId = ++latestRequestId; const requestYear = year.value; const requestMonth = month.value; loading.value = true; error.value = ''; try { const result = await getFestivals(requestYear, requestMonth); if (requestId !== latestRequestId) return; festivals.value = Array.isArray(result?.items) ? result.items : []; loadedYear.value = requestYear; loadedMonth.value = requestMonth } catch (err) { if (requestId !== latestRequestId) return; error.value = err instanceof Error ? err.message : '축제 일정을 불러오지 못했습니다.' } finally { if (requestId === latestRequestId) loading.value = false } }
function moveMonth(amount) { viewDate.value = new Date(year.value, month.value - 1 + amount, 1); selectedDate.value = formatDate(viewDate.value); loadFestivals() }
function goToday() { viewDate.value = new Date(today.getFullYear(), today.getMonth(), 1); selectedDate.value = formatDate(today); loadFestivals() }
function selectDay(day) { selectedDate.value = day.key; if (!day.currentMonth) { const [y, m] = day.key.split('-').map(Number); viewDate.value = new Date(y, m - 1, 1); loadFestivals() } }
function onKeydown(event) { if (event.key === 'Escape') closeDetails() }
watch(activeFestival, (festival) => { document.body.style.overflow = festival ? 'hidden' : '' })
onMounted(() => { loadFestivals(); window.addEventListener('keydown', onKeydown) })
onBeforeUnmount(() => { window.removeEventListener('keydown', onKeydown); document.body.style.overflow = '' })
</script>

<template>
  <section class="schedule-shell">
    <header class="schedule-topline"><div><span>MONTHLY SCHEDULE</span><h2>{{ monthLabel }}</h2><small>이번 달 축제 {{ monthFestivals.length }}개</small></div><div class="month-control"><button type="button" aria-label="이전 달" @click="moveMonth(-1)">‹</button><button type="button" @click="goToday">오늘</button><button type="button" aria-label="다음 달" @click="moveMonth(1)">›</button></div></header>
    <div v-if="longRunningFestivals.length" class="long-events"><span>이달의 상시·장기 행사</span><button v-for="event in longRunningFestivals" :key="event.title" type="button" @click="openDetails(event)">{{ event.title }} · {{ formatPeriod(event) }}</button></div>
    <div class="schedule-layout"><div class="calendar-wrap" :aria-busy="loading"><div class="week-row"><span v-for="day in weekDays" :key="day">{{ day }}</span></div><div class="month-grid"><button v-for="day in calendarDays" :key="day.key" type="button" class="calendar-day" :class="{ muted: !day.currentMonth, selected: selectedDate === day.key, today: day.today }" @click="selectDay(day)"><span class="day-number">{{ day.day }}<i v-if="day.today">오늘</i></span><span v-for="event in day.events.slice(0, 2)" :key="`${event.title}-${event.startDate}`" class="event-chip" :title="event.title">{{ event.title }}</span><small v-if="day.events.length > 2">+{{ day.events.length - 2 }}개</small></button></div></div>
      <aside class="day-panel"><p>SELECTED DAY</p><h3>{{ selectedLabel }}</h3><small>이날의 행사 {{ selectedNormalEvents.length }}개</small><div v-if="loading && !monthFestivals.length" class="state">축제 일정을 불러오는 중입니다.</div><div v-else-if="error" class="state error"><span>{{ error }}</span><button type="button" @click="loadFestivals">다시 시도</button></div><div v-else-if="!monthFestivals.length" class="state">이번 달에 등록된 축제 일정이 없습니다.</div><template v-else><div v-if="selectedNormalEvents.length" class="event-list"><article v-for="event in selectedNormalEvents" :key="`${event.title}-${event.startDate}`"><strong>{{ event.title }}</strong><small>{{ formatPeriod(event) }}</small><p v-if="hasValue(event.eventplace)">{{ event.eventplace }}</p><p v-else-if="hasValue(event.addr1)">{{ event.addr1 }}</p><button type="button" @click="openDetails(event)">상세 보기</button></article></div><div v-else class="state">등록된 일정이 없어요.<br />다른 날짜를 선택해 보세요.</div><div v-if="selectedLongEvents.length" class="ongoing"><span>진행 중인 장기 행사</span><button v-for="event in selectedLongEvents" :key="event.title" type="button" @click="openDetails(event)">{{ event.title }}</button></div></template></aside></div>
  </section>
  <div v-if="activeFestival" class="modal-backdrop" @click.self="closeDetails"><section class="festival-modal" role="dialog" aria-modal="true" :aria-label="`${activeFestival.title} 상세 정보`"><button class="close-modal" type="button" aria-label="닫기" @click="closeDetails">×</button><div class="modal-image"><img v-if="normalizeImage(activeFestival.firstImage) || normalizeImage(activeFestival.firstImage2) || fallbackImage" :src="normalizeImage(activeFestival.firstImage) || normalizeImage(activeFestival.firstImage2) || fallbackImage" :alt="activeFestival.title" @error="handleImageError($event, activeFestival)" /></div><div class="modal-content"><h2>{{ activeFestival.title }}</h2><p class="period">{{ formatPeriod(activeFestival) }}</p><dl class="summary"><template v-for="field in [['행사 장소', activeFestival.eventplace], ['주소', activeFestival.addr1], ['공연·운영 시간', activeFestival.playtime], ['이용 요금', activeFestival.usetimefestival]]" :key="field[0]"><dt v-if="hasValue(field[1])">{{ field[0] }}</dt><dd v-if="hasValue(field[1])">{{ field[1] }}</dd></template></dl><dl class="details"><template v-for="field in detailFields(activeFestival)" :key="field.key"><dt>{{ field.label }}</dt><dd v-if="field.key === 'eventhomepage' && isSafeUrl(field.value)"><a :href="field.value" target="_blank" rel="noopener noreferrer">{{ field.value }}</a></dd><dd v-else :class="{ program: field.key === 'program' }">{{ field.value }}</dd></template></dl></div></section></div>
</template>

<style scoped>
.schedule-shell{border:1px solid #c8e6fa;border-radius:28px;background:#fff;overflow:hidden;box-shadow:0 24px 70px rgba(45,114,159,.13)}.schedule-topline{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:26px 30px;background:linear-gradient(120deg,#eaf7ff,#b9e0fd)}.schedule-topline span,.day-panel>p{color:#168ac7;font-size:12px;font-weight:900;letter-spacing:.12em}.schedule-topline h2{margin:5px 0;color:#073b66;font-size:clamp(25px,3vw,34px)}.schedule-topline small,.day-panel>small{color:#607d91}.month-control{display:flex;gap:7px}.month-control button,.event-list button,.state button,.ongoing button,.long-events button{border:1px solid #c5deed;border-radius:9px;background:#fff;color:#126fa7;padding:9px 12px;font-weight:800;cursor:pointer}.long-events{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:13px 30px;border-bottom:1px solid #d9ecf8;background:#f8fcff}.long-events span,.ongoing span{color:#607d91;font-size:12px;font-weight:850}.long-events button{padding:6px 9px;font-size:11px}.schedule-layout{display:grid;grid-template-columns:minmax(0,7fr) minmax(270px,3fr)}.calendar-wrap{padding:22px}.week-row,.month-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}.week-row{text-align:center;color:#6990aa;font-size:12px;font-weight:850}.week-row span{padding-bottom:10px}.week-row span:first-child,.calendar-day:nth-child(7n+1) .day-number{color:#d55a67}.week-row span:last-child,.calendar-day:nth-child(7n) .day-number{color:#287fca}.month-grid{border-top:1px solid #d6eaf7;border-left:1px solid #d6eaf7}.calendar-day{min-width:0;min-height:105px;border:0;border-right:1px solid #d6eaf7;border-bottom:1px solid #d6eaf7;background:#fff;padding:8px 6px;text-align:left;cursor:pointer}.calendar-day:hover{background:#f5fbff}.calendar-day.muted{background:#fafcfd;color:#aebdc7}.calendar-day.selected{background:#eaf7ff;box-shadow:inset 0 0 0 2px #4b9ed0}.day-number{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:12px;font-weight:850}.day-number i{border-radius:99px;background:#168ac7;color:#fff;padding:2px 4px;font-size:8px;font-style:normal}.event-chip{display:block;overflow:hidden;margin-top:3px;border-radius:4px;background:#dceffb;padding:4px 5px;color:#155b85;font-size:10px;font-weight:800;text-overflow:ellipsis;white-space:nowrap}.calendar-day small{color:#168ac7;font-size:10px}.day-panel{border-left:1px solid #d6eaf7;background:#f7fcff;padding:24px 20px}.day-panel>p{margin:0}.day-panel h3{margin:6px 0;color:#073b66;font-size:21px}.event-list{display:grid;gap:8px;margin-top:16px}.event-list article{border:1px solid #d5eaf8;border-radius:12px;background:#fff;padding:12px}.event-list strong,.event-list small{display:block}.event-list strong{color:#073b66;font-size:14px}.event-list small,.event-list p{margin:5px 0;color:#607d91;font-size:12px}.event-list button{margin-top:5px;padding:6px 9px;font-size:11px}.state{margin-top:16px;border:1px dashed #b8d9ed;border-radius:12px;padding:18px 10px;color:#7793a6;text-align:center;font-size:13px;line-height:1.6}.state.error{color:#a34848}.ongoing{display:grid;gap:7px;margin-top:16px;border-top:1px solid #d5eaf8;padding-top:14px}.ongoing button{text-align:left;padding:7px 9px;font-size:12px}.modal-backdrop{position:fixed;z-index:100;inset:0;display:grid;place-items:center;padding:20px;background:rgba(7,35,55,.5)}.festival-modal{position:relative;max-width:760px;max-height:calc(100vh - 40px);overflow:auto;border-radius:22px;background:#fff;box-shadow:0 24px 80px rgba(0,0,0,.28)}.close-modal{position:absolute;z-index:1;top:12px;right:12px;width:36px;height:36px;border:0;border-radius:50%;background:rgba(255,255,255,.92);font-size:26px;cursor:pointer}.modal-image{min-height:140px;background:#e7f3f9}.modal-image img{width:100%;max-height:330px;object-fit:cover}.modal-content{padding:24px}.modal-content h2{margin:0;color:#073b66;font-size:clamp(22px,4vw,32px)}.period{color:#168ac7;font-weight:800}.summary,.details{display:grid;grid-template-columns:120px minmax(0,1fr);gap:8px 13px;margin:18px 0}.summary dt,.details dt{color:#607d91;font-size:12px}.summary dd,.details dd{min-width:0;margin:0;color:#315c76;overflow-wrap:anywhere;font-size:13px}.details{border-top:1px solid #e2eef6;padding-top:18px}.details .program{white-space:pre-line}.details a{color:#126fa7}@media(max-width:900px){.schedule-layout{grid-template-columns:1fr}.day-panel{border-top:1px solid #d6eaf7;border-left:0}}@media(max-width:650px){.schedule-topline{align-items:stretch;flex-direction:column;padding:22px 18px}.month-control{justify-content:flex-end}.long-events{padding:12px 18px}.calendar-wrap{overflow-x:auto;padding:10px}.week-row,.month-grid{min-width:560px}.calendar-day{min-height:88px}.event-chip{font-size:9px}.modal-backdrop{align-items:end;padding:0}.festival-modal{width:100%;max-height:88vh;border-radius:22px 22px 0 0}.summary,.details{grid-template-columns:1fr;gap:3px}.summary dt,.details dt{margin-top:7px}}
</style>
