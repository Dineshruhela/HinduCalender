import * as TrackingTransparency from 'expo-tracking-transparency';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { getAdmob } from '@/src/utils/admobLoader';

type AdsInitStatus = 'idle' | 'initializing' | 'ready' | 'unavailable' | 'blocked' | 'error';

export interface AdsInitState {
    status: AdsInitStatus;
    canRequestAds: boolean;
    requestNonPersonalizedAdsOnly: boolean;
    error?: string;
}

const initialState: AdsInitState = {
    status: 'idle',
    canRequestAds: false,
    requestNonPersonalizedAdsOnly: true,
};

let currentState = initialState;
let initPromise: Promise<AdsInitState> | null = null;
const listeners = new Set<(state: AdsInitState) => void>();

const setState = (next: AdsInitState) => {
    currentState = next;
    listeners.forEach(listener => listener(currentState));
};

const subscribe = (listener: (state: AdsInitState) => void) => {
    listeners.add(listener);
    listener(currentState);
    return () => {
        listeners.delete(listener);
    };
};

async function getIosPersonalizedAdsAllowed() {
    if (Platform.OS !== 'ios') return true;

    const available = await TrackingTransparency.isAvailable();
    if (!available) return true;

    const existing = await TrackingTransparency.getTrackingPermissionsAsync();
    const permission = existing.status === TrackingTransparency.PermissionStatus.UNDETERMINED
        ? await TrackingTransparency.requestTrackingPermissionsAsync()
        : existing;

    return permission.status === TrackingTransparency.PermissionStatus.GRANTED;
}

async function initializeNativeAds(): Promise<AdsInitState> {
    if (Platform.OS === 'web') {
        return {
            status: 'unavailable',
            canRequestAds: false,
            requestNonPersonalizedAdsOnly: true,
        };
    }

    const admob = getAdmob();
    if (!admob?.MobileAds || !admob?.AdsConsent) {
        return {
            status: 'unavailable',
            canRequestAds: false,
            requestNonPersonalizedAdsOnly: true,
        };
    }

    const { AdsConsent, AdsConsentStatus, MaxAdContentRating, MobileAds } = admob;

    try {
        // Gather UMP consent info with a 5-second timeout so a slow SDK
        // never prevents ads from loading (e.g. no internet, first launch).
        let consentInfo: any = null;
        try {
            const consentPromise = AdsConsent.gatherConsent({
                tagForUnderAgeOfConsent: false,
            });
            const timeoutPromise = new Promise<null>((resolve) =>
                setTimeout(() => resolve(null), 5000)
            );
            consentInfo = await Promise.race([consentPromise, timeoutPromise]);
        } catch {
            // Consent gathering failed — treat as non-EEA, allow non-personalized ads
            consentInfo = null;
        }

        // For non-EEA regions (India, USA, etc.) the UMP SDK typically returns
        // status = NOT_REQUIRED and canRequestAds = true.
        // If consentInfo is null (timeout / error) or canRequestAds is explicitly
        // false only when consent is REQUIRED, block. Otherwise allow with
        // non-personalized ads as the safe default.
        const consentStatus = consentInfo?.status;
        const isConsentRequired =
            AdsConsentStatus &&
            consentStatus === AdsConsentStatus.REQUIRED;

        if (isConsentRequired && consentInfo?.canRequestAds === false) {
            // EEA user who hasn't consented yet — serve non-personalized as fallback.
            // We don't hard-block; we still initialize MobileAds with NPA=true.
        }

        const iosAllowsPersonalizedAds = await getIosPersonalizedAdsAllowed().catch(() => false);
        let userChoices: any = null;
        try {
            userChoices = await AdsConsent.getUserChoices?.();
        } catch { /* ignore */ }

        const consentAllowsPersonalizedAds = userChoices?.selectPersonalisedAds !== false;
        // Default to non-personalized if we couldn't confirm personalized consent.
        const requestNonPersonalizedAdsOnly = !(
            iosAllowsPersonalizedAds &&
            consentAllowsPersonalizedAds &&
            !isConsentRequired
        );

        const mobileAds = MobileAds();
        await mobileAds.setRequestConfiguration({
            maxAdContentRating: MaxAdContentRating.PG,
            tagForChildDirectedTreatment: false,
            tagForUnderAgeOfConsent: false,
        });
        await mobileAds.initialize();

        return {
            status: 'ready',
            canRequestAds: true,
            requestNonPersonalizedAdsOnly,
        };
    } catch (error) {
        // Even on error, attempt to initialize MobileAds so banner ads can
        // still load (non-personalized). Only truly bail out if MobileAds
        // itself throws during initialize().
        try {
            const mobileAds = MobileAds();
            await mobileAds.initialize();
            return {
                status: 'ready',
                canRequestAds: true,
                requestNonPersonalizedAdsOnly: true,
            };
        } catch {
            return {
                status: 'error',
                canRequestAds: false,
                requestNonPersonalizedAdsOnly: true,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
}

export function initializeAds() {
    if (currentState.status === 'ready' || currentState.status === 'blocked' || currentState.status === 'unavailable') {
        return Promise.resolve(currentState);
    }

    if (!initPromise) {
        setState({
            ...currentState,
            status: 'initializing',
        });

        initPromise = initializeNativeAds().then(result => {
            setState(result);
            if (result.status === 'error') initPromise = null;
            return result;
        }).catch(error => {
            const result: AdsInitState = {
                status: 'error',
                canRequestAds: false,
                requestNonPersonalizedAdsOnly: true,
                error: error instanceof Error ? error.message : String(error),
            };
            setState(result);
            initPromise = null;
            return result;
        });
    }

    return initPromise;
}

export function getAdsState() {
    return currentState;
}

export function getAdRequestOptions() {
    return {
        requestNonPersonalizedAdsOnly: currentState.requestNonPersonalizedAdsOnly,
    };
}

export function useAdsInitialization() {
    const [state, setLocalState] = useState(currentState);

    useEffect(() => {
        const unsubscribe = subscribe(setLocalState);
        initializeAds();
        return unsubscribe;
    }, []);

    return state;
}
