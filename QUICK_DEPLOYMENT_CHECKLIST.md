# ⚡ Quick Deployment Checklist

Use this as a step-by-step guide during deployment. Check off each item as you complete it.

---

## Phase 1: Pre-Deployment (Before building)

### Code Verification
- [ ] All code committed: `git status` shows clean
- [ ] On main branch: `git branch | grep "*"`
- [ ] app.json has correct bundle IDs
  - iOS: `com.hinducalendar.app`
  - Android: `com.dineshruhela.hinducalendar`
- [ ] src/utils/ads.ts has production Ad Unit IDs (no XXXXXXX)
- [ ] app.json includes NSUserTrackingUsageDescription
- [ ] eas.json has correct ascAppId for iOS

### AdMob Setup
- [ ] AdMob account created
- [ ] iOS app registered in AdMob with bundle ID `com.hinducalendar.app`
- [ ] Android app registered in AdMob with package `com.dineshruhela.hinducalendar`
- [ ] Ad Units created:
  - [ ] Banner
  - [ ] Interstitial
  - [ ] App Open
  - [ ] (Optional) Rewarded
- [ ] Ad Unit IDs added to ads.ts

### App Store Connect Setup
- [ ] App created in App Store Connect
- [ ] Bundle ID matches: `com.hinducalendar.app`
- [ ] Version number set: 1.0 (or current)
- [ ] Category selected
- [ ] Screenshots uploaded

### Google Play Setup
- [ ] App created in Google Play Console
- [ ] Package name matches: `com.dineshruhela.hinducalendar`
- [ ] Store listing created with icon, screenshots, description

---

## Phase 2: Build (Building for app stores)

### iOS Build
```bash
cd /Users/dineshruhela/Work/HinduCalender
eas build --platform ios --profile production --non-interactive
```
- [ ] Command executed
- [ ] Build started (check console for build ID)
- [ ] Waiting for build completion (monitor with `eas build:list --limit 1`)
- [ ] Build finished successfully (status: "finished")
- [ ] .ipa artifact available

### Android Build
```bash
eas build --platform android --profile production --non-interactive
```
- [ ] Command executed
- [ ] Build started
- [ ] Waiting for completion
- [ ] Build finished successfully
- [ ] .aab artifact available

---

## Phase 3: iOS Submission

### Prepare Submission
- [ ] Go to App Store Connect
- [ ] Select app: The Hindu Calendar
- [ ] Go to App Store tab → Build section
- [ ] Latest build from EAS is visible

### Complete App Privacy
1. Click **App Privacy** → **Edit**
2. Answer questions about data collection:
   - [ ] **Identifiers** → Yes → Purpose: Advertising
   - [ ] **Usage Data** → Yes → Purpose: App Functionality, Analytics
   - [ ] **Diagnostics** → Yes
3. [ ] Click **Save**

### Complete Advertising Info
- [ ] App Store → **App Information**
- [ ] **Advertising Identifier (IDFA):**
  - [ ] ✅ Does your app use the IDFA? → Yes
  - [ ] ✅ Serve targeted advertising
  - [ ] Click **Save**

### Submit Build
**Option A: Using EAS**
```bash
eas submit --platform ios --latest --non-interactive
```
- [ ] Command executed
- [ ] Submission successful

**Option B: Manual Submission**
1. [ ] App Store Connect → Build section
2. [ ] Click **+** to add build
3. [ ] Select latest build from dropdown
4. [ ] Add release notes
5. [ ] Click **Save**
6. [ ] Click **Submit for Review** (top right)
7. [ ] Confirm submission

### Monitor Review
- [ ] Submission confirmed
- [ ] Check App Store Connect **Activity** tab daily
- [ ] Expected time: 24–48 hours
- [ ] **If rejected:** Note reasons, fix, increment build number, resubmit

---

## Phase 4: Android Submission

### Prepare Submission
- [ ] Go to Google Play Console
- [ ] Select app: The Hindu Calendar
- [ ] Go to **Release** → **Production**

### Complete Data Safety
1. Go to **Data safety** → Fill questionnaire
2. [ ] **Data collection:** Yes
3. [ ] **Data types:**
   - [ ] Identifiers (Ad ID)
   - [ ] Diagnostics
   - [ ] Usage Data
4. [ ] Purpose: Advertising
5. [ ] **Save**

### Create Release
1. [ ] Click **Create new release**
2. [ ] **Upload AAB file:**
   - Download `.aab` from EAS or `eas build:download --id [BUILD_ID]`
   - [ ] Upload .aab file
3. [ ] Add release notes
4. [ ] Click **Review and save**

### Submit for Review
1. [ ] Release created and saved
2. [ ] Click **Roll out to production**
3. [ ] Select 100% rollout
4. [ ] Click **Confirm rollout**
5. [ ] Monitor Console: Status changes from "In review" to "Live" (1–3 hours)

---

## Phase 5: Post-Launch (After apps are live)

### Verification (Day 1)
- [ ] iOS: Install from App Store on test device
- [ ] iOS: Verify no crashes, ads display
- [ ] Android: Install from Play Store on test device
- [ ] Android: Verify no crashes, ads display
- [ ] Test user tracking permission prompt (iOS should show ATT dialog)

### AdMob Monitoring (After 24 hours)
1. [ ] Go to AdMob Console
2. [ ] Check **Overview** dashboard:
   - [ ] Impressions: > 0
   - [ ] Clicks: > 0 (optional)
   - [ ] Estimated revenue: Any value indicates ads are working
3. [ ] Both iOS and Android apps show traffic

### App Store Verification
- [ ] iOS app appears in search (May take 24–48 hours)
- [ ] Android app appears in search
- [ ] Reviews/ratings starting to appear (normal to have 0 initially)
- [ ] Version 1.0 is the current version

### Revenue Setup
- [ ] AdMob: Verify payment method in **Payments**
- [ ] AdMob: Set up **PIN** for security
- [ ] Both app stores linked to Google Play/Apple accounts

---

## Phase 6: Optimization (Week 1+)

### Monitor Performance
- [ ] Daily check: AdMob impressions > 50/day
- [ ] Weekly check: AdMob revenue > $0
- [ ] Check app store reviews for ads-related complaints
- [ ] Monitor crash rates

### Ad Optimization (If impressions are low)
- [ ] Verify bundle IDs haven't changed
- [ ] Check that ad units IDs are correct in app
- [ ] Review AdMob **Mediation** → Add backup ad networks
- [ ] Consider gradual rollout strategy for Android

### Release Version 1.1 (After 1 week of stability)
- [ ] Mark version 1.0 as "stable"
- [ ] Plan next feature update
- [ ] Increment version to 1.1
- [ ] Rebuild with `eas build --platform all`

---

## Common Issues During Deployment

| Issue | Solution |
|-------|----------|
| Build fails: Credentials error | Run `eas whoami` → `eas login` if needed |
| App Store: Bundle ID mismatch | Verify app.json, rebuild with `--clear-cache` |
| Ads not showing (production) | Wait 24–48 hours, check AdMob console for app approval |
| Google Play: Policy violation | Review rejection email, fix ad placement, resubmit |
| iOS submission fails | Check Xcode build logs in EAS console |

---

## Support Commands

```bash
# Check current status
eas build:list --limit 3

# Download build artifact
eas build:download --id [BUILD_ID] --path ~/Desktop/app.ipa

# View build logs
eas build:view [BUILD_ID]

# Check if logged in
eas whoami

# Submit to stores (after builds are ready)
eas submit --platform all --latest

# Clean cache for fresh build
eas build --platform ios --clear-cache --profile production --non-interactive
```

---

**Estimated Timeline:**
- Pre-deployment setup: 1 hour
- Building: 30–60 minutes (both platforms)
- iOS submission: 24–48 hours to review
- Android submission: 1–3 hours to review
- **Total (first time):** 2–3 days from start to both apps live

---

**Next Step:** Follow Phase 1 checklist, then let me know when ready to build.
