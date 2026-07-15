import { API_BASE_URL, joinUrl } from './config'

export async function getPlacesByCategory(contentTypeId, page, pageSize = 4) {
  const params = new URLSearchParams({
    contentTypeId: String(contentTypeId),
    page: String(page),
    page_size: String(pageSize)
  })
  const response = await fetch(joinUrl(API_BASE_URL, `/places/category?${params}`))

  if (!response.ok) {
    throw new Error('장소 목록을 불러오지 못했습니다.')
  }

  return response.json()
}

export async function searchPlaces(keyword, page = 1, pageSize = 20, options = {}) {
  const params = new URLSearchParams({ keyword, page: String(page), page_size: String(pageSize) })
  const response = await fetch(joinUrl(API_BASE_URL, `/places/search?${params}`), options)
  if (!response.ok) throw new Error('검색 결과를 불러오지 못했습니다.')
  return response.json()
}
