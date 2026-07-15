import { API_BASE_URL, joinUrl } from './config'

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

export function searchPlaces(keyword) {
  return requestJson(`/posts/search?keyword=${encodeURIComponent(keyword)}`)
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

  const data = await response.json()
  if (data?.verified !== true) {
    throw new Error('비밀번호를 확인하지 못했습니다.')
  }

  return data
}

export async function deletePost(postId) {
  const response = await fetch(joinUrl(API_BASE_URL, `/posts/${encodeURIComponent(postId)}`), {
    method: 'DELETE'
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }
}
