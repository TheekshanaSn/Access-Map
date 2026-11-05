# AccessMap — Android Mobile Application Guide
### Built with Angular, Ionic Design System, and Capacitor

This guide details how to build, run, test, and deploy the **AccessMap** mobile application on Android devices and emulators, while reusing the existing Express.js REST API backend.

---

## 1. Mobile Architecture Overview

```
Access-Map/
├── backend/                  # Reused REST API (Auth, Places, Audits, Routing)
├── frontend/
│   ├── src/app/
│   │   ├── core/services/
│   │   │   ├── device-location.service.ts # Capacitor GPS + Web Fallback + Rationale
│   │   │   ├── device-network.service.ts  # Online/Offline listener + Stale Data Flag
│   │   │   ├── device-storage.service.ts  # Capacitor Preferences + Offline Place Cache
│   │   │   └── device-haptics.service.ts  # Haptic vibration for accessible touch targets
│   │   ├── shared/components/
│   │   │   ├── mobile-tab-nav/            # Native bottom navigation (Map, Places, Audit, Route, Profile)
│   │   │   └── network-banner/            # Offline & Slow Connection alert bar
│   │   └── features/
│   │       └── profile/                   # Mobile User Profile & Offline Sync Controls
│   ├── capacitor.config.ts   # Capacitor configuration
│   └── android/              # Native Android Gradle Project
│       ├── app/
│       │   ├── src/main/
│       │   │   ├── AndroidManifest.xml    # Permissions: Location, Network, Cleartext
│       │   │   ├── assets/public/         # Compiled Angular web assets
│       │   │   └── java/org/accessmap/app/MainActivity.java
│       │   └── build.gradle               # Android App module build script
│       ├── build.gradle                   # Root Gradle build script
│       └── variables.gradle               # SDK versions (minSdk: 24, targetSdk: 34)
```

---

## 2. Key Mobile Features

1. **Native Bottom Navigation (`app-mobile-tab-nav`)**:
   - 5 primary touch-friendly tabs ($\ge 48\times 48\text{px}$ targets):
     - 🗺️ **Map**: Interactive Leaflet map with step-free filters and GPS recenter.
     - 🏢 **Places**: Searchable venue directory with verified physical features.
     - ➕ **Audit**: High-contrast accessibility report submission with photo uploads.
     - 🧭 **Route**: Step-free route planner with mobility profile selection (Manual Chair, Power Chair, Walker, Stroller, Pedestrian).
     - 👤 **Profile**: Mobile user account, location permission rationale, and offline storage manager.

2. **Explicit Location Permission with User Rationale (Requirement 4)**:
   - AccessMap **never** triggers native OS prompts without explanation.
   - Users are presented with a clear rationale dialog:
     > *"AccessMap uses your device location exclusively to display step-free routes, accessible ramps, and elevators around you. Your location is never logged, tracked, or shared."*
   - Handles permission denial gracefully; users can still search and navigate places manually.

3. **Offline Caching & Stale Data Notices (Requirement 7)**:
   - When the device goes offline, `DeviceNetworkService` displays a sticky warning:
     > `📡 Offline Mode: You are disconnected from the internet. Viewing cached venue data.`
   - In the Places directory, an **Offline Cache** badge clearly indicates that the data may be stale.
   - Users can download/synchronize the place catalog for offline use via the Profile screen.

4. **Tactile Haptic Feedback (Requirement 5)**:
   - Subtle vibrations on tab navigation, button taps, and route calculation confirm actions for users with motor or visual impairments.

---

## 3. Prerequisites & Environment Setup

- **Node.js**: v20+ or v22 LTS
- **JDK**: Java Development Kit (JDK 17 or JDK 21)
- **Android Studio**: Android Studio Jellyfish / Koala (or Command Line Tools)
  - Android SDK Platform 34
  - Android SDK Build-Tools 34.0.0
  - Android Virtual Device (AVD) with API 30+ (Google Play image)

---

## 4. Building the Mobile Application

### Step 1: Build the Angular Web Bundle & Copy to Android Assets
From the root workspace, run:
```bash
npm run --prefix frontend mobile:build
```
This builds the production Angular application (`dist/frontend/browser`) and syncs the files into `frontend/android/app/src/main/assets/public/`.

### Step 2: Open in Android Studio (Recommended)
Launch Android Studio and open the `frontend/android` folder:
```bash
# Using Capacitor CLI (if installed globally)
npx cap open android --project frontend

# Or open frontend/android directly in Android Studio:
# File -> Open -> Select "frontend/android"
```

### Step 3: Compile via Command Line with Gradle
To compile an Android Debug APK from the terminal:
```bash
cd frontend/android

# On Windows PowerShell:
.\gradlew.bat assembleDebug

# On macOS / Linux:
./gradlew assembleDebug
```
The compiled APK will be generated at:
`frontend/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 5. Running on Android Emulator or Physical Device

### Option A: Running in Android Studio
1. Open the **Device Manager** in Android Studio.
2. Start an emulator (e.g. *Pixel 7 - API 34*).
3. Click the green **Run (Play)** button or press `Shift + F10`.

### Option B: Installing via ADB (Command Line)
Connect your physical Android device via USB (with Developer Options & USB Debugging enabled) or start an AVD emulator, then run:
```bash
adb devices
adb install -r frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 6. Connecting to the Local Backend

When running on an Android Emulator:
- The host computer's `localhost` is accessible from the Android emulator via the special loopback IP:
  `http://10.0.2.2:5000`
- To connect a physical phone over Wi-Fi:
  Use your computer's local IP address (e.g. `http://192.168.1.100:5000`).
- Ensure the backend is running:
  ```bash
  npm run --prefix backend dev
  ```
- Cleartext traffic is enabled in `frontend/android/app/src/main/res/xml/network_security_config.xml` to allow communication with `10.0.2.2` during development.

---

## 7. Verification Checklist

| Requirement | Implementation & Verification | Status |
|---|---|---|
| **Angular & Service Reuse** | Reuses all models (`Place`, `User`, `Report`, `Route`) and `PlaceService`, `AuthService`, `RoutingService` without duplication. | Passed |
| **Mobile-Friendly Screens** | Native bottom navigation bar with 5 tabs, touch targets $\ge 48\text{px}$, and safe-area notch insets. | Passed |
| **Capacitor Geolocation** | `DeviceLocationService` with native plugin and progressive web fallback. | Passed |
| **Permission Rationale** | Explains *why* GPS is needed before requesting OS permissions. | Passed |
| **Offline Functionality** | `DeviceStorageService` caches places; `DeviceNetworkService` flags stale data. | Passed |
| **Android Project Setup** | `frontend/android/` contains Gradle configs, Manifest, and assets. | Passed |
| **Unit Test Coverage** | 66/66 Backend tests + 43/43 Frontend tests passing. | Passed |
| **Production Build** | `npm run --prefix frontend mobile:build` generates clean production bundle. | Passed |

