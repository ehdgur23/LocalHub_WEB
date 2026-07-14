const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

async function parseError(response) {
  try {
    const data = await response.json()
    if (typeof data?.detail === 'string') return data.detail
  } catch {
    // Ignore non-JSON error responses.
  }
  return '요청을 처리하지 못했습니다.'
}

async function requestJson(path, options) {
  const response = await fetch(joinUrl(API_BASE_URL, path), options)
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export function getPostImageUrl(imageId) {
  return joinUrl(API_BASE_URL, `/posts/images/${imageId}`)
}

export function getPlaceByContentId(contentId) {
  return requestJson(`/places/by-content-id/${encodeURIComponent(contentId)}`)
}

export function getPosts(placeId) {
  return requestJson(`/posts?place_id=${encodeURIComponent(placeId)}`)
}

export function getPost(postId) {
  return requestJson(`/posts/${encodeURIComponent(postId)}`)
}

export function createPost(formData) {
  return requestJson('/posts', {
    method: 'POST',
    body: formData
  })
}

export function updatePost(postId, formData) {
  return requestJson(`/posts/${encodeURIComponent(postId)}`, {
    method: 'PUT',
    body: formData
  })
}

export async function verifyPostPassword(postId, password) {
  const response = await fetch(joinUrl(API_BASE_URL, `/posts/${encodeURIComponent(postId)}/verify-password`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password })
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }
}

export async function deletePost(postId, password) {
  const response = await fetch(joinUrl(API_BASE_URL, `/posts/${encodeURIComponent(postId)}`), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password })
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }
}
