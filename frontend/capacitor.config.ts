import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.accessmap.app',
  appName: 'AccessMap',
  webDir: 'dist/frontend/browser',
  server: {
    androidScheme: 'https',
    cleartext: true, // Enables communication with local Express backend (10.0.2.2:5000) during development
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0f766e',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#ffffff',
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;

