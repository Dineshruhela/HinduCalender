import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AdBanner from '@/src/components/AdBanner';
import { useInterstitialAd } from '@/src/hooks/useInterstitialAd';
import { getUpcomingFestivals } from '@/src/utils/panchang';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const FESTIVAL_BANNER = require('@/assets/images/festival_banner.png');
const DIYA_ICON = require('@/assets/images/diya_icon.png');

const CATEGORIES: Record<string, { emoji: string; color: string }> = {
    major: { emoji: '🌟', color: '#f59e0b' },
    minor: { emoji: '✨', color: '#a78bfa' },
    ekadashi: { emoji: '🌙', color: '#38bdf8' },
    pradosham: { emoji: '🔱', color: '#6366f1' },
    vrat: { emoji: '🙏', color: '#ec4899' },
    jayanti: { emoji: '🎊', color: '#f97316' },
    solar: { emoji: '☀️', color: '#facc15' },
};

export default function FestivalsScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [upcomingFestivals, setUpcomingFestivals] = useState<any[]>([]);
    const { show: showInterstitial } = useInterstitialAd();
    const hasShownAd = useRef(false);

    useEffect(() => {
        const fests = getUpcomingFestivals(90);
        setUpcomingFestivals(fests);
    }, []);

    const handleFestivalPress = (festName: string) => {
        // Show ad 30% of the time on a meaningful interaction
        if (Math.random() < 0.3) {
            showInterstitial();
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]} bounces={false}>

            {/* Hero Header with festival banner */}
            <View style={styles.heroWrapper}>
                <Image source={FESTIVAL_BANNER} style={styles.heroBanner} resizeMode="cover" />
                <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.1)', 'rgba(180,83,9,0.85)', 'rgba(217,119,6,1)']}
                    start={{ x: 0, y: 0.3 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.heroOverlay}
                >
                    <View style={styles.heroContent}>
                        <Text style={styles.headerTitle}>Upcoming Festivals</Text>
                        <Text style={styles.headerHindi}>आगामी पर्व एवं त्योहार</Text>
                        <Text style={styles.headerSub}>Next 90 days · Hindu Calendar {new Date().getFullYear()}</Text>
                    </View>
                </LinearGradient>
            </View>

            <View style={styles.list}>
                {upcomingFestivals.map((day, idx) => {
                    const evt0 = day.events[0];
                    const catInfo = CATEGORIES[evt0?.category] || { emoji: '🎉', color: '#d97706' };

                    return (
                        <Pressable
                            key={idx}
                            style={({ pressed }) => [
                                styles.festCard,
                                { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 }
                            ]}
                            onPress={() => handleFestivalPress(evt0?.name)}
                        >
                            {/* Date Badge */}
                            <View style={styles.dateBadgeWrapper}>
                                <LinearGradient
                                    colors={[catInfo.color, '#b45309']}
                                    style={styles.dateBadge}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                >
                                    <Text style={styles.dateMonth}>
                                        {new Date(day.date).toLocaleString('default', { month: 'short' })}
                                    </Text>
                                    <Text style={styles.dateDay}>{new Date(day.date).getDate()}</Text>
                                    <Text style={styles.dateDow}>
                                        {new Date(day.date).toLocaleString('default', { weekday: 'short' })}
                                    </Text>
                                </LinearGradient>
                            </View>

                            {/* Events */}
                            <View style={styles.eventsArea}>
                                {day.events.map((evt: any, eIdx: number) => {
                                    const info = CATEGORIES[evt.category] || { emoji: '🎉', color: '#d97706' };
                                    return (
                                        <View key={eIdx} style={[styles.eventRow, eIdx !== day.events.length - 1 && { marginBottom: 10 }]}>
                                            <Text style={styles.eventEmoji}>{info.emoji}</Text>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.eventName, { color: theme.text }]}>{evt.name}</Text>
                                                {evt.description && (
                                                    <Text style={[styles.eventDesc, { color: theme.icon }]} numberOfLines={2}>{evt.description}</Text>
                                                )}
                                                <View style={styles.tagRow}>
                                                    <View style={[styles.tag, { backgroundColor: `${info.color}22` }]}>
                                                        <Text style={[styles.tagText, { color: info.color }]}>
                                                            {(evt.category || 'event').toUpperCase()}
                                                        </Text>
                                                    </View>
                                                    {evt.isFastingDay && (
                                                        <View style={[styles.tag, { backgroundColor: 'rgba(236,72,153,0.1)' }]}>
                                                            <Text style={[styles.tagText, { color: '#ec4899' }]}>FASTING</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </Pressable>
                    );
                })}

                {upcomingFestivals.length === 0 && (
                    <View style={styles.emptyState}>
                        <Image source={DIYA_ICON} style={styles.emptyDiya} resizeMode="contain" />
                        <Text style={[styles.emptyText, { color: theme.icon }]}>No upcoming festivals found</Text>
                    </View>
                )}

                {/* Banner ad at bottom of list */}
                <AdBanner
                    size="LEADERBOARD"
                    style={{ marginTop: 12, marginBottom: 8, alignSelf: 'center' }}
                    darkMode={colorScheme === 'dark'}
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    heroWrapper: { width: '100%', height: Platform.OS === 'ios' ? 260 : 230, overflow: 'hidden' },
    heroBanner: { width: '100%', height: '100%', position: 'absolute' },
    heroOverlay: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 70 : 50,
        justifyContent: 'flex-end',
        paddingHorizontal: 24,
        paddingBottom: 28,
    },
    heroContent: {},
    headerTitle: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
    headerHindi: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginTop: 3 },
    headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6, fontWeight: '600' },

    list: { padding: 20, paddingTop: 24, paddingBottom: 60 },

    festCard: {
        flexDirection: 'row',
        borderRadius: 24,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    dateBadgeWrapper: { padding: 16, paddingRight: 0 },
    dateBadge: {
        width: 66, height: 80, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
    },
    dateMonth: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    dateDay: { color: '#fff', fontSize: 26, fontWeight: '900', lineHeight: 32 },
    dateDow: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

    eventsArea: { flex: 1, padding: 16, paddingLeft: 14 },
    eventRow: { flexDirection: 'row', alignItems: 'flex-start' },
    eventEmoji: { fontSize: 22, marginRight: 10, marginTop: 1 },
    eventName: { fontSize: 17, fontWeight: '800', lineHeight: 22 },
    eventDesc: { fontSize: 13, marginTop: 4, lineHeight: 18, fontWeight: '500' },
    tagRow: { flexDirection: 'row', marginTop: 8, gap: 6 },
    tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    tagText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyDiya: { width: 100, height: 100, opacity: 0.6, marginBottom: 16 },
    emptyText: { fontSize: 16, fontWeight: '600' },
});
