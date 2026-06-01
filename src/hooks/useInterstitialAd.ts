/**
 * src/hooks/useInterstitialAd.ts
 * Uses the singleton admobLoader to avoid double-require crashes on TurboModules.
 */

import { getAdmob } from '@/src/utils/admobLoader';
import { getAdRequestOptions, initializeAds } from '@/src/utils/adService';
import { AdUnits } from '@/src/utils/ads';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export function useInterstitialAd() {
    const adRef = useRef<any>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (Platform.OS === 'web') return;

        let mounted = true;
        let retryTimer: ReturnType<typeof setTimeout> | null = null;

        async function loadInterstitial() {
            const adsState = await initializeAds();
            if (!mounted || !adsState.canRequestAds) return;

            const admob = getAdmob();
            if (!admob) return; // AdMob not available (Expo Go or init failed)

            const { InterstitialAd, AdEventType } = admob;

            const ad = InterstitialAd.createForAdRequest(AdUnits.INTERSTITIAL, getAdRequestOptions());
            adRef.current = ad;

            const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => setLoaded(true));
            const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
                setLoaded(false);
                ad.load();
            });
            const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
                setLoaded(false);
                retryTimer = setTimeout(() => ad.load(), 30_000);
            });

            ad.load();

            return () => {
                unsubLoaded();
                unsubClosed();
                unsubError();
                if (retryTimer) clearTimeout(retryTimer);
            };
        }

        let cleanup: (() => void) | undefined;
        loadInterstitial().then(unsubscribe => {
            cleanup = unsubscribe;
        });

        return () => {
            mounted = false;
            cleanup?.();
            if (retryTimer) clearTimeout(retryTimer);
        };
    }, []);

    const show = () => {
        if (loaded && adRef.current) {
            adRef.current.show();
        }
    };

    return { show, loaded };
}
