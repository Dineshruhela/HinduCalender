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

    const { AdsConsent, MaxAdContentRating, MobileAds } = admob;

    try {
        const consentInfo = await AdsConsent.gatherConsent({
            tagForUnderAgeOfConsent: false,
        });

        if (!consentInfo.canRequestAds) {
            return {
                status: 'blocked',
                canRequestAds: false,
                requestNonPersonalizedAdsOnly: true,
            };
        }

        const [iosAllowsPersonalizedAds, userChoices] = await Promise.all([
            getIosPersonalizedAdsAllowed(),
            AdsConsent.getUserChoices?.().catch(() => null),
        ]);

        const consentAllowsPersonalizedAds = userChoices?.selectPersonalisedAds !== false;
        const requestNonPersonalizedAdsOnly = !(iosAllowsPersonalizedAds && consentAllowsPersonalizedAds);
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
        return {
            status: 'error',
            canRequestAds: false,
            requestNonPersonalizedAdsOnly: true,
            error: error instanceof Error ? error.message : String(error),
        };
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
