import client from './client';

export type Symptom =
  | 'headache'
  | 'dizziness'
  | 'fatigue'
  | 'joint_pain'
  | 'pressure_spike'
  | 'insomnia'
  | 'nausea';

export interface DiaryEntry {
  id: string;
  user_id: string;
  date: string;
  wellbeing_score: number;
  symptoms: Symptom[];
  note?: string;
  pressure?: number;
  kp_index?: number;
  temperature?: number;
  humidity?: number;
  created_at: string;
}

export interface CreateDiaryPayload {
  date: string;
  wellbeing_score: number;
  symptoms: Symptom[];
  note?: string;
}

export interface UpdateDiaryPayload extends Partial<CreateDiaryPayload> {}

export const diaryApi = {
  create: (userId: string, data: CreateDiaryPayload) =>
    client.post<DiaryEntry>(`/diary/${userId}`, data).then(r => r.data),

  getAll: (userId: string) =>
    client.get<DiaryEntry[]>(`/diary/${userId}`).then(r => r.data),

  getByDate: (userId: string, date: string) =>
    client.get<DiaryEntry>(`/diary/${userId}/${date}`).then(r => r.data),

  update: (userId: string, date: string, data: UpdateDiaryPayload) =>
    client.put<DiaryEntry>(`/diary/${userId}/${date}`, data).then(r => r.data),
};
