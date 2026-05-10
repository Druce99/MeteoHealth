import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, wellnessColorMap, WellnessColor } from '../constants/colors';
import { Theme } from '../constants/theme';

interface Props {
  value: number;
  color: WellnessColor;
  size?: number;
}

export default function WellnessIndex({ value, color, size = 140 }: Props) {
  const strokeColor = wellnessColorMap[color];
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, value));
  const strokeDashoffset = circumference * (1 - progress / 100);

  const label =
    color === 'green' ? 'Хорошо' : color === 'yellow' ? 'Умеренно' : 'Осторожно';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
        <View
          style={[
            styles.innerCircle,
            {
              width: size - 24,
              height: size - 24,
              borderRadius: (size - 24) / 2,
              borderColor: strokeColor,
            },
          ]}
        />
        <View style={styles.content}>
          <Text style={[styles.value, { color: strokeColor }]}>{value}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  innerCircle: {
    position: 'absolute',
    borderWidth: 6,
    opacity: 0.3,
  },
  content: {
    alignItems: 'center',
  },
  value: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
  },
  label: {
    fontSize: Theme.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
