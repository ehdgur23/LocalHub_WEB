import { API_BASE_URL, joinUrl } from './config'

async function parseError(response) {
  try {
    const data = await response.json()
    if (typeof data?.detail === 'string') return data.detail
  } catch {
    // Ignore non-JSON error responses.
  }
  return '챗봇 요청을 처리하지 못했습니다.'
}

export async function sendChatMessage(query) {
  const response = await fetch(joinUrl(API_BASE_URL, '/chat'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  const data = await response.json()
  if (!data?.answer) {
    throw new Error('챗봇 응답을 받지 못했습니다.')
  }

  return data.answer
}
