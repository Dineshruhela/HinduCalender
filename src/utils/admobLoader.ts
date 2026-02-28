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
 */

let _attempted = false;
let _admob: any = null;

export function getAdmob(): any | null {
    if (_attempted) return _admob;
    _attempted = true;
    try {
        _admob = require('react-native-google-mobile-ads');
    } catch {
        _admob = null;
    }
    return _admob;
}

export const isAdmobAvailable = (): boolean => {
    const mod = getAdmob();
    return mod !== null && typeof mod.BannerAd !== 'undefined';
};
