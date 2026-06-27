import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';

export const initCapacitorApp = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.hide();
  } catch {
    // Status bar plugin optional on some devices.
  }

  try {
    await SplashScreen.hide();
  } catch {
    // Splash may already be hidden.
  }

  App.addListener('backButton', ({ canGoBack }) => {
    if (!canGoBack) {
      App.minimizeApp();
    }
  });
};
