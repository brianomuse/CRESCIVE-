import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const PWA_DISMISSED_KEY = "crescive_pwa_install_dismissed_v1";
const SNOOZE_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days snooze after "Not now"

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 1. Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // 2. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // 3. Check dismissal snooze
    try {
      const dismissedTimestamp = localStorage.getItem(PWA_DISMISSED_KEY);
      if (dismissedTimestamp) {
        const timePassed = Date.now() - parseInt(dismissedTimestamp, 10);
        if (timePassed < SNOOZE_DURATION_MS) {
          setIsDismissed(true);
        } else {
          localStorage.removeItem(PWA_DISMISSED_KEY);
          setIsDismissed(false);
        }
      }
    } catch {
      // Storage unavailable or blocked
    }

    // 4. Listen for beforeinstallprompt event (Chromium, Android, Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      try {
        localStorage.removeItem(PWA_DISMISSED_KEY);
      } catch {}
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn("PWA installation prompt was dismissed or failed:", err);
    }
    return false;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    try {
      localStorage.setItem(PWA_DISMISSED_KEY, Date.now().toString());
    } catch {}
  }, []);

  const resetDismissal = useCallback(() => {
    setIsDismissed(false);
    try {
      localStorage.removeItem(PWA_DISMISSED_KEY);
    } catch {}
  }, []);

  // Determine if prompt should automatically surface
  const canPrompt = !isInstalled && !isDismissed && (!!deferredPrompt || isIOS);

  return {
    isInstallable: !!deferredPrompt || (isIOS && !isInstalled),
    hasNativePrompt: !!deferredPrompt,
    isInstalled,
    isIOS,
    isDismissed,
    canPrompt,
    install,
    dismiss,
    resetDismissal,
  };
}
