/**
 * src/components/AdBanner.tsx
 * Uses the singleton admobLoader to avoid double-require crashes on TurboModules.
 */

import { getAdmob } from '@/src/utils/admobLoader';
import { AdUnits } from '@/src/utils/ads';
import { Platform, View } from 'react-native';

interface AdBannerProps {
    size?: string;
    style?: object;
    darkMode?: boolean;
}

export default function AdBanner({ size, style }: AdBannerProps) {
    if (Platform.OS === 'web') return null;

    const admob = getAdmob();
    if (!admob) return null;

    const { BannerAd, BannerAdSize } = admob;
    const adSize = size ?? BannerAdSize.BANNER;

    return (
        <View style={[{ alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style]}>
            <BannerAd
                unitId={AdUnits.BANNER}
                size={adSize}
                requestOptions={{ requestNonPersonalizedAdsOnly: false }}
            />
        </View>
    );
}
