/**
 * Analytics utility for Google Analytics 4 (G-YQ6V998MMN) and
 * Google Tag Manager (GTM-ML29JXL7).
 *
 * Use `trackEvent` for custom GA4 events.
 * Use `pushToDataLayer` for raw GTM dataLayer pushes.
 */

const GA_ID = 'G-YQ6V998MMN';

/** Push an arbitrary object to the GTM dataLayer. */
export function pushToDataLayer(data: Record<string, unknown>): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
}

/** Track a page view (called automatically by usePageTracking on route change). */
export function trackPageView(path: string, title?: string): void {
  if (typeof window.gtag !== 'function') return;
  window.gtag('config', GA_ID, {
    page_path: path,
    page_title: title ?? document.title,
  });
  pushToDataLayer({ event: 'page_view', page_path: path, page_title: title ?? document.title });
}

/**
 * Track a custom GA4 event.
 *
 * @param eventName  GA4 event name (snake_case recommended).
 * @param params     Optional event parameters.
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
  pushToDataLayer({ event: eventName, ...params });
}

// ─── Convenience helpers ───────────────────────────────────────────────────

/** Track a button / CTA click. */
export function trackButtonClick(label: string, category?: string): void {
  trackEvent('button_click', { button_label: label, event_category: category ?? 'UI' });
}

/** Track a link click (navigation or external). */
export function trackLinkClick(url: string, label?: string): void {
  trackEvent('link_click', { link_url: url, link_text: label });
}

/** Track a form submission attempt. */
export function trackFormSubmit(formName: string, params?: Record<string, unknown>): void {
  trackEvent('form_submit', { form_name: formName, ...params });
}

/** Track a successful sign-up. */
export function trackSignUp(method?: string): void {
  trackEvent('sign_up', { method: method ?? 'email' });
}

/** Track a successful login. */
export function trackLogin(method?: string): void {
  trackEvent('login', { method: method ?? 'email' });
}

/** Track a search action. */
export function trackSearch(searchTerm: string, category?: string): void {
  trackEvent('search', { search_term: searchTerm, event_category: category });
}

/** Track viewing a content item (profile, event, post, story …). */
export function trackContentView(contentType: string, contentId?: string, contentName?: string): void {
  trackEvent('content_view', { content_type: contentType, content_id: contentId, content_name: contentName });
}

/** Track sharing / social interactions. */
export function trackShare(method: string, contentType?: string, itemId?: string): void {
  trackEvent('share', { method, content_type: contentType, item_id: itemId });
}

/** Track donation / giving interactions. */
export function trackDonation(amount?: number, currency?: string): void {
  trackEvent('donation_initiated', { value: amount, currency: currency ?? 'INR' });
}

// ─── TypeScript augmentation for window ───────────────────────────────────

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (...args: unknown[]) => void;
  }
}
