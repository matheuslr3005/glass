import { SITE } from "./content";

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Carrega o Google Analytics 4 quando SITE.analyticsId estiver preenchido. */
export function initAnalytics(): void {
  window.dataLayer = window.dataLayer || [];
  const id = SITE.analyticsId;
  if (!id) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);

  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", id);
}

/**
 * Registra um clique ou ação. Com GA4 configurado vai por gtag; sem ele, vai para o dataLayer
 * no formato do Google Tag Manager. Em desenvolvimento também aparece no console.
 */
export function track(name: string, params: Params = {}): void {
  try {
    if (window.gtag) window.gtag("event", name, params);
    else (window.dataLayer = window.dataLayer || []).push({ event: name, ...params });
    if (import.meta.env.DEV) console.debug("[track]", name, params);
  } catch {
    /* rastreamento nunca pode quebrar o site */
  }
}
