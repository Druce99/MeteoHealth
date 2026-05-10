import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../src/store/userStore';
import client from '../src/api/client';
import { Colors } from '../src/constants/colors';
import { Theme } from '../src/constants/theme';

interface Recommendation {
  id: string;
  text: string;
  condition: string;
  trigger: string;
  priority: number;
  icon: string;
}

const TRIGGER_LABELS: Record<string, string> = {
  pressure_down: 'Падение давления',
  pressure_up: 'Рост давления',
  magnetic_storm: 'Магнитная буря',
  temperature: 'Перепад температуры',
  humidity: 'Влажность',
};

const PRIORITY_COLORS: Record<number, string> = {
  1: Colors.red,
  2: Colors.yellow,
  3: Colors.green,
};

export default function RecommendationsScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'today' | 'general'>('today');

  useEffect(() => {
    loadRecs();
  }, [tab, user]);

  const loadRecs = async () => {
    setLoading(true);
    try {
      if (tab === 'today' && user) {
        const res = await client.get<Recommendation[]>(`/recommendations/${user.id}/today`);
        setRecs(res.data);
      } else {
        const res = await client.get<Recommendation[]>('/recommendations/general');
        setRecs(res.data);
      }
    } catch {
      setRecs([]);
    } finally {
      setLoading(false);
    }
  };

  const grouped = recs.reduce<Record<string, Recommendation[]>>((acc, r) => {
    const key = r.trigger;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-down" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Рекомендации</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'today' && styles.tabActive]}
          onPress={() => setTab('today')}
        >
          <Text style={[styles.tabText, tab === 'today' && styles.tabTextActive]}>На сегодня</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'general' && styles.tabActive]}
          onPress={() => setTab('general')}
        >
          <Text style={[styles.tabText, tab === 'general' && styles.tabTextActive]}>Все советы</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 60 }} />
      ) : recs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="sunny-outline" size={56} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>Нет рекомендаций</Text>
          <Text style={styles.emptyText}>
            {tab === 'today' ? 'Сегодня нет активных триггеров' : 'База советов пуста'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {Object.entries(grouped).map(([trigger, items]) => (
            <View key={trigger} style={styles.group}>
              <View style={styles.groupHeader}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.groupTitle}>{TRIGGER_LABELS[trigger] || trigger}</Text>
              </View>
              {items
                .sort((a, b) => a.priority - b.priority)
                .map((rec) => (
                  <View key={rec.id} style={styles.recCard}>
                    <View style={[styles.priorityBar, { backgroundColor: PRIORITY_COLORS[rec.priority] }]} />
                    <View style={styles.recBody}>
                      <Ionicons
                        name={rec.icon as any}
                        size={22}
                        color={PRIORITY_COLORS[rec.priority]}
                      />
                      <Text style={styles.recText}>{rec.text}</Text>
                    </View>
                  </View>
                ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Theme.spacing.md,
    paddingTop: 56,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: { color: Colors.textPrimary, fontSize: Theme.fontSize.lg, fontWeight: Theme.fontWeight.bold },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: Theme.spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Theme.radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Theme.radius.sm },
  tabActive: { backgroundColor: Colors.accent },
  tabText: { color: Colors.textSecondary, fontSize: Theme.fontSize.sm, fontWeight: Theme.fontWeight.medium },
  tabTextActive: { color: Colors.background, fontWeight: Theme.fontWeight.semibold },
  list: { padding: Theme.spacing.md, gap: Theme.spacing.md },
  group: { gap: Theme.spacing.sm },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs },
  groupTitle: {
    color: Colors.textSecondary,
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recCard: {
    backgroundColor: Colors.card,
    borderRadius: Theme.radius.md,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  priorityBar: { width: 4 },
  recBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.sm,
    padding: Theme.spacing.md,
  },
  recText: { color: Colors.textPrimary, fontSize: Theme.fontSize.sm, flex: 1, lineHeight: 22 },
  empty: { alignItems: 'center', paddingTop: 80, gap: Theme.spacing.sm },
  emptyTitle: { color: Colors.textPrimary, fontSize: Theme.fontSize.lg, fontWeight: Theme.fontWeight.semibold },
  emptyText: { color: Colors.textSecondary, fontSize: Theme.fontSize.sm, textAlign: 'center' },
});
