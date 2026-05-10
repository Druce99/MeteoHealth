import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../src/store/userStore';
import { notificationsApi, NotificationSettings } from '../src/api/notifications';
import { Colors } from '../src/constants/colors';
import { Theme } from '../src/constants/theme';

function parseTime(t: string): { h: number; m: number } {
  const [h, m] = t.split(':').map(Number);
  return { h, m };
}

function formatTime(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function TimeSelector({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const { h, m } = parseTime(value);
  return (
    <View style={timeStyles.row}>
      <Text style={timeStyles.label}>{label}</Text>
      <View style={timeStyles.controls}>
        <TouchableOpacity onPress={() => onChange(formatTime((h - 1 + 24) % 24, m))} style={timeStyles.btn}>
          <Ionicons name="remove" size={16} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={timeStyles.value}>{formatTime(h, m)}</Text>
        <TouchableOpacity onPress={() => onChange(formatTime((h + 1) % 24, m))} style={timeStyles.btn}>
          <Ionicons name="add" size={16} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const timeStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: Colors.textPrimary, fontSize: Theme.fontSize.sm },
  controls: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm },
  btn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.inputBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  value: { color: Colors.textPrimary, fontSize: Theme.fontSize.md, fontWeight: Theme.fontWeight.semibold, minWidth: 44, textAlign: 'center' },
});

function StepSelector({ label, value, min, max, step = 1, unit, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <View style={timeStyles.row}>
      <Text style={timeStyles.label}>{label}</Text>
      <View style={timeStyles.controls}>
        <TouchableOpacity onPress={() => onChange(Math.max(min, value - step))} style={timeStyles.btn}>
          <Ionicons name="remove" size={16} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={timeStyles.value}>{value}{unit}</Text>
        <TouchableOpacity onPress={() => onChange(Math.min(max, value + step))} style={timeStyles.btn}>
          <Ionicons name="add" size={16} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SwitchRow({ label, hint, value, onChange }: {
  label: string; hint?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <View style={rowStyles.container}>
      <View style={rowStyles.text}>
        <Text style={rowStyles.label}>{label}</Text>
        {hint && <Text style={rowStyles.hint}>{hint}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.inputBg, true: Colors.accent + '88' }}
        thumbColor={value ? Colors.accent : Colors.textSecondary}
      />
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  text: { flex: 1, paddingRight: Theme.spacing.md },
  label: { color: Colors.textPrimary, fontSize: Theme.fontSize.sm },
  hint: { color: Colors.textSecondary, fontSize: Theme.fontSize.xs, marginTop: 2 },
});

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    notificationsApi.getSettings(user.id)
      .then(setSettings)
      .catch(() => Alert.alert('Ошибка', 'Не удалось загрузить настройки'))
      .finally(() => setLoading(false));
  }, [user]);

  const patch = (update: Partial<NotificationSettings>) => {
    if (!settings) return;
    setSettings({ ...settings, ...update });
  };

  const handleSave = async () => {
    if (!user || !settings) return;
    setSaving(true);
    try {
      const updated = await notificationsApi.updateSettings(user.id, {
        notify_pressure: settings.notify_pressure,
        notify_kp: settings.notify_kp,
        notify_temp: settings.notify_temp,
        notify_humidity: settings.notify_humidity,
        kp_threshold: settings.kp_threshold,
        temp_threshold: settings.temp_threshold,
        quiet_from: settings.quiet_from.slice(0, 5),
        quiet_to: settings.quiet_to.slice(0, 5),
        digest_enabled: settings.digest_enabled,
        digest_time: settings.digest_time.slice(0, 5),
      });
      setSettings(updated);
      router.back();
    } catch {
      Alert.alert('Ошибка', 'Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!settings) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Уведомления</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Триггеры</Text>
        <SwitchRow
          label="Изменение давления"
          hint="Резкий перепад атмосферного давления"
          value={settings.notify_pressure}
          onChange={v => patch({ notify_pressure: v })}
        />
        <View style={styles.divider} />
        <SwitchRow
          label="Магнитные бури"
          hint={`Уведомить при Kp ≥ ${settings.kp_threshold}`}
          value={settings.notify_kp}
          onChange={v => patch({ notify_kp: v })}
        />
        {settings.notify_kp && (
          <StepSelector
            label="Порог Kp-индекса"
            value={settings.kp_threshold}
            min={3} max={9}
            unit=""
            onChange={v => patch({ kp_threshold: v })}
          />
        )}
        <View style={styles.divider} />
        <SwitchRow
          label="Перепад температуры"
          hint={`Уведомить при изменении ≥ ${settings.temp_threshold}°C`}
          value={settings.notify_temp}
          onChange={v => patch({ notify_temp: v })}
        />
        {settings.notify_temp && (
          <StepSelector
            label="Порог перепада"
            value={settings.temp_threshold}
            min={1} max={20}
            unit="°C"
            onChange={v => patch({ temp_threshold: v })}
          />
        )}
        <View style={styles.divider} />
        <SwitchRow
          label="Влажность"
          hint="При очень высокой или низкой влажности"
          value={settings.notify_humidity}
          onChange={v => patch({ notify_humidity: v })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Тихое время</Text>
        <Text style={styles.sectionHint}>В это время уведомления не отправляются</Text>
        <TimeSelector label="С" value={settings.quiet_from.slice(0, 5)} onChange={v => patch({ quiet_from: v })} />
        <View style={styles.divider} />
        <TimeSelector label="До" value={settings.quiet_to.slice(0, 5)} onChange={v => patch({ quiet_to: v })} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Утренний дайджест</Text>
        <SwitchRow
          label="Включить дайджест"
          hint="Краткий прогноз самочувствия утром"
          value={settings.digest_enabled}
          onChange={v => patch({ digest_enabled: v })}
        />
        {settings.digest_enabled && (
          <>
            <View style={styles.divider} />
            <TimeSelector label="Время отправки" value={settings.digest_time.slice(0, 5)} onChange={v => patch({ digest_time: v })} />
          </>
        )}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={Colors.background} />
        ) : (
          <Text style={styles.saveBtnText}>Сохранить</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Theme.spacing.md, gap: Theme.spacing.md, paddingTop: 56, paddingBottom: 32 },
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  screenTitle: { color: Colors.textPrimary, fontSize: Theme.fontSize.lg, fontWeight: Theme.fontWeight.bold },
  section: {
    backgroundColor: Colors.card, borderRadius: Theme.radius.md,
    padding: Theme.spacing.md, borderWidth: 1,
    borderColor: Colors.cardBorder, gap: Theme.spacing.md,
  },
  sectionTitle: {
    color: Colors.textSecondary, fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  sectionHint: { color: Colors.textSecondary, fontSize: Theme.fontSize.xs, marginTop: -8 },
  divider: { height: 1, backgroundColor: Colors.cardBorder },
  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: Theme.radius.md,
    padding: Theme.spacing.md, alignItems: 'center',
  },
  saveBtnText: { color: Colors.background, fontSize: Theme.fontSize.md, fontWeight: Theme.fontWeight.bold },
});
