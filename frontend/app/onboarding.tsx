import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useUserStore } from '../src/store/userStore';
import { CreateUserPayload } from '../src/api/users';
import { Colors } from '../src/constants/colors';
import { Theme } from '../src/constants/theme';

type AgeGroup = 'under_18' | '18_35' | '36_55' | '55_plus';
type Condition = 'hypotension' | 'hypertension' | 'joints' | 'general';

interface GeoResult {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

const AGE_GROUPS: { key: AgeGroup; label: string }[] = [
  { key: 'under_18', label: 'До 18 лет' },
  { key: '18_35', label: '18–35 лет' },
  { key: '36_55', label: '36–55 лет' },
  { key: '55_plus', label: 'Старше 55' },
];

const CONDITIONS: { key: Condition; label: string; icon: string }[] = [
  { key: 'hypotension', label: 'Гипотония', icon: 'arrow-down-circle-outline' },
  { key: 'hypertension', label: 'Гипертония', icon: 'arrow-up-circle-outline' },
  { key: 'joints', label: 'Суставы', icon: 'body-outline' },
  { key: 'general', label: 'Общая метеозависимость', icon: 'cloud-outline' },
];

const STEPS = ['Имя', 'Возраст', 'Состояние', 'Местоположение'];

async function searchCity(query: string): Promise<GeoResult[]> {
  if (query.length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=ru&format=json`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.results || []).map((r: any) => ({
    name: r.name,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { createUser, isLoading } = useUserStore();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [cityQuery, setCityQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [selectedCity, setSelectedCity] = useState<GeoResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const toggleCondition = (key: Condition) => {
    setConditions((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const handleCityInput = async (text: string) => {
    setCityQuery(text);
    setSelectedCity(null);
    if (text.length < 2) { setSuggestions([]); return; }
    setSearchLoading(true);
    try {
      const results = await searchCity(text);
      setSuggestions(results);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectCity = (city: GeoResult) => {
    setSelectedCity(city);
    setCityQuery(`${city.name}, ${city.country}`);
    setSuggestions([]);
  };

  const handleGetLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Нет доступа', 'Разрешите доступ к геолокации или введите город вручную');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync(loc.coords);
      const cityName = geo?.city || geo?.region || geo?.country || 'Моё место';
      const countryName = geo?.country || '';
      setSelectedCity({ name: cityName, country: countryName, latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setCityQuery(`${cityName}, ${countryName}`);
      setSuggestions([]);
    } catch {
      Alert.alert('Ошибка', 'Не удалось определить местоположение');
    } finally {
      setLocLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return ageGroup !== null;
    if (step === 2) return conditions.length > 0;
    if (step === 3) return selectedCity !== null;
    return false;
  };

  const handleNext = async () => {
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    if (!ageGroup || !selectedCity) return;

    const payload: CreateUserPayload = {
      name: name.trim(),
      age_group: ageGroup,
      location_name: selectedCity.name,
      latitude: selectedCity.latitude,
      longitude: selectedCity.longitude,
      conditions,
      sensitivity_pressure: 2,
      sensitivity_kp: 2,
      sensitivity_temp: 2,
    };

    await createUser(payload);
    const { user } = useUserStore.getState();
    if (user) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Ошибка', 'Не удалось создать профиль. Проверьте подключение к серверу.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.progressRow}>
          {STEPS.map((s, i) => (
            <View key={s} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
          ))}
        </View>

        <Text style={styles.stepLabel}>Шаг {step + 1} из {STEPS.length}</Text>

        {step === 0 && (
          <View style={styles.stepContent}>
            <Ionicons name="person-circle-outline" size={64} color={Colors.accent} style={styles.stepIcon} />
            <Text style={styles.stepTitle}>Как вас зовут?</Text>
            <Text style={styles.stepSubtitle}>Это имя будет отображаться в приложении</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ваше имя"
              placeholderTextColor={Colors.textSecondary}
              autoFocus
              maxLength={50}
            />
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContent}>
            <Ionicons name="calendar-outline" size={64} color={Colors.accent} style={styles.stepIcon} />
            <Text style={styles.stepTitle}>Ваш возраст</Text>
            <Text style={styles.stepSubtitle}>Помогает подобрать индивидуальные советы</Text>
            <View style={styles.optionsGrid}>
              {AGE_GROUPS.map((g) => (
                <TouchableOpacity
                  key={g.key}
                  style={[styles.optionCard, ageGroup === g.key && styles.optionCardActive]}
                  onPress={() => setAgeGroup(g.key)}
                >
                  <Text style={[styles.optionText, ageGroup === g.key && styles.optionTextActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Ionicons name="heart-outline" size={64} color={Colors.accent} style={styles.stepIcon} />
            <Text style={styles.stepTitle}>Ваше состояние здоровья</Text>
            <Text style={styles.stepSubtitle}>Выберите всё, что относится к вам</Text>
            <View style={styles.conditionsGrid}>
              {CONDITIONS.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.condCard, conditions.includes(c.key) && styles.condCardActive]}
                  onPress={() => toggleCondition(c.key)}
                >
                  <Ionicons
                    name={c.icon as any}
                    size={28}
                    color={conditions.includes(c.key) ? Colors.background : Colors.accent}
                  />
                  <Text style={[styles.condText, conditions.includes(c.key) && styles.condTextActive]}>
                    {c.label}
                  </Text>
                  {conditions.includes(c.key) && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.background} style={styles.check} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Ionicons name="location-outline" size={64} color={Colors.accent} style={styles.stepIcon} />
            <Text style={styles.stepTitle}>Ваш город</Text>
            <Text style={styles.stepSubtitle}>Определите автоматически или введите название города</Text>

            <TouchableOpacity style={styles.locBtn} onPress={handleGetLocation} disabled={locLoading}>
              {locLoading ? (
                <ActivityIndicator color={Colors.accent} />
              ) : (
                <>
                  <Ionicons name="navigate-outline" size={20} color={Colors.accent} />
                  <Text style={styles.locBtnText}>Определить автоматически</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.divider}>или введите вручную</Text>

            <View style={styles.searchWrapper}>
              <TextInput
                style={styles.input}
                value={cityQuery}
                onChangeText={handleCityInput}
                placeholder="Например: Москва, Казань, Сочи..."
                placeholderTextColor={Colors.textSecondary}
                autoFocus
              />
              {searchLoading && (
                <ActivityIndicator style={styles.searchSpinner} color={Colors.accent} size="small" />
              )}
            </View>

            {suggestions.length > 0 && (
              <View style={styles.suggestions}>
                {suggestions.map((city, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectCity(city)}
                  >
                    <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.suggestionText}>{city.name}, {city.country}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {selectedCity && (
              <View style={styles.selectedCity}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.green} />
                <View>
                  <Text style={styles.selectedCityName}>{selectedCity.name}, {selectedCity.country}</Text>
                  <Text style={styles.selectedCityCoords}>
                    {selectedCity.latitude.toFixed(2)}, {selectedCity.longitude.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.footer}>
          {step > 0 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
              <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canProceed() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <>
                <Text style={styles.nextBtnText}>
                  {step === STEPS.length - 1 ? 'Начать' : 'Далее'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.background} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Theme.spacing.lg, paddingTop: 64, flexGrow: 1 },
  progressRow: { flexDirection: 'row', gap: 8, marginBottom: Theme.spacing.sm },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.card },
  progressDotActive: { backgroundColor: Colors.accent },
  stepLabel: { color: Colors.textSecondary, fontSize: Theme.fontSize.sm, marginBottom: Theme.spacing.xl },
  stepContent: { flex: 1, gap: Theme.spacing.md },
  stepIcon: { alignSelf: 'center' },
  stepTitle: { color: Colors.textPrimary, fontSize: Theme.fontSize.xl, fontWeight: Theme.fontWeight.bold, textAlign: 'center' },
  stepSubtitle: { color: Colors.textSecondary, fontSize: Theme.fontSize.md, textAlign: 'center', lineHeight: 22 },
  input: {
    backgroundColor: Colors.inputBg,
    borderRadius: Theme.radius.sm,
    padding: Theme.spacing.md,
    color: Colors.textPrimary,
    fontSize: Theme.fontSize.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.sm },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  optionCardActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '15' },
  optionText: { color: Colors.textPrimary, fontSize: Theme.fontSize.md, fontWeight: Theme.fontWeight.medium },
  optionTextActive: { color: Colors.accent },
  conditionsGrid: { gap: Theme.spacing.sm },
  condCard: {
    backgroundColor: Colors.card,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  condCardActive: { borderColor: Colors.accent, backgroundColor: Colors.accent },
  condText: { color: Colors.textPrimary, fontSize: Theme.fontSize.md, flex: 1 },
  condTextActive: { color: Colors.background, fontWeight: Theme.fontWeight.semibold },
  check: { marginLeft: 'auto' },
  locBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Theme.radius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  locBtnText: { color: Colors.accent, fontSize: Theme.fontSize.md, fontWeight: Theme.fontWeight.semibold },
  divider: { color: Colors.textSecondary, fontSize: Theme.fontSize.sm, textAlign: 'center' },
  searchWrapper: { position: 'relative' },
  searchSpinner: { position: 'absolute', right: 12, top: 14 },
  suggestions: {
    backgroundColor: Colors.card,
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  suggestionText: { color: Colors.textPrimary, fontSize: Theme.fontSize.md },
  selectedCity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    backgroundColor: Colors.green + '15',
    borderRadius: Theme.radius.sm,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.green,
  },
  selectedCityName: { color: Colors.green, fontSize: Theme.fontSize.md, fontWeight: Theme.fontWeight.semibold },
  selectedCityCoords: { color: Colors.textSecondary, fontSize: Theme.fontSize.xs, marginTop: 2 },
  footer: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.xl,
    paddingBottom: Theme.spacing.lg,
  },
  backBtn: {
    width: 52,
    height: 52,
    borderRadius: Theme.radius.md,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: Theme.radius.md,
    height: 52,
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { color: Colors.background, fontSize: Theme.fontSize.md, fontWeight: Theme.fontWeight.bold },
});
