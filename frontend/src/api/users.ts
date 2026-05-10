import client from './client';

export interface CreateUserPayload {
  name: string;
  age_group: 'under_18' | '18_35' | '36_55' | '55_plus';
  location_name: string;
  latitude: number;
  longitude: number;
  conditions: Array<'hypotension' | 'hypertension' | 'joints' | 'general'>;
  sensitivity_pressure?: number;
  sensitivity_kp?: number;
  sensitivity_temp?: number;
  expo_token?: string;
}

export interface UpdateUserPayload extends Partial<CreateUserPayload> {}

export interface User extends CreateUserPayload {
  id: string;
  created_at: string;
}

export const usersApi = {
  create: (data: CreateUserPayload) =>
    client.post<User>('/users/', data).then(r => r.data),

  getById: (userId: string) =>
    client.get<User>(`/users/${userId}`).then(r => r.data),

  update: (userId: string, data: UpdateUserPayload) =>
    client.put<User>(`/users/${userId}`, data).then(r => r.data),

  updateToken: (userId: string, expo_token: string) =>
    client.put(`/users/${userId}/token`, null, { params: { token: expo_token } }).then(r => r.data),
};
