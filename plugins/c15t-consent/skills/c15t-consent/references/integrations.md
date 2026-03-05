# c15t Analytics & Marketing Integrations

## Table of Contents
- [Google Tag Manager](#google-tag-manager)
- [GA4 + Google Ads (gtag.js)](#ga4--google-ads-gtagjs)
- [Meta Pixel](#meta-pixel)
- [TikTok Pixel](#tiktok-pixel)
- [PostHog](#posthog)
- [LinkedIn Insights](#linkedin-insights)
- [Microsoft UET](#microsoft-uet)
- [X Pixel (Twitter)](#x-pixel)
- [Databuddy](#databuddy)

---

## Google Tag Manager

GTM manages its own consent state. c15t syncs consent via Consent Mode v2.

### Setup

```tsx
import { googleTagManager } from '@c15t/scripts/google-tag-manager';

const scripts = [
  googleTagManager({
    id: 'GTM-XXXXXXX',
  }),
];
```

### GTM Configuration Required

1. Enable "consent overview" in Container Settings
2. Create custom trigger for `consent-update` event
3. Add trigger to your tags

---

## GA4 + Google Ads (gtag.js)

```tsx
import { gtag } from '@c15t/scripts/google-tag';

const scripts = [
  gtag({
    id: 'G-XXXXXXXXXX',
    category: 'measurement', // or 'marketing' for Google Ads
  }),
];
```

### Categories
- `measurement` - Analytics only (GA4 events)
- `marketing` - Advertising and conversion tracking (Google Ads)

---

## Meta Pixel

Script persists after consent revoke (has built-in consent management):

```tsx
import { metaPixel, metaPixelEvent } from '@c15t/scripts/meta-pixel';

// Setup
const scripts = [
  metaPixel({
    pixelId: '123456789012345',
  }),
];

// Track events
metaPixelEvent('Purchase', { value: 10.0, currency: 'USD' });
```

---

## TikTok Pixel

Script persists after consent revoke:

```tsx
import { tiktokPixel } from '@c15t/scripts/tiktok-pixel';

const scripts = [
  tiktokPixel({
    pixelId: '123456789012345',
  }),
];
```

---

## PostHog

PostHog supports cookieless tracking, allowing analytics without consent.

### SDK Approach (Recommended)

```tsx
import { posthog } from 'posthog-js';

// Initialize with cookieless mode
posthog.init("phc_xxxxx", {
  api_host: "https://eu.i.posthog.com",
  defaults: "2025-05-24",
  cookieless_mode: 'on_reject'
});

// Sync with c15t
<ConsentManagerProvider
  options={{
    callbacks: {
      onConsentSet({ preferences }) {
        if (preferences.measurement) {
          posthog.opt_in_capturing();
        } else {
          posthog.opt_out_capturing();
        }
      }
    }
  }}
>
```

### Script Approach

```tsx
import { posthog } from '@c15t/scripts/posthog';

const scripts = [
  posthog({
    id: 'phc_xxxxx',
    apiHost: 'https://eu.i.posthog.com',
    defaults: '2025-05-24',
    options: { person_profiles: 'identified_only' }
  }),
];
```

---

## LinkedIn Insights

Default category: `marketing`

```tsx
import { linkedinInsights } from '@c15t/scripts/linkedin-insights';

const scripts = [
  linkedinInsights({
    id: '123456789012345',
  }),
];
```

---

## Microsoft UET

Default category: `marketing`

```tsx
import { microsoftUet } from '@c15t/scripts/microsoft-uet';

const scripts = [
  microsoftUet({
    id: '123456789012345',
  }),
];
```

Note: UET can also load Microsoft Clarity. Load Clarity separately with `measurement` consent.

---

## X Pixel

```tsx
import { xPixel, xPixelEvent } from '@c15t/scripts/x-pixel';

// Setup
const scripts = [
  xPixel({
    id: '123456789012345',
  }),
];

// Track events
xPixelEvent('tw-xxxx-xxxx', { value: 10.00, currency: 'USD' });
```

---

## Databuddy

Privacy-focused analytics with automatic consent sync:

```tsx
import { databuddy } from '@c15t/scripts/databuddy';

const scripts = [
  databuddy({
    clientId: 'your-client-id',
    scriptUrl: 'https://cdn.databuddy.cc/databuddy.js',
    apiUrl: 'https://basket.databuddy.cc',
    options: {
      trackScreenViews: true,
      trackOutgoingLinks: true,
      trackPerformance: true,
    }
  }),
];
```

### Track Events

```ts
window.databuddy?.trackCustomEvent('button_clicked', {
  button_id: 'signup',
  page: '/landing'
});

window.databuddy?.screenView('/dashboard', {
  user_role: 'admin'
});
```

---

## Custom Scripts

```tsx
const scripts = [
  {
    id: 'my-analytics',
    src: 'https://analytics.example.com/script.js',
    category: 'measurement', // or 'marketing'
    onLoad: () => console.log('Script loaded'),
    onBeforeLoad: () => console.log('About to load'),
  }
];
```

### Always Load Scripts

For scripts with built-in consent management:

```tsx
{
  id: 'gtm',
  src: 'https://www.googletagmanager.com/gtm.js',
  alwaysLoad: true, // Never unloads
}
```

---

## Consent Categories

| Category | Purpose |
|----------|---------|
| `necessary` | Essential cookies (always on) |
| `functional` | Functionality cookies |
| `measurement` | Analytics |
| `marketing` | Advertising |
