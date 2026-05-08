/**
 * src/utils/ads.ts
 *
 * Central ads configuration.
 * ─────────────────────────────────────────────────────────────────────────────
 * iOS:     Production IDs are active for banner & app-open.
 *          Interstitial & rewarded still use test IDs until created in AdMob.
 * Android: All test IDs (no production ad units created yet).
 *          Update REAL_IDS.android + set ANDROID_TEST_MODE = false once ready.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Platform } from 'react-native';

// Toggle per platform — flip to false once production ad unit IDs are set
// NOTE: Set back to false after 24-48 hours when AdMob ad units become active
const IOS_TEST_MODE = true;  // ← TEMP: switched to test mode for verification
const ANDROID_TEST_MODE = true; // ← TEMP: switched to test mode for verification

// ── Real Ad Unit IDs (fill these in before publishing) ──────────────────────
const REAL_IDS = {
    ios: {
        banner: 'ca-app-pub-2203210311587761/7958955725',
        interstitial: 'ca-app-pub-2203210311587761/2896748034',
        rewarded: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',     // TODO: Create in AdMob
        appOpen: 'ca-app-pub-2203210311587761/5230160119',
    },
    android: {
        banner: 'ca-app-pub-2203210311587761/8478375645',
        interstitial: 'ca-app-pub-2203210311587761/8995252521',
        rewarded: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',     // TODO: Create in AdMob
        appOpen: 'ca-app-pub-2203210311587761/6004255545',
    },
};

// ── Google's official test IDs (safe for development) ───────────────────────
const TEST_IDS = {
    ios: {
        banner: 'ca-app-pub-3940256099942544/2934735716',
        interstitial: 'ca-app-pub-3940256099942544/4411468910',
        rewarded: 'ca-app-pub-3940256099942544/1712485313',
        appOpen: 'ca-app-pub-3940256099942544/5662855259',
    },
    android: {
        banner: 'ca-app-pub-3940256099942544/6300978111',
        interstitial: 'ca-app-pub-3940256099942544/1033173712',
        rewarded: 'ca-app-pub-3940256099942544/5224354917',
        appOpen: 'ca-app-pub-3940256099942544/3419835294',
    },
};

const platform = Platform.OS === 'ios' ? 'ios' : 'android';
const isTestMode = platform === 'ios' ? IOS_TEST_MODE : ANDROID_TEST_MODE;

// For iOS: use real IDs where available, fall back to test IDs for placeholder entries
const resolveIds = (real: Record<string, string>, test: Record<string, string>) => {
    const resolved: Record<string, string> = {};
    for (const key of Object.keys(real)) {
        resolved[key] = real[key].includes('XXXXXXXX') ? test[key] : real[key];
    }
    return resolved;
};

const ids = isTestMode
    ? TEST_IDS[platform]
    : resolveIds(REAL_IDS[platform], TEST_IDS[platform]);

export const AdUnits = {
    BANNER: ids.banner,
    INTERSTITIAL: ids.interstitial,
    REWARDED: ids.rewarded,
    APP_OPEN: ids.appOpen,
};

export const IS_TEST_MODE = isTestMode;
