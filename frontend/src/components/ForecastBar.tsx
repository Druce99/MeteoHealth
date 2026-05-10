import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';
import { DayForecast } from '../api/forecast';

interface Props {
  days: DayForecast[];
}

function getWellnessColor(index: number): string {
  if (index >= 70) return Colors.green;
  if (index >= 40) return Colors.yellow;
  return Colors.red;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const day = date.getDate();
  const month = date.getMonth() + 1;
  return `${days[date.getDay()]}\n${day}.${month < 10 ? '0' + month : month}`;
}

export default function ForecastBar({ days }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Прогноз на неделю</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {days.map((day) => {
          const color = getWellnessColor(day.wellness_index);
          return (
            <View key={day.date} style={styles.dayCard}>
              <Text style={styles.dateText}>{formatDate(day.date)}</Text>
              <View style={[styles.indexCircle, { borderColor: color }]}>
                <Text style={[styles.indexValue, { color }]}>{day.wellness_index}</Text>
              </View>
              <View style={styles.weatherRow}>
                <Ionicons name="thermometer-outline" size={12} color={Colors.textSecondary} />
                <Text style={styles.weatherText}>{day.temperature > 0 ? '+' : ''}{day.temperature}°</Text>
              </View>
              <View style={styles.weatherRow}>
                <Ionicons name="planet-outline" size={12} color={Colors.textSecondary} />
                <Text style={styles.weatherText}>Kp {day.kp_index != null && day.kp_index > 0 ? day.kp_index : '—'}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
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
  scroll: {
    gap: Theme.spacing.sm,
    paddingRight: Theme.spacing.xs,
  },
  dayCard: {
    alignItems: 'center',
    gap: Theme.spacing.xs,
    minWidth: 56,
  },
  dateText: {
    color: Colors.textSecondary,
    fontSize: Theme.fontSize.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
  indexCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexValue: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.bold,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  weatherText: {
    color: Colors.textSecondary,
    fontSize: Theme.fontSize.xs,
  },
});
