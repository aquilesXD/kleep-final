import api from './axios';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export const apiService = {
  get: async <T>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> => {
    const response = await api.get(url, { params });
    return response.data;
  },

  post: async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    const response = await api.post(url, data);
    return response.data;
  },

  put: async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    const response = await api.put(url, data);
    return response.data;
  },

  delete: async <T>(url: string): Promise<ApiResponse<T>> => {
    const response = await api.delete(url);
    return response.data;
  },

  patch: async <T>(url: string, data?: any): Promise<ApiResponse<T>> => {
    const response = await api.patch(url, data);
    return response.data;
  },
};

export default apiService;
