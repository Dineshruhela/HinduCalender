import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AdBanner from '@/src/components/AdBanner';
import { useInterstitialAd } from '@/src/hooks/useInterstitialAd';
import { requestPermission, scheduleAll } from '@/src/utils/notifications';
import { getUpcomingFestivals } from '@/src/utils/panchang';
import {
    getLanguageSetting,
    getLocalizedText,
    getLocationSettings,
    LanguageType,
} from '@/src/utils/settings';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { Bell, Compass, Info, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FESTIVAL_BANNER = require('@/assets/images/festival_banner.png');
const DIYA_ICON = require('@/assets/images/diya_icon.png');

const CATEGORIES: Record<string, { emoji: string; color: string; hiLabel: string; enLabel: string }> = {
  major: { emoji: '🌟', color: '#f59e0b', hiLabel: 'प्रमुख', enLabel: 'Major' },
  minor: { emoji: '✨', color: '#a78bfa', hiLabel: 'लघु', enLabel: 'Minor' },
  ekadashi: { emoji: '🌙', color: '#38bdf8', hiLabel: 'एकादशी', enLabel: 'Ekadashi' },
  pradosham: { emoji: '🔱', color: '#6366f1', hiLabel: 'प्रदोष', enLabel: 'Pradosh' },
  vrat: { emoji: '🙏', color: '#ec4899', hiLabel: 'व्रत', enLabel: 'Vrat' },
  jayanti: { emoji: '🎊', color: '#f97316', hiLabel: 'जयंती', enLabel: 'Jayanti' },
  solar: { emoji: '☀️', color: '#facc15', hiLabel: 'संक्रांति', enLabel: 'Solar' },
};

type FilterType = 'all' | 'vrat' | 'ekadashi' | 'major';

export default function FestivalsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  // Storage Settings
  const [activeLoc, setActiveLoc] = useState({ latitude: 28.6139, longitude: 77.2090, cityName: 'New Delhi' });
  const [language, setLanguage] = useState<LanguageType>('bilingual');

  // Festivals Data
  const [rawFestivals, setRawFestivals] = useState<any[]>([]);
  const [filteredFestivals, setFilteredFestivals] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Detail Modal State
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');

  const { show: showInterstitial } = useInterstitialAd();

  // Reload dynamically on tab focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function syncData() {
        const loc = await getLocationSettings();
        const lang = await getLanguageSetting();

        if (isMounted) {
          setActiveLoc(loc);
          setLanguage(lang);
        }

        const fests = getUpcomingFestivals(90, loc.latitude, loc.longitude);
        if (isMounted) {
          setRawFestivals(fests);
          applyFilter(fests, activeFilter);
        }
      }

      syncData();

      return () => {
        isMounted = false;
      };
    }, [activeFilter])
  );

  const applyFilter = (fests: any[], filter: FilterType) => {
    if (filter === 'all') {
      setFilteredFestivals(fests);
      return;
    }

    const filtered = fests.map(day => {
      const matchingEvents = day.events.filter((evt: any) => {
        if (filter === 'ekadashi') {
          return evt.category === 'ekadashi';
        }
        if (filter === 'vrat') {
          return evt.isFastingDay || evt.category === 'vrat' || evt.category === 'pradosham' || evt.category === 'ekadashi';
        }
        if (filter === 'major') {
          return evt.category === 'major';
        }
        return true;
      });

      if (matchingEvents.length > 0) {
        return {
          ...day,
          events: matchingEvents,
        };
      }
      return null;
    }).filter(Boolean);

    setFilteredFestivals(filtered);
  };

  const handleFilterPress = (filter: FilterType) => {
    setActiveFilter(filter);
    applyFilter(rawFestivals, filter);
  };

  const handleFestivalPress = (evt: any, date: string) => {
    setSelectedEvent(evt);
    setSelectedDateStr(date);

    // Show ad 30% of the time on a meaningful interaction
    if (Math.random() < 0.3) {
      showInterstitial();
    }
  };

  const handleSetReminder = async () => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Please allow notifications in Settings to set festival reminders.',
        [{ text: 'OK' }]
      );
      return;
    }
    await scheduleAll();
    Alert.alert(
      '🔔 Reminder Set!',
      `Festival alerts for ${selectedEvent?.name} and all upcoming festivals have been scheduled.\n\n• Day-of alert at 6:00 AM\n• Eve alert at 6:00 PM\n• 3-day advance notice at 9:00 AM`,
      [{ text: 'Great!' }]
    );
  };

  // Language helper
  const L = (hi: string, en: string, delim = ' · ') => getLocalizedText(hi, en, language, delim);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.mainWrapper, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.container} bounces={false}>
        
        {/* Hero Header with festival banner */}
        <View style={[styles.heroWrapper, { height: insets.top + 210 }]}>
          <Image source={FESTIVAL_BANNER} style={styles.heroBanner} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.1)', 'rgba(180,83,9,0.85)', 'rgba(217,119,6,1)']}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 0, y: 1 }}
            style={styles.heroOverlay}
          >
            <View style={styles.heroContent}>
              <Text style={styles.headerTitle}>Upcoming Festivals</Text>
              <Text style={styles.headerHindi}>आगामी पर्व एवं त्योहार</Text>
              <View style={styles.locBadgeRow}>
                <Text style={styles.headerSub}>Next 90 days · {new Date().getFullYear()}</Text>
                <Text style={styles.locBadge}>📍 {activeLoc.cityName}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Filter pills bar ── */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
            {[
              { type: 'all', title: L('सभी', 'All') },
              { type: 'vrat', title: L('व्रत / उपवास', 'Vrat / Fasts') },
              { type: 'ekadashi', title: L('एकादशी', 'Ekadashi') },
              { type: 'major', title: L('प्रमुख त्योहार', 'Major Festivals') },
            ].map(pill => {
              const isSelected = activeFilter === pill.type;
              return (
                <Pressable
                  key={pill.type}
                  onPress={() => handleFilterPress(pill.type as FilterType)}
                  style={[
                    styles.filterPill,
                    { backgroundColor: theme.cardBackground, borderColor: theme.border },
                    isSelected && { backgroundColor: theme.tint, borderColor: theme.tint },
                  ]}
                >
                  <Text style={[styles.filterPillText, { color: theme.text }, isSelected && { color: '#fff' }]} numberOfLines={1}>
                    {pill.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* List of festivals */}
        <View style={styles.list}>
          {filteredFestivals.map((day, idx) => {
            const evt0 = day.events[0];
            const catInfo = CATEGORIES[evt0?.category] || { emoji: '🎉', color: '#d97706', hiLabel: 'त्योहार', enLabel: 'Festival' };

            return (
              <Pressable
                key={idx}
                style={({ pressed }) => [
                  styles.festCard,
                  { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 }
                ]}
                onPress={() => handleFestivalPress(evt0, day.date)}
              >
                {/* Date Badge */}
                <View style={styles.dateBadgeWrapper}>
                  <LinearGradient
                    colors={[catInfo.color, '#b45309']}
                    style={styles.dateBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  >
                    <Text style={styles.dateMonth}>
                      {new Date(day.date).toLocaleString('default', { month: 'short' })}
                    </Text>
                    <Text style={styles.dateDay}>{new Date(day.date).getDate()}</Text>
                    <Text style={styles.dateDow}>
                      {new Date(day.date).toLocaleString('default', { weekday: 'short' })}
                    </Text>
                  </LinearGradient>
                </View>

                {/* Events */}
                <View style={styles.eventsArea}>
                  {day.events.map((evt: any, eIdx: number) => {
                    const info = CATEGORIES[evt.category] || { emoji: '🎉', color: '#d97706', hiLabel: 'त्योहार', enLabel: 'Festival' };
                    return (
                      <View key={eIdx} style={[styles.eventRow, eIdx !== day.events.length - 1 && { marginBottom: 10 }]}>
                        <Text style={styles.eventEmoji}>{info.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.eventName, { color: theme.text }]} numberOfLines={1}>{evt.name}</Text>
                          {evt.description && (
                            <Text style={[styles.eventDesc, { color: theme.icon }]} numberOfLines={2}>{evt.description}</Text>
                          )}
                          <View style={styles.tagRow}>
                            <View style={[styles.tag, { backgroundColor: `${info.color}22` }]}>
                              <Text style={[styles.tagText, { color: info.color }]}>
                                {L(info.hiLabel, info.enLabel).toUpperCase()}
                              </Text>
                            </View>
                            {evt.isFastingDay && (
                              <View style={[styles.tag, { backgroundColor: 'rgba(236,72,153,0.1)' }]}>
                                <Text style={[styles.tagText, { color: '#ec4899' }]}>{L('व्रत', 'FASTING')}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </Pressable>
            );
          })}

          {filteredFestivals.length === 0 && (
            <View style={styles.emptyState}>
              <Image source={DIYA_ICON} style={styles.emptyDiya} resizeMode="contain" />
              <Text style={[styles.emptyText, { color: theme.icon }]}>No upcoming festivals found</Text>
            </View>
          )}

          {/* Banner ad at bottom of list */}
          <AdBanner
            size="LEADERBOARD"
            style={{ marginTop: 12, marginBottom: 8, alignSelf: 'center' }}
            darkMode={colorScheme === 'dark'}
          />
        </View>
      </ScrollView>

      {/* ── Detail Bottom Sheet Modal ── */}
      {selectedEvent && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={selectedEvent !== null}
          onRequestClose={() => setSelectedEvent(null)}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedEvent(null)} />
            
            <View style={[styles.modalSheet, { backgroundColor: theme.cardBackground }]}>
              {/* Handlebar */}
              <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />

              {/* Close Button */}
              <Pressable onPress={() => setSelectedEvent(null)} style={styles.modalCloseButton}>
                <X size={20} color={theme.icon} />
              </Pressable>

              {/* Title Section with Saffron Gradient */}
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalHeaderGrad}
              >
                <View style={styles.modalHeaderContent}>
                  <Text style={styles.modalEmoji}>
                    {CATEGORIES[selectedEvent.category]?.emoji || '🎉'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalHeaderTitle} numberOfLines={2}>{selectedEvent.name}</Text>
                    <Text style={styles.modalHeaderSub}>
                      {new Date(selectedDateStr).toLocaleDateString(Platform.OS === 'ios' ? 'en-IN' : 'default', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Scrollable details */}
              <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Fasting Recommendation Badge */}
                {selectedEvent.isFastingDay && (
                  <View style={styles.vratBadge}>
                    <Info size={16} color="#ec4899" />
                    <Text style={styles.vratBadgeText}>
                      {L('व्रत और उपवास की अत्यधिक अनुशंसा की जाती है।', 'Fasting & Vrat is recommended for this auspicious day.')}
                    </Text>
                  </View>
                )}

                {/* Details Section */}
                <Text style={[styles.descTitle, { color: theme.text }]}>
                  {L('विवरण एवं महत्व', 'Significance & Significance')}
                </Text>
                <Text style={[styles.descText, { color: theme.text }]}>
                  {selectedEvent.description || L(
                    'इस शुभ दिन का हिंदू धर्म में अत्यधिक महत्व है। इसे भक्ति, ध्यान, और दान के साथ मनाया जाता है।',
                    'This highly auspicious day holds deep spiritual significance. It is traditionally observed with fasting, prayers, and acts of charity.'
                  )}
                </Text>

                {/* Location indicator */}
                <View style={[styles.modalInfoBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Compass size={18} color={theme.tint} />
                  <Text style={[styles.modalInfoText, { color: theme.icon }]}>
                    {L(
                      `यह गणना आपके सक्रिय स्थान (${activeLoc.cityName}) के अनुसार की गई है।`,
                      `Calculated precisely for your observer coordinates at ${activeLoc.cityName}.`
                    )}
                  </Text>
                </View>

                {/* Notification Alarm */}
                <Pressable
                  onPress={handleSetReminder}
                  style={({ pressed }) => [
                    styles.reminderButton,
                    { backgroundColor: theme.tint, opacity: pressed ? 0.9 : 1 }
                  ]}
                >
                  <Bell size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.reminderButtonText}>
                    {L('स्मरणपत्र सेट करें', 'Set Reminder Alarm')}
                  </Text>
                </Pressable>

                {/* Ad Banner inside Bottom Sheet Drawer */}
                <AdBanner
                  size="BANNER"
                  style={{ marginTop: 24, alignSelf: 'center' }}
                  darkMode={colorScheme === 'dark'}
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  container: { flex: 1 },

  heroWrapper: { width: '100%', overflow: 'hidden' },
  heroBanner: { width: '100%', height: '100%', position: 'absolute' },
  heroOverlay: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  heroContent: {},
  headerTitle: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerHindi: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginTop: 3 },
  locBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  locBadge: { fontSize: 11, color: '#fff', backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, fontWeight: '700' },

  filterContainer: {
    marginTop: 20,
    marginBottom: 4,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
  },

  list: { padding: 20, paddingTop: 16, paddingBottom: 60 },

  festCard: {
    flexDirection: 'row',
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  dateBadgeWrapper: { padding: 16, paddingRight: 0 },
  dateBadge: {
    width: 66, height: 80, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  dateMonth: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateDay: { color: '#fff', fontSize: 26, fontWeight: '900', lineHeight: 32 },
  dateDow: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

  eventsArea: { flex: 1, padding: 16, paddingLeft: 14 },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start' },
  eventEmoji: { fontSize: 22, marginRight: 10, marginTop: 1 },
  eventName: { fontSize: 16, fontWeight: '800', lineHeight: 22 },
  eventDesc: { fontSize: 13, marginTop: 4, lineHeight: 18, fontWeight: '500' },
  tagRow: { flexDirection: 'row', marginTop: 8, gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyDiya: { width: 100, height: 100, opacity: 0.6, marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: '600' },

  // ── Modal Bottom Sheet Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    minHeight: '60%',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  modalCloseButton: {
    position: 'absolute',
    right: 20,
    top: 15,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderGrad: {
    padding: 24,
    paddingTop: 28,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modalEmoji: {
    fontSize: 36,
  },
  modalHeaderTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  modalHeaderSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginTop: 4,
  },
  modalBody: {
    padding: 24,
  },
  vratBadge: {
    flexDirection: 'row',
    backgroundColor: 'rgba(236,72,153,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.18)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  vratBadgeText: {
    flex: 1,
    color: '#ec4899',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  descTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  descText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    marginBottom: 20,
  },
  modalInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 24,
  },
  modalInfoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  reminderButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
