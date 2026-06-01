import { getPanchangamDetails, Observer } from '@ishubhamx/panchangam-js';

const DEFAULT_LAT = 28.6139;
const DEFAULT_LNG = 77.2090;

// ─── Module-level cache so the same date and coordinates are never recalculated ───────────────
const panchangCache = new Map<string, any>();

const toLocalDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const key = (date: Date, lat: number, lng: number) => {
    const dStr = toLocalDateKey(date);
    return `${dStr}_${lat.toFixed(4)}_${lng.toFixed(4)}`;
};

export const getDailyPanchang = (date: Date, lat = DEFAULT_LAT, lng = DEFAULT_LNG) => {
    const k = key(date, lat, lng);
    if (panchangCache.has(k)) return panchangCache.get(k);
    const observer = new Observer(lat, lng, 0);
    try {
        const details = getPanchangamDetails(date, observer);
        panchangCache.set(k, details);
        return details;
    } catch (error) {
        console.error('Error calculating Panchangam details:', error);
        return null;
    }
};

/**
 * Async version — runs calculation on next tick so it never blocks the UI.
 * Resolves immediately from cache if already computed.
 */
export const getDailyPanchangAsync = (date: Date, lat = DEFAULT_LAT, lng = DEFAULT_LNG): Promise<any> =>
    new Promise(resolve => {
        const k = key(date, lat, lng);
        if (panchangCache.has(k)) {
            resolve(panchangCache.get(k));
            return;
        }
        // Defer heavy work off the render tick
        setTimeout(() => resolve(getDailyPanchang(date, lat, lng)), 0);
    });

/**
 * Compute festival marks for a whole month asynchronously.
 * Processes days in small batches so the JS thread stays responsive.
 */
export const getMonthFestivalsAsync = (
    year: number,
    month: number,
    lat = DEFAULT_LAT,
    lng = DEFAULT_LNG
): Promise<{ date: string; events: any[] }[]> =>
    new Promise(resolve => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const results: { date: string; events: any[] }[] = [];
        let day = 1;

        const processBatch = () => {
            const BATCH = 5; // process 5 days per tick
            for (let i = 0; i < BATCH && day <= daysInMonth; i++, day++) {
                const date = new Date(year, month, day);
                const details = getDailyPanchang(date, lat, lng);
                if (details?.festivals?.length) {
                    const dStr = toLocalDateKey(date);
                    results.push({ date: dStr, events: details.festivals });
                }
            }
            if (day <= daysInMonth) {
                // Yield to UI then continue
                setTimeout(processBatch, 0);
            } else {
                resolve(results);
            }
        };

        setTimeout(processBatch, 0);
    });

export const getUpcomingFestivals = (days: number = 90, lat = DEFAULT_LAT, lng = DEFAULT_LNG) => {
    const festivals: any[] = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const details = getDailyPanchang(date, lat, lng);
        if (details?.festivals?.length) {
            const dStr = toLocalDateKey(date);
            festivals.push({ date: dStr, events: details.festivals });
        }
    }
    return festivals;
};

// ─── Formatting helpers ───────────────────────────────────────────────────────
export const formatTime = (d?: Date | string | null) => {
    if (!d) return '--:--';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return '--:--';
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ─── Name tables (English + Hindi) ───────────────────────────────────────────
export const TITHI_DATA = [
    { en: 'Pratipada', hi: 'प्रतिपदा' },
    { en: 'Dwitiya', hi: 'द्वितीया' },
    { en: 'Tritiya', hi: 'तृतीया' },
    { en: 'Chaturthi', hi: 'चतुर्थी' },
    { en: 'Panchami', hi: 'पंचमी' },
    { en: 'Shashthi', hi: 'षष्ठी' },
    { en: 'Saptami', hi: 'सप्तमी' },
    { en: 'Ashtami', hi: 'अष्टमी' },
    { en: 'Navami', hi: 'नवमी' },
    { en: 'Dashami', hi: 'दशमी' },
    { en: 'Ekadashi', hi: 'एकादशी' },
    { en: 'Dwadashi', hi: 'द्वादशी' },
    { en: 'Trayodashi', hi: 'त्रयोदशी' },
    { en: 'Chaturdashi', hi: 'चतुर्दशी' },
    { en: 'Purnima', hi: 'पूर्णिमा' },
    { en: 'Pratipada', hi: 'प्रतिपदा' },
    { en: 'Dwitiya', hi: 'द्वितीया' },
    { en: 'Tritiya', hi: 'तृतीया' },
    { en: 'Chaturthi', hi: 'चतुर्थी' },
    { en: 'Panchami', hi: 'पंचमी' },
    { en: 'Shashthi', hi: 'षष्ठी' },
    { en: 'Saptami', hi: 'सप्तमी' },
    { en: 'Ashtami', hi: 'अष्टमी' },
    { en: 'Navami', hi: 'नवमी' },
    { en: 'Dashami', hi: 'दशमी' },
    { en: 'Ekadashi', hi: 'एकादशी' },
    { en: 'Dwadashi', hi: 'द्वादशी' },
    { en: 'Trayodashi', hi: 'त्रयोदशी' },
    { en: 'Chaturdashi', hi: 'चतुर्दशी' },
    { en: 'Amavasya', hi: 'अमावस्या' },
];

export const NAKSHATRA_DATA = [
    { en: 'Ashwini', hi: 'अश्विनी' },
    { en: 'Bharani', hi: 'भरणी' },
    { en: 'Krittika', hi: 'कृत्तिका' },
    { en: 'Rohini', hi: 'रोहिणी' },
    { en: 'Mrigashira', hi: 'मृगशिरा' },
    { en: 'Ardra', hi: 'आर्द्रा' },
    { en: 'Punarvasu', hi: 'पुनर्वसु' },
    { en: 'Pushya', hi: 'पुष्य' },
    { en: 'Ashlesha', hi: 'आश्लेषा' },
    { en: 'Magha', hi: 'मघा' },
    { en: 'Purva Phalguni', hi: 'पूर्व फाल्गुनी' },
    { en: 'Uttara Phalguni', hi: 'उत्तर फाल्गुनी' },
    { en: 'Hasta', hi: 'हस्त' },
    { en: 'Chitra', hi: 'चित्रा' },
    { en: 'Swati', hi: 'स्वाती' },
    { en: 'Vishakha', hi: 'विशाखा' },
    { en: 'Anuradha', hi: 'अनुराधा' },
    { en: 'Jyeshtha', hi: 'ज्येष्ठा' },
    { en: 'Mula', hi: 'मूल' },
    { en: 'Purva Ashadha', hi: 'पूर्व आषाढ़ा' },
    { en: 'Uttara Ashadha', hi: 'उत्तर आषाढ़ा' },
    { en: 'Shravana', hi: 'श्रवण' },
    { en: 'Dhanishta', hi: 'धनिष्ठा' },
    { en: 'Shatabhisha', hi: 'शतभिषा' },
    { en: 'Purva Bhadrapada', hi: 'पूर्व भाद्रपद' },
    { en: 'Uttara Bhadrapada', hi: 'उत्तर भाद्रपद' },
    { en: 'Revati', hi: 'रेवती' },
];

export const YOGA_DATA = [
    { en: 'Vishkumbha', hi: 'विष्कुम्भ' },
    { en: 'Priti', hi: 'प्रीति' },
    { en: 'Ayushman', hi: 'आयुष्मान' },
    { en: 'Saubhagya', hi: 'सौभाग्य' },
    { en: 'Shobhana', hi: 'शोभन' },
    { en: 'Atiganda', hi: 'अतिगण्ड' },
    { en: 'Sukarman', hi: 'सुकर्मा' },
    { en: 'Dhriti', hi: 'धृति' },
    { en: 'Shula', hi: 'शूल' },
    { en: 'Ganda', hi: 'गण्ड' },
    { en: 'Vriddhi', hi: 'वृद्धि' },
    { en: 'Dhruva', hi: 'ध्रुव' },
    { en: 'Vyaghata', hi: 'व्याघात' },
    { en: 'Harshana', hi: 'हर्षण' },
    { en: 'Vajra', hi: 'वज्र' },
    { en: 'Siddhi', hi: 'सिद्धि' },
    { en: 'Vyatipata', hi: 'व्यतीपात' },
    { en: 'Variyana', hi: 'वरीयान' },
    { en: 'Parigha', hi: 'परिघ' },
    { en: 'Shiva', hi: 'शिव' },
    { en: 'Siddha', hi: 'सिद्ध' },
    { en: 'Sadhya', hi: 'साध्य' },
    { en: 'Shubha', hi: 'शुभ' },
    { en: 'Shukla', hi: 'शुक्ल' },
    { en: 'Brahma', hi: 'ब्रह्म' },
    { en: 'Indra', hi: 'इन्द्र' },
    { en: 'Vaidhriti', hi: 'वैधृति' },
];

export const KARANA_HI: Record<string, string> = {
    Bava: 'बव',
    Balava: 'बालव',
    Kaulava: 'कौलव',
    Taitila: 'तैतिल',
    Gara: 'गर',
    Vanija: 'वणिज',
    Vishti: 'विष्टि (भद्रा)',
    Shakuni: 'शकुनि',
    Chatushpada: 'चतुष्पद',
    Naga: 'नाग',
    Kimstughna: 'किंस्तुघ्न',
};

export const MASA_HI: Record<string, string> = {
    Chaitra: 'चैत्र',
    Vaishakha: 'वैशाख',
    Jyeshtha: 'ज्येष्ठ',
    Ashadha: 'आषाढ़',
    Shravana: 'श्रावण',
    Bhadrapada: 'भाद्रपद',
    Ashwin: 'आश्विन',
    Kartika: 'कार्तिक',
    Margashirsha: 'मार्गशीर्ष',
    Pausha: 'पौष',
    Magha: 'माघ',
    Phalguna: 'फाल्गुन',
};

export const PAKSHA_HI: Record<string, string> = {
    Shukla: 'शुक्ल पक्ष',
    Krishna: 'कृष्ण पक्ष',
};

export const RITU_HI: Record<string, string> = {
    Vasant: 'वसंत',
    Grishma: 'ग्रीष्म',
    Varsha: 'वर्षा',
    Sharad: 'शरद',
    Hemanta: 'हेमंत',
    Shishira: 'शिशिर',
};

export const AYANA_HI: Record<string, string> = {
    Uttarayana: 'उत्तरायण',
    Dakshinayana: 'दक्षिणायन',
};

export const getTithiName = (idx: number) => (idx >= 1 && idx <= 30) ? TITHI_DATA[idx - 1].en : '—';
export const getTithiHindi = (idx: number) => (idx >= 1 && idx <= 30) ? TITHI_DATA[idx - 1].hi : '—';
export const getNakshatraName = (idx: number) => (idx >= 0 && idx < 27) ? NAKSHATRA_DATA[idx].en : '—';
export const getNakshatraHindi = (idx: number) => (idx >= 0 && idx < 27) ? NAKSHATRA_DATA[idx].hi : '—';
export const getYogaName = (idx: number) => (idx >= 1 && idx <= 27) ? YOGA_DATA[idx - 1].en : '—';
export const getYogaHindi = (idx: number) => (idx >= 1 && idx <= 27) ? YOGA_DATA[idx - 1].hi : '—';
export const getKaranaName = (name: string) => name || '—';
export const getKaranaHindi = (name: string) => KARANA_HI[name] || name || '—';
