/**
 * src/utils/ads.ts
 *
 * Central ads configuration.
 * ─────────────────────────────────────────────────────────────────────────────
 * DEVELOPMENT:  Uses Google's official test Ad Unit IDs so you never
 *               accidentally serve real ads or get banned.
 * PRODUCTION:   Replace TEST_MODE = false and fill in your real IDs from
 *               Google AdMob console (admob.google.com).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Platform } from 'react-native';

const TEST_MODE = false; // ← Production is now ACTIVE

// ── Real Ad Unit IDs (fill these in before publishing) ──────────────────────
const REAL_IDS = {
    ios: {
        banner: 'ca-app-pub-2203210311587761/7958955725',
        interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
        rewarded: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
        appOpen: 'ca-app-pub-2203210311587761/5230160119',
    },
    android: {
        banner: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
        interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
        rewarded: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
        appOpen: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
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

const ids = TEST_MODE ? TEST_IDS : REAL_IDS;
const platform = Platform.OS === 'ios' ? 'ios' : 'android';

export const AdUnits = {
    BANNER: ids[platform].banner,
    INTERSTITIAL: ids[platform].interstitial,
    REWARDED: ids[platform].rewarded,
    APP_OPEN: ids[platform].appOpen,
};

export const IS_TEST_MODE = TEST_MODE;
