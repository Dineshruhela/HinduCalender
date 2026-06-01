import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  LATITUDE: '@hindu_cal_latitude',
  LONGITUDE: '@hindu_cal_longitude',
  CITY_NAME: '@hindu_cal_city_name',
  LANGUAGE: '@hindu_cal_language',
};

export type LanguageType = 'bilingual' | 'hindi' | 'english';

export interface LocationSettings {
  latitude: number;
  longitude: number;
  cityName: string;
}

// New Delhi default coordinates
export const DEFAULT_LOCATION: LocationSettings = {
  latitude: 28.6139,
  longitude: 77.2090,
  cityName: 'New Delhi',
};

/**
 * Retrieves the stored location settings or returns New Delhi as default.
 */
export async function getLocationSettings(): Promise<LocationSettings> {
  try {
    const latStr = await AsyncStorage.getItem(KEYS.LATITUDE);
    const lngStr = await AsyncStorage.getItem(KEYS.LONGITUDE);
    const cityName = await AsyncStorage.getItem(KEYS.CITY_NAME);

    if (latStr && lngStr && cityName) {
      return {
        latitude: parseFloat(latStr),
        longitude: parseFloat(lngStr),
        cityName,
      };
    }
  } catch (error) {
    console.error('Error reading location settings:', error);
  }
  return DEFAULT_LOCATION;
}

/**
 * Saves custom location settings.
 */
export async function setLocationSettings(lat: number, lng: number, name: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LATITUDE, String(lat));
    await AsyncStorage.setItem(KEYS.LONGITUDE, String(lng));
    await AsyncStorage.setItem(KEYS.CITY_NAME, name);
  } catch (error) {
    console.error('Error saving location settings:', error);
  }
}

/**
 * Retrieves the stored language preference.
 */
export async function getLanguageSetting(): Promise<LanguageType> {
  try {
    const lang = await AsyncStorage.getItem(KEYS.LANGUAGE);
    if (lang === 'hindi' || lang === 'english' || lang === 'bilingual') {
      return lang as LanguageType;
    }
  } catch (error) {
    console.error('Error reading language setting:', error);
  }
  return 'bilingual';
}

/**
 * Saves language preference.
 */
export async function setLanguageSetting(lang: LanguageType): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.LANGUAGE, lang);
  } catch (error) {
    console.error('Error saving language setting:', error);
  }
}

/**
 * Translation helper that outputs based on language preference.
 * - Bilingual: "Hindi Label / English Label" or custom format
 * - Hindi: "Hindi Label" only
 * - English: "English Label" only
 */
export function getLocalizedText(
  hi: string,
  en: string,
  lang: LanguageType,
  bilingualDelimiter: string = ' / '
): string {
  if (lang === 'hindi') return hi;
  if (lang === 'english') return en;
  return `${hi}${bilingualDelimiter}${en}`;
}
