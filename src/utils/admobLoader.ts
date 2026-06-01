/**
 * src/utils/admobLoader.ts
 *
 * Singleton loader for react-native-google-mobile-ads.
 *
 * With the New Architecture (TurboModules), a failed module initialization is
 * cached by the registry. Any second require() attempt throws
 * "invalid reuse after initialization failure" instead of the original error.
 *
 * This module attempts the require ONCE and caches the result (null if it
 * failed). All consumers share the same cached value, so the module is
 * never required more than once.
 *
 * In Expo Go, TurboModuleRegistry.getEnforcing throws before JS try/catch can
 * intercept it, so we check appOwnership first and bail out gracefully.
 */

import Constants from 'expo-constants';

// Attach state to the global object to survive React Native Fast Refresh
const globalAny = global as any;

export function getAdmob(): any | null {
    if (globalAny.__admobAttempted) return globalAny.__admobInstance;

    globalAny.__admobAttempted = true;

    // Expo Go does not bundle custom native modules. Bail out before the
    // TurboModuleRegistry.getEnforcing call escapes try/catch.
    if (Constants.appOwnership === 'expo') {
        globalAny.__admobInstance = null;
        return null;
    }

    try {
        globalAny.__admobInstance = require('react-native-google-mobile-ads');
    } catch {
        globalAny.__admobInstance = null;
    }
    return globalAny.__admobInstance;
}

export const isAdmobAvailable = (): boolean => {
    const mod = getAdmob();
    return mod !== null && typeof mod.BannerAd !== 'undefined';
};
