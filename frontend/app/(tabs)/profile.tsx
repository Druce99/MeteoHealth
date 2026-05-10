import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useUserStore } from '../../src/store/userStore';
import { Colors } from '../../src/constants/colors';
import { Theme } from '../../src/constants/theme';

type Condition = 'hypotension' | 'hypertension' | 'joints' | 'general';
type AgeGroup = 'under_18' | '18_35' | '36_55' | '55_plus';

const CONDITIONS = [
  { key: 'hypotension' as Condition, label: 'Гипотония' },
  { key: 'hypertension' as Condition, label: 'Гипертония' },
  { key: 'joints' as Condition, label: 'Проблемы с суставами' },
  { key: 'general' as Condition, label: 'Общая метеочувствительность' },
];

const AGE_GROUPS = [
  { key: 'under_18' as AgeGroup, label: 'До 18 лет' },
  { key: '18_35' as AgeGroup, label: '18–35 лет' },
  { key: '36_55' as AgeGroup, label: '36–55 лет' },
  { key: '55_plus' as AgeGroup, label: 'Старше 55' },
];

const SENSITIVITIES = [
  { label: 'Низкая', value: 1 },
  { label: 'Средняя', value: 2 },
  { label: 'Высокая', value: 3 },
] as const;

function getAutoSensitivity(conditions: string[]): { p: number; k: number; t: number } {
  let p = 2, k = 2, t = 2;
  if (conditions.includes('hypotension') || conditions.includes('hypertension')) p = 3;
  if (conditions.includes('joints')) t = 3;
  if (conditions.includes('general')) k = 3;
  return { p, k, t };
}

function SensitivityRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={sensStyles.row}>
      <Text style={sensStyles.label}>{label}</Text>
      <View style={sensStyles.buttons}>
        {SENSITIVITIES.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[sensStyles.btn, value === s.value && sensStyles.btnActive]}
            onPress={() => onChange(s.value)}
          >
            <Text style={[sensStyles.btnText, value === s.value && sensStyles.btnTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const sensStyles = StyleSheet.create({
  row: { gap: Theme.spacing.xs },
  label: { color: Colors.textSecondary, fontSize: Theme.fontSize.sm },
  buttons: { flexDirection: 'row', gap: Theme.spacing.xs },
  btn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Theme.radius.sm,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  btnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  btnText: { color: Colors.textSecondary, fontSize: Theme.fontSize.xs, fontWeight: Theme.fontWeight.medium },
  btnTextActive: { color: Colors.background },
});

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateUser, updateToken, isLoading } = useUserStore();

  const [name, setName] = useState(user?.name ?? '');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>((user?.age_group as AgeGroup) ?? '18_35');
  const [sensP, setSensP] = useState(user?.sensitivity_pressure ?? 2);
  const [sensK, setSensK] = useState(user?.sensitivity_kp ?? 2);
  const [sensT, setSensT] = useState(user?.sensitivity_temp ?? 2);
  const [conditions, setConditions] = useState<string[]>(user?.conditions ?? []);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '95df5263-f74e-4f3b-a09e-7d3438d1069a',
      }).catch(() => null);
      if (token) updateToken(token.data);
    })();
  }, [user?.id]);

  if (!user) return null;

  const toggleCondition = (key: string) => {
    const next = conditions.includes(key)
      ? conditions.filter((c) => c !== key)
      : [...conditions, key];
    setConditions(next);
    const auto = getAutoSensitivity(next);
    setSensP(auto.p);
    setSensK(auto.k);
    setSensT(auto.t);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Ошибка', 'Введите имя'); return; }
    await updateUser({
      name: name.trim(),
      age_group: ageGroup,
      sensitivity_pressure: sensP,
      sensitivity_kp: sensK,
      sensitivity_temp: sensT,
      conditions: conditions as any,
    });
    setEditing(false);
  };

  const conditionLabel = (key: string) => CONDITIONS.find((c) => c.key === key)?.label ?? key;

  const ageLabels: Record<string, string> = {
    under_18: 'До 18 лет',
    '18_35': '18–35 лет',
    '36_55': '36–55 лет',
    '55_plus': 'Старше 55',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Профиль</Text>
        {!editing ? (
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
            <Ionicons name="create-outline" size={20} color={Colors.accent} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(false)}>
            <Ionicons name="close-outline" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={Colors.textSecondary} />
        </View>
        {editing ? (
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Ваше имя"
            placeholderTextColor={Colors.textSecondary}
          />
        ) : (
          <Text style={styles.userName}>{user.name}</Text>
        )}
        {!editing && <Text style={styles.userAge}>{ageLabels[user.age_group]}</Text>}
      </View>

      {editing && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Возраст</Text>
          <View style={styles.ageGrid}>
            {AGE_GROUPS.map((g) => (
              <TouchableOpacity
                key={g.key}
                style={[styles.ageCard, ageGroup === g.key && styles.ageCardActive]}
                onPress={() => setAgeGroup(g.key)}
              >
                <Text style={[styles.ageText, ageGroup === g.key && styles.ageTextActive]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Местоположение</Text>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color={Colors.accent} />
          <Text style={styles.infoText}>{user.location_name}</Text>
        </View>
        <Text style={styles.coords}>{user.latitude.toFixed(4)}, {user.longitude.toFixed(4)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Состояния здоровья</Text>
        {editing ? (
          <View style={styles.conditionsGrid}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[styles.condChip, conditions.includes(c.key) && styles.condChipActive]}
                onPress={() => toggleCondition(c.key)}
              >
                <Text style={[styles.condText, conditions.includes(c.key) && styles.condTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.conditionsGrid}>
            {user.conditions.map((c) => (
              <View key={c} style={styles.condChipActive}>
                <Text style={styles.condTextActive}>{conditionLabel(c)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {editing && (
        <View style={styles.section}>
          <View style={styles.sensHeader}>
            <Text style={styles.sectionTitle}>Чувствительность</Text>
            <Text style={styles.sensHint}>Авто при смене состояний</Text>
          </View>
          <View style={styles.sensitivities}>
            <SensitivityRow label="К давлению" value={sensP} onChange={setSensP} />
            <SensitivityRow label="К Kp-индексу" value={sensK} onChange={setSensK} />
            <SensitivityRow label="К температуре" value={sensT} onChange={setSensT} />
          </View>
        </View>
      )}

      {!editing && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Чувствительность</Text>
          {[
            { label: 'К давлению', value: user.sensitivity_pressure },
            { label: 'К Kp-индексу', value: user.sensitivity_kp },
            { label: 'К температуре', value: user.sensitivity_temp },
          ].map((s) => (
            <View key={s.label} style={styles.sensRow}>
              <Text style={styles.sensLabel}>{s.label}</Text>
              <View style={[styles.sensBadge,
                s.value === 1 ? styles.sensLow : s.value === 3 ? styles.sensHigh : styles.sensMid
              ]}>
                <Text style={styles.sensBadgeText}>
                  {s.value === 1 ? 'Низкая' : s.value === 3 ? 'Высокая' : 'Средняя'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.navRow} onPress={() => router.push('/notification-settings')}>
        <Ionicons name="notifications-outline" size={20} color={Colors.accent} />
        <Text style={styles.navRowText}>Настройки уведомлений</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      {editing && (
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={Colors.background} />
          ) : (
            <Text style={styles.saveBtnText}>Сохранить изменения</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Theme.spacing.md, gap: Theme.spacing.md, paddingTop: 56, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  screenTitle: { color: Colors.textPrimary, fontSize: Theme.fontSize.xl, fontWeight: Theme.fontWeight.bold },
  editBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  avatarSection: { alignItems: 'center', gap: Theme.spacing.sm },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.cardBorder,
  },
  userName: { color: Colors.textPrimary, fontSize: Theme.fontSize.xl, fontWeight: Theme.fontWeight.bold },
  userAge: { color: Colors.textSecondary, fontSize: Theme.fontSize.sm },
  nameInput: {
    backgroundColor: Colors.inputBg, borderRadius: Theme.radius.sm,
    padding: Theme.spacing.sm, color: Colors.textPrimary,
    fontSize: Theme.fontSize.lg, textAlign: 'center',
    borderWidth: 1, borderColor: Colors.accent, minWidth: 200,
  },
  section: {
    backgroundColor: Colors.card, borderRadius: Theme.radius.md,
    padding: Theme.spacing.md, borderWidth: 1,
    borderColor: Colors.cardBorder, gap: Theme.spacing.sm,
  },
  sectionTitle: {
    color: Colors.textSecondary, fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  ageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.xs },
  ageCard: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: Theme.radius.full,
    backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  ageCardActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  ageText: { color: Colors.textSecondary, fontSize: Theme.fontSize.sm },
  ageTextActive: { color: Colors.background, fontWeight: Theme.fontWeight.semibold },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm },
  infoText: { color: Colors.textPrimary, fontSize: Theme.fontSize.md },
  coords: { color: Colors.textSecondary, fontSize: Theme.fontSize.xs },
  conditionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.sm },
  condChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: Theme.radius.full,
    backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  condChipActive: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: Theme.radius.full,
    backgroundColor: Colors.accent + '22', borderWidth: 1, borderColor: Colors.accent,
  },
  condText: { color: Colors.textSecondary, fontSize: Theme.fontSize.sm },
  condTextActive: { color: Colors.accent, fontSize: Theme.fontSize.sm, fontWeight: Theme.fontWeight.medium },
  sensHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sensHint: { color: Colors.textSecondary, fontSize: Theme.fontSize.xs, fontStyle: 'italic' },
  sensitivities: { gap: Theme.spacing.md },
  sensRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sensLabel: { color: Colors.textPrimary, fontSize: Theme.fontSize.sm },
  sensBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Theme.radius.full },
  sensLow: { backgroundColor: Colors.green + '22' },
  sensMid: { backgroundColor: Colors.yellow + '22' },
  sensHigh: { backgroundColor: Colors.red + '22' },
  sensBadgeText: { fontSize: Theme.fontSize.xs, fontWeight: Theme.fontWeight.medium, color: Colors.textPrimary },
  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: Theme.radius.md,
    padding: Theme.spacing.md, alignItems: 'center',
  },
  saveBtnText: { color: Colors.background, fontSize: Theme.fontSize.md, fontWeight: Theme.fontWeight.bold },
  navRow: {
    backgroundColor: Colors.card,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  navRowText: { flex: 1, color: Colors.textPrimary, fontSize: Theme.fontSize.md },
});
