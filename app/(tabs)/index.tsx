import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AdBanner from '@/src/components/AdBanner';
import {
    areNotificationsEnabled,
    cancelAll,
    requestPermission,
    scheduleAll,
} from '@/src/utils/notifications';
import {
    AYANA_HI,
    formatTime,
    getDailyPanchangAsync,
    getKaranaHindi,
    getKaranaName,
    getNakshatraHindi,
    getNakshatraName,
    getTithiHindi,
    getTithiName,
    getYogaHindi,
    getYogaName,
    MASA_HI,
    PAKSHA_HI,
    RITU_HI,
} from '@/src/utils/panchang';
import { getDailyRashifal, RASHI_LIST } from '@/src/utils/rashifal';
import {
    getLanguageSetting,
    getLocalizedText,
    getLocationSettings,
    LanguageType,
} from '@/src/utils/settings';
import { getKundli, Observer } from '@ishubhamx/panchangam-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
    AlertTriangle,
    AlignLeft,
    Bell,
    BellOff,
    Calendar,
    Clock,
    MapPin,
    Moon,
    Settings as SettingsIcon,
    Sparkles,
    Star,
    Sun,
    Sunrise,
    Sunset,
    TrendingUp,
    User,
    X,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ImageBackground,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OM_MANDALA = require('@/assets/images/om_mandala.png');
const MOON_BANNER = require('@/assets/images/moon_banner.png');
const DIYA_ICON = require('@/assets/images/diya_icon.png');

const CHOGHADIYA_HI: Record<string, { hi: string; meaning: string; color: string }> = {
  Amrit: { hi: 'अमृत', meaning: 'सर्वोत्तम (Best)', color: '#10b981' },
  Amrita: { hi: 'अमृत', meaning: 'सर्वोत्तम (Best)', color: '#10b981' },
  Shubh: { hi: 'शुभ', meaning: 'उत्तम (Good)', color: '#10b981' },
  Shubha: { hi: 'शुभ', meaning: 'उत्तम (Good)', color: '#10b981' },
  Labh: { hi: 'लाभ', meaning: 'उन्नति (Gain)', color: '#10b981' },
  Laabha: { hi: 'लाभ', meaning: 'उन्नति (Gain)', color: '#10b981' },
  Chal: { hi: 'चल', meaning: 'सामान्य (Neutral)', color: '#64748b' },
  Chala: { hi: 'चल', meaning: 'सामान्य (Neutral)', color: '#64748b' },
  Rog: { hi: 'रोग', meaning: 'बाधा (Avoid/Disease)', color: '#ef4444' },
  Roga: { hi: 'रोग', meaning: 'बाधा (Avoid/Disease)', color: '#ef4444' },
  Kaal: { hi: 'काल', meaning: 'हानि (Loss)', color: '#ef4444' },
  Kaala: { hi: 'काल', meaning: 'हानि (Loss)', color: '#ef4444' },
  Udveg: { hi: 'उद्वेग', meaning: 'भय/चिंता (Bad)', color: '#ef4444' },
  Udvega: { hi: 'उद्वेग', meaning: 'भय/चिंता (Bad)', color: '#ef4444' },
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Settings states
  const [activeLoc, setActiveLoc] = useState({ latitude: 28.6139, longitude: 77.2090, cityName: 'New Delhi' });
  const [language, setLanguage] = useState<LanguageType>('bilingual');

  // Saved profile and Rashifal states
  const [savedProfile, setSavedProfile] = useState<any>(null);
  const [rashifal, setRashifal] = useState<any>(null);
  const [previewRashi, setPreviewRashi] = useState<number | null>(null);

  // Panchang & Notification States
  const [panchang, setPanchang] = useState<any>(null);
  const [today] = useState(new Date());
  const [notifsOn, setNotifsOn] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [loadingPanchang, setLoadingPanchang] = useState(true);

  // Active Muhurta Category
  const [muhurtaTab, setMuhurtaTab] = useState<'auspicious' | 'inauspicious' | 'choghadiya'>('auspicious');
  const [choghadiyaTime, setChoghadiyaTime] = useState<'day' | 'night'>('day');

  // Triggered on every tab focus to ensure location settings are instantly re-applied
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      setLoadingPanchang(true);

      async function init() {
        const loc = await getLocationSettings();
        const lang = await getLanguageSetting();
        const notifs = await areNotificationsEnabled();

        if (isMounted) {
          setActiveLoc(loc);
          setLanguage(lang);
          setNotifsOn(notifs);
        }

        // Calculate Panchang dynamically for the active observer
        const data = await getDailyPanchangAsync(today, loc.latitude, loc.longitude);
        if (isMounted) {
          setPanchang(data);
          setLoadingPanchang(false);
        }

        // Load saved birth profile for personalized daily Rashifal
        try {
          const profileStr = await AsyncStorage.getItem('@SavedKundliProfile');
          if (profileStr) {
            const profile = JSON.parse(profileStr);
            if (isMounted) {
              setSavedProfile(profile);
            }
            
            // Compute Moon Rashi dynamically on the fly
            const obs = new Observer(profile.latitude, profile.longitude, 0);
            const birthTime = new Date(profile.year, profile.month - 1, profile.day, profile.hour, profile.min);
            const k = getKundli(birthTime, obs);
            const moonRashi = k.planets['Moon']?.rashi;
            if (moonRashi !== undefined) {
              const calculatedRashifal = getDailyRashifal(moonRashi, today);
              if (isMounted) {
                setRashifal(calculatedRashifal);
              }
            }
          } else {
            if (isMounted) {
              setSavedProfile(null);
              setRashifal(null);
            }
          }
        } catch (e) {
          console.error('Failed to calculate daily Rashifal', e);
        }
      }

      init();
      return () => {
        isMounted = false;
      };
    }, [today])
  );

  const toggleNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      if (notifsOn) {
        await cancelAll();
        setNotifsOn(false);
        Alert.alert('🔕 Notifications Off', 'All Hindu calendar alerts have been stopped.');
      } else {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert('Permission Required', 'Please allow notifications in Settings to receive festival alerts.');
          return;
        }
        await scheduleAll();
        setNotifsOn(true);
        Alert.alert(
          '🔔 Notifications On!',
          'You will receive:\n• Daily Panchang at 7:00 AM\n• Festival alerts 3 days and 1 day before\n• Morning alerts on festival days'
        );
      }
    } finally {
      setNotifLoading(false);
    }
  }, [notifsOn]);

  if (loadingPanchang || !panchang) {
    return (
      <ImageBackground source={MOON_BANNER} style={styles.loadingContainer} imageStyle={{ opacity: 0.45 }}>
        <LinearGradient colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0.92)']} style={StyleSheet.absoluteFill} />
        <Image source={OM_MANDALA} style={styles.loadingMandala} resizeMode="contain" />
        <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 20 }} />
        <Text style={{ color: '#fcd34d', fontSize: 18, fontWeight: 'bold', marginTop: 16 }}>
          Awakening the Cosmos...
        </Text>
        <Text style={{ color: 'rgba(253,211,77,0.7)', fontSize: 14, marginTop: 6 }}>
          पंचांग गणना हो रही है
        </Text>
      </ImageBackground>
    );
  }

  const {
    tithi,
    nakshatra,
    yoga,
    karana,
    paksha,
    masa,
    sunrise,
    sunset,
    moonrise,
    moonset,
    rahuKalamStart,
    rahuKalamEnd,
    yamagandaKalam,
    gulikaKalam,
    brahmaMuhurta,
    abhijitMuhurta,
    festivals,
    ritu,
    ayana,
  } = panchang;

  // Language helper
  const L = (hi: string, en: string, delim = ' · ') => getLocalizedText(hi, en, language, delim);

  // Panchang calculations
  const tithiEn = getTithiName(tithi);
  const tithiHi = getTithiHindi(tithi);
  const nakshatraEn = getNakshatraName(nakshatra);
  const nakshatraHi = getNakshatraHindi(nakshatra);
  const yogaEn = getYogaName(yoga);
  const yogaHi = getYogaHindi(yoga);
  const karanaEn = getKaranaName(karana);
  const karanaHi = getKaranaHindi(karana);

  const isBhadraActive = karana === 'Vishti';
  const PANCHAK_RASHIS = new Set([0, 1, 2, 10, 11]);
  const isPanchakActive = PANCHAK_RASHIS.has(panchang.moonRashi?.index);

  const masaHi = MASA_HI[masa?.name] || masa?.name;
  const pakshaHi = PAKSHA_HI[paksha] || paksha;
  const rituHi = RITU_HI[ritu] || ritu;
  const ayanaHi = AYANA_HI[ayana] || ayana;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} bounces={false}>
      {/* ── Hero Header ── */}
      <ImageBackground source={MOON_BANNER} style={styles.heroImage} imageStyle={{ opacity: 0.5 }}>
        <LinearGradient
          colors={['rgba(120,40,0,0.45)', 'rgba(209,91,5,0.85)', 'rgba(217,119,6,1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.heroOverlay, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroTextContainer}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                <View style={styles.locationChip}>
                  <MapPin size={12} color="#fff" />
                  <Text style={styles.locationText} numberOfLines={1}>{activeLoc.cityName}</Text>
                </View>
                {isBhadraActive && (
                  <View style={[styles.cautionChip, { backgroundColor: '#ef4444' }]}>
                    <AlertTriangle size={12} color="#fff" />
                    <Text style={styles.cautionText}>{L('भद्रा सक्रिय ⚠️', 'Bhadra Active ⚠️')}</Text>
                  </View>
                )}
                {isPanchakActive && (
                  <View style={[styles.cautionChip, { backgroundColor: '#ea580c' }]}>
                    <AlertTriangle size={12} color="#fff" />
                    <Text style={styles.cautionText}>{L('पंचक सक्रिय ⚠️', 'Panchak Active ⚠️')}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.headerHindi}>हिंदू पंचांग</Text>
              <Text style={styles.headerTitle}>Hindu Calendar</Text>
              <Text style={styles.headerDate}>
                {today.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.heroRight}>
              <View style={styles.buttonRow}>
                {/* Settings Gear */}
                <Pressable
                  onPress={() => router.push('/modal')}
                  style={styles.bellButton}
                  accessibilityLabel="Settings"
                >
                  <SettingsIcon size={20} color="rgba(255,255,255,0.9)" />
                </Pressable>

                {/* Notification Bell */}
                <Pressable
                  onPress={toggleNotifications}
                  disabled={notifLoading}
                  style={[styles.bellButton, notifsOn && styles.bellButtonActive]}
                  accessibilityLabel={notifsOn ? 'Disable notifications' : 'Enable notifications'}
                >
                  {notifLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : notifsOn ? (
                    <Bell size={20} color="#fff" fill="#fff" />
                  ) : (
                    <BellOff size={20} color="rgba(255,255,255,0.7)" />
                  )}
                </Pressable>
              </View>
              <Image source={OM_MANDALA} style={styles.omMandala} resizeMode="contain" />
            </View>
          </View>

          {/* Quick strip */}
          <View style={styles.quickInfoStrip}>
            <View style={styles.quickItem}>
              <Text style={styles.quickLabel}>{L('तिथि', 'Tithi', ' / ')}</Text>
              <Text style={styles.quickValue} numberOfLines={1}>
                {L(tithiHi, tithiEn, ' / ')}
              </Text>
            </View>
            <View style={styles.quickDivider} />
            <View style={styles.quickItem}>
              <Text style={styles.quickLabel}>{L('मास', 'Masa', ' / ')}</Text>
              <Text style={styles.quickValue} numberOfLines={1}>
                {L(masaHi, masa.name, ' / ')}
              </Text>
            </View>
            <View style={styles.quickDivider} />
            <View style={styles.quickItem}>
              <Text style={styles.quickLabel}>{L('पक्ष', 'Paksha', ' / ')}</Text>
              <Text style={[styles.quickValue, { fontSize: 13 }]} numberOfLines={1}>
                {L(pakshaHi, paksha, ' / ')}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.content}>
        {/* ── Panchang Grid (The Five Limbs) ── */}
        <View style={styles.gridContainer}>
          <GridBox
            iconBg="rgba(245,158,11,0.12)"
            Icon={Moon}
            iconColor="#f59e0b"
            label={L('तिथि', 'Tithi')}
            value={L(tithiHi, tithiEn)}
            theme={theme}
          />
          <GridBox
            iconBg="rgba(56,189,248,0.12)"
            Icon={Star}
            iconColor="#38bdf8"
            label={L('नक्षत्र', 'Nakshatra')}
            value={L(nakshatraHi, nakshatraEn)}
            theme={theme}
          />
          <GridBox
            iconBg="rgba(168,85,247,0.12)"
            Icon={TrendingUp}
            iconColor="#a855f7"
            label={L('योग', 'Yoga')}
            value={L(yogaHi, yogaEn)}
            theme={theme}
          />
          <GridBox
            iconBg="rgba(236,72,153,0.12)"
            Icon={AlignLeft}
            iconColor="#ec4899"
            label={L('करण', 'Karana')}
            value={L(karanaHi, karanaEn)}
            theme={theme}
          />
          <GridBox
            iconBg="rgba(16,185,129,0.12)"
            Icon={Calendar}
            iconColor="#10b981"
            label={L('ऋतु · अयन', 'Season · Ayana')}
            value={L(`${rituHi} · ${ayanaHi}`, `${ritu} · ${ayana}`)}
            theme={theme}
            fullWidth
          />
        </View>

        {/* ── Sun & Moon Timings Card ── */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Astronomical Timings</Text>
            <Text style={[styles.cardTitleHi, { color: theme.icon }]}>सूर्य और चंद्र के समय</Text>
          </View>

          <View style={styles.timingGrid}>
            {[
              {
                Icon: Sunrise,
                color: '#ea580c',
                bg: 'rgba(234,88,12,0.1)',
                label: L('सूर्योदय', 'Sunrise'),
                time: sunrise,
              },
              {
                Icon: Sunset,
                color: '#c2410c',
                bg: 'rgba(194,65,12,0.1)',
                label: L('सूर्यास्त', 'Sunset'),
                time: sunset,
              },
              {
                Icon: Moon,
                color: '#475569',
                bg: 'rgba(71,85,105,0.1)',
                label: L('चंद्रोदय', 'Moonrise'),
                time: moonrise,
              },
              {
                Icon: Sun,
                color: '#64748b',
                bg: 'rgba(100,116,139,0.1)',
                label: L('चंद्रास्त', 'Moonset'),
                time: moonset,
              },
            ].map(({ Icon, color, bg, label, time }) => (
              <View key={label} style={styles.timingItem}>
                <View style={[styles.timingIconBox, { backgroundColor: bg }]}>
                  <Icon size={22} strokeWidth={1.5} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.timingLabel, { color: theme.icon }]} numberOfLines={1}>{label}</Text>
                  <Text style={[styles.timingTime, { color: theme.text }]}>{formatTime(time)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Daily Rashifal Section ── */}
        {(() => {
          const activeRashiIdx = previewRashi !== null ? previewRashi : (rashifal ? rashifal.rashi.index : null);
          const activeRashifal = activeRashiIdx !== null ? getDailyRashifal(activeRashiIdx, today) : null;

          const renderStars = (rating: number) => {
            return (
              <View style={{ flexDirection: 'row', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={13}
                    color={s <= rating ? '#fbbf24' : '#e2e8f0'}
                    fill={s <= rating ? '#fbbf24' : 'none'}
                  />
                ))}
              </View>
            );
          };

          return (
            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderLeftWidth: 4, borderLeftColor: '#f59e0b' }]}>
              {/* Card Title */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                    {savedProfile && previewRashi === null 
                      ? L(`${savedProfile.name || 'My'} Rashifal`, `${savedProfile.name || 'My'} Daily Horoscope`)
                      : L('दैनिक राशिफल', 'Daily Rashifal')}
                  </Text>
                  <Text style={[styles.cardTitleHi, { color: theme.icon }]} numberOfLines={1}>
                    {activeRashifal 
                      ? L(`चन्द्र राशि: ${activeRashifal.rashi.nameHi}`, `Moon Sign: ${activeRashifal.rashi.nameEn}`)
                      : L('राशिफल एवं वैदिक उपाय', 'Astrological Forecasts & Remedies')}
                  </Text>
                </View>
                {previewRashi !== null && (
                  <Pressable
                    onPress={() => setPreviewRashi(null)}
                    style={{ padding: 6, backgroundColor: theme.background, borderRadius: 50 }}
                  >
                    <X size={16} color={theme.text} />
                  </Pressable>
                )}
              </View>

              {activeRashifal ? (
                /* ── Linked / Selected Sign Horoscope Details ── */
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, backgroundColor: `${theme.tint}0a`, padding: 10, borderRadius: 12 }}>
                    <Text style={{ fontSize: 28 }}>{activeRashifal.rashi.symbol}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>
                        {L(`${activeRashifal.rashi.nameHi} (${activeRashifal.rashi.nameEn})`, `${activeRashifal.rashi.nameEn} Sign`)}
                      </Text>
                      <Text style={{ color: theme.icon, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                        {L(`स्वामी: ${activeRashifal.rashi.rulerHi} · तत्व: ${activeRashifal.rashi.elementHi}`, `Ruler: ${activeRashifal.rashi.rulerEn} · Element: ${activeRashifal.rashi.elementEn}`)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#fbbf24', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>
                        {L('आज का भाग्य', 'Today\'s Luck')}
                      </Text>
                      {renderStars(activeRashifal.luckRating)}
                    </View>
                  </View>

                  {/* 4 Pillars Ratings Grid */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 16 }}>
                    <View style={{ flex: 1, backgroundColor: theme.background, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
                      <Text style={{ color: theme.icon, fontSize: 10, fontWeight: '700', marginBottom: 4 }}>
                        {L('स्वास्थ्य', 'Health')}
                      </Text>
                      {renderStars(activeRashifal.healthRating)}
                    </View>
                    <View style={{ flex: 1, backgroundColor: theme.background, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
                      <Text style={{ color: theme.icon, fontSize: 10, fontWeight: '700', marginBottom: 4 }}>
                        {L('करियर/धन', 'Wealth')}
                      </Text>
                      {renderStars(activeRashifal.wealthRating)}
                    </View>
                    <View style={{ flex: 1, backgroundColor: theme.background, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
                      <Text style={{ color: theme.icon, fontSize: 10, fontWeight: '700', marginBottom: 4 }}>
                        {L('प्रेम/परिवार', 'Love')}
                      </Text>
                      {renderStars(activeRashifal.loveRating)}
                    </View>
                  </View>

                  {/* Daily Paragraph */}
                  <Text style={{ color: theme.text, fontSize: 13, lineHeight: 20, fontWeight: '600', marginBottom: 16 }}>
                    {L(activeRashifal.forecastHi, activeRashifal.forecastEn)}
                  </Text>

                  {/* Remedy of the Day */}
                  <View style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7', borderWidth: 1, padding: 12, borderRadius: 12, gap: 4, marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={16} color="#d97706" />
                      <Text style={{ color: '#b45309', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {L('आज का वैदिक उपाय', 'Vedic Remedy of the Day')}
                      </Text>
                    </View>
                    <Text style={{ color: '#78350f', fontSize: 13, fontWeight: '700', lineHeight: 18 }}>
                      {L(activeRashifal.remedyHi, activeRashifal.remedyEn)}
                    </Text>
                  </View>

                  {/* Toggle Profile CTAs */}
                  {previewRashi !== null ? (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                      <Pressable
                        onPress={() => setPreviewRashi(null)}
                        style={{ flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}
                      >
                        <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>
                          {L('वापस जाएं', 'Back')}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => router.push('/(tabs)/kundli')}
                        style={{ flex: 1.5, paddingVertical: 10, borderRadius: 8, backgroundColor: theme.tint, alignItems: 'center' }}
                      >
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>
                          {L('जन्म कुंडली बनाएं', 'Setup My Profile')}
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => router.push('/(tabs)/kundli')}
                      style={{ paddingVertical: 10, borderRadius: 8, backgroundColor: `${theme.tint}11`, borderWidth: 1, borderColor: `${theme.tint}33`, alignItems: 'center', marginTop: 4 }}
                    >
                      <Text style={{ color: theme.tint, fontSize: 12, fontWeight: '800' }}>
                        {L('मेरी जन्म कुंडली अपडेट करें', 'Update Birth Profile')}
                      </Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                /* ── Empty State / Rashi Selection Grid ── */
                <View>
                  <Text style={{ color: theme.icon, fontSize: 13, lineHeight: 18, fontWeight: '600', marginBottom: 14 }}>
                    {L(
                      'अपनी सटीक चन्द्र राशि और नक्षत्र के अनुसार दैनिक राशिफल एवं व्यक्तिगत उपाय प्राप्त करें। अपनी जन्म प्रोफाइल सेट करें या नीचे से अपनी राशि चुनें:',
                      'Unlock precise daily horoscopes and Vedic remedies customized for your birth coordinates. Select your sign below or setup your profile:'
                    )}
                  </Text>

                  {/* Horizontal sign selector grid */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingBottom: 14 }}
                  >
                    {RASHI_LIST.map((r) => (
                      <Pressable
                        key={r.index}
                        onPress={() => setPreviewRashi(r.index)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                          borderWidth: 1,
                          borderRadius: 12,
                          alignItems: 'center',
                          gap: 4,
                          minWidth: 70
                        }}
                      >
                        <Text style={{ fontSize: 20 }}>{r.symbol}</Text>
                        <Text style={{ color: theme.text, fontSize: 11, fontWeight: '700' }} numberOfLines={1}>
                          {r.nameHi}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  {/* Set Up Profile CTA */}
                  <Pressable
                    onPress={() => router.push('/(tabs)/kundli')}
                    style={({ pressed }) => [
                      {
                        backgroundColor: theme.tint,
                        opacity: pressed ? 0.9 : 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 12,
                        borderRadius: 12,
                        gap: 8
                      }
                    ]}
                  >
                    <User size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }} numberOfLines={1}>
                      {language === 'hindi' ? 'जन्म प्रोफाइल सेट करें' : 'Set Up My Birth Profile'}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })()}

        <AdBanner
          size="BANNER"
          style={{ marginBottom: 20, alignSelf: 'center' }}
          darkMode={colorScheme === 'dark'}
        />

        {/* ── Muhurtas Sections (Auspicious / Inauspicious / Choghadiya Tabs) ── */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.tabHeaderRow}>
            <Pressable
              onPress={() => setMuhurtaTab('auspicious')}
              style={[
                styles.tabButton,
                muhurtaTab === 'auspicious' && { borderBottomColor: theme.tint },
              ]}
            >
              <Text style={[styles.tabButtonHi, { color: muhurtaTab === 'auspicious' ? theme.tint : theme.text }]}>शुभ</Text>
              <Text style={[styles.tabButtonEn, { color: muhurtaTab === 'auspicious' ? theme.tint : theme.icon }]}>Auspicious</Text>
            </Pressable>
            <Pressable
              onPress={() => setMuhurtaTab('inauspicious')}
              style={[
                styles.tabButton,
                muhurtaTab === 'inauspicious' && { borderBottomColor: '#ef4444' },
              ]}
            >
              <Text style={[styles.tabButtonHi, { color: muhurtaTab === 'inauspicious' ? '#ef4444' : theme.text }]}>अशुभ</Text>
              <Text style={[styles.tabButtonEn, { color: muhurtaTab === 'inauspicious' ? '#ef4444' : theme.icon }]}>Inauspicious</Text>
            </Pressable>
            <Pressable
              onPress={() => setMuhurtaTab('choghadiya')}
              style={[
                styles.tabButton,
                muhurtaTab === 'choghadiya' && { borderBottomColor: '#eab308' },
              ]}
            >
              <Text style={[styles.tabButtonHi, { color: muhurtaTab === 'choghadiya' ? '#eab308' : theme.text }]}>चौघड़िया</Text>
              <Text style={[styles.tabButtonEn, { color: muhurtaTab === 'choghadiya' ? '#eab308' : theme.icon }]}>Choghadiya</Text>
            </Pressable>
          </View>

          {muhurtaTab === 'choghadiya' && (
            <View style={styles.choghadiyaToggleRow}>
              <Pressable
                onPress={() => setChoghadiyaTime('day')}
                style={[
                  styles.choghadiyaToggleBtn,
                  choghadiyaTime === 'day' && { backgroundColor: theme.tint, borderColor: theme.tint }
                ]}
              >
                <Text style={[styles.choghadiyaToggleText, { color: theme.text }, choghadiyaTime === 'day' && { color: '#fff' }]}>
                  {L('दिन', 'Day')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setChoghadiyaTime('night')}
                style={[
                  styles.choghadiyaToggleBtn,
                  choghadiyaTime === 'night' && { backgroundColor: theme.tint, borderColor: theme.tint }
                ]}
              >
                <Text style={[styles.choghadiyaToggleText, { color: theme.text }, choghadiyaTime === 'night' && { color: '#fff' }]}>
                  {L('रात्रि', 'Night')}
                </Text>
              </Pressable>
            </View>
          )}

          {muhurtaTab === 'auspicious' ? (
            <View style={styles.muhurtaList}>
              <MuhurtaItem
                Icon={Sunrise}
                color="#eab308"
                title={L('ब्रह्म मुहूर्त', 'Brahma Muhurta')}
                desc={L('अध्ययन, ध्यान और आध्यात्मिक अभ्यास के लिए सर्वोत्तम', 'Ideal for study, meditation & spiritual practice')}
                time={brahmaMuhurta}
              />
              <MuhurtaItem
                Icon={Sun}
                color="#f59e0b"
                title={L('अभिजीत मुहूर्त', 'Abhijit Muhurta')}
                desc={L('कोई भी नया काम शुरू करने के लिए उत्तम समय', 'Most auspicious midday time to start new actions')}
                time={abhijitMuhurta}
              />
            </View>
          ) : muhurtaTab === 'inauspicious' ? (
            <View style={styles.muhurtaList}>
              <MuhurtaItem
                Icon={Clock}
                color="#ef4444"
                title={L('राहुकाल', 'Rahu Kalam')}
                desc={L('अशुभ समय, कोई भी शुभ कार्य न करें', 'Inauspicious period, avoid initiating auspicious tasks')}
                time={{ start: rahuKalamStart, end: rahuKalamEnd }}
              />
              <MuhurtaItem
                Icon={AlertTriangle}
                color="#f97316"
                title={L('यमगण्ड काल', 'Yamaganda Kalam')}
                desc={L('अशुभ समय, केवल सामान्य कार्य ही करें', 'Inauspicious, actions during this time rarely yield fruit')}
                time={yamagandaKalam}
              />
              <MuhurtaItem
                Icon={AlertTriangle}
                color="#ea580c"
                title={L('गुलिक काल', 'Gulika Kalam')}
                desc={L('अशुभ समय, नया निवेश करने से बचें', 'A period of stagnation, avoid making investments')}
                time={gulikaKalam}
              />
            </View>
          ) : (
            <View style={styles.muhurtaList}>
              {((choghadiyaTime === 'day' ? panchang.choghadiya?.day : panchang.choghadiya?.night) || []).map((item: any, idx: number) => {
                const info = CHOGHADIYA_HI[item.name] || { hi: item.name, meaning: '—', color: theme.tint };
                return (
                  <View key={idx} style={[styles.muhurtaItem, { borderBottomColor: theme.border }]}>
                    <View style={[styles.muhurtaIconBox, { backgroundColor: `${info.color}15` }]}>
                      <Clock size={20} color={info.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.muhurtaTitle, { color: theme.text }]} numberOfLines={1}>
                        {L(info.hi, item.name, ' · ')}
                      </Text>
                      <Text style={[styles.muhurtaDesc, { color: theme.icon }]} numberOfLines={1}>
                        {info.meaning}
                      </Text>
                      <Text style={[styles.muhurtaTime, { color: info.color, marginTop: 4 }]}>
                        {formatTime(item.startTime)} – {formatTime(item.endTime)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Ad Banner between Muhurtas and Festivals ── */}
        <AdBanner
          size="LEADERBOARD"
          style={styles.adBanner}
          darkMode={colorScheme === 'dark'}
        />

        {/* ── Festivals ── */}
        {festivals?.length > 0 && (
          <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#451a03' : '#fef3c7', padding: 0, overflow: 'hidden' }]}>
            <LinearGradient colors={['rgba(245,158,11,0.2)', 'rgba(217,119,6,0.05)']} style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Image source={DIYA_ICON} style={styles.diyaIcon} resizeMode="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colorScheme === 'dark' ? '#fde68a' : '#b45309', marginBottom: 0 }]}>
                    {"Today's Festivals"}
                  </Text>
                  <Text style={{ color: '#d97706', fontSize: 14, fontWeight: '700', marginTop: 2 }}>
                    आज के पर्व एवं त्योहार
                  </Text>
                </View>
              </View>

              {festivals.map((fest: any, idx: number) => (
                <View
                  key={idx}
                  style={[
                    styles.festivalItem,
                    idx !== festivals.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(217,119,6,0.25)' },
                  ]}
                >
                  <View style={styles.festDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.festivalName, { color: colorScheme === 'dark' ? '#fbbf24' : '#d97706' }]}>{fest.name}</Text>
                    {fest.description && (
                      <Text style={[styles.festivalDesc, { color: colorScheme === 'dark' ? '#fcd34d' : '#92400e' }]}>
                        {fest.description}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </LinearGradient>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ─── GridBox Component ─────────────────────────────────────────────────────────
function GridBox({ iconBg, Icon, iconColor, label, value, theme, fullWidth }: any) {
  return (
    <View style={[styles.gridBox, { backgroundColor: theme.cardBackground }, fullWidth && { width: '100%' }]}>
      <View style={styles.gridBoxInner}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <Icon size={22} color={iconColor} />
        </View>
        <View style={styles.gridBoxRight}>
          <Text style={[styles.boxLabel, { color: theme.icon }]} numberOfLines={1}>{label}</Text>
          <Text style={[styles.boxValue, { color: theme.text }]} numberOfLines={2}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── MuhurtaItem Component ───────────────────────────────────────────────────
function MuhurtaItem({ Icon, color, title, desc, time }: any) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const tStr = time ? `${formatTime(time.start || time)} – ${formatTime(time.end || time)}` : '--:--';

  return (
    <View style={[styles.muhurtaItem, { borderBottomColor: theme.border }]}>
      <View style={[styles.muhurtaIconBox, { backgroundColor: `${color}15` }]}>
        <Icon size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.muhurtaTitle, { color: theme.text }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.muhurtaDesc, { color: theme.icon }]} numberOfLines={2}>{desc}</Text>
        <Text style={[styles.muhurtaTime, { color: color, marginTop: 4 }]}>{tStr}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingMandala: { width: 180, height: 180, opacity: 0.9 },
  container: { flex: 1 },

  heroImage: { width: '100%', minHeight: 290 },
  heroOverlay: {
    paddingBottom: 35,
    paddingHorizontal: 24,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  heroTextContainer: { flex: 1 },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10,
    gap: 5,
    maxWidth: '85%',
  },
  locationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  headerHindi: { fontSize: 22, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 1 },
  headerTitle: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerDate: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6, fontWeight: '500' },
  omMandala: { width: 90, height: 90, opacity: 0.95, marginLeft: 10 },

  quickInfoStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18,
    padding: 14,
  },
  quickItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  quickDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  quickLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  quickValue: { fontSize: 13, color: '#fff', fontWeight: '800' },

  content: { padding: 20, paddingTop: 24, paddingBottom: 60 },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  gridBox: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gridBoxInner: { flexDirection: 'row', alignItems: 'center' },
  gridBoxRight: { flex: 1, marginLeft: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  boxLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  boxValue: { fontSize: 13, fontWeight: 'bold', lineHeight: 18 },

  card: { borderRadius: 24, padding: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  cardTitleRow: { flexDirection: 'column', marginBottom: 16, gap: 4 },
  cardTitle: { fontSize: 20, fontWeight: '800' },
  cardTitleHi: { fontSize: 14, fontWeight: '700' },

  timingGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  timingItem: { width: '48%', flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  timingIconBox: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  timingLabel: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  timingTime: { fontSize: 16, fontWeight: 'bold' },

  diyaIcon: { width: 60, height: 60, borderRadius: 16, marginRight: 14 },
  festivalItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
  festDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d97706', marginTop: 6, marginRight: 12 },
  festivalName: { fontSize: 17, fontWeight: '800' },
  festivalDesc: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  adBanner: { marginVertical: 16, alignSelf: 'center' },
  heroRight: { alignItems: 'center', gap: 8 },
  buttonRow: { flexDirection: 'row', gap: 8, alignSelf: 'flex-end', marginBottom: 5 },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  bellButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderColor: '#fff',
  },

  tabHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  muhurtaList: { gap: 16 },
  muhurtaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  muhurtaIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muhurtaTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  muhurtaDesc: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 16,
  },
  muhurtaTime: {
    fontSize: 12,
    fontWeight: '800',
  },
  tabButtonHi: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  tabButtonEn: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 1,
  },
  cautionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 4,
  },
  cautionText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  choghadiyaToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center',
  },
  choghadiyaToggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  choghadiyaToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
