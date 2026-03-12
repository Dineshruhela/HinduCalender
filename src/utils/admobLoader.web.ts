/**
 * src/utils/admobLoader.web.ts
 *
 * Stub loader for react-native-google-mobile-ads on Web.
 * Since the native library can't be bundled on web, we provide a null stub.
 */

export function getAdmob(): any | null {
    return null;
}

export const isAdmobAvailable = (): boolean => {
    return false;
};
