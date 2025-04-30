import { create } from 'zustand';
import { getAuthToken } from '../services/authService';

interface UserState {
  userData: {
    name?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    profile_image?: string;
  } | null;
  isLoading: boolean;
  fetchUserData: () => Promise<void>;
  updateUserData: (data: Partial<UserState['userData']>) => void;
}

export const useUserStore = create<UserState>((set) => ({
  userData: null,
  isLoading: false,
  fetchUserData: async () => {
    set({ isLoading: true });
    try {
      const authToken = getAuthToken();
      if (!authToken) {
        set({ isLoading: false });
        return;
      }

      const response = await fetch('https://contabl.net/kleep/api/user', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.user || data;
        
        // Asegurarse de que la URL de la imagen sea completa
        if (userData.profile_image) {
          userData.profile_image = userData.profile_image.startsWith('http')
            ? userData.profile_image
            : `https://contabl.net/kleep${userData.profile_image.startsWith('/') ? '' : '/'}${userData.profile_image}`;
        }

        set({ userData, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },
  updateUserData: (data) => {
    set((state) => ({
      userData: state.userData ? { ...state.userData, ...data } : data
    }));
  },
})); 