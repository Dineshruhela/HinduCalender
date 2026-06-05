/**
 * src/utils/ads.ts
 *
 * Central ads configuration.
 * ─────────────────────────────────────────────────────────────────────────────
 * Release builds use production IDs for banner, interstitial, and app-open
 * ads on both iOS and Android. Rewarded ads intentionally fall back to
 * Google's official test IDs until production rewarded units are created.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Platform } from 'react-native';

// Dynamically enable test mode in development, and use production IDs in release builds
const IOS_TEST_MODE = __DEV__;
const ANDROID_TEST_MODE = __DEV__;

// ── Real Ad Unit IDs (fill these in before publishing) ──────────────────────
const REAL_IDS = {
    ios: {
        banner: 'ca-app-pub-2203210311587761/4551090882',
        interstitial: 'ca-app-pub-2203210311587761/3338915719',
        rewarded: 'ca-app-pub-2203210311587761/8651107678',     // TODO: Create in AdMob
        appOpen: 'ca-app-pub-2203210311587761/2908660552',
    },
    android: {
        banner: 'ca-app-pub-2203210311587761/5390363980',
        interstitial: 'ca-app-pub-2203210311587761/4077282311',
        rewarded: 'ca-app-pub-2203210311587761/5942548237',     // TODO: Create in AdMob
        appOpen: 'ca-app-pub-2203210311587761/3316384899',
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
