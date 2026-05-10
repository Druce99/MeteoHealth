import client from './client';

export interface NotificationSettings {
  id: string;
  user_id: string;
  notify_pressure: boolean;
  notify_kp: boolean;
  notify_temp: boolean;
  notify_humidity: boolean;
  kp_threshold: number;
  temp_threshold: number;
  quiet_from: string;
  quiet_to: string;
  digest_enabled: boolean;
  digest_time: string;
  updated_at: string;
  created_at: string;
}

export interface UpdateSettingsPayload {
  notify_pressure?: boolean;
  notify_kp?: boolean;
  notify_temp?: boolean;
  notify_humidity?: boolean;
  kp_threshold?: number;
  temp_threshold?: number;
  quiet_from?: string;
  quiet_to?: string;
  digest_enabled?: boolean;
  digest_time?: string;
}

export const notificationsApi = {
  getSettings: (userId: string) =>
    client.get<NotificationSettings>(`/notifications/${userId}`).then(r => r.data),

  updateSettings: (userId: string, data: UpdateSettingsPayload) =>
    client.put<NotificationSettings>(`/notifications/${userId}`, data).then(r => r.data),
};
