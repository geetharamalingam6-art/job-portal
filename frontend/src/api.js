import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
})

let refreshRequest = null

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config
    const requestUrl = request?.url || ''
    if (
      error.response?.status !== 401 ||
      !request ||
      request._retried ||
      requestUrl === '/token/' ||
      requestUrl === '/token/refresh/'
    ) {
      return Promise.reject(error)
    }

    const tokenStorage = localStorage.getItem('refresh_token')
      ? localStorage
      : sessionStorage
    const refreshToken = tokenStorage.getItem('refresh_token')
    if (!refreshToken) return Promise.reject(error)

    request._retried = true
    if (!refreshRequest) {
      refreshRequest = api
        .post('/token/refresh/', { refresh: refreshToken })
        .then(({ data }) => {
          tokenStorage.setItem('access_token', data.access)
          if (data.refresh) tokenStorage.setItem('refresh_token', data.refresh)
          return data.access
        })
        .catch((refreshError) => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          sessionStorage.removeItem('access_token')
          sessionStorage.removeItem('refresh_token')
          throw refreshError
        })
        .finally(() => {
          refreshRequest = null
        })
    }

    try {
      const accessToken = await refreshRequest
      request.headers.Authorization = `Bearer ${accessToken}`
      return api(request)
    } catch (refreshError) {
      return Promise.reject(refreshError)
    }
  },
)

export function getAccessToken() {
  return (
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token')
  )
}

export default api
