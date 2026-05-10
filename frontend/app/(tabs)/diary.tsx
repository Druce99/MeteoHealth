import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../src/store/userStore';
import { diaryApi, DiaryEntry, CreateDiaryPayload, UpdateDiaryPayload, Symptom } from '../../src/api/diary';
import DiaryChart from '../../src/components/DiaryChart';
import { Colors } from '../../src/constants/colors';
import { Theme } from '../../src/constants/theme';

const SYMPTOMS: { key: Symptom; label: string; icon: string }[] = [
  { key: 'headache', label: 'Головная боль', icon: 'medical-outline' },
  { key: 'dizziness', label: 'Головокружение', icon: 'sync-outline' },
  { key: 'fatigue', label: 'Усталость', icon: 'battery-dead-outline' },
  { key: 'joint_pain', label: 'Боль в суставах', icon: 'body-outline' },
  { key: 'pressure_spike', label: 'Скачок давления', icon: 'trending-up-outline' },
  { key: 'insomnia', label: 'Бессонница', icon: 'moon-outline' },
  { key: 'nausea', label: 'Тошнота', icon: 'alert-circle-outline' },
];

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTH_NAMES = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getLastDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return toDateStr(d);
  });
}

function formatChipDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const isToday = dateStr === toDateStr(new Date());
  if (isToday) return `Сегодня\n${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
  const isYesterday = dateStr === toDateStr(new Date(Date.now() - 86400000));
  if (isYesterday) return `Вчера\n${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
  return `${DAY_NAMES[d.getDay()]}\n${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function formatEntryDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function ScorePicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={scoreStyles.row}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
        <TouchableOpacity
          key={n}
          style={[scoreStyles.dot, value === n && scoreStyles.dotActive]}
          onPress={() => onChange(n)}
        >
          <Text style={[scoreStyles.dotText, value === n && scoreStyles.dotTextActive]}>{n}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const scoreStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dot: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.inputBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  dotActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  dotText: { color: Colors.textSecondary, fontSize: Theme.fontSize.sm, fontWeight: Theme.fontWeight.medium },
  dotTextActive: { color: Colors.background },
});

export default function DiaryScreen() {
  const { user } = useUserStore();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);

  const todayStr = toDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [score, setScore] = useState(5);
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const loadEntries = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await diaryApi.getAll(user.id);
      setEntries(data.sort((a, b) => b.date.localeCompare(a.date)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEntries(); }, [user]);

  const toggleSymptom = (s: Symptom) =>
    setSelectedSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const openCreate = () => {
    setEditingEntry(null);
    setSelectedDate(todayStr);
    setScore(5);
    setSelectedSymptoms([]);
    setNote('');
    setModalVisible(true);
  };

  const openEdit = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setSelectedDate(entry.date);
    setScore(entry.wellbeing_score);
    setSelectedSymptoms(entry.symptoms);
    setNote(entry.note || '');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingEntry(null);
    setSelectedDate(todayStr);
    setScore(5);
    setSelectedSymptoms([]);
    setNote('');
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (editingEntry) {
        const payload: UpdateDiaryPayload = {
          wellbeing_score: score,
          symptoms: selectedSymptoms,
          note: note.trim() || undefined,
        };
        await diaryApi.update(user.id, editingEntry.date, payload);
      } else {
        const payload: CreateDiaryPayload = {
          date: selectedDate,
          wellbeing_score: score,
          symptoms: selectedSymptoms,
          note: note.trim() || undefined,
        };
        await diaryApi.create(user.id, payload);
      }
      closeModal();
      await loadEntries();
    } catch (e: any) {
      Alert.alert('Ошибка', e?.response?.data?.detail || 'Не удалось сохранить запись');
    } finally {
      setSaving(false);
    }
  };

  const getScoreColor = (s: number) => s >= 7 ? Colors.green : s >= 4 ? Colors.yellow : Colors.red;

  const lastDays = getLastDays(7);

  if (!user) return null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Дневник</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Ionicons name="add" size={24} color={Colors.background} />
          </TouchableOpacity>
        </View>

        {entries.length > 0 && <DiaryChart entries={[...entries].reverse()} />}

        {loading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="journal-outline" size={56} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Дневник пуст</Text>
            <Text style={styles.emptySubtitle}>Добавьте первую запись о самочувствии</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openCreate}>
              <Text style={styles.emptyBtnText}>Добавить запись</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.entriesList}>
            {entries.map((entry) => (
              <TouchableOpacity key={entry.id} style={styles.entryCard} onPress={() => openEdit(entry)} activeOpacity={0.7}>
                <View style={[styles.scoreIndicator, { backgroundColor: getScoreColor(entry.wellbeing_score) }]}>
                  <Text style={styles.scoreText}>{entry.wellbeing_score}</Text>
                </View>
                <View style={styles.entryContent}>
                  <Text style={styles.entryDate}>{formatEntryDate(entry.date)}</Text>
                  {entry.symptoms.length > 0 && (
                    <Text style={styles.entrySymptoms}>
                      {entry.symptoms.map(s => SYMPTOMS.find(x => x.key === s)?.label || s).join(', ')}
                    </Text>
                  )}
                  {entry.note && <Text style={styles.entryNote}>{entry.note}</Text>}
                </View>
                <Ionicons name="pencil-outline" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEntry ? 'Редактировать запись' : 'Новая запись'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Дата</Text>
              {editingEntry ? (
                <View style={styles.editDateBadge}>
                  <Ionicons name="calendar-outline" size={14} color={Colors.accent} />
                  <Text style={styles.editDateText}>{formatEntryDate(editingEntry.date)}</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Theme.spacing.md }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {lastDays.map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.dateChip, selectedDate === d && styles.dateChipActive]}
                        onPress={() => setSelectedDate(d)}
                      >
                        <Text style={[styles.dateChipText, selectedDate === d && styles.dateChipTextActive]}>
                          {formatChipDate(d)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}

              <Text style={styles.fieldLabel}>Самочувствие (1–10)</Text>
              <ScorePicker value={score} onChange={setScore} />

              <Text style={[styles.fieldLabel, { marginTop: Theme.spacing.md }]}>Симптомы</Text>
              <View style={styles.symptomsGrid}>
                {SYMPTOMS.map((s) => (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.symptomChip, selectedSymptoms.includes(s.key) && styles.symptomChipActive]}
                    onPress={() => toggleSymptom(s.key)}
                  >
                    <Ionicons
                      name={s.icon as any}
                      size={14}
                      color={selectedSymptoms.includes(s.key) ? Colors.background : Colors.textSecondary}
                    />
                    <Text style={[styles.symptomText, selectedSymptoms.includes(s.key) && styles.symptomTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: Theme.spacing.md }]}>Заметка (необязательно)</Text>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="Как вы себя чувствуете?"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={Colors.background} />
                ) : (
                  <Text style={styles.saveBtnText}>Сохранить</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Theme.spacing.md, gap: Theme.spacing.md, paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  screenTitle: { color: Colors.textPrimary, fontSize: Theme.fontSize.xl, fontWeight: Theme.fontWeight.bold },
  addBtn: {
    backgroundColor: Colors.accent, width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: Theme.spacing.sm },
  emptyTitle: { color: Colors.textPrimary, fontSize: Theme.fontSize.lg, fontWeight: Theme.fontWeight.semibold },
  emptySubtitle: { color: Colors.textSecondary, fontSize: Theme.fontSize.sm, textAlign: 'center' },
  emptyBtn: {
    backgroundColor: Colors.card, paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm, borderRadius: Theme.radius.md,
    borderWidth: 1, borderColor: Colors.accent, marginTop: Theme.spacing.sm,
  },
  emptyBtnText: { color: Colors.accent, fontSize: Theme.fontSize.md, fontWeight: Theme.fontWeight.semibold },
  entriesList: { gap: Theme.spacing.sm },
  entryCard: {
    backgroundColor: Colors.card, borderRadius: Theme.radius.md, padding: Theme.spacing.md,
    flexDirection: 'row', gap: Theme.spacing.sm, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  scoreIndicator: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  scoreText: { color: Colors.background, fontSize: Theme.fontSize.md, fontWeight: Theme.fontWeight.bold },
  entryContent: { flex: 1, gap: 4 },
  entryDate: { color: Colors.textSecondary, fontSize: Theme.fontSize.sm },
  entrySymptoms: { color: Colors.textPrimary, fontSize: Theme.fontSize.sm },
  entryNote: { color: Colors.textSecondary, fontSize: Theme.fontSize.sm, fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.card, borderTopLeftRadius: Theme.radius.lg,
    borderTopRightRadius: Theme.radius.lg, padding: Theme.spacing.lg, maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  modalTitle: { color: Colors.textPrimary, fontSize: Theme.fontSize.lg, fontWeight: Theme.fontWeight.bold },
  editDateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.inputBg, borderRadius: Theme.radius.sm,
    paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.sm,
    marginBottom: Theme.spacing.md, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: Colors.accent,
  },
  editDateText: { color: Colors.accent, fontSize: Theme.fontSize.sm, fontWeight: Theme.fontWeight.medium },
  dateChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Theme.radius.sm,
    backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.cardBorder,
    alignItems: 'center', minWidth: 64,
  },
  dateChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  dateChipText: { color: Colors.textSecondary, fontSize: Theme.fontSize.xs, textAlign: 'center', lineHeight: 16 },
  dateChipTextActive: { color: Colors.background, fontWeight: Theme.fontWeight.semibold },
  fieldLabel: { color: Colors.textSecondary, fontSize: Theme.fontSize.sm, marginBottom: Theme.spacing.sm, fontWeight: Theme.fontWeight.medium },
  symptomsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.sm },
  symptomChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: Theme.radius.full,
    backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  symptomChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  symptomText: { color: Colors.textSecondary, fontSize: Theme.fontSize.sm },
  symptomTextActive: { color: Colors.background },
  noteInput: {
    backgroundColor: Colors.inputBg, borderRadius: Theme.radius.sm, padding: Theme.spacing.md,
    color: Colors.textPrimary, fontSize: Theme.fontSize.md, textAlignVertical: 'top',
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: Theme.radius.md,
    padding: Theme.spacing.md, alignItems: 'center',
    marginTop: Theme.spacing.lg, marginBottom: Theme.spacing.md,
  },
  saveBtnText: { color: Colors.background, fontSize: Theme.fontSize.md, fontWeight: Theme.fontWeight.bold },
});
