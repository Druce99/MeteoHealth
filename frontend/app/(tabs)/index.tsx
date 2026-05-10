import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useUserStore } from '../../src/store/userStore';
import { useForecastStore } from '../../src/store/forecastStore';
import WellnessIndex from '../../src/components/WellnessIndex';
import WeatherCard from '../../src/components/WeatherCard';
import AlertCard from '../../src/components/AlertCard';
import ForecastBar from '../../src/components/ForecastBar';
import { Colors } from '../../src/constants/colors';
import { Theme } from '../../src/constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const { today, week, isLoadingToday, fetchToday, fetchWeek } = useForecastStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (!user) return;
    fetchToday(user.id);
    fetchWeek(user.id);
  }, [user]);

  const onRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    await Promise.all([fetchToday(user.id), fetchWeek(user.id)]);
    setRefreshing(false);
  };

  if (!user) return null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Привет, {user.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.location}>{user.location_name}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/recommendations')} style={styles.recBtn}>
          <Ionicons name="bulb-outline" size={22} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      {isLoadingToday && !today ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Загружаем прогноз...</Text>
        </View>
      ) : today ? (
        <>
          <View style={styles.wellnessRow}>
            <WellnessIndex value={today.wellness_index} color={today.color} size={160} />
            <View style={styles.wellnessInfo}>
              <Text style={styles.wellnessTitle}>Индекс благополучия</Text>
              <Text style={styles.wellnessSubtitle}>на сегодня</Text>
              <View style={styles.dateChip}>
                <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
                <Text style={styles.dateText}>{today.date}</Text>
              </View>
            </View>
          </View>

          <AlertCard
            color={today.color}
            wellness={today.wellness_index}
            kp_index={today.kp_index}
            pressure={today.pressure}
          />

          <WeatherCard
            pressure={today.pressure}
            temperature={today.temperature}
            humidity={today.humidity}
            kp_index={today.kp_index}
          />

          {week && week.days.length > 0 && <ForecastBar days={week.days} />}
        </>
      ) : (
        <View style={styles.errorState}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.errorText}>Не удалось загрузить прогноз</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchToday(user.id)}>
            <Text style={styles.retryText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Theme.spacing.md, gap: Theme.spacing.md, paddingTop: 56 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    color: Colors.textPrimary,
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  location: { color: Colors.textSecondary, fontSize: Theme.fontSize.sm },
  recBtn: {
    backgroundColor: Colors.card,
    borderRadius: Theme.radius.full,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  wellnessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  wellnessInfo: { flex: 1 },
  wellnessTitle: {
    color: Colors.textPrimary,
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
  },
  wellnessSubtitle: { color: Colors.textSecondary, fontSize: Theme.fontSize.sm, marginTop: 4 },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Theme.spacing.sm,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
    alignSelf: 'flex-start',
  },
  dateText: { color: Colors.textSecondary, fontSize: Theme.fontSize.xs },
  loader: { alignItems: 'center', paddingTop: 80, gap: Theme.spacing.md },
  loadingText: { color: Colors.textSecondary, fontSize: Theme.fontSize.md },
  errorState: { alignItems: 'center', paddingTop: 80, gap: Theme.spacing.md },
  errorText: { color: Colors.textSecondary, fontSize: Theme.fontSize.md },
  retryBtn: {
    backgroundColor: Colors.card,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  retryText: { color: Colors.accent, fontSize: Theme.fontSize.md, fontWeight: Theme.fontWeight.semibold },
});
