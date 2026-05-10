import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Theme } from '../constants/theme';

interface WeatherParam {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

interface Props {
  pressure: number;
  temperature: number;
  humidity: number;
  kp_index: number;
}

export default function WeatherCard({ pressure, temperature, humidity, kp_index }: Props) {
  const params: WeatherParam[] = [
    {
      icon: 'speedometer-outline',
      label: 'Давление',
      value: `${pressure} мм рт.ст.`,
    },
    {
      icon: 'thermometer-outline',
      label: 'Температура',
      value: `${temperature > 0 ? '+' : ''}${temperature}°C`,
    },
    {
      icon: 'water-outline',
      label: 'Влажность',
      value: `${humidity}%`,
    },
    {
      icon: 'planet-outline',
      label: 'Kp-индекс',
      value: `${kp_index}`,
    },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Погода сейчас</Text>
      <View style={styles.grid}>
        {params.map((p) => (
          <View key={p.label} style={styles.item}>
            <Ionicons name={p.icon} size={22} color={Colors.accent} />
            <Text style={styles.itemValue}>{p.value}</Text>
            <Text style={styles.itemLabel}>{p.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  item: {
    width: '47%',
    backgroundColor: Colors.inputBg,
    borderRadius: Theme.radius.sm,
    padding: Theme.spacing.sm,
    alignItems: 'flex-start',
    gap: 4,
  },
  itemValue: {
    color: Colors.textPrimary,
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
  },
  itemLabel: {
    color: Colors.textSecondary,
    fontSize: Theme.fontSize.xs,
  },
});
