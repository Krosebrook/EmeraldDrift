# Troubleshooting Guide

> **Version**: 2.0.0  
> **Last Updated**: January 2026

Common issues and solutions for EmeraldDrift development and deployment.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Development Server](#development-server)
3. [Build Issues](#build-issues)
4. [Runtime Errors](#runtime-errors)
5. [Platform-Specific Issues](#platform-specific-issues)
6. [Performance Issues](#performance-issues)
7. [Data & Storage](#data--storage)
8. [Git & Version Control](#git--version-control)

---

## Installation Issues

### npm install fails

**Symptoms**: Dependency installation errors

**Solutions**:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still failing, try with legacy peer deps
npm install --legacy-peer-deps
```

### Expo CLI not found

**Symptoms**: `expo: command not found`

**Solution**:
```bash
# Install Expo CLI (not needed for SDK 46+)
npm install -g expo-cli

# Or use npx
npx expo start
```

### TypeScript errors after install

**Symptoms**: Type errors in IDE

**Solution**:
```bash
# Rebuild TypeScript cache
rm -rf tsconfig.tsbuildinfo

# Restart TypeScript server in VS Code
# Command Palette → TypeScript: Restart TS Server
```

---

## Development Server

### Can't connect to development server

**Symptoms**: QR code scans but app won't load

**Solutions**:

1. **Check network connection**:
   ```bash
   # Ensure computer and device on same WiFi
   # Check firewall isn't blocking port 8081
   ```

2. **Use tunnel mode**:
   ```bash
   npx expo start --tunnel
   ```

3. **Clear Expo cache**:
   ```bash
   npx expo start -c
   ```

4. **Check Metro bundler**:
   ```bash
   # Kill any running Metro processes
   pkill -f "react-native"
   
   # Restart
   npx expo start
   ```

### Metro bundler stuck on "Building JavaScript bundle"

**Symptoms**: Bundle takes forever to build

**Solutions**:

```bash
# Clear Metro cache
npx expo start -c

# Or clear React Native cache
npx react-native start --reset-cache

# Check for circular dependencies
npm ls

# If problem persists, check for infinite loops in code
```

### "Unable to resolve module" error

**Symptoms**: Import errors despite file existing

**Solutions**:

1. **Clear cache and restart**:
   ```bash
   npx expo start -c
   ```

2. **Check import paths**:
   ```typescript
   // ❌ Wrong
   import { Button } from "@/components/Button";
   
   // ✅ Correct
   import { Button } from "@/components/Button";
   ```

3. **Verify babel.config.js**:
   ```javascript
   module.exports = {
     presets: ['babel-preset-expo'],
     plugins: [
       [
         'module-resolver',
         {
           root: ['./'],
           alias: {
             '@': './',
           },
         },
       ],
     ],
   };
   ```

4. **Restart TypeScript server** (VS Code)

### Port 8081 already in use

**Symptoms**: `Error: listen EADDRINUSE: address already in use :::8081`

**Solutions**:

```bash
# Find process using port 8081
lsof -i :8081

# Kill the process
kill -9 [PID]

# Or use different port
npx expo start --port 8082
```

---

## Build Issues

### EAS Build fails with "Keystore not found"

**Symptoms**: Android build fails with keystore error

**Solution**:
```bash
# Clear and regenerate credentials
eas credentials -p android

# Select "Remove all credentials"
# Then rebuild
eas build -p android
```

### iOS build fails with "Provisioning profile error"

**Symptoms**: Can't create provisioning profile

**Solutions**:

1. **Check Apple Developer account**:
   - Ensure account is active
   - Check Team ID is correct

2. **Clear credentials**:
   ```bash
   eas credentials -p ios
   # Remove all credentials
   # Rebuild
   ```

3. **Check Bundle ID**:
   - Ensure `app.json` bundle ID matches App Store Connect
   - Bundle ID must be unique

### Build timeout on EAS

**Symptoms**: Build exceeds time limit

**Solutions**:

1. **Check for large dependencies**:
   ```bash
   # Analyze bundle size
   npx expo-bundle-analyzer
   ```

2. **Optimize images**:
   - Compress images in `assets/`
   - Use appropriate resolutions

3. **Remove unused dependencies**:
   ```bash
   npm uninstall [package]
   ```

### "Duplicate resource" error

**Symptoms**: Android build fails with duplicate resource

**Solution**:
```bash
# Clean build directory
cd android
./gradlew clean

# Rebuild
cd ..
eas build -p android
```

---

## Runtime Errors

### App crashes on launch

**Symptoms**: White screen or immediate crash

**Solutions**:

1. **Check error logs**:
   ```bash
   # iOS
   npx react-native log-ios
   
   # Android
   npx react-native log-android
   ```

2. **Common causes**:
   - Missing required fonts
   - Unhandled promise rejection
   - Invalid initial state

3. **Check ErrorBoundary**:
   - Ensure ErrorBoundary wraps app
   - Check console for error details

### "Cannot read property of undefined"

**Symptoms**: Runtime error accessing object property

**Solutions**:

```typescript
// ❌ Bad: Crashes if user is null
const name = user.name;

// ✅ Good: Safe access
const name = user?.name;
const name = user?.name ?? "Guest";
```

### AsyncStorage errors

**Symptoms**: Data persistence fails

**Solutions**:

1. **Clear storage** (development only):
   ```typescript
   import AsyncStorage from "@react-native-async-storage/async-storage";
   
   await AsyncStorage.clear();
   ```

2. **Check storage limits**:
   - iOS: ~10MB
   - Android: Varies by device
   - Consider using a database for large data

3. **Handle errors**:
   ```typescript
   try {
     await AsyncStorage.setItem(key, value);
   } catch (error) {
     console.error("Storage error:", error);
     // Implement fallback
   }
   ```

### Navigation errors

**Symptoms**: "The action X was not handled by any navigator"

**Solutions**:

1. **Check route name**:
   ```typescript
   // Ensure route exists in navigator
   navigation.navigate("Dashboard"); // Must match screen name
   ```

2. **Verify navigator hierarchy**:
   - Screen must be in current navigator or parent
   - Can't navigate to sibling stack directly

3. **Use proper navigation method**:
   ```typescript
   // Stack navigation
   navigation.navigate("Screen");
   navigation.push("Screen");
   navigation.goBack();
   
   // Tab navigation
   navigation.jumpTo("Tab");
   ```

---

## Platform-Specific Issues

### iOS

#### App doesn't load on simulator

**Solutions**:

1. **Reset simulator**:
   ```bash
   # Erase simulator
   xcrun simctl erase all
   ```

2. **Clear derived data** (if using Xcode):
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```

3. **Check iOS version**:
   - Ensure simulator iOS version matches target

#### White screen on physical device

**Solutions**:

1. **Check network configuration**:
   - Use tunnel mode: `npx expo start --tunnel`

2. **Clear app data**:
   - Delete app from device
   - Reinstall via Expo Go

#### Fonts not loading

**Solutions**:

```typescript
import { useFonts } from "expo-font";

// Preload fonts
const [fontsLoaded] = useFonts({
  "SpaceMono-Regular": require("./assets/fonts/SpaceMono-Regular.ttf"),
});

if (!fontsLoaded) {
  return <AppLoading />;
}
```

### Android

#### App crashes on startup (Android)

**Solutions**:

1. **Check permissions**:
   ```json
   // app.json
   {
     "android": {
       "permissions": [
         "CAMERA",
         "READ_EXTERNAL_STORAGE"
       ]
     }
   }
   ```

2. **Clear app data**:
   ```bash
   adb shell pm clear com.creatorstudio.app
   ```

3. **Check for ProGuard issues** (release builds):
   - Add rules to `proguard-rules.pro`

#### Back button doesn't work

**Solution**:
```typescript
import { BackHandler } from "react-native";

useEffect(() => {
  const backHandler = BackHandler.addEventListener(
    "hardwareBackPress",
    () => {
      // Handle back button
      return true; // Prevent default behavior
    }
  );

  return () => backHandler.remove();
}, []);
```

#### Keyboard covers input fields

**Solutions**:

1. **Use KeyboardAvoidingView**:
   ```typescript
   import { KeyboardAvoidingView, Platform } from "react-native";
   
   <KeyboardAvoidingView
     behavior={Platform.OS === "ios" ? "padding" : "height"}
     style={{ flex: 1 }}
   >
     <Form />
   </KeyboardAvoidingView>
   ```

2. **Or use react-native-keyboard-controller** (already installed):
   ```typescript
   import { KeyboardProvider } from "react-native-keyboard-controller";
   ```

### Web

#### Module not found errors

**Solutions**:

1. **Install web-compatible packages**:
   ```bash
   npm install react-native-web
   ```

2. **Check webpack config** (if customized)

3. **Use web-safe APIs**:
   ```typescript
   import { Platform } from "react-native";
   
   if (Platform.OS === "web") {
     // Web-specific code
   }
   ```

#### Styles not applying

**Solutions**:

1. **Check web-specific styles**:
   ```typescript
   const styles = StyleSheet.create({
     container: {
       ...Platform.select({
         web: {
           maxWidth: 1200,
           margin: "0 auto",
         },
       }),
     },
   });
   ```

2. **Test in different browsers**:
   - Chrome, Safari, Firefox
   - Check console for errors

---

## Performance Issues

### App is slow/laggy

**Solutions**:

1. **Profile with React DevTools**:
   ```bash
   npx react-devtools
   ```

2. **Check for unnecessary re-renders**:
   ```typescript
   // Use React.memo for expensive components
   export default React.memo(MyComponent);
   
   // Use useMemo for expensive calculations
   const value = useMemo(() => expensiveCalc(), [deps]);
   
   // Use useCallback for handlers
   const handler = useCallback(() => {}, [deps]);
   ```

3. **Optimize lists**:
   ```typescript
   // Use FlatList instead of map
   <FlatList
     data={items}
     renderItem={renderItem}
     keyExtractor={(item) => item.id}
     maxToRender={10}
     windowSize={5}
   />
   ```

### Images loading slowly

**Solutions**:

1. **Use expo-image** (already installed):
   ```typescript
   import { Image } from "expo-image";
   
   <Image
     source={{ uri }}
     placeholder={blurhash}
     contentFit="cover"
     transition={200}
   />
   ```

2. **Optimize images**:
   - Compress with TinyPNG or similar
   - Use appropriate resolutions
   - Consider lazy loading

3. **Use CDN**:
   - Host large images on CDN
   - Use responsive images

### High memory usage

**Solutions**:

1. **Check for memory leaks**:
   ```typescript
   // Always cleanup in useEffect
   useEffect(() => {
     const subscription = subscribe();
     
     return () => {
       subscription.unsubscribe(); // Cleanup!
     };
   }, []);
   ```

2. **Limit data in memory**:
   - Implement pagination
   - Clear old data
   - Use virtualized lists

3. **Profile memory** (Chrome DevTools):
   - Take heap snapshots
   - Look for detached nodes

---

## Data & Storage

### Data not persisting

**Symptoms**: User data lost after app restart

**Solutions**:

1. **Verify AsyncStorage**:
   ```typescript
   // Check if data is being saved
   const value = await AsyncStorage.getItem(key);
   console.log("Stored value:", value);
   ```

2. **Check storage keys**:
   ```typescript
   // Use constants for keys
   const STORAGE_KEYS = {
     USER: "@app_user",
     CONTENT: "@app_content",
   };
   ```

3. **Handle errors**:
   ```typescript
   try {
     await AsyncStorage.setItem(key, JSON.stringify(data));
   } catch (error) {
     logError(error, { operation: "save", key });
   }
   ```

### Data corruption

**Symptoms**: Invalid JSON errors, unexpected null values

**Solutions**:

1. **Validate before saving**:
   ```typescript
   const validateData = (data: unknown): data is ValidType => {
     // Validation logic
     return true;
   };
   
   if (validateData(data)) {
     await storage.save(data);
   }
   ```

2. **Add migration for data structure changes**:
   ```typescript
   const migrateData = async () => {
     const version = await getStorageVersion();
     
     if (version < CURRENT_VERSION) {
       // Migrate data
       await runMigrations(version);
     }
   };
   ```

3. **Clear corrupt data** (last resort):
   ```typescript
   await AsyncStorage.removeItem(key);
   ```

### Sync issues between devices

**Symptoms**: Different data on different devices

**Solutions**:

1. **Implement conflict resolution**:
   - Last-write-wins
   - Manual conflict resolution
   - Timestamp-based merging

2. **Use server sync**:
   - Periodic background sync
   - Real-time sync with WebSockets
   - Conflict detection

---

## Git & Version Control

### Can't push: unpulled changes must be merged first

**Symptoms**: 
- Warning: "pulling will start a merge with conflicts"
- Error: "Can't push: unpulled changes must be merged first"
- Branch status shows "5 down 36 up" (commits behind/ahead of remote)

This occurs when:
1. You have local commits that aren't on the remote
2. Remote has commits you haven't pulled
3. Git requires merging before you can push

**Solutions**:

#### Option 1: Merge Remote Changes (Recommended)

```bash
# 1. Fetch latest changes from remote
git fetch origin

# 2. Check what commits are different
git log origin/main..HEAD --oneline  # Your local commits not on remote
git log HEAD..origin/main --oneline  # Remote commits you don't have

# 3. Pull and merge remote changes
git pull origin main

# 4. If conflicts occur, Git will pause and show conflicted files
# Files with conflicts will be marked like:
# <<<<<<< HEAD (your changes)
# your code
# =======
# remote code
# >>>>>>> origin/main (remote changes)

# 5. Resolve conflicts by editing each file
# Choose which changes to keep or combine both

# 6. After resolving conflicts, stage the resolved files
git add .

# 7. Complete the merge
git commit -m "Merge remote changes"

# 8. Push your merged changes
git push origin main
```

#### Option 2: Rebase (Creates Linear History)

```bash
# 1. Fetch latest changes
git fetch origin

# 2. Rebase your commits on top of remote
git rebase origin/main

# 3. If conflicts occur, resolve them
# Edit conflicted files

# 4. After resolving, continue rebase
git add .
git rebase --continue

# 5. Repeat steps 3-4 until rebase completes

# 6. Push changes (may require force push)
git push origin main --force-with-lease
```

⚠️ **Note**: Only use `--force-with-lease` if you're sure no one else has pushed to the branch since you last pulled.

#### Option 3: Stash Changes Temporarily

If you want to pull first, then apply your changes:

```bash
# 1. Save your local changes temporarily
git stash save "Work in progress"

# 2. Pull remote changes
git pull origin main

# 3. Apply your stashed changes
git stash pop

# 4. Resolve any conflicts that arise
git add .
git commit -m "Resolve conflicts after stash pop"

# 5. Push
git push origin main
```

### Resolving Merge Conflicts

**Symptoms**: 
- Git shows "CONFLICT (content): Merge conflict in [filename]"
- Files contain conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
- Cannot commit until conflicts are resolved

**Step-by-Step Resolution**:

1. **Identify conflicted files**:
   ```bash
   git status
   # Look for "both modified:" files
   ```

2. **Open each conflicted file** and look for conflict markers:
   ```
   <<<<<<< HEAD
   // Your local changes
   const API_URL = "http://localhost:3000";
   =======
   // Remote changes
   const API_URL = "https://api.production.com";
   >>>>>>> origin/main
   ```

3. **Decide how to resolve**:
   - **Keep yours**: Delete remote code and markers
   - **Keep theirs**: Delete your code and markers
   - **Keep both**: Combine both changes and remove markers
   - **Manual edit**: Write new code that combines both

4. **Clean example resolution**:
   ```typescript
   // Before (with conflict):
   <<<<<<< HEAD
   const API_URL = "http://localhost:3000";
   =======
   const API_URL = "https://api.production.com";
   >>>>>>> origin/main

   // After (resolved):
   const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
   ```

5. **Mark as resolved**:
   ```bash
   git add [resolved-file]
   ```

6. **Complete the merge**:
   ```bash
   # After resolving all conflicts
   git commit -m "Resolve merge conflicts"
   git push origin main
   ```

### Common Merge Conflict Scenarios

#### Package.json conflicts

**Symptom**: Conflict in `package.json` or `package-lock.json`

**Solution**:
```bash
# 1. Resolve package.json conflicts manually
# Carefully merge dependencies from both versions

# 2. Only if necessary, regenerate lock file
# (Try to resolve lock file conflicts first if possible)
rm package-lock.json

# 3. Regenerate lock file
npm install

# 4. Commit resolved files
git add package.json package-lock.json
git commit -m "Resolve package.json conflicts"
```

**Note**: Avoid deleting `package-lock.json` unless absolutely necessary, as it ensures consistent dependency versions.

#### Import/export conflicts

**Symptom**: Conflict in `index.ts` export files

**Solution**:
```typescript
// Merge both export lists, remove duplicates
export { ComponentA } from "./ComponentA";
export { ComponentB } from "./ComponentB";
export { ComponentC } from "./ComponentC"; // From remote
```

#### TypeScript type conflicts

**Symptom**: Conflicting type definitions

**Solution**:
```typescript
// Combine type definitions or use union types
export interface User {
  id: string;
  name: string;
  email: string;        // Your addition
  role: UserRole;       // Remote addition
}
```

### Preventing Conflicts

**Best Practices**:

1. **Pull frequently**:
   ```bash
   # Start each work session by pulling
   git pull origin main
   ```

2. **Commit small, focused changes**:
   ```bash
   # Commit logical units of work
   git add [specific-files]
   git commit -m "feat: add specific feature"
   ```

3. **Communicate with team**:
   - Coordinate on shared files
   - Use feature branches for major changes
   - Review pull requests promptly

4. **Use feature branches**:
   ```bash
   # Create branch for your work
   git checkout -b feature/my-feature
   
   # Work and commit
   git add .
   git commit -m "feat: implement feature"
   
   # Update your branch with latest main
   git checkout main
   git pull origin main
   git checkout feature/my-feature
   git merge main
   
   # Push feature branch
   git push origin feature/my-feature
   ```

### Undoing a Merge

**If merge went wrong**:

```bash
# Before committing the merge
git merge --abort

# After committing the merge
git reset --hard HEAD~1  # Removes last commit
# ⚠️ WARNING: This deletes uncommitted work

# Safer option: Create new commit that undoes changes
git revert -m 1 HEAD
```

### Checking Remote Status

**Check if you're behind/ahead of remote**:

```bash
# Fetch without merging
git fetch origin

# Compare your branch to remote
git status

# See detailed comparison
git log --oneline --graph --all --decorate

# Count commits behind/ahead
git rev-list --left-right --count origin/main...HEAD
# Output: "5  36" means 5 behind, 36 ahead
```

---

## Getting Help

### Debug Information to Collect

When reporting issues, include:

1. **Environment**:
   - Expo SDK version
   - React Native version
   - Platform (iOS/Android/Web)
   - Device model
   - OS version

2. **Steps to reproduce**:
   - Exact steps to trigger issue
   - Expected vs actual behavior

3. **Error logs**:
   - Console output
   - Stack traces
   - Screenshots/recordings

4. **Code snippets**:
   - Relevant code
   - Configuration files

### Resources

- **Expo Documentation**: https://docs.expo.dev
- **React Native Docs**: https://reactnative.dev
- **GitHub Issues**: https://github.com/Krosebrook/EmeraldDrift/issues
- **Stack Overflow**: Tag `expo` or `react-native`
- **Expo Discord**: https://chat.expo.dev

### Filing a Bug Report

Use this template:

```markdown
## Environment
- Expo SDK: 54.0.0
- React Native: 0.81.5
- Platform: iOS 17.1
- Device: iPhone 14 Pro

## Description
Brief description of the issue

## Steps to Reproduce
1. Open app
2. Navigate to Dashboard
3. Click on content item
4. Observe error

## Expected Behavior
App should show content detail

## Actual Behavior
App crashes with error: ...

## Error Logs
```
[Paste error logs here]
```

## Screenshots
[Attach screenshots]

## Additional Context
Any other relevant information
```

---

*This troubleshooting guide is updated based on common issues. Contribute your solutions!*
