import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppOpenAd } from '@/src/hooks/useAppOpenAd';
import { initializeAds } from '@/src/utils/adService';
import { areNotificationsEnabled, requestPermission, scheduleAll } from '@/src/utils/notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useAppOpenAd();

  // Initialize AdMob once at app startup
  useEffect(() => {
    if (Platform.OS === 'web') return;
    initializeAds().catch(() => { });
  }, []);

  // Initialize notifications: re-schedule if user had them enabled
  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      const enabled = await areNotificationsEnabled();
      if (enabled) {
        const granted = await requestPermission();
        if (granted) await scheduleAll();
      }
    })();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
