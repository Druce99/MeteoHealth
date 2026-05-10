import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';
import { DiaryEntry } from '../api/diary';

interface Props {
  entries: DiaryEntry[];
}

const CHART_HEIGHT = 80;
const BAR_MIN_HEIGHT = 4;

export default function DiaryChart({ entries }: Props) {
  const last14 = entries.slice(-14);

  if (last14.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Нет данных для графика</Text>
      </View>
    );
  }

  const maxScore = 10;
  const width = (Dimensions.get('window').width - 64) / Math.max(last14.length, 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Самочувствие за 14 дней</Text>
      <View style={styles.chart}>
        {last14.map((entry, i) => {
          const barHeight = Math.max(
            BAR_MIN_HEIGHT,
            (entry.wellbeing_score / maxScore) * CHART_HEIGHT
          );
          const color =
            entry.wellbeing_score >= 7
              ? Colors.green
              : entry.wellbeing_score >= 4
              ? Colors.yellow
              : Colors.red;
          return (
            <View key={entry.id} style={[styles.barWrapper, { width: width - 4 }]}>
              <View style={[styles.bar, { height: barHeight, backgroundColor: color }]} />
              {i % 3 === 0 && (
                <Text style={styles.dateLabel}>
                  {entry.date.slice(5).replace('-', '.')}
                </Text>
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: Colors.green }]} />
          <Text style={styles.legendText}>Хорошо (7–10)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: Colors.yellow }]} />
          <Text style={styles.legendText}>Умеренно (4–6)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: Colors.red }]} />
          <Text style={styles.legendText}>Плохо (1–3)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  title: {
    color: Colors.textSecondary,
    fontSize: Theme.fontSize.sm,
    marginBottom: Theme.spacing.md,
    fontWeight: Theme.fontWeight.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + 20,
    gap: 4,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: CHART_HEIGHT + 20,
  },
  bar: {
    width: '100%',
    borderRadius: 3,
  },
  dateLabel: {
    color: Colors.textSecondary,
    fontSize: 9,
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: Colors.textSecondary,
    fontSize: Theme.fontSize.xs,
  },
  empty: {
    backgroundColor: Colors.card,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Theme.fontSize.sm,
  },
});
