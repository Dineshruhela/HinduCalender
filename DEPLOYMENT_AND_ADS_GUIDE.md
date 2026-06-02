# 🎯 Complete Guide: AdMob Setup, Production Builds & Deployment

**For: The Hindu Calendar App**  
**Last Updated:** June 2026  
**Target:** iOS + Android production releases with monetized ads

---

## Table of Contents
1. [AdMob Setup (Complete)](#1-admob-setup-complete)
2. [App Configuration](#2-app-configuration)
3. [Production Build Process](#3-production-build-process)
4. [App Store Connect Submission (iOS)](#4-app-store-connect-submission-ios)
5. [Google Play Console Submission (Android)](#5-google-play-console-submission-android)
6. [Post-Launch Monitoring](#6-post-launch-monitoring)
7. [Troubleshooting](#7-troubleshooting)
8. [Checklist](#8-final-deployment-checklist)

---

## 1. AdMob Setup (Complete)

### 1.1 Create AdMob Account
1. Go to [AdMob Console](https://admob.google.com)
2. Sign in with your Google account
3. Click **Get Started** → Accept terms
4. Fill in business details (your name/developer name)

### 1.2 Register Your Apps

**For iOS:**
1. Click **Apps** → **Add App**
2. Select platform: **iOS**
3. Name: "The Hindu Calendar - iOS"
4. Bundle ID: `com.hinducalendar.app`
5. Click **Create**
6. Note your **App ID**: `ca-app-pub-XXXXXXXX~YYYYYYYY` (you already have this)

**For Android:**
1. Repeat for Android
2. Platform: **Android**
3. Package name: `com.dineshruhela.hinducalendar`
4. Name: "The Hindu Calendar - Android"
5. Note your **App ID**

### 1.3 Create Ad Units (Ad placements)

**Banner Ads (Both platforms):**
1. In your app → **Ad units** → **Create banner ad unit**
2. Name: "Home Screen Banner"
3. Size: Adaptive (recommended)
4. Get the **Ad Unit ID** (copy for code)

**Interstitial Ads (Full-screen, shown between screens):**
1. **Create interstitial ad unit**
2. Name: "Screen Transitions"
3. Get the **Ad Unit ID**

**App Open Ads (Shown when user opens app):**
1. **Create app open ad unit**
2. Name: "App Launch"
3. Get the **Ad Unit ID**

**Rewarded Ads (Optional - user watches ad for reward):**
1. **Create rewarded ad unit**
2. Name: "Festival Info Unlock"
3. Get the **Ad Unit ID**

### 1.4 Update Your App Code

Location: `src/utils/ads.ts`

```typescript
// ── Real Ad Unit IDs (Production) ──────────────────────
const REAL_IDS = {
    ios: {
        banner: 'ca-app-pub-2203210311587761/7958955725',           // Your iOS banner
        interstitial: 'ca-app-pub-2203210311587761/2896748034',     // Your iOS interstitial
        rewarded: 'ca-app-pub-2203210311587761/XXXXXXXXXX',         // Your iOS rewarded (if created)
        appOpen: 'ca-app-pub-2203210311587761/5230160119',          // Your iOS app open
    },
    android: {
        banner: 'ca-app-pub-2203210311587761/8478375645',           // Your Android banner
        interstitial: 'ca-app-pub-2203210311587761/8995252521',     // Your Android interstitial
        rewarded: 'ca-app-pub-2203210311587761/XXXXXXXXXX',         // Your Android rewarded
        appOpen: 'ca-app-pub-2203210311587761/6004255545',          // Your Android app open
    },
};
```

### 1.5 App Store Registration

**In App Store Connect:**
1. Your app → **App Information** → **Advertising Identifier**
2. Enable: ✅ **Does your app use the Advertising Identifier (IDFA)?**
3. Reasons: ✅ **Serve targeted advertising**

**In Google Play Console:**
1. Your app → **Setup** → **App content** → **Ads**
2. Select: ✅ **App contains ads**

---

## 2. App Configuration

### 2.1 app.json Configuration (Already Set)

```json
{
  "ios": {
    "bundleIdentifier": "com.hinducalendar.app",
    "config": {
      "googleMobileAdsAppId": "ca-app-pub-2203210311587761~8223154964"
    },
    "infoPlist": {
      "ITSAppUsesNonExemptEncryption": false,
      "NSUserTrackingUsageDescription": "This identifier is used to deliver more relevant ads and keep The Hindu Calendar free."
    }
  },
  "android": {
    "package": "com.dineshruhela.hinducalendar",
    "config": {
      "googleMobileAdsAppId": "ca-app-pub-2203210311587761~4550738920"
    }
  }
}
```

### 2.2 eas.json Configuration

```json
{
  "build": {
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "6745056498"  // Replace with YOUR app ID from App Store Connect
      },
      "android": {}
    }
  }
}
```

---

## 3. Production Build Process

### 3.1 Pre-Build Checklist

**Before building, verify:**
```bash
# 1. Check that you're on main branch with all changes committed
git status

# 2. Verify app.json has correct bundle IDs
grep -E "bundleIdentifier|package" app.json

# 3. Verify ads.ts has production Ad Unit IDs (no XXXXXXX)
grep -E "banner|interstitial|appOpen" src/utils/ads.ts
```

### 3.2 Build for iOS

```bash
# Clean build (recommended for first production build)
eas build --platform ios --profile production --clear-cache --non-interactive

# Standard build (faster for subsequent builds)
eas build --platform ios --profile production --non-interactive
```

**What happens:**
- Version increments automatically (buildNumber goes 5→6, 6→7, etc.)
- iOS certificate is provisioned for `com.hinducalendar.app`
- `.ipa` file is created and uploaded to EAS
- Build logs available at: `https://expo.dev/accounts/dineshruhela/projects/HinduCalender/builds/[BUILD_ID]`

**Monitor build:**
```bash
# Check status
eas build:list --limit 1 --platform ios

# Download .ipa manually (if needed)
eas build:download --id [BUILD_ID]
```

### 3.3 Build for Android

```bash
# Standard build
eas build --platform android --profile production --non-interactive

# This creates an `.aab` (Android App Bundle) file
```

**What happens:**
- Version increments automatically (versionCode goes 6→7, 7→8, etc.)
- Signed with your keystore credentials from `credentials.json`
- `.aab` file is created (ready for Play Console)

### 3.4 Build Both Platforms Simultaneously

```bash
# Queue both builds at once
eas build --platform all --profile production --non-interactive

# Monitor both
eas build:list --limit 2
```

---

## 4. App Store Connect Submission (iOS)

### 4.1 Prepare App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app: **The Hindu Calendar**
3. Go to **App Store** tab

### 4.2 Complete App Privacy (Required)

**Path:** App Store → **App Privacy**

1. Click **Edit**
2. Answer privacy questions (you collected data via AdMob):
   - **Identifiers** → Yes → Purpose: Advertising
   - **Usage Data** → Yes → Purpose: App Functionality, Analytics
   - **Diagnostics** → Yes (if AdMob collects)
3. Save

### 4.3 Complete App Information

**Path:** App Store → **App Information**

1. **Ratings Image:** Upload app screenshot
2. **Content Rights:** 
   - ✅ I have the right to use all material
3. **Category:** Utilities or Lifestyle
4. **Advertising Identifier (IDFA):**
   - ✅ Does your app use the IDFA? → Yes
   - ✅ Serve targeted advertising
   - Save

### 4.4 Add Pricing & Availability

**Path:** App Store → **Pricing & Availability**

1. **Price:** Free
2. **Availability:**
   - Select countries/regions where you want the app
3. Save

### 4.5 Submit Build for Review

**Method A: Via `eas submit` (Recommended)**

```bash
# First, configure ascAppId in eas.json
# Then submit
eas submit --platform ios --latest --non-interactive
```

**Method B: Manual via App Store Connect**

1. Go to App Store → **Build** section
2. Click **+** next to "Build"
3. Select your latest build (from EAS)
4. Add release notes: "Initial release with daily Panchang, Rashifal, and festivals"
5. Click **Save**
6. Click **Submit for Review** (top right)
7. Answer compliance questions
8. Confirm submission

### 4.6 App Store Review Process

- **Typical time:** 24–48 hours
- **Status tracking:** Notifications tab in App Store Connect
- **Possible outcomes:**
  - ✅ **Approved** → App appears on App Store
  - ⚠️ **Rejected** → Review rejection reason with instructions to fix
  - 🔄 **Needs more information** → Answer specific questions
- **If rejected:** Fix issues, bump build number, resubmit

---

## 5. Google Play Console Submission (Android)

### 5.1 Prepare Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Select **The Hindu Calendar** project

### 5.2 Complete App Content

**Path:** Setup → **App content**

1. **Target audience:**
   - Select: Not a game, Suitable for all ages
2. **Content rating:**
   - Fill in the IARC questionnaire (2 min)
   - Questions about content (violence, profanity, etc.)
3. **Ads:**
   - ✅ App contains ads
4. **Permissions:** Review and confirm
5. **Save**

### 5.3 Complete App Privacy

**Path:** Data safety → **Fill out the questionnaire**

1. **Data collection:**
   - ✅ Collects data
2. **Types of data:**
   - ✅ **Identifiers** (Ad ID)
   - ✅ **Diagnostics** (if collected)
   - ✅ **Usage Data** (analytics)
3. **Purpose:**
   - ✅ Advertising
   - ✅ App functionality
4. **Save**

### 5.4 Create Release

**Path:** Release → **Production**

1. Click **Create new release**
2. **Add App Bundle (.aab file):**
   - Download from EAS: [Check build artifacts](https://expo.dev)
   - Upload the `.aab` file
3. **Release notes:** "Initial release with daily Panchang, Rashifal, and festivals"
4. **Review and save**

### 5.5 Set Price & Distribution

**Path:** Pricing & distribution**

1. **Price:** Free
2. **Countries/regions:** Select where you want distribution
3. **Content rating:** Already set (from App Content)
4. **Save**

### 5.6 Submit for Review

1. In your release, click **Review and roll out → Rollout to production**
2. Select: **Roll out to 100%** (or gradual rollout)
3. Confirm submission
4. Click **Confirm rollout**

### 5.7 Google Play Review Process

- **Typical time:** 1–3 hours (usually faster than iOS)
- **Status:** Visible in Console under Release status
- **Possible outcomes:**
  - ✅ **Live** → App on Play Store
  - ❌ **Rejected** → Review policy violation with fix instructions
  - 🔄 **Needs information** → Answer specific questions
- **If rejected:** Fix, increment versionCode, resubmit

---

## 6. Post-Launch Monitoring

### 6.1 AdMob Performance Tracking

**After apps go live (24–48 hours):**

1. [AdMob Console](https://admob.google.com) → **Overview**
2. Monitor:
   - **Impressions:** Ads shown to users
   - **Clicks:** Users tap ads
   - **Revenue:** Estimated earnings
   - **Fill rate:** % of ad requests fulfilled

**Expect:**
- **Day 1–3:** Low activity (early users)
- **Week 1–2:** Ramping up as more users install
- **Month 1:** ~50–200 impressions/day for new apps

### 6.2 Ad Optimization

**If revenue is low:**
1. Check AdMob **Mediation** → add more ad networks (AdSense, Meta, Inmobi)
2. Verify users aren't blocking ads (check Privacy settings)
3. Ensure ad placements are visible (not below fold)

**If impressions are low:**
1. Check app install numbers on app stores
2. Verify ads are loading (check logcat: `grep -i "admob" logcat`)
3. Ensure your bundle ID matches AdMob registration

### 6.3 Crash Monitoring

**Set up Sentry (error tracking):** *(Optional but recommended)*

```bash
npm install @sentry/react-native
```

In `app.json`:
```json
{
  "plugins": ["@sentry/react-native/expo"]
}
```

---

## 7. Troubleshooting

### Issue: "Bundle ID mismatch" in AdMob

**Symptom:** Ads not serving, AdMob console shows no traffic

**Fix:**
1. Verify `app.json` → `ios.bundleIdentifier` matches AdMob registration
2. Verify `eas.json` uses correct bundle ID
3. Rebuild: `eas build --platform ios --profile production --clear-cache`

### Issue: Ads not showing in production build

**Symptom:** Test ads showed fine, but production ads are blank

**Causes & fixes:**
1. **Ad Unit ID is wrong:**
   - Verify `ads.ts` has correct production Ad Unit IDs (not test IDs)
   - Rebuild and resubmit

2. **New app has no ads initially:**
   - AdMob takes 24–48 hours to serve ads for new apps
   - Click "Check now" in AdMob console

3. **User denied tracking permission:**
   - Show non-personalized ads (handled in code)
   - Fill rate may be lower

4. **Ad network quota exceeded:**
   - Apps get free quota; check AdMob → Quota status
   - Add more ad networks via Mediation

### Issue: Build fails with "Credentials not found"

**Symptom:** `eas build` fails with credential errors

**Fix:**
1. Verify you're logged into EAS:
   ```bash
   eas whoami
   ```
2. If not, log in:
   ```bash
   eas login
   ```
3. Rebuild

### Issue: App Store Connect submission fails with "Invalid bundle"

**Symptom:** Error during `eas submit` or manual upload

**Fix:**
1. Verify bundle ID in `app.json` matches App Store Connect
2. Rebuild with clear cache:
   ```bash
   eas build --platform ios --profile production --clear-cache
   ```
3. Try submitting again

### Issue: Google Play Console shows "Policy violation"

**Symptom:** Android app rejected for ads-related reasons

**Common causes:**
- Ads over-aggressive (showing too frequently)
- Ad placement interferes with app functionality
- Misleading ad claims

**Fix:**
1. Review Play Console rejection details
2. Adjust ad placement in code
3. Resubmit with higher versionCode

---

## 8. Final Deployment Checklist

### Pre-Build
- [ ] `app.json` has correct bundle IDs (`com.hinducalendar.app` for iOS, `com.dineshruhela.hinducalendar` for Android)
- [ ] `ads.ts` has production Ad Unit IDs (no XXXXXXX placeholders)
- [ ] `eas.json` has correct `ascAppId` for iOS
- [ ] Git: All changes committed, on `main` branch
- [ ] Run `git status` → should show clean working directory

### Build
- [ ] iOS: Run `eas build --platform ios --profile production --non-interactive`
- [ ] Android: Run `eas build --platform android --profile production --non-interactive`
- [ ] Monitor builds: `eas build:list --limit 2`
- [ ] Wait for both to finish (iOS ~30 min, Android ~20 min)

### iOS Submission
- [ ] App Store Connect: Complete App Privacy questionnaire
- [ ] App Store Connect: Set rating, category, pricing
- [ ] App Store Connect: Add screenshots, description
- [ ] Submit via `eas submit --platform ios --latest` OR manually
- [ ] Wait for review (24–48 hours)
- [ ] Monitor notifications in App Store Connect

### Android Submission
- [ ] Google Play Console: Complete App Content
- [ ] Google Play Console: Complete Data Safety form
- [ ] Google Play Console: Add release notes
- [ ] Google Play Console: Create release with `.aab` file
- [ ] Submit for review
- [ ] Wait for approval (1–3 hours typically)

### Post-Launch
- [ ] App Store: Verify app is live, can install on device
- [ ] Google Play: Verify app is live, can install on device
- [ ] AdMob: Monitor impressions, clicks, revenue after 24 hours
- [ ] Verify ads display in production app
- [ ] Test user privacy settings (disable tracking, verify non-personalized ads work)

---

## Key Contacts & Resources

| Resource | URL |
|----------|-----|
| AdMob Console | https://admob.google.com |
| App Store Connect | https://appstoreconnect.apple.com |
| Google Play Console | https://play.google.com/console |
| EAS Build Docs | https://docs.expo.dev/eas-update/introduction |
| App Store Review Guidelines | https://developer.apple.com/app-store/review/guidelines |
| Google Play Policies | https://play.google.com/about/developer-content-policy |

---

## Support

**If you encounter issues:**
1. Check [Troubleshooting](#7-troubleshooting) section above
2. Review EAS build logs: `eas build:list` → click build ID
3. Email: dinesh.jony@gmail.com (your support contact in app stores)

**Emergency contacts:**
- **Apple:** developer.apple.com/contact
- **Google Play:** support.google.com/googleplay
- **EAS/Expo:** support.expo.dev

---

**Last Updated:** June 2026  
**Next Review:** When releasing version 1.1.0
