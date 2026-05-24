import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scarfall.esports',
  appName: 'ScarFall Esports',
  webDir: 'capacitor-assets',
  server: {
    url: 'https://tournax.vercel.app',
    cleartext: true,
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
    },
  },
};

export default config;
