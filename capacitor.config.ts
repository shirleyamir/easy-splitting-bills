import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4372ded3fc794060853b02f67c64cf64',
  appName: 'receipt-reconcile',
  webDir: 'dist',
  server: {
    url: 'https://4372ded3-fc79-4060-853b-02f67c64cf64.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    }
  }
};

export default config;