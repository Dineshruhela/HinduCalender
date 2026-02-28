import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
    getDailyPanchangAsync,
    getMonthFestivalsAsync,
    getNakshatraHindi,
    getNakshatraName,
    getTithiHindi,
    getTithiName,
    MASA_HI,
    PAKSHA_HI,
} from '@/src/utils/panchang';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

const OM_MANDALA = require('@/assets/images/om_mandala.png');
const DIYA_ICON = require('@/assets/images/diya_icon.png');

export default function CalendarScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [markedDates, setMarkedDates] = useState<any>({});
    const [panchang, setPanchang] = useState<any>(null);
    const [loadingDay, setLoadingDay] = useState(false);
    const [loadingMonth, setLoadingMonth] = useState(false);

    // Keep track of already-fetched months
    const loadedMonths = useRef(new Set<string>());

    const loadMonth = useCallback(async (year: number, month0: number) => {
        const k = `${year}-${month0}`;
        if (loadedMonths.current.has(k)) return;
        loadedMonths.current.add(k);
        setLoadingMonth(true);
        const festDates = await getMonthFestivalsAsync(year, month0);
        setMarkedDates((prev: any) => {
            const next = { ...prev };
            festDates.forEach(f => {
                next[f.date] = { ...next[f.date], marked: true, dotColor: theme.tint };
            });
            return next;
        });
        setLoadingMonth(false);
    }, [theme.tint]);

    // Load current month on mount and set initial selection
    useEffect(() => {
        const today = new Date();
        loadMonth(today.getFullYear(), today.getMonth());
        setMarkedDates((prev: Record<string, any>) => ({
            ...prev,
            [selectedDate]: { ...prev[selectedDate], selected: true, selectedColor: theme.tint },
        }));
    }, []);

    // Load panchang for selected day
    useEffect(() => {
        let cancelled = false;
        setLoadingDay(true);
        setPanchang(null);
        getDailyPanchangAsync(new Date(selectedDate)).then(data => {
            if (!cancelled) {
                setPanchang(data);
                setLoadingDay(false);
            }
        });
        return () => { cancelled = true; };
    }, [selectedDate]);

    const onDayPress = useCallback((day: any) => {
        setSelectedDate(day.dateString);
        setMarkedDates((prev: any) => {
            const next = { ...prev };
            Object.keys(next).forEach(k => {
                if (next[k]?.selected) next[k] = { ...next[k], selected: false };
            });
            next[day.dateString] = { ...next[day.dateString], selected: true, selectedColor: theme.tint };
            return next;
        });
    }, [theme.tint]);

    const onMonthChange = useCallback((month: { year: number; month: number }) => {
        loadMonth(month.year, month.month - 1); // calendar is 1-indexed
    }, [loadMonth]);

    const calTheme = {
        backgroundColor: 'transparent',
        calendarBackground: 'transparent',
        textSectionTitleColor: theme.icon,
        selectedDayBackgroundColor: theme.tint,
        selectedDayTextColor: '#ffffff',
        todayTextColor: theme.tint,
        dayTextColor: theme.text,
        textDisabledColor: colorScheme === 'dark' ? '#374151' : '#d1d5db',
        dotColor: theme.tint,
        selectedDotColor: '#ffffff',
        arrowColor: theme.tint,
        monthTextColor: theme.text,
        textDayFontWeight: '600' as '600',
        textMonthFontWeight: 'bold' as 'bold',
        textDayHeaderFontWeight: '700' as '700',
        textDayFontSize: 16,
        textMonthFontSize: 20,
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]} bounces={false}>

            <LinearGradient
                colors={['#f59e0b', '#d97706', '#b45309']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Monthly View</Text>
                        <Text style={styles.headerHindi}>मासिक पंचांग</Text>
                        <Text style={styles.headerSub}>
                            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </Text>
                    </View>
                    <Image source={OM_MANDALA} style={styles.headerMandala} resizeMode="contain" />
                </View>
            </LinearGradient>

            <View style={styles.content}>
                {/* Calendar */}
                <View style={[styles.calendarWrapper, { backgroundColor: theme.cardBackground }]}>
                    <Calendar
                        current={selectedDate}
                        onDayPress={onDayPress}
                        onMonthChange={onMonthChange}
                        markedDates={markedDates}
                        theme={calTheme}
                        style={styles.calendar}
                    />
                    {loadingMonth && (
                        <View style={styles.monthLoader}>
                            <ActivityIndicator size="small" color={theme.tint} />
                            <Text style={[styles.monthLoaderText, { color: theme.icon }]}>Loading festivals...</Text>
                        </View>
                    )}
                </View>

                {/* Legend */}
                <View style={styles.legend}>
                    <View style={[styles.legendDot, { backgroundColor: theme.tint }]} />
                    <Text style={[styles.legendText, { color: theme.icon }]}>Festival / पर्व on this day</Text>
                </View>

                {/* Selected Day Details */}
                <View style={[styles.detailsCard, { backgroundColor: theme.cardBackground }]}>
                    <Text style={[styles.dateTitle, { color: theme.text }]}>
                        {new Date(selectedDate).toLocaleDateString('en-IN', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}
                    </Text>

                    {loadingDay ? (
                        <View style={styles.dayLoader}>
                            <ActivityIndicator size="large" color={theme.tint} />
                            <Text style={[{ color: theme.icon, marginTop: 12, fontWeight: '600' }]}>
                                गणना हो रही है...
                            </Text>
                        </View>
                    ) : panchang ? (
                        <>
                            <BilingualRow
                                emoji="🌙" bg="rgba(245,158,11,0.1)"
                                label="Tithi" labelHi="तिथि"
                                value={getTithiName(panchang.tithi)} valueHi={getTithiHindi(panchang.tithi)}
                                sub={panchang.paksha} subHi={PAKSHA_HI[panchang.paksha] || panchang.paksha}
                                theme={theme}
                            />
                            <BilingualRow
                                emoji="⭐" bg="rgba(56,189,248,0.1)"
                                label="Nakshatra" labelHi="नक्षत्र"
                                value={getNakshatraName(panchang.nakshatra)} valueHi={getNakshatraHindi(panchang.nakshatra)}
                                theme={theme}
                            />
                            <BilingualRow
                                emoji="📅" bg="rgba(236,72,153,0.1)"
                                label="Hindu Month" labelHi="मास"
                                value={panchang.masa?.name || '-'}
                                valueHi={MASA_HI[panchang.masa?.name] || panchang.masa?.name || '-'}
                                last
                                theme={theme}
                            />

                            {panchang.festivals?.length > 0 && (
                                <LinearGradient
                                    colors={['rgba(245,158,11,0.12)', 'rgba(217,119,6,0.18)']}
                                    style={styles.festivalBox}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                        <Image source={DIYA_ICON} style={styles.diyaMini} resizeMode="cover" />
                                        <View>
                                            <Text style={[styles.festivalBoxTitle, { color: '#d97706' }]}>Festivals</Text>
                                            <Text style={{ color: '#b45309', fontSize: 13, fontWeight: '700' }}>पर्व एवं त्योहार</Text>
                                        </View>
                                    </View>
                                    {panchang.festivals.map((fest: any, idx: number) => (
                                        <View key={idx} style={styles.festRow}>
                                            <View style={styles.festDot} />
                                            <Text style={[styles.festText, { color: colorScheme === 'dark' ? '#fbbf24' : '#b45309' }]}>
                                                {fest.name}
                                            </Text>
                                        </View>
                                    ))}
                                </LinearGradient>
                            )}
                        </>
                    ) : null}
                </View>
            </View>
        </ScrollView>
    );
}

// ─── Bilingual info row component ─────────────────────────────────────────────
function BilingualRow({ emoji, bg, label, labelHi, value, valueHi, sub, subHi, last, theme }: any) {
    return (
        <View style={[styles.detailRow, last && { marginBottom: 0 }]}>
            <View style={[styles.detailIconBox, { backgroundColor: bg }]}>
                <Text style={{ fontSize: 20 }}>{emoji}</Text>
            </View>
            <View style={styles.detailTextArea}>
                <Text style={[styles.detailLabel, { color: theme.icon }]}>
                    {label} <Text style={styles.detailLabelHi}>· {labelHi}</Text>
                </Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                    {value}
                    {valueHi ? <Text style={styles.detailValueHi}>  {valueHi}</Text> : null}
                </Text>
                {sub && (
                    <Text style={[styles.detailSub, { color: theme.icon }]}>
                        {sub}  <Text style={styles.detailSubHi}>{subHi}</Text>
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: Platform.OS === 'ios' ? 65 : 45,
        paddingBottom: 30,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#d97706',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    headerContent: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
    headerHindi: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginTop: 2 },
    headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: '600' },
    headerMandala: { width: 80, height: 80, opacity: 0.9 },

    content: { padding: 20, paddingTop: 24, paddingBottom: 50 },

    calendarWrapper: {
        borderRadius: 24, padding: 12, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
    },
    calendar: { borderRadius: 12 },
    monthLoader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8 },
    monthLoaderText: { marginLeft: 8, fontSize: 13, fontWeight: '600' },

    legend: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    legendText: { fontSize: 13, fontWeight: '600' },

    detailsCard: {
        borderRadius: 24, padding: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
    },
    dateTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20, lineHeight: 26 },
    dayLoader: { alignItems: 'center', paddingVertical: 30 },

    detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
    detailIconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    detailTextArea: { flex: 1 },
    detailLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 },
    detailLabelHi: { fontSize: 12, fontWeight: '600', textTransform: 'none', letterSpacing: 0 },
    detailValue: { fontSize: 17, fontWeight: '800', lineHeight: 22 },
    detailValueHi: { fontSize: 16, fontWeight: '600' },
    detailSub: { fontSize: 13, marginTop: 3, fontWeight: '600' },
    detailSubHi: { fontSize: 13, fontWeight: '500' },

    festivalBox: { marginTop: 24, padding: 20, borderRadius: 20 },
    diyaMini: { width: 36, height: 36, borderRadius: 10, marginRight: 12 },
    festivalBoxTitle: { fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.4 },
    festRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    festDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#d97706', marginRight: 10 },
    festText: { fontSize: 16, fontWeight: '700', flex: 1 },
});
