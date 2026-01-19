type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = 'G-S9QKPW484B';
let initialized = false;

function loadScript(src: string): void {
  if (typeof document === 'undefined') return;
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

export function initAnalytics(): void {
  if (initialized) return;
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  loadScript(`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`);
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: true });

  initialized = true;
}

export function trackEvent(name: string, params?: AnalyticsParams): void {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;
  if (!window.gtag) return;

  window.gtag('event', name, params ?? {});
}
