import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../src/store/userStore';
import { useForecastStore } from '../../src/store/forecastStore';
import { forecastApi, TodayForecast, MlPrediction } from '../../src/api/forecast';
import { Colors, wellnessColorMap, WellnessColor } from '../../src/constants/colors';
import { Theme } from '../../src/constants/theme';

function getWellnessColor(index: number): WellnessColor {
  if (index >= 70) return 'green';
  if (index >= 40) return 'yellow';
  return 'red';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

export default function ForecastScreen() {
  const { user } = useUserStore();
  const { week, isLoadingWeek, fetchWeek } = useForecastStore();
  const [selected, setSelected] = useState<TodayForecast | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [mlPredictions, setMlPredictions] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    fetchWeek(user.id);
    forecastApi.getMlPredictions(user.id)
      .then(preds => {
        const map: Record<string, number> = {};
        preds.forEach(p => { map[p.date] = p.predicted_wellbeing; });
        setMlPredictions(map);
      })
      .catch(() => {});
  }, [user]);

  const handleDayPress = async (date: string) => {
    if (!user) return;
    setLoadingDetail(true);
    try {
      const detail = await forecastApi.getByDate(user.id, date);
      setSelected(detail);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (!user) return null;

  const hasMl = Object.keys(mlPredictions).length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Прогноз на неделю</Text>

      {isLoadingWeek && !week ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />
      ) : week ? (
        <View style={styles.daysContainer}>
          {week.days.map((day) => {
            const wColor = getWellnessColor(day.wellness_index);
            const accent = wellnessColorMap[wColor];
            const isSelected = selected?.date === day.date;
            const mlScore = mlPredictions[day.date];
            const isCritical = mlScore !== undefined && mlScore < 5;
            return (
              <TouchableOpacity
                key={day.date}
                style={[styles.dayCard, isSelected && { borderColor: accent }]}
                onPress={() => handleDayPress(day.date)}
              >
                <View style={styles.dayLeft}>
                  <View style={styles.dayNameRow}>
                    <Text style={styles.dayName}>{formatDate(day.date)}</Text>
                    {isCritical && (
                      <View style={styles.criticalBadge}>
                        <Ionicons name="warning-outline" size={12} color={Colors.background} />
                        <Text style={styles.criticalText}>Тяжёлый день</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.dayMetrics}>
                    <View style={styles.metric}>
                      <Ionicons name="thermometer-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.metricText}>{day.temperature > 0 ? '+' : ''}{day.temperature}°C</Text>
                    </View>
                    <View style={styles.metric}>
                      <Ionicons name="speedometer-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.metricText}>{day.pressure} мм</Text>
                    </View>
                    <View style={styles.metric}>
                      <Ionicons name="planet-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.metricText}>Kp {day.kp_index != null && day.kp_index > 0 ? day.kp_index : '—'}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.dayRight}>
                  <View style={[styles.indexBadge, { borderColor: accent }]}>
                    <Text style={[styles.indexValue, { color: accent }]}>{day.wellness_index}</Text>
                  </View>
                  {hasMl && mlScore !== undefined && (
                    <Text style={styles.mlScore}>ML {mlScore}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {selected && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>{formatDate(selected.date)}</Text>
            {mlPredictions[selected.date] !== undefined && (
              <View style={styles.mlDetailBadge}>
                <Ionicons name="hardware-chip-outline" size={14} color={Colors.accent} />
                <Text style={styles.mlDetailText}>
                  Личный прогноз: {mlPredictions[selected.date]}/10
                </Text>
              </View>
            )}
          </View>
          <View style={styles.detailGrid}>
            {[
              { icon: 'speedometer-outline', label: 'Давление', value: `${selected.pressure} мм рт.ст.` },
              { icon: 'thermometer-outline', label: 'Температура', value: `${selected.temperature > 0 ? '+' : ''}${selected.temperature}°C` },
              { icon: 'water-outline', label: 'Влажность', value: `${selected.humidity}%` },
              { icon: 'planet-outline', label: 'Kp-индекс', value: selected.kp_index != null && selected.kp_index > 0 ? `${selected.kp_index}` : '—' },
            ].map((item) => (
              <View key={item.label} style={styles.detailItem}>
                <Ionicons name={item.icon as any} size={18} color={Colors.accent} />
                <Text style={styles.detailValue}>{item.value}</Text>
                <Text style={styles.detailLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {loadingDetail && (
        <ActivityIndicator size="small" color={Colors.accent} style={{ marginTop: 16 }} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Theme.spacing.md, gap: Theme.spacing.md, paddingTop: 56 },
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
  },
  daysContainer: { gap: Theme.spacing.sm },
  dayCard: {
    backgroundColor: Colors.card,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  dayLeft: { flex: 1, gap: Theme.spacing.xs },
  dayNameRow: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, flexWrap: 'wrap' },
  dayName: { color: Colors.textPrimary, fontSize: Theme.fontSize.md, fontWeight: Theme.fontWeight.medium },
  criticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.red,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  criticalText: { color: Colors.background, fontSize: 10, fontWeight: Theme.fontWeight.semibold },
  dayMetrics: { flexDirection: 'row', gap: Theme.spacing.md },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricText: { color: Colors.textSecondary, fontSize: Theme.fontSize.sm },
  dayRight: { alignItems: 'center', gap: 4 },
  indexBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexValue: { fontSize: Theme.fontSize.md, fontWeight: Theme.fontWeight.bold },
  mlScore: { color: Colors.textSecondary, fontSize: 10 },
  detailCard: {
    backgroundColor: Colors.card,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.accent,
    gap: Theme.spacing.md,
  },
  detailHeader: { gap: Theme.spacing.xs },
  detailTitle: { color: Colors.textPrimary, fontSize: Theme.fontSize.lg, fontWeight: Theme.fontWeight.semibold },
  mlDetailBadge: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs },
  mlDetailText: { color: Colors.accent, fontSize: Theme.fontSize.sm },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.sm },
  detailItem: {
    width: '47%',
    backgroundColor: Colors.inputBg,
    borderRadius: Theme.radius.sm,
    padding: Theme.spacing.sm,
    gap: 4,
  },
  detailValue: { color: Colors.textPrimary, fontSize: Theme.fontSize.md, fontWeight: Theme.fontWeight.semibold },
  detailLabel: { color: Colors.textSecondary, fontSize: Theme.fontSize.xs },
});
