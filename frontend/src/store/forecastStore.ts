import { create } from 'zustand';
import { forecastApi, TodayForecast, WeekForecast } from '../api/forecast';

interface ForecastState {
  today: TodayForecast | null;
  week: WeekForecast | null;
  isLoadingToday: boolean;
  isLoadingWeek: boolean;
  error: string | null;
  fetchToday: (userId: string) => Promise<void>;
  fetchWeek: (userId: string) => Promise<void>;
  clearError: () => void;
}

export const useForecastStore = create<ForecastState>((set) => ({
  today: null,
  week: null,
  isLoadingToday: false,
  isLoadingWeek: false,
  error: null,

  fetchToday: async (userId: string) => {
    set({ isLoadingToday: true, error: null });
    try {
      const today = await forecastApi.getToday(userId);
      set({ today, isLoadingToday: false });
    } catch {
      set({ isLoadingToday: false, error: 'Не удалось загрузить прогноз' });
    }
  },

  fetchWeek: async (userId: string) => {
    set({ isLoadingWeek: true, error: null });
    try {
      const week = await forecastApi.getWeek(userId);
      set({ week, isLoadingWeek: false });
    } catch {
      set({ isLoadingWeek: false, error: 'Не удалось загрузить прогноз на неделю' });
    }
  },

  clearError: () => set({ error: null }),
}));
