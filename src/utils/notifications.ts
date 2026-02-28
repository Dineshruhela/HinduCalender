/**
 * src/utils/notifications.ts
 *
 * Hindu Calendar notification service — all native modules are lazy-loaded
 * so this file is safe in bare Expo Go (no native modules linked).
 *
 * Behaviour:
 *  • Requests permission on first enable
 *  • Daily 7 AM Panchang reminder (repeating)
 *  • Festival day-of (6 AM), eve (6 PM), 3-day-advance (9 AM) alerts
 *  • cancelAll() stops everything — "till stop"
 *  • State persisted in AsyncStorage under NOTIF_KEY
 */

import { Platform } from 'react-native';
import { getDailyPanchang, getTithiName, getUpcomingFestivals } from './panchang';

const NOTIF_KEY = '@hindu_cal_notif_enabled';
const DAYS_AHEAD = 60;

// ─── Lazy native module loaders ───────────────────────────────────────────────
function getNotifications(): any | null {
    try { return require('expo-notifications'); } catch { return null; }
}
function getDevice(): any | null {
    try { return require('expo-device'); } catch { return null; }
}
function getAsyncStorage(): any | null {
    try { return require('@react-native-async-storage/async-storage').default; } catch { return null; }
}

// Configure foreground notification handling (called lazily inside scheduleAll)
function configureForeground() {
    const N = getNotifications();
    if (!N) return;
    N.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
}

// ─── Permission ───────────────────────────────────────────────────────────────
export async function requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const N = getNotifications();
    const D = getDevice();
    if (!N || !D) return false;
    if (!D.isDevice) return false;

    if (Platform.OS === 'android') {
        await N.setNotificationChannelAsync('hindu-calendar', {
            name: 'Hindu Calendar Events',
            importance: N.AndroidImportance.HIGH,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
        });
    }
    const { status: existing } = await N.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await N.requestPermissionsAsync();
    return status === 'granted';
}

// ─── Schedule all notifications ───────────────────────────────────────────────
export async function scheduleAll(): Promise<void> {
    if (Platform.OS === 'web') return;
    const N = getNotifications();
    const AS = getAsyncStorage();
    if (!N) return;

    configureForeground();
    await N.cancelAllScheduledNotificationsAsync();

    const today = new Date();
    const todayPanchang = getDailyPanchang(today);
    const festivalToday = todayPanchang?.festivals?.[0]?.name ?? null;
    const tithiName = todayPanchang ? getTithiName(todayPanchang.tithi) : '';

    // 1. Daily repeating 7 AM notification
    await N.scheduleNotificationAsync({
        identifier: 'daily-panchang',
        content: {
            title: '🪔 आज का पंचांग',
            body: [
                `तिथि: ${tithiName}`,
                festivalToday ? `उत्सव: ${festivalToday}` : null,
                'हिंदू कैलेंडर खोलें →',
            ].filter(Boolean).join('  •  '),
            sound: 'default',
            data: { type: 'daily' },
        },
        trigger: {
            type: N.SchedulableTriggerInputTypes.DAILY,
            hour: 7,
            minute: 0,
        },
    });

    // 2. Festival advance notices for the next DAYS_AHEAD days
    const upcomingFestivals = getUpcomingFestivals(DAYS_AHEAD);
    for (const day of upcomingFestivals) {
        const festDate = new Date(day.date);
        const festName = day.events[0]?.name ?? 'Hindu Festival';
        const daysFromNow = Math.round(
            (festDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Day of — 6:00 AM
        if (daysFromNow >= 0) {
            await scheduleAt(N, festDate, 6, 0, {
                title: `🎉 आज: ${festName}`,
                body: `आज ${festName} का शुभ अवसर है।\nहार्दिक शुभकामनाएं! 🙏`,
                data: { type: 'festival-day', date: day.date },
            });
        }
        // 1 day before — 6:00 PM
        if (daysFromNow >= 1) {
            const eve = new Date(festDate);
            eve.setDate(eve.getDate() - 1);
            await scheduleAt(N, eve, 18, 0, {
                title: `🌟 कल है: ${festName}`,
                body: `कल ${festName} है। तैयारियां करें! 🪔`,
                data: { type: 'festival-eve', date: day.date },
            });
        }
        // 3 days before — 9:00 AM
        if (daysFromNow >= 3) {
            const advance = new Date(festDate);
            advance.setDate(advance.getDate() - 3);
            await scheduleAt(N, advance, 9, 0, {
                title: `📅 3 दिन बाद: ${festName}`,
                body: `${festName} आने वाला है। ${festDate.toLocaleDateString('hi-IN')}`,
                data: { type: 'festival-advance', date: day.date },
            });
        }
    }

    await AS?.setItem(NOTIF_KEY, 'true');
}

// ─── Cancel all ───────────────────────────────────────────────────────────────
export async function cancelAll(): Promise<void> {
    if (Platform.OS === 'web') return;
    const N = getNotifications();
    const AS = getAsyncStorage();
    if (N) {
        await N.cancelAllScheduledNotificationsAsync();
        await N.dismissAllNotificationsAsync();
    }
    await AS?.setItem(NOTIF_KEY, 'false');
}

// ─── Read saved preference ────────────────────────────────────────────────────
export async function areNotificationsEnabled(): Promise<boolean> {
    const AS = getAsyncStorage();
    if (!AS) return false;
    try {
        const val = await AS.getItem(NOTIF_KEY);
        return val === 'true';
    } catch {
        return false;
    }
}

// ─── Helper ───────────────────────────────────────────────────────────────────
async function scheduleAt(
    N: any,
    date: Date,
    hour: number,
    minute: number,
    content: any
) {
    const trigger = new Date(date);
    trigger.setHours(hour, minute, 0, 0);
    if (trigger <= new Date()) return;
    await N.scheduleNotificationAsync({
        content: { ...content, sound: 'default' },
        trigger: {
            type: N.SchedulableTriggerInputTypes.DATE,
            date: trigger,
        },
    });
}
