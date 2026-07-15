<script setup>
import { computed, reactive, ref } from 'vue'
import {
  createPost,
  deletePost,
  getPost,
  getPostImageUrl,
  getPosts,
  searchPlaces,
  updatePost,
  verifyPostPassword
} from '../api/review'

const props = defineProps({
  categories: {
    type: Array,
    required: true
  },
  detailOnly: Boolean,
  showBack: Boolean
})
const emit = defineEmits(['detail-change', 'back'])

const selectedCategory = ref('all')
const query = ref('')
const selectedPlace = ref(null)
const backendPlaceId = ref(null)
const formOpen = ref(false)
const editingId = ref(null)
const fileInput = ref(null)
const reviews = ref([])
const loading = ref(false)
const error = ref('')
const actionError = ref('')
const submitting = ref(false)
const deletingId = ref(null)
const verifyingReviewId = ref(null)
const requestToken = ref(0)

const form = reactive({
  nickname: '',
  title: '',
  body: '',
  rating: 5,
  password: '',
  imageFile: null,
  imagePreview: null
})

const allPlaces = computed(() =>
  props.categories.flatMap((category) =>
    category.items.map((place) => ({ ...place, category: category.label, slug: category.slug }))
  )
)

const filteredPlaces = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return allPlaces.value.filter((place) => {
    const categoryMatch = selectedCategory.value === 'all' || place.slug === selectedCategory.value
    const keywordMatch = !keyword || `${place.title} ${place.area} ${place.category}`.toLowerCase().includes(keyword)
    return categoryMatch && keywordMatch
  })
})

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('ko-KR').format(date).replaceAll(' ', '').replace(/\.$/, '')
}

function toReview(listItem, detail) {
  const firstImage = detail.images?.[0]
  return {
    id: detail.id,
    title: detail.title,
    body: detail.content,
    nickname: detail.nickname,
    rating: detail.rating,
    date: formatDate(listItem.created_at),
    image: firstImage ? getPostImageUrl(firstImage.image_id) : null
  }
}

async function loadReviews(place = selectedPlace.value) {
  const token = requestToken.value + 1
  requestToken.value = token
  loading.value = true
  error.value = ''
  actionError.value = ''
  reviews.value = []
  backendPlaceId.value = null

  try {
    if (!place?.contentId || !place?.title) {
      throw new Error('장소 정보가 올바르지 않습니다.')
    }

    const backendPlace = await resolveBackendPlace(place)
    if (requestToken.value !== token) return

    backendPlaceId.value = backendPlace.id
    const list = await getPosts(backendPlace.id)
    const details = await Promise.all(list.items.map((item) => getPost(item.id)))
    if (requestToken.value !== token) return

    const detailsById = new Map(details.map((detail) => [detail.id, detail]))
    reviews.value = list.items
      .map((item) => toReview(item, detailsById.get(item.id)))
      .filter(Boolean)
  } catch (err) {
    if (requestToken.value === token) {
      error.value = err instanceof Error ? err.message : '리뷰를 불러오지 못했습니다.'
    }
  } finally {
    if (requestToken.value === token) {
      loading.value = false
    }
  }
}

async function resolveBackendPlace(place) {
  const places = await searchPlaces(place.title)
  const backendPlace = places.find((item) => String(item.content_id) === String(place.contentId))

  if (!backendPlace) {
    throw new Error(`${place.title} 장소 정보를 찾을 수 없습니다.`)
  }

  return backendPlace
}

function selectPlace(place) {
  selectedPlace.value = place
  emit('detail-change', true)
  formOpen.value = false
  verifyingReviewId.value = null
  resetForm()
  loadReviews(place)
  window.setTimeout(() => document.querySelector('#place-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
}

function openPlace(place) {
  const matched = allPlaces.value.find((item) => item.contentId === place.contentId || item.title === place.title) || place
  selectPlace(matched)
}

defineExpose({ openPlace })

function resetForm() {
  form.nickname = ''
  form.title = ''
  form.body = ''
  form.rating = 5
  form.password = ''
  form.imageFile = null
  form.imagePreview = null
  editingId.value = null
  if (fileInput.value) fileInput.value.value = ''
}

function openWriteForm() {
  resetForm()
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  resetForm()
}

function handleImage(event) {
  const file = event.target.files?.[0]
  if (!file) {
    form.imageFile = null
    form.imagePreview = null
    return
  }

  form.imageFile = file
  const reader = new FileReader()
  reader.onload = () => {
    form.imagePreview = reader.result
  }
  reader.readAsDataURL(file)
}

function buildFormData() {
  const formData = new FormData()
  if (!editingId.value) {
    formData.append('place_id', String(backendPlaceId.value))
    formData.append('nickname', form.nickname.trim())
    formData.append('password', form.password)
  }
  formData.append('title', form.title.trim())
  formData.append('content', form.body.trim())
  formData.append('rating', String(Number(form.rating)))
  if (form.imageFile) {
    formData.append('images', form.imageFile)
  }
  return formData
}

async function submitReview() {
  if (!selectedPlace.value || !backendPlaceId.value || submitting.value) return
  if (!form.title.trim() || !form.body.trim()) return
  if (!editingId.value && !form.password.trim()) return
  if (!editingId.value && !form.nickname.trim()) return

  submitting.value = true
  actionError.value = ''
  const wasEditing = Boolean(editingId.value)
  try {
    if (editingId.value) {
      await updatePost(editingId.value, buildFormData())
    } else {
      await createPost(buildFormData())
    }
    closeForm()
    await loadReviews()
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : '리뷰를 저장하지 못했습니다.'
    if (wasEditing) {
      closeForm()
    }
  } finally {
    submitting.value = false
  }
}

async function editReview(review) {
  if (verifyingReviewId.value) return

  const password = window.prompt('작성할 때 입력한 비밀번호를 입력해 주세요.')
  if (password === null) return
  if (!password.trim()) {
    const message = '비밀번호를 입력해 주세요.'
    actionError.value = message
    window.alert(message)
    return
  }

  verifyingReviewId.value = review.id
  actionError.value = ''
  try {
    await verifyPostPassword(review.id, password)
  } catch (err) {
    const message = err instanceof Error ? err.message : '비밀번호를 확인하지 못했습니다.'
    actionError.value = message
    window.alert(message)
    return
  } finally {
    verifyingReviewId.value = null
  }

  editingId.value = review.id
  form.nickname = review.nickname
  form.title = review.title
  form.body = review.body
  form.rating = review.rating
  form.password = ''
  form.imageFile = null
  form.imagePreview = review.image
  formOpen.value = true
  if (fileInput.value) fileInput.value.value = ''
}

async function removeReview(review) {
  const password = window.prompt('리뷰를 삭제하려면 비밀번호를 입력해 주세요.')
  if (password === null || deletingId.value) return
  if (!password.trim()) {
    const message = '비밀번호를 입력해 주세요.'
    actionError.value = message
    window.alert(message)
    return
  }

  deletingId.value = review.id
  actionError.value = ''
  try {
    await verifyPostPassword(review.id, password)
    await deletePost(review.id)
    await loadReviews()
  } catch (err) {
    const message = err instanceof Error ? err.message : '리뷰를 삭제하지 못했습니다.'
    actionError.value = message
    window.alert(message)
  } finally {
    deletingId.value = null
  }
}

function handleBrokenImage(event) {
  event.currentTarget.style.display = 'none'
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
</script>

<template>
  <div class="review-page" :class="{ 'detail-only': detailOnly }">
    <section v-if="!detailOnly" class="review-hero">
      <div class="container">
        <p>LOCAL REVIEW BOARD</p>
        <h1>부산의 진짜 경험을<br />장소별로 만나보세요.</h1>
        <span>먼저 장소를 선택하면 방문자 리뷰를 확인하고 새로운 후기를 남길 수 있어요.</span>

        <div class="review-search">
          <span>⌕</span>
          <input v-model="query" type="search" placeholder="해운대, 부산 감천문화마을 등 장소 검색" />
          <button @click="query = ''">초기화</button>
        </div>
      </div>
    </section>

    <section v-if="!detailOnly" class="container place-step">
      <div class="step-heading">
        <span>STEP 01</span>
        <div>
          <h2>리뷰를 확인할 장소를 선택하세요</h2>
          <p>부산 공공데이터 기반 {{ categories.length }}개 카테고리 장소입니다.</p>
        </div>
      </div>

      <div class="category-filter">
        <button :class="{ active: selectedCategory === 'all' }" @click="selectedCategory = 'all'">전체</button>
        <button
          v-for="category in categories"
          :key="category.slug"
          :class="{ active: selectedCategory === category.slug }"
          @click="selectedCategory = category.slug"
        >
          {{ category.icon }} {{ category.label }}
        </button>
      </div>

      <div v-if="filteredPlaces.length" class="place-grid">
        <button
          v-for="place in filteredPlaces"
          :key="place.contentId"
          class="place-option"
          :class="{ selected: selectedPlace?.contentId === place.contentId }"
          @click="selectPlace(place)"
        >
          <img :src="place.image" :alt="place.title" @error="handlePlaceImageError($event, place.fallbackImage)" />
          <span>
            <small>{{ place.category }} · {{ place.area }}</small>
            <strong>{{ place.title }}</strong>
            <i>리뷰 {{ place.reviews }}개</i>
          </span>
          <b>→</b>
        </button>
      </div>
      <div v-else class="place-empty">검색 조건에 맞는 장소가 없습니다.</div>
    </section>

    <section v-if="selectedPlace" id="place-reviews" class="selected-section">
      <div class="container">
        <button v-if="showBack" class="detail-back" type="button" @click="emit('back')">
          <span aria-hidden="true">←</span> 이전
        </button>
        <div class="selected-place">
          <img :src="selectedPlace.image" :alt="selectedPlace.title" @error="handlePlaceImageError($event, selectedPlace.fallbackImage)" />
          <div>
            <span>{{ selectedPlace.category }} · {{ selectedPlace.area }}</span>
            <h2>{{ selectedPlace.title }}</h2>
            <p>{{ selectedPlace.text }}</p>
            <div v-if="selectedPlace.rating > 0"><strong>★ {{ selectedPlace.rating.toFixed(1) }}</strong><small>공공데이터 장소 정보</small></div>
          </div>
        </div>

        <div class="review-title-row">
          <div>
            <h2>방문자 리뷰 <span>{{ reviews.length }}</span></h2>
          </div>
          <button class="write-button" :disabled="loading || !backendPlaceId" @click="openWriteForm">＋ 리뷰 작성</button>
        </div>

        <div v-if="actionError" class="review-state error-state">
          <strong>{{ actionError }}</strong>
        </div>
        <div v-if="loading" class="review-state">리뷰를 불러오는 중입니다.</div>
        <div v-else-if="error" class="review-state error-state">
          <strong>{{ error }}</strong>
          <button type="button" @click="loadReviews()">다시 시도</button>
        </div>

        <form v-if="formOpen" class="review-form" @submit.prevent="submitReview">
          <div class="form-heading">
            <div><span>WRITE A REVIEW</span><h3>{{ editingId ? '리뷰 수정하기' : `${selectedPlace.title} 리뷰 작성` }}</h3></div>
            <button type="button" :disabled="submitting" @click="closeForm">×</button>
          </div>
          <label v-if="!editingId">
            <span>닉네임</span>
            <input v-model="form.nickname" required maxlength="30" placeholder="닉네임 입력" />
          </label>
          <label>
            <span>제목</span>
            <input v-model="form.title" required maxlength="60" placeholder="방문 경험이 드러나는 제목을 적어주세요" />
          </label>
          <label>
            <span>방문 후기</span>
            <textarea v-model="form.body" required rows="6" placeholder="장소의 분위기와 이용 팁을 공유해 주세요"></textarea>
          </label>
          <div class="form-row">
            <label>
              <span>평점</span>
              <select v-model="form.rating">
                <option v-for="score in [5,4,3,2,1]" :key="score" :value="score">{{ score }}점</option>
              </select>
            </label>
            <label v-if="!editingId">
              <span>수정·삭제 비밀번호</span>
              <input v-model="form.password" required type="password" maxlength="20" placeholder="비밀번호 입력" />
            </label>
          </div>
          <label class="image-upload">
            <span>사진 1장</span>
            <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" @change="handleImage" />
            <div v-if="form.imagePreview"><img :src="form.imagePreview" alt="첨부 이미지 미리보기" /><b>사진 변경하기</b></div>
            <div v-else><strong>＋</strong><b>방문 사진 선택하기</b><small>JPG, PNG, WEBP · 1장</small></div>
          </label>
          <button class="submit-review" type="submit" :disabled="submitting">{{ submitting ? '저장 중' : editingId ? '수정 완료' : '리뷰 등록' }}</button>
        </form>

        <div v-if="!loading && !error && reviews.length" class="review-list">
          <article v-for="review in reviews" :key="review.id" class="review-item">
            <img v-if="review.image" :src="review.image" :alt="review.title" @error="handleBrokenImage" />
            <div class="review-content">
              <div class="review-meta"><span>{{ '★'.repeat(review.rating) }}</span><small>{{ review.nickname }} · {{ review.date }}</small></div>
              <h3>{{ review.title }}</h3>
              <p>{{ review.body }}</p>
              <div class="review-actions">
                <button :disabled="deletingId === review.id || verifyingReviewId === review.id" @click="editReview(review)">
                  {{ verifyingReviewId === review.id ? '확인 중' : '수정' }}
                </button>
                <button :disabled="deletingId === review.id" @click="removeReview(review)">삭제</button>
              </div>
            </div>
          </article>
        </div>
        <div v-else-if="!loading && !error" class="empty-reviews">
          <strong>아직 등록된 리뷰가 없어요.</strong>
          <p>이 장소의 첫 번째 경험을 공유해 주세요.</p>
          <button :disabled="!backendPlaceId" @click="openWriteForm">첫 리뷰 작성하기</button>
        </div>
      </div>
    </section>

    <section v-else-if="!detailOnly" class="container select-guide">
      <span>↑</span>
      <strong>장소를 선택하면 리뷰가 여기에 표시됩니다.</strong>
    </section>
  </div>
</template>

<style scoped>
.review-page { background: #f8fcff; min-height: calc(100vh - 74px); padding-bottom: 100px; }
.review-page.detail-only { min-height: 0; padding-bottom: 0; }
.review-hero { padding: 72px 0 58px; background: radial-gradient(circle at 85% 10%, rgba(119,216,220,.36), transparent 28%), linear-gradient(135deg, #e7f5ff, #fff 68%); }
.review-hero p { margin: 0 0 10px; color: #168ac7; font-weight: 950; letter-spacing: .12em; }
.review-hero h1 { margin: 0; color: #073b66; font-size: clamp(40px, 6vw, 64px); line-height: 1.08; letter-spacing: -.06em; }
.review-hero > div > span { display: block; margin-top: 18px; color: #607d91; font-size: 17px; }
.review-search { width: min(760px,100%); min-height: 62px; margin-top: 30px; border: 1px solid #badcf1; border-radius: 18px; background: #fff; display: flex; align-items: center; gap: 12px; padding: 8px 9px 8px 20px; box-shadow: 0 18px 45px rgba(34,112,158,.13); }
.review-search > span { color: #168ac7; font-size: 25px; }
.review-search input { flex: 1; min-width: 0; border: 0; outline: 0; font-size: 16px; }
.review-search button { border: 0; border-radius: 12px; background: #e1f2fd; color: #126c9f; padding: 12px 16px; font-weight: 850; cursor: pointer; }
.place-step { padding-top: 64px; }
.step-heading { display: flex; align-items: flex-start; gap: 15px; }
.step-heading > span { border-radius: 999px; background: #073b66; color: #fff; padding: 7px 11px; font-size: 11px; font-weight: 900; letter-spacing: .08em; }
.step-heading h2 { margin: 0; font-size: clamp(26px,3vw,36px); letter-spacing: -.04em; }
.step-heading p { margin: 7px 0 0; color: #607d91; }
.category-filter { display: flex; gap: 7px; margin: 27px 0 22px; overflow-x: auto; scrollbar-width: none; }
.category-filter button { flex: none; border: 1px solid #c5e0f1; border-radius: 999px; background: #fff; color: #486d85; padding: 10px 14px; font-weight: 800; cursor: pointer; }
.category-filter button.active { border-color: #168ac7; background: #168ac7; color: #fff; }
.place-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 12px; }
.place-option { min-width: 0; border: 1px solid #d1e5f2; border-radius: 18px; background: #fff; padding: 10px; display: grid; grid-template-columns: 78px 1fr auto; align-items: center; gap: 13px; text-align: left; cursor: pointer; transition: .2s ease; }
.place-option:hover, .place-option.selected { border-color: #168ac7; transform: translateY(-2px); box-shadow: 0 12px 28px rgba(30,110,157,.12); }
.place-option img { width: 78px; height: 68px; border-radius: 12px; object-fit: cover; }
.place-option > span { min-width: 0; display: grid; gap: 4px; }
.place-option small, .place-option i { overflow: hidden; color: #66859a; font-size: 10px; font-style: normal; text-overflow: ellipsis; white-space: nowrap; }
.place-option strong { overflow: hidden; color: #073b66; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
.place-option b { color: #168ac7; }
.place-empty, .select-guide { border: 1px dashed #bcd9eb; border-radius: 22px; color: #718da0; padding: 50px; text-align: center; }
.selected-section { margin-top: 72px; border-top: 1px solid #d7e9f4; background: #fff; padding: 64px 0 100px; scroll-margin-top: 74px; }
.detail-only .selected-section { margin-top: 0; border-top: 0; }
.detail-back { margin-bottom: 22px; border: 1px solid #c5deed; border-radius: 8px; background: #fff; color: #315c76; padding: 10px 14px; font-weight: 850; cursor: pointer; }
.detail-back:hover { border-color: #168ac7; color: #168ac7; }
.selected-place { border-radius: 26px; background: #e8f6ff; display: grid; grid-template-columns: 260px 1fr; gap: 26px; padding: 18px; }
.selected-place > img { width: 100%; height: 190px; border-radius: 18px; object-fit: cover; }
.selected-place > div { align-self: center; padding-right: 24px; }
.selected-place span { color: #168ac7; font-size: 12px; font-weight: 850; }
.selected-place h2 { margin: 7px 0; font-size: 32px; letter-spacing: -.04em; }
.selected-place p { margin: 0; color: #607d91; line-height: 1.6; }
.selected-place div > div { display: flex; gap: 14px; margin-top: 16px; align-items: center; }
.selected-place small { color: #7793a6; }
.review-title-row { display: flex; justify-content: space-between; align-items: flex-end; margin: 54px 0 20px; }
.review-title-row h2 { margin: 0; font-size: 30px; }
.review-title-row h2 span { color: #168ac7; }
.write-button, .submit-review, .empty-reviews button, .review-state button { border: 0; border-radius: 13px; background: #168ac7; color: #fff; padding: 13px 18px; font-weight: 900; cursor: pointer; }
.write-button:disabled, .submit-review:disabled, .empty-reviews button:disabled, .review-actions button:disabled { opacity: .58; cursor: not-allowed; }
.review-state { border: 1px dashed #bad8ea; border-radius: 18px; padding: 24px; color: #607d91; background: #f8fcff; display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
.error-state { border-color: #efb8b8; color: #9c3d3d; background: #fff8f8; }
.review-form { border: 1px solid #badcf1; border-radius: 24px; background: #f5fbff; margin-bottom: 22px; padding: 26px; display: grid; gap: 17px; }
.form-heading { display: flex; justify-content: space-between; }
.form-heading span { color: #168ac7; font-size: 11px; font-weight: 950; letter-spacing: .1em; }
.form-heading h3 { margin: 4px 0 0; font-size: 23px; }
.form-heading button { border: 0; background: transparent; color: #607d91; font-size: 26px; cursor: pointer; }
.review-form label { display: grid; gap: 7px; color: #315c76; font-size: 12px; font-weight: 850; }
.review-form input, .review-form textarea, .review-form select { width: 100%; border: 1px solid #c8dfed; border-radius: 12px; background: #fff; outline: 0; padding: 13px; resize: vertical; }
.review-form input:focus, .review-form textarea:focus, .review-form select:focus { border-color: #168ac7; }
.form-row { display: grid; grid-template-columns: 180px 1fr; gap: 12px; }
.image-upload > input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.image-upload > div { min-height: 120px; border: 1px dashed #9fcbe5; border-radius: 14px; background: #fff; display: grid; place-items: center; align-content: center; gap: 5px; cursor: pointer; overflow: hidden; }
.image-upload img { width: 100%; max-height: 240px; object-fit: cover; }
.image-upload strong { color: #168ac7; font-size: 28px; }
.image-upload small { color: #8aa0ae; }
.submit-review { justify-self: end; min-width: 120px; }
.review-list { display: grid; gap: 12px; }
.review-item { border: 1px solid #d6e7f2; border-radius: 20px; padding: 18px; display: grid; grid-template-columns: auto 1fr; gap: 18px; }
.review-item > img { width: 190px; height: 150px; border-radius: 14px; object-fit: cover; }
.review-content { min-width: 0; }
.review-meta { display: flex; justify-content: space-between; gap: 10px; }
.review-meta span { color: #f4ab32; letter-spacing: 2px; }
.review-meta small { color: #8aa0ae; }
.review-item h3 { margin: 9px 0 7px; font-size: 19px; }
.review-item p { margin: 0; color: #607d91; line-height: 1.65; white-space: pre-wrap; }
.review-actions { display: flex; justify-content: flex-end; gap: 7px; margin-top: 13px; }
.review-actions button { border: 1px solid #cfdfeb; border-radius: 8px; background: #fff; color: #607d91; padding: 6px 10px; cursor: pointer; }
.empty-reviews { border: 1px dashed #bad8ea; border-radius: 20px; padding: 52px; text-align: center; }
.empty-reviews p { color: #718da0; }
.select-guide { margin-top: 60px; display: grid; gap: 8px; }
.select-guide span { color: #168ac7; font-size: 24px; }

@media (max-width: 950px) { .place-grid { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 650px) {
  .review-hero { padding-top: 48px; }
  .place-grid { grid-template-columns: 1fr; }
  .selected-place { grid-template-columns: 1fr; }
  .selected-place > div { padding: 0 7px 10px; }
  .selected-place > img { height: 220px; }
  .review-title-row { align-items: stretch; flex-direction: column; gap: 16px; }
  .form-row { grid-template-columns: 1fr; }
  .review-state { align-items: stretch; flex-direction: column; }
  .review-item { grid-template-columns: 1fr; }
  .review-item > img { width: 100%; height: 210px; }
}
</style>
