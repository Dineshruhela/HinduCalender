import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs } from 'expo-router';
import { Calendar as CalendarIcon, Home, PartyPopper, Sparkles } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <View pointerEvents="none">
              <Home size={28} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => (
            <View pointerEvents="none">
              <CalendarIcon size={28} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="festivals"
        options={{
          title: 'Festivals',
          tabBarIcon: ({ color }) => (
            <View pointerEvents="none">
              <PartyPopper size={28} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="kundli"
        options={{
          title: 'Kundli',
          tabBarIcon: ({ color }) => (
            <View pointerEvents="none">
              <Sparkles size={28} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
