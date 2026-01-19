type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = 'G-S9QKPW484B';
let initialized = false;
let warned = false;

function loadScript(src: string): void {
  if (typeof document === 'undefined') return;
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  script.onerror = () => {
    if (!warned) {
      console.warn('Failed to load GA4 script. Check network or ad blockers.');
      warned = true;
    }
  };
  document.head.appendChild(script);
}

export function initAnalytics(): void {
  if (initialized) return;
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  loadScript(`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`);
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer?.push(arguments);
  };
  window.gtag('js', new Date());
  const isLocalhost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: true,
    debug_mode: isLocalhost,
  });

  initialized = true;
}

export function trackEvent(name: string, params?: AnalyticsParams): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;
  if (!window.gtag) {
    initAnalytics();
  }
  if (!window.gtag) {
    if (!warned) {
      console.warn('GA4 not initialized; event skipped:', name);
      warned = true;
    }
    return;
  }

  window.gtag('event', name, params ?? {});
}
