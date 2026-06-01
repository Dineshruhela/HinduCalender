import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AdBanner from '@/src/components/AdBanner';
import { getLanguageSetting, getLocalizedText, LanguageType } from '@/src/utils/settings';
import { checkMangalDosha, getKundli, matchKundli, Observer } from '@ishubhamx/panchangam-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { RefreshCw, ShieldAlert, Sparkles, Star, User } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRESET_CITIES = [
  { name: 'New Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Varanasi', lat: 25.3176, lng: 82.9739 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
];

const RASHI_HI = [
  'मेष (Aries)', 'वृषभ (Taurus)', 'मिथुन (Gemini)', 'कर्क (Cancer)',
  'सिंह (Leo)', 'कन्या (Virgo)', 'तुला (Libra)', 'वृश्चिक (Scorpio)',
  'धनु (Sagittarius)', 'मकर (Capricorn)', 'कुंभ (Aquarius)', 'मीन (Pisces)'
];

const PLANET_HI: Record<string, string> = {
  Sun: 'सूर्य (Sun)',
  Moon: 'चन्द्र (Moon)',
  Mars: 'मंगल (Mars)',
  Mercury: 'बुध (Mercury)',
  Jupiter: 'गुरु (Jupiter)',
  Venus: 'शुक्र (Venus)',
  Saturn: 'शनि (Saturn)',
  Rahu: 'राहु (Rahu)',
  Ketu: 'केतु (Ketu)',
};

const KOOTA_HI: Record<string, { hi: string; desc: string }> = {
  Varna: { hi: 'वर्ण', desc: 'कार्य और अहंकार अनुकूलता (Work & Ego Compatibility)' },
  Vashya: { hi: 'वश्य', desc: 'वर्चस्व और नियंत्रण (Dominance & Control)' },
  Tara: { hi: 'तारा', desc: 'भाग्य और किस्मत (Luck & Destiny)' },
  Yoni: { hi: 'योनि', desc: 'शारीरिक अनुकूलता (Sexual Compatibility)' },
  'Graha Maitri': { hi: 'मैत्री', desc: 'मानसिक और भावनात्मक मित्रता (Mental Compatibility)' },
  Gana: { hi: 'गण', desc: 'स्वभाव और मानसिक स्तर (Temperament Match)' },
  Bhakoot: { hi: 'भकूट', desc: 'प्रेम, संबंध और समृद्धि (Love & Happiness)' },
  Nadi: { hi: 'नाडी', desc: 'शारीरिक स्वास्थ्य और वंश (Health & Genes)' },
};

type ActiveSegment = 'kundli' | 'milan';

function getGemstoneRecommendation(rashiIdx: number) {
  const gems = [
    { rashi: 'Aries', lord: 'Mars', stoneHi: 'लाल मूंगा (Red Coral)', stoneEn: 'Red Coral (Moonga)', descHi: 'ऊर्जा, साहस और शारीरिक शक्ति बढ़ाने के लिए उत्तम', descEn: 'Improves vitality, confidence, and physical energy' },
    { rashi: 'Taurus', lord: 'Venus', stoneHi: 'सफेद ओपल या हीरा', stoneEn: 'White Opal or Diamond', descHi: 'आकर्षण, कलात्मक सफलता और वैवाहिक सुख के लिए उत्तम', descEn: 'Enhances artistic creativity, relationship harmony, and luxury' },
    { rashi: 'Gemini', lord: 'Mercury', stoneHi: 'पन्ना (Emerald)', stoneEn: 'Emerald (Panna)', descHi: 'बुद्धि, व्यापारिक सूझबूझ और संवाद क्षमता बढ़ाने के लिए उत्तम', descEn: 'Boosts analytical intelligence, communications, and business success' },
    { rashi: 'Cancer', lord: 'Moon', stoneHi: 'मोती (Pearl)', stoneEn: 'Pearl (Moti)', descHi: 'मानसिक शांति, तनाव मुक्ति और भावनाओं पर नियंत्रण के लिए उत्तम', descEn: 'Promotes emotional stability, peace of mind, and relieves anxiety' },
    { rashi: 'Leo', lord: 'Sun', stoneHi: 'माणिक्य (Ruby)', stoneEn: 'Ruby (Manik)', descHi: 'नेतृत्व क्षमता, प्रसिद्धि और आत्मविश्वास को बढ़ाने के लिए उत्तम', descEn: 'Boosts leadership authority, self-respect, and career fame' },
    { rashi: 'Virgo', lord: 'Mercury', stoneHi: 'पन्ना (Emerald)', stoneEn: 'Emerald (Panna)', descHi: 'व्यापारिक समृद्धि, तर्कशक्ति और निर्णय क्षमता के लिए उत्तम', descEn: 'Enhances decision-making skills, logical precision, and commercial gain' },
    { rashi: 'Libra', lord: 'Venus', stoneHi: 'ओपल या हीरा', stoneEn: 'Diamond or Opal', descHi: 'सौंदर्य, आर्थिक समृद्धि और रचनात्मक सफलता के लिए उत्तम', descEn: 'Attracts financial abundance, physical charm, and creative success' },
    { rashi: 'Scorpio', lord: 'Mars', stoneHi: 'मूंगा (Red Coral)', stoneEn: 'Red Coral (Moonga)', descHi: 'मानसिक साहस, बाधाओं पर विजय और प्रतिरक्षा बढ़ाने के लिए उत्तम', descEn: 'Protects from obstacles, enhances focus, and boosts endurance' },
    { rashi: 'Sagittarius', lord: 'Jupiter', stoneHi: 'पीला पुखराज', stoneEn: 'Yellow Sapphire (Pukhraj)', descHi: 'ज्ञान, आध्यात्मिक प्रगति और भाग्य वृद्धि के लिए उत्तम', descEn: 'Enhances higher wisdom, spiritual progress, and material luck' },
    { rashi: 'Capricorn', lord: 'Saturn', stoneHi: 'नीलम (Blue Sapphire)', stoneEn: 'Blue Sapphire (Neelam)', descHi: 'करियर में स्थिरता, अनुशासन और कार्य कुशलता बढ़ाने के लिए उत्तम', descEn: 'Brings structural stability, professional focus, and strategic growth' },
    { rashi: 'Aquarius', lord: 'Saturn', stoneHi: 'नीलम (Blue Sapphire)', stoneEn: 'Blue Sapphire (Neelam)', descHi: 'आर्थिक लाभ, सामाजिक प्रभाव और दूरदर्शिता के लिए उत्तम', descEn: 'Promotes long-term vision, public networks, and financial growth' },
    { rashi: 'Pisces', lord: 'Jupiter', stoneHi: 'पीला पुखराज', stoneEn: 'Yellow Sapphire (Pukhraj)', descHi: 'मानसिक शांति, सम्मान और स्वास्थ्य रक्षा के लिए उत्तम', descEn: 'Brings spiritual peace, public respect, and sound health protection' },
  ];
  return gems[rashiIdx] || gems[0];
}

function getMantraRecommendation(rashiIdx: number) {
  const mantras = [
    { name: 'Mars / मंगल', text: 'ॐ अं अंगारकाय नमः (Om Am Angarakaya Namah)', count: '108 times on Tuesday' },
    { name: 'Venus / शुक्र', text: 'ॐ शुं शुक्राय नमः (Om Shum Shukraya Namah)', count: '108 times on Friday' },
    { name: 'Mercury / बुध', text: 'ॐ बुं बुधाय नमः (Om Bum Budhaya Namah)', count: '108 times on Wednesday' },
    { name: 'Moon / चन्द्र', text: 'ॐ सों सोमाय नमः (Om Som Somaya Namah)', count: '108 times on Monday' },
    { name: 'Sun / सूर्य', text: 'ॐ घृणि सूर्याय नमः (Om Ghrini Suryaya Namah)', count: '108 times daily' },
    { name: 'Mercury / बुध', text: 'ॐ बुं बुधाय नमः (Om Bum Budhaya Namah)', count: '108 times on Wednesday' },
    { name: 'Venus / शुक्र', text: 'ॐ शुं शुक्राय नमः (Om Shum Shukraya Namah)', count: '108 times on Friday' },
    { name: 'Mars / मंगल', text: 'ॐ अं अंगारकाय नमः (Om Am Angarakaya Namah)', count: '108 times on Tuesday' },
    { name: 'Jupiter / गुरु', text: 'ॐ बृं बृहस्पतये नमः (Om Brim Brihaspataye Namah)', count: '108 times on Thursday' },
    { name: 'Saturn / शनि', text: 'ॐ शं शनैश्चराय नमः (Om Sham Shanaishcharaya Namah)', count: '108 times on Saturday' },
    { name: 'Saturn / शनि', text: 'ॐ शं शनैश्चराय नमः (Om Sham Shanaishcharaya Namah)', count: '108 times on Saturday' },
    { name: 'Jupiter / गुरु', text: 'ॐ बृं बृहस्पतये नमः (Om Brim Brihaspataye Namah)', count: '108 times on Thursday' },
  ];
  return mantras[rashiIdx] || mantras[0];
}

function validateBirthDetails(
  dayStr: string,
  monthStr: string,
  yearStr: string,
  hourStr: string,
  minStr: string
): { isValid: boolean; errorHi: string; errorEn: string; date?: Date } {
  const day = parseInt(dayStr);
  const month = parseInt(monthStr);
  const year = parseInt(yearStr);
  const hour = parseInt(hourStr);
  const minute = parseInt(minStr);

  if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hour) || isNaN(minute)) {
    return { isValid: false, errorHi: 'कृपया सभी फ़ील्ड भरें और वे संख्यात्मक होने चाहिए।', errorEn: 'Please fill all fields with valid numeric values.' };
  }

  if (year < 1800 || year > 2100) {
    return { isValid: false, errorHi: 'वर्ष 1800 और 2100 के बीच होना चाहिए।', errorEn: 'Year must be between 1800 and 2100.' };
  }

  if (month < 1 || month > 12) {
    return { isValid: false, errorHi: 'महीना 1 और 12 के बीच होना चाहिए।', errorEn: 'Month must be between 1 and 12.' };
  }

  if (hour < 0 || hour > 23) {
    return { isValid: false, errorHi: 'घंटा 0 और 23 के बीच होना चाहिए।', errorEn: 'Hour must be between 0 and 23.' };
  }

  if (minute < 0 || minute > 59) {
    return { isValid: false, errorHi: 'मिनट 0 और 59 के बीच होना चाहिए।', errorEn: 'Minute must be between 0 and 59.' };
  }

  // Days in month validation
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // Leap year check
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  if (isLeap) {
    daysInMonth[1] = 29;
  }

  const maxDays = daysInMonth[month - 1];
  if (day < 1 || day > maxDays) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[month - 1];
    return {
      isValid: false,
      errorHi: `${monthName} में दिन 1 और ${maxDays} के बीच होना चाहिए।`,
      errorEn: `Days in ${monthName} must be between 1 and ${maxDays}.`
    };
  }

  // Future date check
  const birthTime = new Date(year, month - 1, day, hour, minute);
  const now = new Date();
  if (birthTime > now) {
    return {
      isValid: false,
      errorHi: 'जन्म तिथि भविष्य में नहीं हो सकती।',
      errorEn: 'Birth date and time cannot be in the future.'
    };
  }

  return { isValid: true, errorHi: '', errorEn: '', date: birthTime };
}

export default function KundliScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  
  // Segment Controller
  const [activeSegment, setActiveSegment] = useState<ActiveSegment>('kundli');
  const [language, setLanguage] = useState<LanguageType>('bilingual');

  // Saved Profile Persistence States
  const [savedProfile, setSavedProfile] = useState<any>(null);

  const loadProfileFromStorage = async () => {
    try {
      const dataStr = await AsyncStorage.getItem('@SavedKundliProfile');
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        setSavedProfile(parsed);
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    }
    return null;
  };

  const applyProfile = (profile: any) => {
    if (!profile) return;
    setKName(profile.name || '');
    setKDay(String(profile.day || '15'));
    setKMonth(String(profile.month || '5'));
    setKYear(String(profile.year || '1995'));
    setKHour(String(profile.hour || '8'));
    setKMin(String(profile.min || '30'));
    
    const foundCity = PRESET_CITIES.find(c => c.name === profile.cityName) || {
      name: profile.cityName || 'Custom',
      lat: profile.latitude || 28.6139,
      lng: profile.longitude || 77.2090
    };
    setKCity(foundCity);

    setLoadingKundli(true);
    setTimeout(() => {
      try {
        const observer = new Observer(foundCity.lat, foundCity.lng, 0);
        const birthTime = new Date(profile.year, profile.month - 1, profile.day, profile.hour, profile.min);
        const kundliObj = getKundli(birthTime, observer);
        const doshaObj = checkMangalDosha(kundliObj);
        setComputedKundli(kundliObj);
        setComputedDosha(doshaObj);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingKundli(false);
      }
    }, 150);
  };

  const handleSaveProfile = async () => {
    const val = validateBirthDetails(kDay, kMonth, kYear, kHour, kMin);
    if (!val.isValid) {
      Alert.alert(L('अमान्य विवरण', 'Invalid Details'), L(val.errorHi, val.errorEn));
      return;
    }

    try {
      const profile = {
        name: kName,
        day: parseInt(kDay),
        month: parseInt(kMonth),
        year: parseInt(kYear),
        hour: parseInt(kHour),
        min: parseInt(kMin),
        cityName: kCity.name,
        latitude: kCity.lat,
        longitude: kCity.lng
      };

      await AsyncStorage.setItem('@SavedKundliProfile', JSON.stringify(profile));
      setSavedProfile(profile);
      Alert.alert(
        L('प्रोफाइल सहेजी गई', 'Profile Saved'),
        L('आपकी जन्म कुंडली प्रोफाइल को दैनिक राशिफल के लिए सहेज लिया गया है!', 'Your birth details profile has been saved for daily Rashifal!')
      );
    } catch (e) {
      console.error('Failed to save profile', e);
      Alert.alert('Error', 'Failed to save profile details.');
    }
  };

  const handleDeleteProfile = async () => {
    try {
      await AsyncStorage.removeItem('@SavedKundliProfile');
      setSavedProfile(null);
      Alert.alert(
        L('प्रोफाइल हटाई गई', 'Profile Removed'),
        L('आपकी सहेजी गई प्रोफाइल को हटा दिया गया है।', 'Your saved birth profile has been deleted.')
      );
    } catch (e) {
      console.error(e);
    }
  };

  // ─── Kundli Input States ───
  const [kName, setKName] = useState('');
  const [kDay, setKDay] = useState('15');
  const [kMonth, setKMonth] = useState('5');
  const [kYear, setKYear] = useState('1995');
  const [kHour, setKHour] = useState('8');
  const [kMin, setKMin] = useState('30');
  const [kCity, setKCity] = useState(PRESET_CITIES[0]);

  // ─── Kundli Result States ───
  const [computedKundli, setComputedKundli] = useState<any>(null);
  const [computedDosha, setComputedDosha] = useState<any>(null);
  const [activeChart, setActiveChart] = useState<'d1' | 'd9'>('d1');
  const [loadingKundli, setLoadingKundli] = useState(false);

  // ─── Milan Input States ───
  const [boyName, setBoyName] = useState('');
  const [boyDay, setBoyDay] = useState('15');
  const [boyMonth, setBoyMonth] = useState('5');
  const [boyYear, setBoyYear] = useState('1995');
  const [boyHour, setBoyHour] = useState('8');
  const [boyMin, setBoyMin] = useState('30');
  const [boyCity, setBoyCity] = useState(PRESET_CITIES[0]);

  const [girlName, setGirlName] = useState('');
  const [girlDay, setGirlDay] = useState('20');
  const [girlMonth, setGirlMonth] = useState('8');
  const [girlYear, setGirlYear] = useState('1997');
  const [girlHour, setGirlHour] = useState('14');
  const [girlMin, setGirlMin] = useState('45');
  const [girlCity, setGirlCity] = useState(PRESET_CITIES[1]);

  // ─── Milan Result States ───
  const [matchResult, setMatchResult] = useState<any>(null);
  const [loadingMilan, setLoadingMilan] = useState(false);

  // Dynamic focus sync
  useFocusEffect(
    useCallback(() => {
      getLanguageSetting().then(setLanguage);
      loadProfileFromStorage().then(profile => {
        if (profile && !computedKundli) {
          applyProfile(profile);
        }
      });
    }, [computedKundli])
  );

  const L = (hi: string, en: string, delim = ' · ') => getLocalizedText(hi, en, language, delim);

  const handleGenerateKundli = () => {
    const val = validateBirthDetails(kDay, kMonth, kYear, kHour, kMin);
    if (!val.isValid) {
      Alert.alert(
        L('अमान्य प्रविष्टि', 'Invalid Input'),
        L(val.errorHi, val.errorEn)
      );
      return;
    }

    setLoadingKundli(true);
    setTimeout(() => {
      try {
        const observer = new Observer(kCity.lat, kCity.lng, 0);
        const kundliObj = getKundli(val.date!, observer);
        const doshaObj = checkMangalDosha(kundliObj);

        setComputedKundli(kundliObj);
        setComputedDosha(doshaObj);
      } catch (e) {
        console.error(e);
        Alert.alert('Calculation Failed', 'Check birth details and try again.');
      } finally {
        setLoadingKundli(false);
      }
    }, 150);
  };

  const handleGenerateMatch = () => {
    const boyVal = validateBirthDetails(boyDay, boyMonth, boyYear, boyHour, boyMin);
    if (!boyVal.isValid) {
      Alert.alert(
        L('वर का अमान्य विवरण', "Boy's Invalid Details"),
        L(boyVal.errorHi, boyVal.errorEn)
      );
      return;
    }

    const girlVal = validateBirthDetails(girlDay, girlMonth, girlYear, girlHour, girlMin);
    if (!girlVal.isValid) {
      Alert.alert(
        L('कन्या का अमान्य विवरण', "Girl's Invalid Details"),
        L(girlVal.errorHi, girlVal.errorEn)
      );
      return;
    }

    setLoadingMilan(true);
    setTimeout(() => {
      try {
        const bObs = new Observer(boyCity.lat, boyCity.lng, 0);
        const bKundli = getKundli(boyVal.date!, bObs);

        const gObs = new Observer(girlCity.lat, girlCity.lng, 0);
        const gKundli = getKundli(girlVal.date!, gObs);

        const matchObj = matchKundli(bKundli, gKundli);
        setMatchResult(matchObj);
      } catch (e) {
        console.error(e);
        Alert.alert('Matchmaker Failed', 'Check input values and try again.');
      } finally {
        setLoadingMilan(false);
      }
    }, 150);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 60 }} bounces={false}>
      
      {/* ── Saffron Header ── */}
      <LinearGradient
        colors={['#f59e0b', '#d97706', '#b45309']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Astrology Center</Text>
            <Text style={styles.headerHindi}>वैदिक ज्योतिष और मिलान</Text>
          </View>
          <Sparkles size={40} color="#fff" style={{ opacity: 0.9 }} />
        </View>
      </LinearGradient>

      {/* ── Segment Selector ── */}
      <View style={styles.segmentContainer}>
        <Pressable
          onPress={() => setActiveSegment('kundli')}
          style={[
            styles.segmentButton,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
            activeSegment === 'kundli' && { backgroundColor: theme.tint, borderColor: theme.tint }
          ]}
        >
          <Text style={[styles.segmentText, { color: theme.text }, activeSegment === 'kundli' && { color: '#fff' }]}>
            {L('जन्म कुंडली', 'Birth Chart (Kundli)')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveSegment('milan')}
          style={[
            styles.segmentButton,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
            activeSegment === 'milan' && { backgroundColor: theme.tint, borderColor: theme.tint }
          ]}
        >
          <Text style={[styles.segmentText, { color: theme.text }, activeSegment === 'milan' && { color: '#fff' }]}>
            {L('कुण्डली मिलान', 'Matchmaker (Milan)')}
          </Text>
        </Pressable>
      </View>

      {/* ─── CASE 1: Kundli Section ─── */}
      {activeSegment === 'kundli' && (
        <View style={styles.body}>
          {loadingKundli ? (
            <View style={[styles.card, styles.loadingCard, { backgroundColor: theme.cardBackground }]}>
              <ActivityIndicator size="large" color={theme.tint} />
              <Text style={[styles.loadingTitle, { color: theme.text }]}>Aligning Celestial Bodies...</Text>
              <Text style={[styles.loadingSubtitle, { color: theme.icon }]}>ग्रहों की स्थिति और जन्म कुंडली की गणना की जा रही है...</Text>
            </View>
          ) : !computedKundli ? (
            /* Input Form */
            <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.cardHeadline, { color: theme.text }]}>Enter Birth Details</Text>
              <Text style={[styles.cardSubHeadline, { color: theme.icon }]}>सटीक गणना के लिए जन्म का विवरण भरें</Text>

              {/* Quick Load Profile Row */}
              {savedProfile && (
                <View style={[styles.profileQuickRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <User size={18} color={theme.tint} />
                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600', flexShrink: 1 }} numberOfLines={1}>
                      {L('सहेजी गई प्रोफाइल: ', 'Saved Profile: ')}
                      <Text style={{ color: theme.tint }}>{savedProfile.name || 'Anonymous'}</Text>
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Pressable
                      onPress={() => applyProfile(savedProfile)}
                      style={[styles.profileQuickBtn, { backgroundColor: theme.tint }]}
                    >
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                        {L('लोड करें', 'Load')}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleDeleteProfile}
                      style={[styles.profileQuickBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                    >
                      <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700' }}>
                        {L('हटाएं', 'Delete')}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Name */}
              <View style={styles.inputBox}>
                <Text style={[styles.inputLabel, { color: theme.icon }]}>Name (नाम)</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={kName}
                  onChangeText={setKName}
                  placeholder="e.g. Ramesh"
                  placeholderTextColor={theme.icon}
                />
              </View>

              {/* Day, Month, Year */}
              <Text style={[styles.inputLabel, { color: theme.icon, marginTop: 10 }]}>Birth Date (जन्म तिथि)</Text>
              <View style={styles.inlineRow}>
                <TextInput
                  style={[styles.textInput, styles.dateField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={kDay}
                  onChangeText={setKDay}
                  keyboardType="numeric"
                  placeholder="DD"
                  maxLength={2}
                />
                <TextInput
                  style={[styles.textInput, styles.dateField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={kMonth}
                  onChangeText={setKMonth}
                  keyboardType="numeric"
                  placeholder="MM"
                  maxLength={2}
                />
                <TextInput
                  style={[styles.textInput, styles.yearField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={kYear}
                  onChangeText={setKYear}
                  keyboardType="numeric"
                  placeholder="YYYY"
                  maxLength={4}
                />
              </View>

              {/* Hour, Minute */}
              <Text style={[styles.inputLabel, { color: theme.icon, marginTop: 10 }]}>Birth Time (24h format - जन्म समय)</Text>
              <View style={styles.inlineRow}>
                <TextInput
                  style={[styles.textInput, styles.timeField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={kHour}
                  onChangeText={setKHour}
                  keyboardType="numeric"
                  placeholder="HH"
                  maxLength={2}
                />
                <Text style={{ fontSize: 20, color: theme.icon }}>:</Text>
                <TextInput
                  style={[styles.textInput, styles.timeField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={kMin}
                  onChangeText={setKMin}
                  keyboardType="numeric"
                  placeholder="MM"
                  maxLength={2}
                />
              </View>

              {/* City Presets */}
              <Text style={[styles.inputLabel, { color: theme.icon, marginTop: 10 }]}>Birth Place (जन्म स्थान)</Text>
              <View style={styles.presetsGrid}>
                {PRESET_CITIES.map(city => {
                  const isSel = kCity.name === city.name;
                  return (
                    <Pressable
                      key={city.name}
                      onPress={() => setKCity(city)}
                      style={[
                        styles.cityChip,
                        { backgroundColor: theme.background, borderColor: isSel ? theme.tint : theme.border },
                        isSel && { backgroundColor: `${theme.tint}11` }
                      ]}
                    >
                      <Text style={[styles.cityChipText, { color: isSel ? theme.tint : theme.text }]}>{city.name}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Action Button */}
              <Pressable
                onPress={handleGenerateKundli}
                style={({ pressed }) => [styles.primaryButton, { backgroundColor: theme.tint, opacity: pressed ? 0.9 : 1 }]}
              >
                <Sparkles size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Generate Birth Kundli</Text>
              </Pressable>

              <AdBanner
                size="BANNER"
                style={{ marginTop: 24, alignSelf: 'center' }}
                darkMode={colorScheme === 'dark'}
              />
            </View>
          ) : (
            /* Results Presentation */
            <View style={styles.results}>
              {/* Header summary */}
              <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <View>
                    <Text style={[styles.cardHeadline, { color: theme.text }]}>
                      {kName || 'Explorer'}{"'s Kundli"}
                    </Text>
                    <Text style={{ fontSize: 13, color: theme.icon, fontWeight: '600', marginTop: 4 }}>
                      Born: {kDay}/{kMonth}/{kYear} · {kHour}:{kMin} @ {kCity.name}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setComputedKundli(null)}
                    style={styles.recalculateButton}
                  >
                    <RefreshCw size={14} color={theme.tint} />
                    <Text style={[styles.recalText, { color: theme.tint }]}>Reset</Text>
                  </Pressable>
                </View>

                {/* Astral stats */}
                <View style={styles.inlineStats}>
                  <View style={styles.statBox}>
                    <Text style={[styles.statLabel, { color: theme.icon }]}>Lagna (Ascendant)</Text>
                    <Text style={[styles.statValue, { color: theme.text }]}>
                      {computedKundli.ascendant.nakshatra}
                    </Text>
                    <Text style={[styles.statSubValue, { color: theme.tint }]}>
                      {RASHI_HI[computedKundli.ascendant.rashi]}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={[styles.statLabel, { color: theme.icon }]}>Moon Nakshatra</Text>
                    <Text style={[styles.statValue, { color: theme.text }]}>
                      {computedKundli.planets['Moon']?.nakshatra || '—'}
                    </Text>
                    <Text style={[styles.statSubValue, { color: theme.tint }]}>
                      Pada {computedKundli.planets['Moon']?.pada || '—'}
                    </Text>
                  </View>
                </View>

                {/* Save Profile Button */}
                <Pressable
                  onPress={handleSaveProfile}
                  style={({ pressed }) => [
                    styles.saveProfileBtn,
                    {
                      backgroundColor: theme.tint,
                      opacity: pressed ? 0.9 : 1,
                    }
                  ]}
                >
                  <User size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.saveProfileBtnText}>
                    {savedProfile && savedProfile.name === kName
                      ? L('मेरी प्रोफाइल अपडेट करें', 'Update My Profile')
                      : L('मेरी प्रोफाइल बनाएं', 'Set as My Profile')}
                  </Text>
                </Pressable>
              </View>

              {/* ── 12-House Lagna Chart Grid ── */}
              {(() => {
                const activeHouses = activeChart === 'd1' ? computedKundli.houses : computedKundli.vargas?.d9?.houses;
                return (
                  <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 8 }}>
                        <Star size={20} color={theme.tint} />
                        <Text style={[styles.cardHeadline, { color: theme.text, marginBottom: 0, flexShrink: 1 }]} numberOfLines={2}>
                          {activeChart === 'd1' ? L('लग्न कुंडली (D1)', 'Lagna Chart (D1)') : L('नवमांश कुंडली (D9)', 'Navamsha Chart (D9)')}
                        </Text>
                      </View>
                      <View style={styles.chartToggleContainer}>
                        <Pressable
                          onPress={() => setActiveChart('d1')}
                          style={[styles.chartToggleBtn, activeChart === 'd1' && { backgroundColor: theme.tint }]}
                        >
                          <Text style={[styles.chartToggleText, { color: theme.text }, activeChart === 'd1' && { color: '#fff' }]}>D1</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setActiveChart('d9')}
                          style={[styles.chartToggleBtn, activeChart === 'd9' && { backgroundColor: theme.tint }]}
                        >
                          <Text style={[styles.chartToggleText, { color: theme.text }, activeChart === 'd9' && { color: '#fff' }]}>D9</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.housesGrid}>
                      {(activeHouses || []).map((house: any) => {
                        const hasPlanets = house.planets && house.planets.length > 0;
                        return (
                          <View key={house.number} style={[styles.houseCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                            <View style={styles.houseHeader}>
                              <Text style={styles.houseLabel}>H{house.number}</Text>
                              <Text style={[styles.houseRashi, { color: theme.tint }]}>{house.rashi + 1}</Text>
                            </View>
                            <View style={styles.houseBody}>
                              {hasPlanets ? (
                                house.planets.map((planet: string) => (
                                  <View key={planet} style={[styles.planetBadge, { backgroundColor: `${theme.tint}18` }]}>
                                    <Text style={[styles.planetBadgeText, { color: theme.tint }]}>
                                      {planet.substring(0, 3)}
                                    </Text>
                                  </View>
                                ))
                              ) : (
                                <Text style={styles.emptyHouseText}>—</Text>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })()}

              {/* Ad Banner between chart and dosha */}
              <AdBanner
                size="BANNER"
                style={{ marginVertical: 10, alignSelf: 'center' }}
                darkMode={colorScheme === 'dark'}
              />

              {/* ── Mangal Dosha Card ── */}
              <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <ShieldAlert size={22} color={computedDosha.hasDosha ? '#ef4444' : '#10b981'} />
                  <Text style={[styles.cardHeadline, { color: theme.text, marginBottom: 0 }]}>
                    Mangal Dosha (मंगल दोष)
                  </Text>
                </View>

                <View style={[
                  styles.doshaStatusAlert,
                  { backgroundColor: computedDosha.hasDosha ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', borderColor: computedDosha.hasDosha ? '#ef4444' : '#10b981' }
                ]}>
                  <Text style={[styles.doshaStatusText, { color: computedDosha.hasDosha ? '#ef4444' : '#10b981' }]}>
                    {computedDosha.hasDosha ? 'Manglik (मंगल दोष है)' : 'Non-Manglik (दोष रहित है)'}
                  </Text>
                  <Text style={[styles.doshaDesc, { color: theme.text }]}>
                    {computedDosha.description}
                  </Text>
                </View>
              </View>

              {/* ── Planetary Degrees Table ── */}
              <View style={[styles.card, { backgroundColor: theme.cardBackground, paddingBottom: 10 }]}>
                <Text style={[styles.cardHeadline, { color: theme.text }]}>Planets Positions & Degrees</Text>
                <Text style={[styles.cardSubHeadline, { color: theme.icon, marginBottom: 16 }]}>कुंडली में ग्रहों के अंश और राशियां</Text>

                {Object.keys(computedKundli.planets).map(pKey => {
                  const p = computedKundli.planets[pKey];
                  const hiName = PLANET_HI[pKey] || pKey;
                  return (
                    <View key={pKey} style={[styles.planetRow, { borderBottomColor: theme.border }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.planetRowName, { color: theme.text }]}>{hiName}</Text>
                        <Text style={{ fontSize: 11, color: theme.icon, fontWeight: '600', marginTop: 2 }}>
                          Nakshatra: {p.nakshatra || '—'} · Pada {p.pada || '—'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.planetRowDegree, { color: theme.tint }]}>
                          {p.degree.toFixed(2)}°
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.text, fontWeight: '700', marginTop: 2 }}>
                          {RASHI_HI[p.rashi]?.split(' ')[0]}
                        </Text>
                      </View>
                      {p.isRetrograde && (
                        <View style={styles.retroBadge}>
                          <Text style={styles.retroText}>R</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* ── Astro Recommendations Card ── */}
              {(() => {
                const gem = getGemstoneRecommendation(computedKundli.ascendant.rashi);
                const moonRashiVal = computedKundli.planets['Moon']?.rashi !== undefined 
                  ? computedKundli.planets['Moon']?.rashi 
                  : computedKundli.ascendant.rashi;
                const mantra = getMantraRecommendation(moonRashiVal);
                return (
                  <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <ShieldAlert size={22} color={theme.tint} />
                      <Text style={[styles.cardHeadline, { color: theme.text, marginBottom: 0 }]}>
                        Astro Recommendations & Remedies
                      </Text>
                    </View>

                    {/* Gemstone */}
                    <View style={[styles.remedyBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                      <Text style={[styles.remedyLabel, { color: theme.tint }]}>
                        {L('अनुकूल जीवन रत्न (Gemstone)', 'Auspicious Gemstone')}
                      </Text>
                      <Text style={[styles.remedyValue, { color: theme.text }]}>
                        {gem.stoneHi}
                      </Text>
                      <Text style={[styles.remedyDesc, { color: theme.icon }]}>
                        {L(gem.descHi, gem.descEn)}
                      </Text>
                    </View>

                    {/* Mantra */}
                    <View style={[styles.remedyBox, { backgroundColor: theme.background, borderColor: theme.border, marginTop: 12 }]}>
                      <Text style={[styles.remedyLabel, { color: theme.tint }]}>
                        {L('दैनिक वैदिक मंत्र (Mantra)', 'Personalized Vedic Mantra')}
                      </Text>
                      <Text style={[styles.remedyValue, { color: theme.text, fontSize: 16 }]}>
                        {mantra.text}
                      </Text>
                      <Text style={[styles.remedyDesc, { color: theme.icon }]}>
                        {L(`साधना: ${mantra.count}`, `Chant: ${mantra.count}`)}
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </View>
          )}
        </View>
      )}

      {/* ─── CASE 2: Milan Matchmaker Section ─── */}
      {activeSegment === 'milan' && (
        <View style={styles.body}>
          {loadingMilan ? (
            <View style={[styles.card, styles.loadingCard, { backgroundColor: theme.cardBackground }]}>
              <ActivityIndicator size="large" color={theme.tint} />
              <Text style={[styles.loadingTitle, { color: theme.text }]}>Analyzing Ashtakoot Match...</Text>
              <Text style={[styles.loadingSubtitle, { color: theme.icon }]}>अष्टकूट दोषों और गुण अनुकूलता की गणना की जा रही है...</Text>
            </View>
          ) : !matchResult ? (
            /* Forms Input */
            <View style={{ gap: 20 }}>
              
              {/* BOY'S DETAILS CARD */}
              <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <User size={20} color="#38bdf8" />
                  <Text style={[styles.cardHeadline, { color: theme.text, marginBottom: 0 }]}>{"Boy's Details (वर का विवरण)"}</Text>
                </View>

                {/* Name */}
                <View style={styles.inputBox}>
                  <Text style={[styles.inputLabel, { color: theme.icon }]}>{"Boy's Name"}</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={boyName}
                    onChangeText={setBoyName}
                    placeholder="Name"
                  />
                </View>

                {/* Date */}
                <Text style={[styles.inputLabel, { color: theme.icon, marginTop: 10 }]}>Date of Birth</Text>
                <View style={styles.inlineRow}>
                  <TextInput
                    style={[styles.textInput, styles.dateField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={boyDay}
                    onChangeText={setBoyDay}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <TextInput
                    style={[styles.textInput, styles.dateField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={boyMonth}
                    onChangeText={setBoyMonth}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <TextInput
                    style={[styles.textInput, styles.yearField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={boyYear}
                    onChangeText={setBoyYear}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>

                {/* Time */}
                <Text style={[styles.inputLabel, { color: theme.icon, marginTop: 10 }]}>Time of Birth</Text>
                <View style={styles.inlineRow}>
                  <TextInput
                    style={[styles.textInput, styles.timeField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={boyHour}
                    onChangeText={setBoyHour}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={{ fontSize: 20, color: theme.icon }}>:</Text>
                  <TextInput
                    style={[styles.textInput, styles.timeField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={boyMin}
                    onChangeText={setBoyMin}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>

                {/* City */}
                <Text style={[styles.inputLabel, { color: theme.icon, marginTop: 10 }]}>Birth Place</Text>
                <View style={styles.presetsGrid}>
                  {PRESET_CITIES.map(city => {
                    const isSel = boyCity.name === city.name;
                    return (
                      <Pressable
                        key={city.name}
                        onPress={() => setBoyCity(city)}
                        style={[
                          styles.cityChip,
                          { backgroundColor: theme.background, borderColor: isSel ? '#38bdf8' : theme.border },
                          isSel && { backgroundColor: 'rgba(56,189,248,0.1)' }
                        ]}
                      >
                        <Text style={[styles.cityChipText, { color: isSel ? '#38bdf8' : theme.text }]}>{city.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* GIRL'S DETAILS CARD */}
              <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <User size={20} color="#ec4899" />
                  <Text style={[styles.cardHeadline, { color: theme.text, marginBottom: 0 }]}>{"Girl's Details (कन्या का विवरण)"}</Text>
                </View>

                {/* Name */}
                <View style={styles.inputBox}>
                  <Text style={[styles.inputLabel, { color: theme.icon }]}>{"Girl's Name"}</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={girlName}
                    onChangeText={setGirlName}
                    placeholder="Name"
                  />
                </View>

                {/* Date */}
                <Text style={[styles.inputLabel, { color: theme.icon, marginTop: 10 }]}>Date of Birth</Text>
                <View style={styles.inlineRow}>
                  <TextInput
                    style={[styles.textInput, styles.dateField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={girlDay}
                    onChangeText={setGirlDay}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <TextInput
                    style={[styles.textInput, styles.dateField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={girlMonth}
                    onChangeText={setGirlMonth}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <TextInput
                    style={[styles.textInput, styles.yearField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={girlYear}
                    onChangeText={setGirlYear}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>

                {/* Time */}
                <Text style={[styles.inputLabel, { color: theme.icon, marginTop: 10 }]}>Time of Birth</Text>
                <View style={styles.inlineRow}>
                  <TextInput
                    style={[styles.textInput, styles.timeField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={girlHour}
                    onChangeText={setGirlHour}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={{ fontSize: 20, color: theme.icon }}>:</Text>
                  <TextInput
                    style={[styles.textInput, styles.timeField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={girlMin}
                    onChangeText={setGirlMin}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>

                {/* City */}
                <Text style={[styles.inputLabel, { color: theme.icon, marginTop: 10 }]}>Birth Place</Text>
                <View style={styles.presetsGrid}>
                  {PRESET_CITIES.map(city => {
                    const isSel = girlCity.name === city.name;
                    return (
                      <Pressable
                        key={city.name}
                        onPress={() => setGirlCity(city)}
                        style={[
                          styles.cityChip,
                          { backgroundColor: theme.background, borderColor: isSel ? '#ec4899' : theme.border },
                          isSel && { backgroundColor: 'rgba(236,72,153,0.1)' }
                        ]}
                      >
                        <Text style={[styles.cityChipText, { color: isSel ? '#ec4899' : theme.text }]}>{city.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Submit Match */}
              <Pressable
                onPress={handleGenerateMatch}
                style={({ pressed }) => [styles.primaryButton, { backgroundColor: theme.tint, opacity: pressed ? 0.9 : 1 }]}
              >
                <Sparkles size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Calculate Ashtakoot Compatibility</Text>
              </Pressable>

              <AdBanner
                size="BANNER"
                style={{ marginTop: 24, alignSelf: 'center' }}
                darkMode={colorScheme === 'dark'}
              />
            </View>
          ) : (
            /* Matchmaker Compatibility Presentation */
            <View style={styles.results}>
              
              {/* Verdict Header with Circular matching wheel */}
              <View style={[styles.card, { backgroundColor: theme.cardBackground, alignItems: 'center' }]}>
                <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={[styles.cardHeadline, { color: theme.text, marginBottom: 0 }]}>Matchmaker Results</Text>
                  <Pressable onPress={() => setMatchResult(null)} style={styles.recalculateButton}>
                    <RefreshCw size={14} color={theme.tint} />
                    <Text style={[styles.recalText, { color: theme.tint }]}>Reset</Text>
                  </Pressable>
                </View>

                <View style={styles.gunaRingBox}>
                  <LinearGradient
                    colors={['#f59e0b', '#b45309']}
                    style={styles.gunaRing}
                  >
                    <Text style={styles.gunaScoreText}>
                      {matchResult.ashtakoot.totalScore}
                    </Text>
                    <Text style={styles.gunaMaxText}>
                      / 36 Gunas
                    </Text>
                  </LinearGradient>
                </View>

                <Text style={[styles.verdictTitle, { color: theme.tint }]}>
                  {matchResult.verdict}
                </Text>
                <Text style={[styles.verdictDesc, { color: theme.icon }]}>
                  {L(
                    '18 से अधिक अंक को अनुकूल मिलान माना जाता है।',
                    'A score of 18 or above is traditionally considered a compatible match.'
                  )}
                </Text>
              </View>

              {/* Ad Banner in matchmaking results */}
              <AdBanner
                size="BANNER"
                style={{ marginVertical: 10, alignSelf: 'center' }}
                darkMode={colorScheme === 'dark'}
              />

              {/* Mangal Dosha Comparison Card */}
              <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.cardHeadline, { color: theme.text }]}>Manglik Compatibility Match</Text>
                <Text style={[styles.cardSubHeadline, { color: theme.icon, marginBottom: 16 }]}>मंगल दोष मिलान और अनुकूलता</Text>

                <View style={styles.mangalSideRow}>
                  <View style={[
                    styles.mangalSideCard,
                    { backgroundColor: theme.background, borderColor: matchResult.dosha.boy.hasDosha ? '#ef4444' : '#10b981' }
                  ]}>
                    <Text style={[styles.mangalSideLabel, { color: theme.icon }]}>{boyName || 'Boy'}</Text>
                    <Text style={[styles.mangalSideValue, { color: matchResult.dosha.boy.hasDosha ? '#ef4444' : '#10b981' }]}>
                      {matchResult.dosha.boy.hasDosha ? 'Manglik ⚠️' : 'Non-Manglik ✓'}
                    </Text>
                    <Text style={styles.mangalSideDesc} numberOfLines={2}>
                      {matchResult.dosha.boy.description}
                    </Text>
                  </View>

                  <View style={[
                    styles.mangalSideCard,
                    { backgroundColor: theme.background, borderColor: matchResult.dosha.girl.hasDosha ? '#ef4444' : '#10b981' }
                  ]}>
                    <Text style={[styles.mangalSideLabel, { color: theme.icon }]}>{girlName || 'Girl'}</Text>
                    <Text style={[styles.mangalSideValue, { color: matchResult.dosha.girl.hasDosha ? '#ef4444' : '#10b981' }]}>
                      {matchResult.dosha.girl.hasDosha ? 'Manglik ⚠️' : 'Non-Manglik ✓'}
                    </Text>
                    <Text style={styles.mangalSideDesc} numberOfLines={2}>
                      {matchResult.dosha.girl.description}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Ashtakoot Breakdown list */}
              <View style={[styles.card, { backgroundColor: theme.cardBackground, paddingBottom: 10 }]}>
                <Text style={[styles.cardHeadline, { color: theme.text }]}>Ashtakoot Guna Match Scorecard</Text>
                <Text style={[styles.cardSubHeadline, { color: theme.icon, marginBottom: 16 }]}>अष्टकूट मिलान की विस्तृत गणना</Text>

                {matchResult.ashtakoot.kootas.map((k: any) => {
                  const hiKoota = KOOTA_HI[k.name] || { hi: k.name, desc: k.area };
                  const isRed = k.score === 0;
                  const isFull = k.score === k.maxScore;
                  return (
                    <View key={k.name} style={[styles.kootaRow, { borderBottomColor: theme.border }]}>
                      <View style={{ flex: 1, marginRight: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={[styles.kootaRowTitle, { color: theme.text }]}>
                            {L(hiKoota.hi, k.name)}
                          </Text>
                          <Text style={{ fontSize: 11, color: theme.icon, fontWeight: '700' }}>
                            ({L(hiKoota.hi, k.area)})
                          </Text>
                        </View>
                        <Text style={{ fontSize: 12, color: theme.icon, fontWeight: '500', marginTop: 4 }}>
                          {k.description}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                        <Text style={[
                          styles.kootaScore,
                          isRed && { color: '#ef4444' },
                          isFull && { color: '#10b981' }
                        ]}>
                          {k.score} / {k.maxScore}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerHindi: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  segmentContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },

  body: { padding: 20, paddingTop: 16 },

  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeadline: { fontSize: 18, fontWeight: '900', marginBottom: 4 },
  cardSubHeadline: { fontSize: 12, fontWeight: '600', lineHeight: 16 },

  inputBox: { marginBottom: 12 },
  inputLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
  },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  dateField: { width: 65, textAlign: 'center' },
  yearField: { width: 100, textAlign: 'center' },
  timeField: { width: 65, textAlign: 'center' },

  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  cityChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  cityChipText: { fontSize: 12, fontWeight: '700' },

  primaryButton: {
    height: 52,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '900' },

  results: { gap: 20 },
  recalculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(217,119,6,0.1)',
    gap: 6,
  },
  recalText: { fontSize: 12, fontWeight: '800' },

  inlineStats: { flexDirection: 'row', marginTop: 16 },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: 'rgba(0,0,0,0.06)' },
  statLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '900' },
  statSubValue: { fontSize: 12, fontWeight: '700', marginTop: 2 },

  housesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  houseCard: {
    width: '31.3%',
    height: 90,
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    justifyContent: 'space-between',
  },
  houseHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  houseLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '800' },
  houseRashi: { fontSize: 12, fontWeight: '900' },
  houseBody: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  planetBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  planetBadgeText: { fontSize: 10, fontWeight: '800' },
  emptyHouseText: { fontSize: 12, color: '#cbd5e1', alignSelf: 'center', marginTop: 10 },

  doshaStatusAlert: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  doshaStatusText: { fontSize: 17, fontWeight: '900', marginBottom: 4 },
  doshaDesc: { fontSize: 13, fontWeight: '500', lineHeight: 18 },

  planetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  planetRowName: { fontSize: 15, fontWeight: '800' },
  planetRowDegree: { fontSize: 15, fontWeight: '900' },
  retroBadge: {
    marginLeft: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retroText: { color: '#fff', fontSize: 10, fontWeight: '900' },

  gunaRingBox: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(217,119,6,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  gunaRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gunaScoreText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  gunaMaxText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '800', marginTop: 2 },
  verdictTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  verdictDesc: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

  mangalSideRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  mangalSideCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  mangalSideLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  mangalSideValue: { fontSize: 15, fontWeight: '900', marginBottom: 2 },
  mangalSideDesc: { fontSize: 11, color: '#94a3b8', fontWeight: '500', lineHeight: 14 },

  kootaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  kootaRowTitle: { fontSize: 15, fontWeight: '800' },
  kootaScore: { fontSize: 16, fontWeight: '900' },
  
  chartToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  chartToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chartToggleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  remedyBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  remedyLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  remedyValue: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 4,
  },
  remedyDesc: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 10,
  },
  loadingSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  profileQuickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
  },
  profileQuickBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveProfileBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
