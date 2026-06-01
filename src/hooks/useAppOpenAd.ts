/**
 * src/hooks/useAppOpenAd.ts
 * Automatically shows App Open Ad when app is brought to foreground.
 */

import { getAdmob } from '@/src/utils/admobLoader';
import { getAdRequestOptions, initializeAds } from '@/src/utils/adService';
import { AdUnits } from '@/src/utils/ads';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

const APP_OPEN_COOLDOWN_MS = 5 * 60 * 1000;

export function useAppOpenAd() {
    const adRef = useRef<any>(null);
    const loadedRef = useRef(false);
    const isShowingAdRef = useRef(false);
    const appState = useRef(AppState.currentState);
    const lastShownAtRef = useRef(0);

    useEffect(() => {
        if (Platform.OS === 'web') return;

        let mounted = true;
        let subscription: { remove: () => void } | null = null;
        let unsubLoaded: (() => void) | null = null;
        let unsubClosed: (() => void) | null = null;
        let unsubError: (() => void) | null = null;

        async function setupAppOpenAd() {
            const adsState = await initializeAds();
            if (!mounted || !adsState.canRequestAds) return;

            const admob = getAdmob();
            if (!admob) return; // AdMob not available in Expo Go

            const { AppOpenAd, AdEventType } = admob;

            try {
                const ad = AppOpenAd.createForAdRequest(AdUnits.APP_OPEN, getAdRequestOptions());
                adRef.current = ad;

                unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
                    loadedRef.current = true;
                });
                unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
                    isShowingAdRef.current = false;
                    loadedRef.current = false;
                    ad.load();
                });
                unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
                    isShowingAdRef.current = false;
                    loadedRef.current = false;
                });

                ad.load();

                subscription = AppState.addEventListener('change', (nextAppState) => {
                    if (
                        appState.current.match(/inactive|background/) &&
                        nextAppState === 'active'
                    ) {
                        const canShowNow = Date.now() - lastShownAtRef.current >= APP_OPEN_COOLDOWN_MS;

                        if (loadedRef.current && !isShowingAdRef.current && canShowNow) {
                            isShowingAdRef.current = true;
                            lastShownAtRef.current = Date.now();
                            adRef.current?.show();
                        } else if (!loadedRef.current && !isShowingAdRef.current) {
                            ad.load();
                        }
                    }
                    appState.current = nextAppState;
                });
            } catch (error) {
                console.error('Failed to init AppOpenAd', error);
            }
        }

        setupAppOpenAd();

        return () => {
            mounted = false;
            unsubLoaded?.();
            unsubClosed?.();
            unsubError?.();
            subscription?.remove();
        };
    }, []);
}
