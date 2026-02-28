/**
 * src/hooks/useAppOpenAd.ts
 * Automatically shows App Open Ad when app is brought to foreground.
 */

import { getAdmob } from '@/src/utils/admobLoader';
import { AdUnits } from '@/src/utils/ads';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

export function useAppOpenAd() {
    const adRef = useRef<any>(null);
    const [loaded, setLoaded] = useState(false);
    const [isShowingAd, setIsShowingAd] = useState(false);
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        if (Platform.OS === 'web') return;

        const admob = getAdmob();
        if (!admob) return; // AdMob not available in Expo Go

        const { AppOpenAd, AdEventType } = admob;

        try {
            const ad = AppOpenAd.createForAdRequest(AdUnits.APP_OPEN, {
                requestNonPersonalizedAdsOnly: false,
            });
            adRef.current = ad;

            const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
                setLoaded(true);
            });
            const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
                setIsShowingAd(false);
                setLoaded(false);
                ad.load(); // Reload for next time
            });
            const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
                setIsShowingAd(false);
                setLoaded(false);
            });

            ad.load();

            const subscription = AppState.addEventListener('change', (nextAppState) => {
                if (
                    appState.current.match(/inactive|background/) &&
                    nextAppState === 'active'
                ) {
                    // App brought to foreground
                    if (loaded && !isShowingAd) {
                        setIsShowingAd(true);
                        adRef.current?.show();
                    } else if (!loaded && !isShowingAd) {
                        ad.load(); // Make sure it's loading if it failed previously
                    }
                }
                appState.current = nextAppState;
            });

            return () => {
                unsubLoaded();
                unsubClosed();
                unsubError();
                subscription.remove();
            };
        } catch (error) {
            console.error('Failed to init AppOpenAd', error);
        }
    }, [loaded, isShowingAd]);
}
