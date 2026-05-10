import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useUserStore } from '../src/store/userStore';

export default function RootLayout() {
  const { user, loadUser } = useUserStore();
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    loadUser().then(() => setInitialized(true)).catch(() => setInitialized(true));
  }, []);

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      router.replace('/onboarding');
    }
  }, [initialized]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0F1117' } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="recommendations" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="notification-settings" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}
