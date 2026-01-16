# Deployment Guide

> **Version**: 2.0.0  
> **Last Updated**: January 2026

This guide covers the complete deployment process for EmeraldDrift to production environments.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Build Process](#build-process)
4. [Google Play Store](#google-play-store)
5. [Apple App Store](#apple-app-store)
6. [Web Deployment](#web-deployment)
7. [Environment Configuration](#environment-configuration)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Post-Deployment](#post-deployment)

---

## Overview

EmeraldDrift supports deployment to three platforms:

- **Android**: Google Play Store (AAB format)
- **iOS**: Apple App Store (IPA format)
- **Web**: Static hosting (Vercel, Netlify, etc.)

We use **EAS (Expo Application Services)** for building production binaries.

---

## Prerequisites

### Required Accounts

1. **Expo Account** (free)
   - Sign up at [expo.dev](https://expo.dev)
   - Used for EAS Build and EAS Submit

2. **Google Play Console** ($25 one-time fee)
   - Sign up at [play.google.com/console](https://play.google.com/console)
   - Required for Android distribution

3. **Apple Developer Program** ($99/year)
   - Enroll at [developer.apple.com](https://developer.apple.com)
   - Required for iOS distribution

### Development Tools

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login
```

### Project Setup

```bash
# Initialize EAS in your project (if not already done)
eas build:configure

# This creates eas.json configuration file
```

---

## Build Process

### Build Profiles

EAS builds are configured in `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "distribution": "store",
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "autoIncrement": true
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./secrets/google-play-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABC123DEF4"
      }
    }
  }
}
```

### Development Build

For testing with custom native code:

```bash
# Build for Android
eas build --profile development --platform android

# Build for iOS
eas build --profile development --platform ios
```

### Preview Build

For internal testing (APK format, no Play Store):

```bash
# Build APK for testing
eas build --profile preview --platform android

# Share the APK link with testers
```

### Production Build

For App Store submission:

```bash
# Build for Android (AAB)
eas build --profile production --platform android

# Build for iOS (IPA)
eas build --profile production --platform ios

# Build for both platforms
eas build --profile production --platform all
```

Build process takes 10-20 minutes. Monitor progress at [expo.dev/accounts/[account]/builds](https://expo.dev/accounts).

---

## Google Play Store

> 📱 **For comprehensive Android/Play Store submission guide, see [GOOGLE_PLAY_STORE.md](GOOGLE_PLAY_STORE.md)**

### Initial Setup

#### 1. Create App in Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Create app**
3. Fill in app details:
   - **App name**: Creator Studio Lite
   - **Default language**: English (US)
   - **App or game**: App
   - **Free or paid**: Free

#### 2. Configure Store Listing

**Main Store Listing** (required):
- App name: Creator Studio Lite
- Short description (80 chars): Multi-platform social media management for creators
- Full description (4000 chars): See template below
- App icon: 512x512 PNG (from `assets/images/`)
- Feature graphic: 1024x500 PNG
- Screenshots: 2-8 per device type (phone, tablet, TV, Wear OS)

**Description Template**:
```
Creator Studio Lite is your all-in-one solution for managing social media content across Instagram, TikTok, YouTube, LinkedIn, and Pinterest.

✨ KEY FEATURES:
• AI-powered content generation
• Multi-platform publishing
• Real-time analytics dashboard
• Smart scheduling with optimal timing
• Team collaboration tools
• Centralized media library

📊 ANALYTICS:
Track engagement metrics, growth rates, and performance across all your platforms in one beautiful dashboard.

🎨 CONTENT STUDIO:
Create, edit, and schedule content with our intuitive editor. Save time by publishing to multiple platforms simultaneously.

👥 TEAM COLLABORATION:
Invite team members with role-based permissions. Perfect for agencies, brands, and growing creator teams.

📱 SUPPORTED PLATFORMS:
• Instagram (Feed, Stories, Reels)
• TikTok
• YouTube
• LinkedIn
• Pinterest

Download now and streamline your social media workflow!
```

#### 3. Content Rating

Complete the content rating questionnaire:
- App category: Productivity
- Violence: None
- Sexual content: None
- Language: None
- Controlled substances: None
- Gambling: None
- User interaction: Yes (user-generated content)

#### 4. Data Safety

Required as of 2024. Complete the Data Safety form:

**Data Collection**:
- Personal info: Email, name
- Photos and videos: Media uploads
- App activity: Content created, platforms connected
- App info and performance: Crash logs, diagnostics

**Data Usage**:
- Account management
- App functionality
- Analytics

**Data Sharing**: No third-party sharing

**Security practices**:
- Data encrypted in transit (HTTPS)
- Data encrypted at rest (AsyncStorage)
- Users can request data deletion
- Committed to Google Play Families Policy

#### 5. App Access

If your app requires login:
- Provide demo account credentials
- Or describe how reviewers can access all features

**Demo Account** (for reviewers):
```
Email: reviewer@creatorstudio.app
Password: ReviewAccess2024!
```

#### 6. Privacy Policy

Upload privacy policy URL. Use hosted version of `docs/PRIVACY_POLICY.md`:
```
https://your-domain.com/privacy
```

Or use GitHub Pages:
```
https://krosebrook.github.io/EmeraldDrift/privacy
```

### Building for Google Play

#### Generate Upload Key

First build generates credentials automatically:

```bash
eas build --platform android --profile production
```

EAS handles keystore generation and management. Download credentials:

```bash
eas credentials
```

#### Build AAB

```bash
# Build app bundle for Play Store
eas build --platform android --profile production

# Wait for build to complete (10-20 mins)
# Download AAB from Expo dashboard or use:
eas build:download --platform android --latest
```

### Uploading to Play Console

#### Option 1: Manual Upload

1. Go to Play Console → **Production** → **Releases**
2. Click **Create new release**
3. Upload AAB file
4. Add release notes
5. Click **Save** then **Review release**
6. Click **Start rollout to Production**

#### Option 2: Automated Submission (Recommended)

Set up service account for EAS Submit:

1. **Create Service Account**:
   - Go to Play Console → **Setup** → **API access**
   - Click **Create new service account**
   - Follow instructions to create service account in Google Cloud Console
   - Grant **Service Account User** role

2. **Generate JSON Key**:
   - In Google Cloud Console, go to **Service Accounts**
   - Click on your service account → **Keys** → **Add Key** → **Create new key**
   - Choose **JSON** format
   - Save as `secrets/google-play-service-account.json`
   - **Never commit this file!**

3. **Configure Play Console Permissions**:
   - In Play Console → **Users and permissions**
   - Add service account email
   - Grant **Release to production** permission

4. **Submit via EAS**:
   ```bash
   eas submit --platform android --latest
   ```

### Release Tracks

Google Play supports multiple release tracks:

- **Internal testing**: Up to 100 testers, immediate availability
- **Closed testing**: Up to 100,000 testers, requires opt-in
- **Open testing**: Unlimited testers, anyone can join
- **Production**: Public release

**Recommended flow**:
1. Internal testing (1-2 days)
2. Closed testing (7-14 days, required by Google)
3. Production release

### Review Process

- **Initial review**: 1-3 days (can take up to 7 days)
- **Updates**: Few hours to 1 day
- Common rejection reasons:
  - Missing privacy policy
  - Incomplete content rating
  - Crashes or major bugs
  - Misleading screenshots or descriptions

---

## Apple App Store

> 📱 **For comprehensive iOS/App Store submission guide, see [APP_STORE_SUBMISSION.md](APP_STORE_SUBMISSION.md)**

### Initial Setup

#### 1. Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in app details:
   - **Platform**: iOS
   - **Name**: Creator Studio Lite
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: `com.creatorstudio.app` (must match `app.json`)
   - **SKU**: `creator-studio-lite`
   - **User Access**: Full Access

#### 2. Configure App Information

**General Information**:
- App name
- Subtitle (30 chars): "Social Media Management"
- Categories: 
  - Primary: Productivity
  - Secondary: Social Networking

**Privacy Policy URL**:
```
https://your-domain.com/privacy
```

**App Store Screenshots**:
- iPhone 6.7": 1290 x 2796 pixels (3 required, up to 10)
- iPhone 6.5": 1242 x 2688 pixels
- iPad Pro 12.9" (3rd gen): 2048 x 2732 pixels

**App Preview Videos** (optional but recommended):
- 30 seconds max
- Showcase key features

#### 3. App Privacy

Required as of iOS 14. Complete the App Privacy section:

**Data Collection**:
- Contact Info: Email address
- User Content: Photos, videos
- Usage Data: Product interaction
- Diagnostics: Crash data

**Purposes**:
- App functionality
- Analytics
- Product personalization

**Data Linked to User**: All collected data

**Tracking**: No (if not using ad networks)

#### 4. Age Rating

Complete the age rating questionnaire:
- Unrestricted Web Access: Yes (if allowing external links)
- Mature/Suggestive Themes: None
- Violence: None
- Result: 4+ (typically)

### Building for App Store

#### Configure Bundle Identifier

Ensure `app.json` has correct bundle ID:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.creatorstudio.app"
    }
  }
}
```

#### Build IPA

```bash
# Build for App Store
eas build --platform ios --profile production

# Wait for build to complete (15-25 mins)
```

You'll need to provide Apple credentials during first build:
- Apple ID
- App-specific password (generate at appleid.apple.com)
- Team ID

EAS handles:
- Provisioning profiles
- Code signing certificates
- Push notification certificates

### Submitting to App Store

#### Option 1: Manual Upload via Transporter

1. Download IPA from EAS dashboard
2. Open **Transporter** app (Mac)
3. Drag IPA file into Transporter
4. Click **Deliver**
5. Go to App Store Connect and submit for review

#### Option 2: Automated Submission (Recommended)

```bash
# Submit latest build
eas submit --platform ios --latest

# Or specify build ID
eas submit --platform ios --id [build-id]
```

### App Store Review

#### Prepare for Review

In App Store Connect:

1. **Version Information**:
   - What's New: Release notes (up to 4000 chars)
   - Promotional text: Optional feature highlight (170 chars)

2. **App Review Information**:
   - Contact information
   - Demo account (if required)
   - Notes for review: How to test features

3. **Version Release**:
   - Automatically release
   - Manually release
   - Schedule for specific date

#### Submit for Review

1. Complete all required fields
2. Click **Add for Review**
3. Click **Submit for Review**

#### Review Timeline

- **Initial submission**: 24-48 hours (can be longer)
- **Updates**: Usually faster, few hours to 1 day
- Status updates:
  - Waiting for Review
  - In Review
  - Pending Developer Release (approved)
  - Ready for Sale (live)

#### Common Rejection Reasons

- Crashes or bugs during review
- Missing or broken features
- Privacy policy issues
- Misleading screenshots/descriptions
- Using private APIs
- Incomplete account deletion flow

---

## Web Deployment

Build static website for web deployment:

```bash
# Build web bundle
npx expo export:web

# Output directory: web-build/
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Or use GitHub integration for automatic deployments
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=web-build

# Or drag & drop web-build/ folder in Netlify dashboard
```

### Deploy to GitHub Pages

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
"deploy:web": "expo export:web && gh-pages -d web-build"

# Deploy
npm run deploy:web
```

Configure `app.json` for GitHub Pages:

```json
{
  "expo": {
    "web": {
      "bundler": "metro"
    }
  }
}
```

---

## Environment Configuration

### Production Environment Variables

Create `.env.production`:

```env
# API Configuration
EXPO_PUBLIC_API_URL=https://api.creatorstudio.app
EXPO_PUBLIC_API_KEY=prod_key_here

# OpenAI
EXPO_PUBLIC_OPENAI_API_KEY=sk-prod-...

# Analytics
EXPO_PUBLIC_ANALYTICS_ID=G-PROD123456

# Feature Flags
EXPO_PUBLIC_ENABLE_AI_FEATURES=true
EXPO_PUBLIC_ENABLE_TEAM_FEATURES=true

# Environment
EXPO_PUBLIC_ENV=production
```

### Secrets Management

**Never commit secrets!** Use EAS Secrets:

```bash
# Set secret for EAS builds
eas secret:create --scope project --name OPENAI_API_KEY --value sk-...

# List secrets
eas secret:list

# Delete secret
eas secret:delete --name OPENAI_API_KEY
```

Access in code:

```typescript
const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
```

---

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
    tags:
      - 'v*'

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build Android
        run: eas build --platform android --profile production --non-interactive
      
      - name: Submit to Play Store
        run: eas submit --platform android --latest --non-interactive

  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build iOS
        run: eas build --platform ios --profile production --non-interactive
      
      - name: Submit to App Store
        run: eas submit --platform ios --latest --non-interactive

  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm ci
      - run: npx expo export:web
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./web-build
```

### Required Secrets

Add these to GitHub repository secrets:

- `EXPO_TOKEN`: Generate at expo.dev/settings/access-tokens
- `VERCEL_TOKEN`: Generate at vercel.com/account/tokens
- `VERCEL_ORG_ID`: From `.vercel/project.json`
- `VERCEL_PROJECT_ID`: From `.vercel/project.json`

---

## Post-Deployment

### Monitoring

**Crash Reporting**:
```bash
# View crashes in Expo dashboard
npx expo-cli diagnostics
```

**Analytics**:
- Set up Google Analytics or Mixpanel
- Monitor app metrics (DAU, MAU, retention)
- Track feature usage

### OTA Updates

For JavaScript-only changes (no native code):

```bash
# Publish update
eas update --branch production --message "Fix typo in dashboard"

# Users get update automatically next time they open app
```

### Rollback

If critical bug discovered:

```bash
# Rollback to previous update
eas update --branch production --message "Rollback" --republish
```

### Version Management

Follow semantic versioning:
- **Major**: Breaking changes (2.0.0)
- **Minor**: New features (1.1.0)
- **Patch**: Bug fixes (1.0.1)

Update in `app.json`:

```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    },
    "ios": {
      "buildNumber": "1.0.1"
    }
  }
}
```

---

## Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] No lint errors
- [ ] Updated version numbers
- [ ] Updated changelog
- [ ] Privacy policy up to date
- [ ] Environment variables configured
- [ ] Secrets secured
- [ ] Screenshots prepared
- [ ] Store listings complete

### Android Checklist

- [ ] Built AAB with EAS
- [ ] Tested on multiple devices
- [ ] Content rating complete
- [ ] Data safety form complete
- [ ] Privacy policy URL added
- [ ] Release notes written
- [ ] Submitted to appropriate track

### iOS Checklist

- [ ] Built IPA with EAS
- [ ] Tested on iPhone and iPad
- [ ] App privacy completed
- [ ] Screenshots uploaded
- [ ] Privacy policy URL added
- [ ] Release notes written
- [ ] Submitted for review

### Web Checklist

- [ ] Built static bundle
- [ ] Tested in all browsers
- [ ] PWA manifest configured
- [ ] Deployed to hosting
- [ ] SSL certificate active
- [ ] Domain configured

---

## Troubleshooting

### Build Failures

**Error: Keystore not found**
```bash
# Regenerate credentials
eas credentials
```

**Error: Bundle identifier mismatch**
- Ensure `app.json` bundle ID matches App Store Connect

**Error: Build timeout**
- Builds should complete in 20-30 minutes
- Contact Expo support if longer

### Submission Issues

**Google Play: API not enabled**
- Enable Google Play Android Developer API in Google Cloud Console

**App Store: Missing compliance**
- Complete Export Compliance in App Store Connect

**Both: Invalid binary**
- Rebuild with correct profile
- Check for native code changes requiring new build

---

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [App Store Connect Help](https://developer.apple.com/support/app-store-connect/)
- [Expo Application Services](https://expo.dev/eas)

---

*This deployment guide should be updated with each major release.*
