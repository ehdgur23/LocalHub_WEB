import axios from 'axios'
import { API_BASE_URL, joinUrl } from './config'

// 랜덤 코스 생성은 서버에서 장소 선택과 Tmap 경로 최적화까지 완료해 반환합니다.
export async function createRandomRoute() {
  try {
    const { data } = await axios.post(joinUrl(API_BASE_URL, '/api/routes/random'))
    return data
  } catch (error) {
    const message = error.response?.data?.detail || error.response?.data?.message
    throw new Error(message || '랜덤 여행코스를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }
}
