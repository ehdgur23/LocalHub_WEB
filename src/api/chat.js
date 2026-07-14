const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
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
    throw new Error('Chat request failed')
  }

  const data = await response.json()
  if (!data?.answer) {
    throw new Error('Chat response is missing an answer')
  }

  return data.answer
}
