# Android Configuration Guide

> **Version**: 2.0.0  
> **Last Updated**: January 2026  
> **Framework**: Expo React Native

Complete guide for configuring Android-specific features, native modules, and build settings for Creator Studio Lite.

## Table of Contents

1. [Overview](#overview)
2. [Android Project Structure](#android-project-structure)
3. [Build Configuration](#build-configuration)
4. [Permissions](#permissions)
5. [App Manifest](#app-manifest)
6. [Native Modules](#native-modules)
7. [Push Notifications](#push-notifications)
8. [Deep Linking](#deep-linking)
9. [Performance Optimization](#performance-optimization)
10. [Debugging](#debugging)

---

## Overview

### Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | Expo SDK 54+ |
| Build Tool | EAS Build |
| Target SDK | API 35 (Android 15) |
| Min SDK | API 24 (Android 7.0) |
| Language | JavaScript/TypeScript |
| Native Bridge | React Native |

### Key Android Features

- **Adaptive Icons**: Monochrome, foreground, background layers
- **Edge-to-Edge**: Full-screen experience
- **Predictive Back**: Enhanced navigation
- **Permissions**: Runtime permission handling
- **Notifications**: Local and push notifications
- **Deep Links**: Universal app links

---

## Android Project Structure

### Expo Managed Workflow

With Expo, Android configuration is managed through `app.json`:

```
EmeraldDrift/
├── app.json                    # Expo configuration
├── eas.json                    # EAS Build configuration
├── assets/
│   └── images/
│       ├── icon.png            # App icon (1024x1024)
│       ├── splash-icon.png     # Splash screen icon
│       ├── android-icon-foreground.png
│       ├── android-icon-background.png
│       └── android-icon-monochrome.png
└── android/                    # (Only if ejected)
    ├── app/
    │   ├── build.gradle
    │   └── src/
    └── build.gradle
```

### Native Android (If Ejected)

If you eject to bare workflow:

```
android/
├── app/
│   ├── build.gradle           # App-level Gradle config
│   ├── proguard-rules.pro     # Code obfuscation rules
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml
│           ├── java/           # Java/Kotlin code
│           └── res/            # Resources
│               ├── mipmap/     # App icons
│               ├── values/     # Strings, colors
│               └── xml/        # Configs
├── build.gradle               # Project-level Gradle
├── gradle.properties          # Build properties
└── settings.gradle            # Project settings
```

---

## Build Configuration

### app.json Configuration

Complete Android section configuration:

```json
{
  "expo": {
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundColor": "#8B5CF6",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "package": "com.creatorstudio.app",
      "versionCode": 1,
      "targetSdkVersion": "35",
      "minSdkVersion": "24",
      "permissions": [
        "CAMERA",
        "READ_MEDIA_IMAGES",
        "READ_MEDIA_VIDEO",
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "VIBRATE",
        "RECEIVE_BOOT_COMPLETED",
        "POST_NOTIFICATIONS"
      ],
      "blockedPermissions": [
        "RECORD_AUDIO"
      ],
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false,
      "enableProguardInReleaseBuilds": true,
      "enableHermes": true,
      "softwareKeyboardLayoutMode": "pan",
      "allowBackup": true,
      "userInterfaceStyle": "automatic",
      "playStoreUrl": "https://play.google.com/store/apps/details?id=com.creatorstudio.app",
      "googleServicesFile": "./google-services.json",
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    }
  }
}
```

### Adaptive Icon Assets

**Requirements for Android 13+**:

#### Foreground Image
- Size: 1024x1024px
- Safe area: 432x432px circle in center
- Format: PNG with transparency
- Content: Logo or app icon

#### Background Image (Optional)
- Size: 1024x1024px
- Format: PNG without transparency
- Or use solid color: `"backgroundColor": "#8B5CF6"`

#### Monochrome Image (Android 13+)
- Size: 1024x1024px
- Format: PNG with transparency
- Color: Single color (white or black)
- Purpose: Themed icons in Android 13+

**Creating Assets**:

```bash
# Using Figma or design tool:
1. Create 1024x1024px artboard
2. Place logo in 432x432px safe area (center)
3. Export as PNG

# Or use Expo Asset Utils
npx expo-asset-utils
```

### Version Management

**Version Code** (Integer, auto-increments):
```json
{
  "android": {
    "versionCode": 1  // Increments: 1, 2, 3, 4...
  }
}
```

**Version Name** (String, semantic versioning):
```json
{
  "version": "2.0.0"  // Format: MAJOR.MINOR.PATCH
}
```

**Auto-Increment in EAS**:
```json
// eas.json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## Permissions

### Runtime Permissions (Android 6.0+)

All dangerous permissions require runtime request:

**Camera Permission**:
```typescript
import * as ImagePicker from 'expo-image-picker';

async function requestCameraPermission() {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Camera access is needed to capture photos for your content.',
      [{ text: 'OK' }]
    );
    return false;
  }
  
  return true;
}
```

**Media Library Permission**:
```typescript
async function requestMediaPermission() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (status !== 'granted') {
    Alert.alert(
      'Permission Required',
      'Photo library access is needed to select media for your posts.'
    );
    return false;
  }
  
  return true;
}
```

**Notification Permission (Android 13+)**:
```typescript
import * as Notifications from 'expo-notifications';

async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  
  if (status !== 'granted') {
    Alert.alert(
      'Notifications Disabled',
      'Enable notifications to receive reminders for scheduled posts.'
    );
    return false;
  }
  
  return true;
}
```

### Permission Declaration

**In app.json**:
```json
{
  "android": {
    "permissions": [
      "CAMERA",                    // Take photos/videos
      "READ_MEDIA_IMAGES",         // Access images (Android 13+)
      "READ_MEDIA_VIDEO",          // Access videos (Android 13+)
      "INTERNET",                  // Network access
      "ACCESS_NETWORK_STATE",      // Check connectivity
      "VIBRATE",                   // Haptic feedback
      "RECEIVE_BOOT_COMPLETED",    // Background notifications
      "POST_NOTIFICATIONS"         // Show notifications (Android 13+)
    ]
  }
}
```

### Removing Unwanted Permissions

**Block unused permissions**:
```json
{
  "android": {
    "blockedPermissions": [
      "RECORD_AUDIO",              // If not using audio recording
      "ACCESS_FINE_LOCATION",      // If not using GPS
      "READ_PHONE_STATE"           // If not accessing device info
    ]
  }
}
```

### Permission Best Practices

1. **Request When Needed**: Don't request all permissions on launch
2. **Explain Purpose**: Show rationale before requesting
3. **Handle Denial**: Provide alternative flows
4. **Check Before Use**: Always check permission status
5. **Minimal Permissions**: Only request what's necessary

**Example Flow**:
```typescript
async function capturePhoto() {
  // Check current permission status
  const { status } = await ImagePicker.getCameraPermissionsAsync();
  
  if (status === 'undetermined') {
    // First time - request with rationale
    Alert.alert(
      'Camera Access',
      'Creator Studio needs camera access to capture photos for your content.',
      [
        { text: 'Not Now', style: 'cancel' },
        { 
          text: 'Allow', 
          onPress: async () => {
            const result = await requestCameraPermission();
            if (result) {
              launchCamera();
            }
          }
        }
      ]
    );
  } else if (status === 'granted') {
    // Already granted
    launchCamera();
  } else {
    // Previously denied - direct to settings
    Alert.alert(
      'Camera Permission Required',
      'Please enable camera access in Settings to capture photos.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() }
      ]
    );
  }
}
```

---

## App Manifest

### AndroidManifest.xml (If Ejected)

Key configurations for ejected projects:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.creatorstudio.app">
    
    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    
    <!-- Required features (optional) -->
    <uses-feature 
        android:name="android.hardware.camera"
        android:required="false" />
    
    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:theme="@style/AppTheme"
        android:allowBackup="true"
        android:networkSecurityConfig="@xml/network_security_config"
        android:usesCleartextTraffic="false"
        android:requestLegacyExternalStorage="false">
        
        <!-- Main Activity -->
        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize|uiMode"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            
            <!-- Deep Links -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" 
                      android:host="creatorstudio.app" />
            </intent-filter>
        </activity>
        
        <!-- Notification Service -->
        <service
            android:name=".NotificationService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>
        
    </application>
</manifest>
```

### Network Security Configuration

**res/xml/network_security_config.xml**:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Production: Only allow HTTPS -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    
    <!-- Development: Allow localhost -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
</network-security-config>
```

---

## Native Modules

### Using Expo Modules

Most native functionality available through Expo modules:

**Image Picker**:
```typescript
import * as ImagePicker from 'expo-image-picker';

const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.All,
  allowsEditing: true,
  aspect: [4, 3],
  quality: 1,
});
```

**Notifications**:
```typescript
import * as Notifications from 'expo-notifications';

await Notifications.scheduleNotificationAsync({
  content: {
    title: "Scheduled Post",
    body: "Your content is ready to publish!",
  },
  trigger: {
    date: scheduledDate,
  },
});
```

**Secure Storage**:
```typescript
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('userToken', token);
const token = await SecureStore.getItemAsync('userToken');
```

### Adding Custom Native Modules

If you need custom Android code:

1. **Create Development Build**:
   ```bash
   eas build --profile development --platform android
   ```

2. **Create Config Plugin**:
   ```javascript
   // app.config.js
   module.exports = {
     expo: {
       plugins: [
         [
           "./plugins/custom-native-module.js",
           { androidSetting: "value" }
         ]
       ]
     }
   };
   ```

3. **Write Plugin**:
   ```javascript
   // plugins/custom-native-module.js
   const { withAndroidManifest } = require('@expo/config-plugins');
   
   module.exports = function withCustomNativeModule(config, props) {
     return withAndroidManifest(config, async (config) => {
       // Modify AndroidManifest.xml
       return config;
     });
   };
   ```

---

## Push Notifications

### Firebase Cloud Messaging (FCM)

**Setup**:

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create new project
   - Add Android app with package name

2. **Download google-services.json**
   - Place in project root
   - Add to `app.json`:
     ```json
     {
       "android": {
         "googleServicesFile": "./google-services.json"
       }
     }
     ```

3. **Configure Expo**:
   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-notifications",
           {
             "icon": "./assets/images/notification-icon.png",
             "color": "#8B5CF6",
             "sounds": ["./assets/sounds/notification.wav"]
           }
         ]
       ]
     }
   }
   ```

**Implementation**:

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Get push token
async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Permission not granted for push notifications');
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  
  // Send token to your backend
  await sendTokenToBackend(token.data);
  
  return token.data;
}

// Handle incoming notifications
Notifications.addNotificationReceivedListener(notification => {
  console.log('Notification received:', notification);
  // Update UI, show badge, etc.
});

// Handle notification taps
Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;
  
  // Navigate based on notification data
  if (data.contentId) {
    navigation.navigate('ContentDetail', { id: data.contentId });
  }
});
```

---

## Deep Linking

### Universal Links (App Links)

**Configure in app.json**:
```json
{
  "expo": {
    "scheme": "creatorstudio",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "creatorstudio.app",
              "pathPrefix": "/app"
            }
          ],
          "category": [
            "BROWSABLE",
            "DEFAULT"
          ]
        }
      ]
    }
  }
}
```

**Host assetlinks.json**:

Place at `https://creatorstudio.app/.well-known/assetlinks.json`:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.creatorstudio.app",
    "sha256_cert_fingerprints": [
      "YOUR_SHA256_FINGERPRINT"
    ]
  }
}]
```

**Get SHA256 Fingerprint**:
```bash
# For debug key
keytool -list -v -keystore ~/.android/debug.keystore

# For release key (from EAS)
eas credentials
# Select Android → Keystore → View SHA256
```

**Handle Deep Links**:
```typescript
import * as Linking from 'expo-linking';

// Parse URL
const url = Linking.useURL();

useEffect(() => {
  if (url) {
    const { hostname, path, queryParams } = Linking.parse(url);
    
    // Example: https://creatorstudio.app/app/content/123
    if (path === 'content') {
      navigation.navigate('ContentDetail', { id: queryParams.id });
    }
  }
}, [url]);

// Create deep link
const deepLink = Linking.createURL('content', {
  queryParams: { id: '123' }
});
// Result: creatorstudio://content?id=123
```

---

## Performance Optimization

### Hermes JavaScript Engine

**Enabled by default in Expo 54+**:

```json
{
  "android": {
    "enableHermes": true
  }
}
```

**Benefits**:
- Faster app startup
- Lower memory usage
- Smaller bundle size
- Improved performance

### ProGuard (Code Obfuscation)

**Enable in app.json**:
```json
{
  "android": {
    "enableProguardInReleaseBuilds": true
  }
}
```

**Custom Rules** (if ejected):

**android/app/proguard-rules.pro**:
```proguard
# Keep React Native
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters

# Keep Expo modules
-keep class expo.modules.** { *; }

# Keep your app classes
-keep class com.creatorstudio.app.** { *; }
```

### Build Optimization

**android/gradle.properties** (if ejected):
```properties
# Enable Gradle daemon
org.gradle.daemon=true

# Increase memory
org.gradle.jvmargs=-Xmx4g -XX:MaxPermSize=2048m

# Enable parallel execution
org.gradle.parallel=true

# Enable build cache
android.enableBuildCache=true

# Use AndroidX
android.useAndroidX=true
android.enableJetifier=true
```

---

## Debugging

### Android Studio

**Open project**:
```bash
cd android
./gradlew clean
studio .
```

**View logs**:
```bash
# Logcat
adb logcat | grep "ReactNative"

# Clear logs
adb logcat -c
```

### React Native Debugger

**Enable debug menu**:
- Shake device
- Or press `Cmd + M` (emulator)
- Select "Debug"

**Chrome DevTools**:
- Open `chrome://inspect`
- Click "inspect" on your app

### Common Issues

**Build fails with "Duplicate class"**:
```bash
# Clean build
cd android
./gradlew clean
cd ..
npm start -- --reset-cache
```

**App crashes on startup**:
- Check Logcat for stack trace
- Verify all permissions are declared
- Check for missing native dependencies

**Slow build times**:
- Enable Gradle daemon
- Increase JVM memory
- Use build cache
- Disable unnecessary features

---

## Resources

### Official Documentation

- [Expo Android Documentation](https://docs.expo.dev/workflow/android/)
- [React Native Android](https://reactnative.dev/docs/running-on-device)
- [Android Developer Guides](https://developer.android.com/guide)
- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)

### Tools

- **Android Studio**: Full IDE for Android development
- **adb**: Android Debug Bridge for device communication
- **bundletool**: Test AAB files locally
- **Gradle**: Build automation tool

---

*This guide should be updated as Android APIs and Expo SDK versions evolve.*
