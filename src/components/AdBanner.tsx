/**
 * src/components/AdBanner.tsx
 * Uses the singleton admobLoader to avoid double-require crashes on TurboModules.
 */

import { getAdmob } from '@/src/utils/admobLoader';
import { getAdRequestOptions, useAdsInitialization } from '@/src/utils/adService';
import { AdUnits } from '@/src/utils/ads';
import { Platform, View } from 'react-native';

interface AdBannerProps {
    size?: string;
    style?: object;
    darkMode?: boolean;
}

export default function AdBanner({ size, style }: AdBannerProps) {
    const adsState = useAdsInitialization();

    if (Platform.OS === 'web') return null;
    if (!adsState.canRequestAds) return null;

    const admob = getAdmob();
    if (!admob) return null;

    const { BannerAd, BannerAdSize } = admob;
    const requestedSize = size && BannerAdSize[size] ? BannerAdSize[size] : size;
    const adSize = requestedSize ?? BannerAdSize.ANCHORED_ADAPTIVE_BANNER;

    // Auto-adjust if LEADERBOARD was requested but we're on mobile
    const isTablet = Platform.OS === 'ios' && Platform.isPad;
    const safeSize = (adSize === BannerAdSize.LEADERBOARD && !isTablet)
        ? BannerAdSize.BANNER
        : adSize;

    return (
        <View style={[{ alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style]}>
            <BannerAd
                unitId={AdUnits.BANNER}
                size={safeSize}
                requestOptions={getAdRequestOptions()}
            />
        </View>
    );
}
