export const isNativeApp = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check Capacitor bridge (works when page is served from APK's local server)
  if ((window as any).Capacitor?.isNativePlatform()) return true;

  // Check for source=apk flag passed from APK shell on redirect
  if (typeof sessionStorage !== 'undefined') {
    if (sessionStorage.getItem('appSource') === 'apk') return true;
    const params = new URLSearchParams(window.location.search);
    if (params.get('source') === 'apk') {
      sessionStorage.setItem('appSource', 'apk');
      return true;
    }
  }

  return false;
};
