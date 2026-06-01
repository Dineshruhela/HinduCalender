import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  getLocationSettings,
  setLocationSettings,
  getLanguageSetting,
  setLanguageSetting,
  LanguageType,
} from '@/src/utils/settings';
import {
  areNotificationsEnabled,
  cancelAll,
  requestPermission,
  scheduleAll,
} from '@/src/utils/notifications';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Compass, Check, Bell, Languages, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  // Core settings state
  const [cityName, setCityName] = useState('New Delhi');
  const [lat, setLat] = useState('28.6139');
  const [lng, setLng] = useState('77.2090');
  const [language, setLanguage] = useState<LanguageType>('bilingual');
  const [notificationsOn, setNotificationsOn] = useState(false);

  // UI state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load initial settings
    async function loadSettings() {
      const loc = await getLocationSettings();
      setCityName(loc.cityName);
      setLat(String(loc.latitude));
      setLng(String(loc.longitude));

      const lang = await getLanguageSetting();
      setLanguage(lang);

      const notifs = await areNotificationsEnabled();
      setNotificationsOn(notifs);
    }
    loadSettings();
  }, []);

  const handlePresetSelect = (city: typeof PRESET_CITIES[number]) => {
    setCityName(city.name);
    setLat(String(city.lat));
    setLng(String(city.lng));
  };

  const handleGpsDetect = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location permission in Settings to auto-detect location.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      setLat(latitude.toFixed(4));
      setLng(longitude.toFixed(4));
      setCityName('GPS Location');

      // Attempt reverse geocoding
      let detectedCityName = 'GPS Location';
      try {
        const [geocode] = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (geocode && (geocode.city || geocode.subregion)) {
          detectedCityName = geocode.city || geocode.subregion || 'GPS Location';
          setCityName(detectedCityName);
        }
      } catch {
        // Fallback to coordinates title
      }

      Alert.alert('📍 Location Found!', `Detected location as: ${detectedCityName}`);
    } catch (error) {
      console.error(error);
      Alert.alert('Detection Failed', 'Failed to retrieve GPS location. Please try manually.');
    } finally {
      setGpsLoading(false);
    }
  };

  const toggleNotifications = async () => {
    setNotifLoading(true);
    try {
      if (notificationsOn) {
        await cancelAll();
        setNotificationsOn(false);
      } else {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert('Permission Required', 'Please enable notification permissions in your phone settings.');
          return;
        }
        await scheduleAll();
        setNotificationsOn(true);
        Alert.alert('🔔 Alerts Scheduled', 'Daily Panchang & festival alerts have been enabled!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleSave = async () => {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      Alert.alert('Invalid Latitude', 'Latitude must be a valid number between -90 and 90.');
      return;
    }
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      Alert.alert('Invalid Longitude', 'Longitude must be a valid number between -180 and 180.');
      return;
    }

    setSaving(true);
    try {
      await setLocationSettings(parsedLat, parsedLng, cityName);
      await setLanguageSetting(language);

      // Re-schedule notifications using new location details if they are on
      if (notificationsOn) {
        await scheduleAll();
      }

      Alert.alert('✓ Settings Saved', 'Your location and preferences have been updated successfully.');
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings & Location</Text>
        <Text style={[styles.headerSub, { color: theme.icon }]}>कैलेंडर सेटिंग्स और स्थान</Text>
      </View>

      {/* ── Section: Observer Location ── */}
      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.sectionTitleRow}>
          <MapPin size={20} color={theme.tint} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Panchang Location (स्थान)</Text>
        </View>
        <Text style={[styles.sectionDesc, { color: theme.icon }]}>
          Sunrise, Sunset, and Rahu Kalam depend heavily on your coordinates.
        </Text>

        {/* GPS Button */}
        <Pressable
          onPress={handleGpsDetect}
          disabled={gpsLoading}
          style={({ pressed }) => [
            styles.gpsButton,
            { backgroundColor: gpsLoading ? `${theme.tint}44` : theme.tint, opacity: pressed ? 0.9 : 1 }
          ]}
        >
          {gpsLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Compass size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.gpsButtonText}>Auto-Detect My GPS Location</Text>
            </>
          )}
        </Pressable>

        {/* Custom Inputs */}
        <View style={styles.inputsRow}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.icon }]}>City Name</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={cityName}
              onChangeText={setCityName}
              placeholder="e.g. New Delhi"
              placeholderTextColor={theme.icon}
            />
          </View>
        </View>

        <View style={styles.coordinatesRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={[styles.inputLabel, { color: theme.icon }]}>Latitude (अक्षांश)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={lat}
              onChangeText={setLat}
              keyboardType="numeric"
              placeholder="28.6139"
              placeholderTextColor={theme.icon}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: theme.icon }]}>Longitude (रेखांश)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={lng}
              onChangeText={setLng}
              keyboardType="numeric"
              placeholder="77.2090"
              placeholderTextColor={theme.icon}
            />
          </View>
        </View>

        {/* Preset Cities */}
        <Text style={[styles.presetTitle, { color: theme.text }]}>Or Select a Preset City:</Text>
        <View style={styles.presetsGrid}>
          {PRESET_CITIES.map((city) => {
            const isSelected = cityName.toLowerCase() === city.name.toLowerCase();
            return (
              <Pressable
                key={city.name}
                onPress={() => handlePresetSelect(city)}
                style={[
                  styles.presetChip,
                  { backgroundColor: theme.background, borderColor: isSelected ? theme.tint : theme.border },
                  isSelected && { backgroundColor: `${theme.tint}11` }
                ]}
              >
                <Text style={[styles.presetChipText, { color: isSelected ? theme.tint : theme.text }]}>
                  {city.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Section: Language Mode ── */}
      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.sectionTitleRow}>
          <Languages size={20} color={theme.tint} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Display Language (भाषा)</Text>
        </View>
        <Text style={[styles.sectionDesc, { color: theme.icon }]}>
          Choose how details on the screens should display.
        </Text>

        <View style={styles.langChoices}>
          {(['bilingual', 'hindi', 'english'] as LanguageType[]).map((mode) => {
            const isSelected = language === mode;
            const labels = {
              bilingual: { title: 'Bilingual', sub: 'हिंदी + English' },
              hindi: { title: 'Hindi Only', sub: 'केवल हिंदी' },
              english: { title: 'English Only', sub: 'English' },
            };
            return (
              <Pressable
                key={mode}
                onPress={() => setLanguage(mode)}
                style={[
                  styles.langItem,
                  { backgroundColor: theme.background, borderColor: isSelected ? theme.tint : theme.border },
                  isSelected && { backgroundColor: `${theme.tint}11` }
                ]}
              >
                <View style={styles.langItemLeft}>
                  <Text style={[styles.langTitle, { color: isSelected ? theme.tint : theme.text }]}>
                    {labels[mode].title}
                  </Text>
                  <Text style={[styles.langSub, { color: theme.icon }]}>
                    {labels[mode].sub}
                  </Text>
                </View>
                {isSelected && (
                  <View style={[styles.checkCircle, { backgroundColor: theme.tint }]}>
                    <Check size={14} color="#fff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Section: Notifications ── */}
      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.sectionTitleRow}>
          <Bell size={20} color={theme.tint} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Festival & Daily Alerts</Text>
        </View>
        <Text style={[styles.sectionDesc, { color: theme.icon }]}>
          Get beautiful notifications for sunrise Panchang & custom festival eve counts.
        </Text>

        <Pressable
          onPress={toggleNotifications}
          disabled={notifLoading}
          style={({ pressed }) => [
            styles.notifToggle,
            { backgroundColor: theme.background, borderColor: notificationsOn ? theme.tint : theme.border },
            notificationsOn && { backgroundColor: `${theme.tint}11` },
            pressed && { opacity: 0.9 }
          ]}
        >
          <View style={styles.notifToggleText}>
            <Text style={[styles.langTitle, { color: notificationsOn ? theme.tint : theme.text }]}>
              {notificationsOn ? 'Alerts are Active 🔔' : 'Alerts are Disabled 🔕'}
            </Text>
            <Text style={[styles.langSub, { color: theme.icon }]}>
              {notificationsOn ? 'Receive daily Panchangam at 7:00 AM' : 'Click to enable festival schedules'}
            </Text>
          </View>
          {notifLoading ? (
            <ActivityIndicator size="small" color={theme.tint} />
          ) : (
            <View style={[styles.toggleTrack, notificationsOn && { backgroundColor: theme.tint }]}>
              <View style={[styles.toggleThumb, notificationsOn && { transform: [{ translateX: 16 }] }]} />
            </View>
          )}
        </Pressable>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveButton,
            { backgroundColor: theme.tint, opacity: pressed ? 0.9 : 1 }
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.cancelButton,
            { borderColor: theme.border, opacity: pressed ? 0.9 : 1 }
          ]}
        >
          <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
        </Pressable>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, fontWeight: '600', marginTop: 4 },

  section: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionDesc: { fontSize: 13, fontWeight: '500', lineHeight: 18, marginBottom: 16 },

  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  gpsButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  inputsRow: { flexDirection: 'row', marginBottom: 12 },
  coordinatesRow: { flexDirection: 'row', marginBottom: 16 },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
  },

  presetTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetChipText: { fontSize: 12, fontWeight: '700' },

  langChoices: { gap: 12 },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  langItemLeft: {},
  langTitle: { fontSize: 16, fontWeight: '800' },
  langSub: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notifToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  notifToggleText: { flex: 1, marginRight: 16 },
  toggleTrack: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#cbd5e1',
    padding: 2,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 1,
  },

  actions: { gap: 12, marginTop: 10 },
  saveButton: {
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelButton: {
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { fontSize: 16, fontWeight: '700' },
});
