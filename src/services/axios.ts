import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://contabl.net',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token")
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/signin'
    }
    return Promise.reject(error)
  }
)

export default api
