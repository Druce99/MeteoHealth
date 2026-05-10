import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, WellnessColor, wellnessColorMap } from '../constants/colors';
import { Theme } from '../constants/theme';

interface Props {
  color: WellnessColor;
  wellness: number;
  kp_index: number;
  pressure: number;
}

function getAlerts(color: WellnessColor, kp_index: number, pressure: number): string[] {
  const alerts: string[] = [];
  if (color === 'red') alerts.push('Неблагоприятный день — ограничьте нагрузки');
  if (color === 'yellow') alerts.push('Умеренная активность геофизических факторов');
  if (kp_index >= 5) alerts.push(`Магнитная буря Kp=${kp_index} — примите меры`);
  else if (kp_index >= 3) alerts.push(`Повышенная геомагнитная активность Kp=${kp_index}`);
  if (pressure < 745) alerts.push('Пониженное атмосферное давление');
  else if (pressure > 775) alerts.push('Повышенное атмосферное давление');
  if (alerts.length === 0) alerts.push('Благоприятный день для активности');
  return alerts;
}

export default function AlertCard({ color, wellness, kp_index, pressure }: Props) {
  const alerts = getAlerts(color, kp_index, pressure);
  const accentColor = wellnessColorMap[color];
  const iconName =
    color === 'green'
      ? 'checkmark-circle-outline'
      : color === 'yellow'
      ? 'warning-outline'
      : 'alert-circle-outline';

  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      <View style={styles.header}>
        <Ionicons name={iconName} size={20} color={accentColor} />
        <Text style={[styles.title, { color: accentColor }]}>Предупреждения</Text>
      </View>
      {alerts.map((alert, i) => (
        <View key={i} style={styles.alertRow}>
          <Ionicons name="radio-button-on-outline" size={12} color={Colors.textSecondary} />
          <Text style={styles.alertText}>{alert}</Text>
        </View>
      ))}
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
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  title: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.xs,
  },
  alertText: {
    color: Colors.textPrimary,
    fontSize: Theme.fontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
});
