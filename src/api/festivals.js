import { API_BASE_URL, joinUrl } from './config'

export async function getFestivals(year, month) {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month)
  })
  const response = await fetch(joinUrl(API_BASE_URL, `/festivals?${params}`))

  if (!response.ok) {
    throw new Error('축제 일정을 불러오지 못했습니다.')
  }

  return response.json()
}
