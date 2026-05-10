import client from './client';

export interface DayForecast {
  date: string;
  pressure: number;
  temperature: number;
  humidity: number;
  kp_index: number | null;
  wellness_index: number;
}

export interface TodayForecast extends DayForecast {
  color: 'green' | 'yellow' | 'red';
}

export interface WeekForecast {
  days: DayForecast[];
}

export interface MlPrediction {
  date: string;
  predicted_wellbeing: number;
}

export const forecastApi = {
  getToday: (userId: string) =>
    client.get<TodayForecast>(`/forecast/${userId}/today`).then(r => r.data),

  getWeek: (userId: string) =>
    client.get<WeekForecast>(`/forecast/${userId}/week`).then(r => r.data),

  getByDate: (userId: string, date: string) =>
    client.get<TodayForecast>(`/forecast/${userId}/${date}`).then(r => r.data),

  getMlPredictions: (userId: string) =>
    client.get<MlPrediction[]>(`/ml/${userId}/predictions`).then(r => r.data),
};
