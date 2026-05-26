import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tournax.app',
  appName: 'TournaX',
  webDir: 'capacitor-assets',
  server: {
    cleartext: true,
    allowNavigation: ['tournax.vercel.app'],
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
    },
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
};

export default config;
