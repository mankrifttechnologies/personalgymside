import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.86f699f0283d484f9df8c9a407b56112',
  appName: 'personalgymside',
  webDir: 'dist',
  server: {
    url: 'https://86f699f0-283d-484f-9df8-c9a407b56112.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
