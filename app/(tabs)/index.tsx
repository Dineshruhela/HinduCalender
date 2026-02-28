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
  getNakshatraHindi,
  getNakshatraName,
  getTithiHindi,
  getTithiName,
  MASA_HI, PAKSHA_HI, RITU_HI,
} from '@/src/utils/panchang';
import { LinearGradient } from 'expo-linear-gradient';
import { AlignLeft, Bell, BellOff, Calendar, Clock, Moon, Star, Sun, Sunrise, Sunset } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ImageBackground, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const OM_MANDALA = require('@/assets/images/om_mandala.png');
const MOON_BANNER = require('@/assets/images/moon_banner.png');
const DIYA_ICON = require('@/assets/images/diya_icon.png');

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [panchang, setPanchang] = useState<any>(null);
  const [today] = useState(new Date());
  const [notifsOn, setNotifsOn] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    getDailyPanchangAsync(today).then(setPanchang);
    areNotificationsEnabled().then(setNotifsOn);
  }, []);

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

  if (!panchang) {
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

  const { tithi, nakshatra, paksha, masa, samvat, sunrise, sunset, moonrise, moonset,
    rahuKalamStart, rahuKalamEnd, festivals, ritu, ayana } = panchang;

  const tithiEn = getTithiName(tithi);
  const tithiHi = getTithiHindi(tithi);
  const nakshatraEn = getNakshatraName(nakshatra);
  const nakshatraHi = getNakshatraHindi(nakshatra);
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
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={styles.heroOverlay}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.headerHindi}>हिंदू पंचांग</Text>
              <Text style={styles.headerTitle}>Hindu Calendar</Text>
              <Text style={styles.headerDate}>
                {today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </View>
            <View style={styles.heroRight}>
              {/* Notification Bell */}
              <Pressable
                onPress={toggleNotifications}
                disabled={notifLoading}
                style={[styles.bellButton, notifsOn && styles.bellButtonActive]}
                accessibilityLabel={notifsOn ? 'Disable notifications' : 'Enable notifications'}
              >
                {notifLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : notifsOn
                    ? <Bell size={20} color="#fff" fill="#fff" />
                    : <BellOff size={20} color="rgba(255,255,255,0.7)" />
                }
              </Pressable>
              <Image source={OM_MANDALA} style={styles.omMandala} resizeMode="contain" />
            </View>
          </View>


          {/* Quick strip */}
          <View style={styles.quickInfoStrip}>
            <View style={styles.quickItem}>
              <Text style={styles.quickLabel}>तिथि / Tithi</Text>
              <Text style={styles.quickValue}>{tithiHi}</Text>
              <Text style={styles.quickValueSub}>{tithiEn}</Text>
            </View>
            <View style={styles.quickDivider} />
            <View style={styles.quickItem}>
              <Text style={styles.quickLabel}>मास / Masa</Text>
              <Text style={styles.quickValue}>{masaHi}</Text>
              <Text style={styles.quickValueSub}>{masa.name}</Text>
            </View>
            <View style={styles.quickDivider} />
            <View style={styles.quickItem}>
              <Text style={styles.quickLabel}>पक्ष / Paksha</Text>
              <Text style={[styles.quickValue, { fontSize: 13 }]}>{pakshaHi}</Text>
              <Text style={styles.quickValueSub}>{paksha}</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.content}>

        {/* ── Panchang Grid ── */}
        <View style={styles.gridContainer}>
          <GridBox
            iconBg="rgba(245,158,11,0.12)" Icon={Moon} iconColor="#f59e0b"
            labelEn="Tithi" labelHi="तिथि"
            valueEn={tithiEn} valueHi={tithiHi}
            theme={theme}
          />
          <GridBox
            iconBg="rgba(56,189,248,0.12)" Icon={Star} iconColor="#38bdf8"
            labelEn="Nakshatra" labelHi="नक्षत्र"
            valueEn={nakshatraEn} valueHi={nakshatraHi}
            theme={theme}
          />
          <GridBox
            iconBg="rgba(236,72,153,0.12)" Icon={Calendar} iconColor="#ec4899"
            labelEn="Masa / Season" labelHi="मास / ऋतु"
            valueEn={masa.name} valueHi={masaHi}
            subEn={`${ritu} · ${ayana}`} subHi={`${rituHi} · ${ayanaHi}`}
            theme={theme}
          />
          <GridBox
            iconBg="rgba(168,85,247,0.12)" Icon={AlignLeft} iconColor="#a855f7"
            labelEn="Vikram Samvat" labelHi="विक्रम संवत"
            valueEn={String(samvat.vikram)} valueHi={`${samvat.samvatsara}`}
            theme={theme}
          />
        </View>

        {/* ── Timings ── */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Today's Timings</Text>
            <Text style={[styles.cardTitleHi, { color: theme.icon }]}>आज के मुहूर्त</Text>
          </View>

          <View style={styles.timingGrid}>
            {[
              { Icon: Sunrise, color: '#ea580c', bg: 'rgba(234,88,12,0.1)', label: 'Sunrise', labelHi: 'सूर्योदय', time: sunrise },
              { Icon: Sunset, color: '#c2410c', bg: 'rgba(194,65,12,0.1)', label: 'Sunset', labelHi: 'सूर्यास्त', time: sunset },
              { Icon: Moon, color: '#475569', bg: 'rgba(71,85,105,0.1)', label: 'Moonrise', labelHi: 'चंद्रोदय', time: moonrise },
              { Icon: Sun, color: '#64748b', bg: 'rgba(100,116,139,0.1)', label: 'Moonset', labelHi: 'चंद्रास्त', time: moonset },
            ].map(({ Icon, color, bg, label, labelHi, time }) => (
              <View key={label} style={styles.timingItem}>
                <View style={[styles.timingIconBox, { backgroundColor: bg }]}>
                  <Icon size={22} strokeWidth={1.5} color={color} />
                </View>
                <View>
                  <Text style={[styles.timingLabel, { color: theme.icon }]}>{label}</Text>
                  <Text style={[styles.timingLabelHi, { color: theme.icon }]}>{labelHi}</Text>
                  <Text style={[styles.timingTime, { color: theme.text }]}>{formatTime(time)}</Text>
                </View>
              </View>
            ))}
          </View>

          <LinearGradient colors={['rgba(239,68,68,0.05)', 'rgba(239,68,68,0.15)']} style={styles.rahuKalamBox}>
            <Clock size={22} color="#ef4444" style={{ marginRight: 12 }} />
            <View>
              <Text style={{ fontSize: 11, color: '#b91c1c', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Rahu Kalam (Avoid)  •  राहुकाल
              </Text>
              <Text style={{ fontSize: 18, color: '#991b1b', fontWeight: '900', marginTop: 2 }}>
                {formatTime(rahuKalamStart)} – {formatTime(rahuKalamEnd)}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* ── Ad Banner between Timings and Festivals ── */}
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
                    Today's Festivals
                  </Text>
                  <Text style={{ color: '#d97706', fontSize: 14, fontWeight: '700', marginTop: 2 }}>
                    आज के पर्व एवं त्योहार
                  </Text>
                </View>
              </View>

              {festivals.map((fest: any, idx: number) => (
                <View key={idx} style={[styles.festivalItem,
                idx !== festivals.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(217,119,6,0.25)' }
                ]}>
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
function GridBox({ iconBg, Icon, iconColor, labelEn, labelHi, valueEn, valueHi, subEn, subHi, theme }: any) {
  return (
    <View style={[styles.gridBox, { backgroundColor: theme.cardBackground }]}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Icon size={22} color={iconColor} />
      </View>
      <Text style={[styles.boxLabel, { color: theme.icon }]}>{labelEn}</Text>
      <Text style={[styles.boxLabelHi, { color: theme.icon }]}>{labelHi}</Text>
      <Text style={[styles.boxValue, { color: theme.text }]} numberOfLines={1}>{valueEn}</Text>
      <Text style={[styles.boxValueHi, { color: theme.tint }]} numberOfLines={1}>{valueHi}</Text>
      {subEn && <Text style={[styles.boxSubValue, { color: theme.icon }]} numberOfLines={1}>{subEn}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingMandala: { width: 180, height: 180, opacity: 0.9 },
  container: { flex: 1 },

  heroImage: { width: '100%', minHeight: 280 },
  heroOverlay: {
    paddingTop: Platform.OS === 'ios' ? 65 : 45,
    paddingBottom: 30, paddingHorizontal: 24,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  heroTextContainer: { flex: 1 },
  headerHindi: { fontSize: 22, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 1 },
  headerTitle: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerDate: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6, fontWeight: '500' },
  omMandala: { width: 90, height: 90, opacity: 0.95, marginLeft: 10 },

  quickInfoStrip: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18, padding: 14,
  },
  quickItem: { flex: 1, alignItems: 'center' },
  quickDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  quickLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  quickValue: { fontSize: 16, color: '#fff', fontWeight: '800' },
  quickValueSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 1 },

  content: { padding: 20, paddingTop: 24, paddingBottom: 60 },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  gridBox: { width: '48%', borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  boxLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  boxLabelHi: { fontSize: 11, fontWeight: '600', marginBottom: 6 },
  boxValue: { fontSize: 16, fontWeight: 'bold' },
  boxValueHi: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  boxSubValue: { fontSize: 11, marginTop: 4, fontWeight: '600' },

  card: { borderRadius: 24, padding: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 20, gap: 8 },
  cardTitle: { fontSize: 20, fontWeight: '800' },
  cardTitleHi: { fontSize: 14, fontWeight: '700' },

  timingGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  timingItem: { width: '48%', flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  timingIconBox: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  timingLabel: { fontSize: 12, fontWeight: '700', marginBottom: 0 },
  timingLabelHi: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  timingTime: { fontSize: 16, fontWeight: 'bold' },

  rahuKalamBox: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16 },

  diyaIcon: { width: 60, height: 60, borderRadius: 16, marginRight: 14 },
  festivalItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
  festDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d97706', marginTop: 6, marginRight: 12 },
  festivalName: { fontSize: 17, fontWeight: '800' },
  festivalDesc: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  adBanner: { marginVertical: 16, alignSelf: 'center' },
  heroRight: { alignItems: 'center', gap: 8 },
  bellButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  bellButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderColor: '#fff',
  },
});
