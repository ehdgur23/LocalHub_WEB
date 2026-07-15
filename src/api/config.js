export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://localhub-server.onrender.com'

export function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}
