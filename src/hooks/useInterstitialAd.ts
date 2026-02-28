/**
 * src/hooks/useInterstitialAd.ts
 * Uses the singleton admobLoader to avoid double-require crashes on TurboModules.
 */

import { getAdmob } from '@/src/utils/admobLoader';
import { AdUnits } from '@/src/utils/ads';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export function useInterstitialAd() {
    const adRef = useRef<any>(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (Platform.OS === 'web') return;

        const admob = getAdmob();
        if (!admob) return; // AdMob not available (Expo Go or init failed)

        const { InterstitialAd, AdEventType } = admob;

        const ad = InterstitialAd.createForAdRequest(AdUnits.INTERSTITIAL, {
            requestNonPersonalizedAdsOnly: false,
        });
        adRef.current = ad;

        const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => setLoaded(true));
        const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
            setLoaded(false);
            ad.load();
        });
        const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
            setLoaded(false);
            setTimeout(() => ad.load(), 30_000);
        });

        ad.load();

        return () => {
            unsubLoaded();
            unsubClosed();
            unsubError();
        };
    }, []);

    const show = () => {
        if (loaded && adRef.current) {
            adRef.current.show();
        }
    };

    return { show, loaded };
}
