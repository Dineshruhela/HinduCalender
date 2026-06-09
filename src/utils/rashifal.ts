// Dynamic predictions mapping utility

export interface RashiDetails {
  index: number;
  nameHi: string;
  nameEn: string;
  symbol: string;
  rulerHi: string;
  rulerEn: string;
  elementHi: string;
  elementEn: string;
}

export interface RashifalPrediction {
  rashi: RashiDetails;
  healthRating: number;
  wealthRating: number;
  loveRating: number;
  luckRating: number;
  forecastHi: string;
  forecastEn: string;
  remedyHi: string;
  remedyEn: string;
}

export const RASHI_LIST: RashiDetails[] = [
  { index: 0, nameHi: 'मेष', nameEn: 'Aries', symbol: '♈', rulerHi: 'मंगल', rulerEn: 'Mars', elementHi: 'अग्नि', elementEn: 'Fire' },
  { index: 1, nameHi: 'वृषभ', nameEn: 'Taurus', symbol: '♉', rulerHi: 'शुक्र', rulerEn: 'Venus', elementHi: 'पृथ्वी', elementEn: 'Earth' },
  { index: 2, nameHi: 'मिथुन', nameEn: 'Gemini', symbol: '♊', rulerHi: 'बुध', rulerEn: 'Mercury', elementHi: 'वायु', elementEn: 'Air' },
  { index: 3, nameHi: 'कर्क', nameEn: 'Cancer', symbol: '♋', rulerHi: 'चन्द्र', rulerEn: 'Moon', elementHi: 'जल', elementEn: 'Water' },
  { index: 4, nameHi: 'सिंह', nameEn: 'Leo', symbol: '♌', rulerHi: 'सूर्य', rulerEn: 'Sun', elementHi: 'अग्नि', elementEn: 'Fire' },
  { index: 5, nameHi: 'कन्या', nameEn: 'Virgo', symbol: '♍', rulerHi: 'बुध', rulerEn: 'Mercury', elementHi: 'पृथ्वी', elementEn: 'Earth' },
  { index: 6, nameHi: 'तुला', nameEn: 'Libra', symbol: '♎', rulerHi: 'शुक्र', rulerEn: 'Venus', elementHi: 'वायु', elementEn: 'Air' },
  { index: 7, nameHi: 'वृश्चिक', nameEn: 'Scorpio', symbol: '♏', rulerHi: 'मंगल', rulerEn: 'Mars', elementHi: 'जल', elementEn: 'Water' },
  { index: 8, nameHi: 'धनु', nameEn: 'Sagittarius', symbol: '♐', rulerHi: 'गुरु', rulerEn: 'Jupiter', elementHi: 'अग्नि', elementEn: 'Fire' },
  { index: 9, nameHi: 'मकर', nameEn: 'Capricorn', symbol: '♑', rulerHi: 'शनि', rulerEn: 'Saturn', elementHi: 'पृथ्वी', elementEn: 'Earth' },
  { index: 10, nameHi: 'कुंभ', nameEn: 'Aquarius', symbol: '♒', rulerHi: 'शनि', rulerEn: 'Saturn', elementHi: 'वायु', elementEn: 'Air' },
  { index: 11, nameHi: 'मीन', nameEn: 'Pisces', symbol: '♓', rulerHi: 'गुरु', rulerEn: 'Jupiter', elementHi: 'जल', elementEn: 'Water' },
];

// Mappings for dynamic predictions based on Rashi index and Weekday index (0=Sun, 1=Mon, ..., 6=Sat)
const HEALTH_PREDICTIONS: { hi: string; en: string }[] = [
  { hi: 'आज स्वास्थ्य सामान्य रहेगा, संतुलित खान-पान और योग को अपनी दिनचर्या में शामिल करें।', en: 'Health remains moderate today. Incorporate balanced meals and yoga into your daily routine.' },
  { hi: 'आज आप अत्यधिक ऊर्जा और सकारात्मकता का अनुभव करेंगे। शारीरिक व्यायाम के लिए बेहतरीन दिन है।', en: 'You will feel highly energetic and positive today. A perfect day for physical exercise.' },
  { hi: 'स्वास्थ्य को लेकर थोड़ा सावधान रहें। मौसमी बीमारियां या मानसिक तनाव आपको प्रभावित कर सकते हैं।', en: 'Take care of your health today. Seasonal cold or minor mental fatigue may cause discomfort.' },
  { hi: 'आज तंदुरुस्ती में सुधार होगा। पुरानी शारीरिक तकलीफों से राहत मिलने के संकेत हैं।', en: 'Health shows significant recovery. You will find relief from long-standing physical ailments.' },
];

const WEALTH_PREDICTIONS: { hi: string; en: string }[] = [
  { hi: 'आर्थिक रूप से आज का दिन शुभ है। अचानक धन लाभ या रुके हुए धन की प्राप्ति संभव है।', en: 'Financially, today is very auspicious. Unexpected monetary gains or recovery of pending dues is likely.' },
  { hi: 'निवेश के लिहाज से दिन सामान्य है। बड़े निवेश या पैसों के लेनदेन में जल्दबाजी न करें।', en: 'A moderate day for investments. Avoid making hasty financial decisions or lending money.' },
  { hi: 'व्यापार में लाभ के योग हैं। नए व्यावसायिक अनुबंध होने से भविष्य में आर्थिक उन्नति होगी।', en: 'Profits are indicated in business. New professional alliances will bring long-term prosperity.' },
  { hi: 'खर्चों में बढ़ोतरी हो सकती है। गैर-जरूरी विलासिता की वस्तुओं पर नियंत्रण रखना श्रेयस्कर होगा।', en: 'Expenses may rise today. It is highly recommended to control impulsive spending on luxury items.' },
];

const LOVE_PREDICTIONS: { hi: string; en: string }[] = [
  { hi: 'पारिवारिक जीवन सुखद रहेगा। जीवनसाथी के साथ सामंजस्य बढ़ेगा और साथ बिताने का मौका मिलेगा।', en: 'Family life remains harmonious. Understanding with your spouse will deepen with quality time spent together.' },
  { hi: 'वाणी पर नियंत्रण रखें। प्रियजन के साथ वैचारिक मतभेद होने की संभावना है, धैर्य बनाए रखें।', en: 'Watch your words today. Minor disagreements with loved ones are possible; maintain patience.' },
  { hi: 'प्रेम संबंधों में मधुरता आएगी। अविवाहित जातकों के लिए नए रिश्ते की बात आगे बढ़ सकती है।', en: 'Romantic relationships flourish today. Unmarried individuals might receive promising matrimonial proposals.' },
  { hi: 'आज मित्रों और परिजनों का पूर्ण सहयोग प्राप्त होगा। सामाजिक मेलजोल में खुशी महसूस करेंगे।', en: 'Full support from friends and relatives is indicated. Social interactions will bring joy and peace.' },
];

const LUCK_PREDICTIONS: { hi: string; en: string }[] = [
  { hi: 'भाग्य का भरपूर साथ मिलेगा। आज आपके सोचे हुए कार्य बिना बाधा के पूरे हो सकते हैं।', en: 'Luck is strongly in your favor today. Your planned endeavors will be completed without any obstacles.' },
  { hi: 'परिश्रम से ही सफलता मिलेगी। दूसरों के भाग्य पर निर्भर रहने के बजाय स्वयं के प्रयासों पर भरोसा करें।', en: 'Success comes through hard work today. Rely on your own efforts rather than depending on luck.' },
  { hi: 'आज का दिन मिलाजुला रहेगा। दिन के उत्तरार्ध में कोई शुभ समाचार प्राप्त होने से भाग्य उदय होगा।', en: 'A mixed bag of opportunities today. A positive piece of news in the evening will boost your luck.' },
  { hi: 'अध्यात्म की ओर झुकाव बढ़ेगा। धार्मिक कार्यों या पूजा-पाठ में भाग लेने से भाग्य में वृद्धि होगी।', en: 'Spiritual inclination increases. Participating in religious activities or prayers will unlock new opportunities.' },
];

const REMEDIES: { hi: string; en: string }[] = [
  { hi: 'सूर्योदय के समय तांबे के लोटे से सूर्य देव को जल अर्पित करें और गायत्री मंत्र का जाप करें।', en: 'Offer water to Lord Surya in a copper vessel at sunrise and chant the Gayatri Mantra.' },
  { hi: 'शिवलिंग पर कच्चा दूध और जल चढ़ाएं। "ॐ नमः शिवाय" का 108 बार जाप करें।', en: 'Offer raw milk and water on Shiva Lingam. Chant "Om Namah Shivaya" 108 times.' },
  { hi: 'गाय को हरी घास खिलाएं और किसी जरूरतमंद व्यक्ति को अन्न दान करें।', en: 'Feed fresh green grass to a cow and donate grain to someone in need.' },
  { hi: 'हनुमान चालीसा का पाठ करें और हनुमान जी को लाल सिंदूर अर्पित करें।', en: 'Recite Hanuman Chalisa and offer red vermillion to Lord Hanuman.' },
  { hi: 'विष्णु सहस्रनाम का पाठ करें और मस्तक पर पीले चंदन का तिलक लगाएं।', en: 'Recite Vishnu Sahasranama and apply a yellow sandalwood tilak on your forehead.' },
  { hi: 'सफेद वस्तुओं जैसे कपूर, दूध या दही का दान किसी मंदिर में करें।', en: 'Donate white items like camphor, milk, or yogurt to a temple.' },
  { hi: 'शनि देव के मंदिर में सरसों के तेल का दीपक जलाएं और "ॐ शं शनैश्चराय नमः" का जाप करें।', en: 'Light a mustard oil lamp at a Shani temple and chant "Om Sham Shanaishcharaya Namah".' },
];

export function getDailyRashifal(rashiIdx: number, date: Date = new Date()): RashifalPrediction {
  const rashi = RASHI_LIST[rashiIdx] || RASHI_LIST[0];
  
  // Dynamic seeds based on date to ensure deterministic but changing daily horoscopes
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const weekday = date.getDay(); // 0 = Sunday, 1 = Monday, ...
  
  // Deterministic index generators
  const healthSeed = (rashiIdx + day + month) % HEALTH_PREDICTIONS.length;
  const wealthSeed = (rashiIdx * 2 + day + weekday) % WEALTH_PREDICTIONS.length;
  const loveSeed = (rashiIdx + month + weekday * 3) % LOVE_PREDICTIONS.length;
  const luckSeed = (rashiIdx * 3 + day + year) % LUCK_PREDICTIONS.length;
  const remedySeed = (rashiIdx + weekday) % REMEDIES.length;

  // Star ratings out of 5 based on seeds (2–5 range for realistic but not overly negative forecasts)
  const healthRating = 2 + ((rashiIdx + day + month) % 4);
  const wealthRating = 2 + ((rashiIdx * 2 + day + weekday) % 4);
  const loveRating = 2 + ((rashiIdx + month + weekday * 2) % 4);
  const luckRating = 2 + ((rashiIdx * 3 + day + weekday + month) % 4);

  const healthPred = HEALTH_PREDICTIONS[healthSeed];
  const wealthPred = WEALTH_PREDICTIONS[wealthSeed];
  const lovePred = LOVE_PREDICTIONS[loveSeed];
  const luckPred = LUCK_PREDICTIONS[luckSeed];
  const remedy = REMEDIES[remedySeed];

  // Compound localized paragraphs
  const forecastHi = `${healthPred.hi} ${wealthPred.hi} ${lovePred.hi} ${luckPred.hi}`;
  const forecastEn = `${healthPred.en} ${wealthPred.en} ${lovePred.en} ${luckPred.en}`;

  return {
    rashi,
    healthRating,
    wealthRating,
    loveRating,
    luckRating,
    forecastHi,
    forecastEn,
    remedyHi: remedy.hi,
    remedyEn: remedy.en,
  };
}
