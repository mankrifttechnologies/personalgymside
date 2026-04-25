import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Configures native mobile behaviors when running inside Capacitor:
 *  - StatusBar styling (overlay + theme color)
 *  - Keyboard resize behavior
 * Safe no-op on web.
 */
export default function NativeSetup() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    (async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0F1419' });
      } catch (e) {
        console.warn('StatusBar setup skipped', e);
      }

      try {
        const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard');
        await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
        await Keyboard.setScroll({ isDisabled: false });
      } catch (e) {
        console.warn('Keyboard setup skipped', e);
      }
    })();
  }, []);

  return null;
}
