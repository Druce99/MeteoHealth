import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, usersApi, CreateUserPayload, UpdateUserPayload } from '../api/users';

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  loadUser: () => Promise<void>;
  createUser: (data: CreateUserPayload) => Promise<void>;
  updateUser: (data: UpdateUserPayload) => Promise<void>;
  updateToken: (token: string) => Promise<void>;
  clearError: () => void;
}

const USER_ID_KEY = 'meteohealth_user_id';

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  loadUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const userId = await AsyncStorage.getItem(USER_ID_KEY);
      if (!userId) {
        set({ isLoading: false });
        return;
      }
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 8000)
      );
      const user = await Promise.race([usersApi.getById(userId), timeout]);
      set({ user, isLoading: false });
    } catch (e: any) {
      const is404 = e?.response?.status === 404;
      if (is404) {
        await AsyncStorage.removeItem(USER_ID_KEY);
      }
      set({ isLoading: false, error: is404 ? null : 'Не удалось загрузить профиль' });
    }
  },

  createUser: async (data: CreateUserPayload) => {
    set({ isLoading: true, error: null });
    try {
      const user = await usersApi.create(data);
      await AsyncStorage.setItem(USER_ID_KEY, user.id);
      set({ user, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Не удалось создать профиль' });
    }
  },

  updateUser: async (data: UpdateUserPayload) => {
    const { user } = get();
    if (!user) return;
    set({ isLoading: true, error: null });
    try {
      const updated = await usersApi.update(user.id, data);
      set({ user: updated, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Не удалось обновить профиль' });
    }
  },

  updateToken: async (token: string) => {
    const { user } = get();
    if (!user) return;
    try {
      await usersApi.updateToken(user.id, token);
    } catch {
      // silent
    }
  },

  clearError: () => set({ error: null }),
}));
