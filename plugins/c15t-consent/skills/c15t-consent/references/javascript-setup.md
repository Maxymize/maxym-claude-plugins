# c15t JavaScript (Vanilla) Setup

## Table of Contents
- [Installation](#installation)
- [Basic Setup](#basic-setup)
- [Hosting Options](#hosting-options)
- [Script Loader](#script-loader)
- [Internationalization](#internationalization)
- [Callbacks](#callbacks)

---

## Installation

```bash
npm install c15t
# or
pnpm add c15t
# or
yarn add c15t
```

---

## Basic Setup

```ts
import { configureConsentManager, createConsentManagerStore } from 'c15t';

// Configure the consent manager
export const consentManager = configureConsentManager({
  mode: 'c15t',
  backendURL: 'https://your-instance.c15t.dev',
});

// Create the store
export const store = createConsentManagerStore(consentManager, {
  initialGdprTypes: ['necessary', 'marketing'],
  ignoreGeoLocation: true, // true for development
});

// Usage
store.getState().setConsent('marketing', true);
console.log(store.getState().showPopup);
```

---

## Hosting Options

### consent.io (Recommended)

Fully managed service with zero backend maintenance.

```ts
const consentManager = configureConsentManager({
  mode: 'c15t',
  backendURL: 'https://your-instance.c15t.dev',
  consentCategories: ['necessary', 'marketing'],
});
```

**Setup:**
1. Sign up at consent.io
2. Create a new instance
3. Add trusted origins (localhost, production domain)
4. Copy the backendURL

### Offline Mode

Browser-based storage without backend.

```ts
const consentManager = configureConsentManager({
  mode: 'offline',
  consentCategories: ['necessary', 'marketing'],
});
```

**Characteristics:**
- No backend required
- Stores in localStorage
- No network requests
- Fast for prototyping

---

## Script Loader

Load/unload scripts based on consent.

```ts
import { configureConsentManager } from 'c15t';
import { googleTagManager } from '@c15t/scripts/google-tag-manager';
import { metaPixel } from '@c15t/scripts/meta-pixel';

const consentManager = configureConsentManager({
  scripts: [
    // Prebuilt scripts
    googleTagManager({ id: 'GTM-XXXXXXX' }),
    metaPixel({ pixelId: '123456789012345' }),

    // Custom script
    {
      id: 'custom-analytics',
      src: 'https://analytics.example.com/script.js',
      category: 'measurement',
      onLoad: () => console.log('Loaded'),
      onBeforeLoad: () => console.log('Loading...'),
    },
  ],
});
```

### Always Load Scripts

For scripts with built-in consent management (like GTM):

```ts
{
  id: 'gtm',
  src: 'https://www.googletagmanager.com/gtm.js',
  alwaysLoad: true, // Never unloads
}
```

---

## Internationalization

```ts
const consentManager = configureConsentManager({
  translations: {
    defaultLanguage: 'en',
    translations: {
      en: {
        common: {
          acceptAll: 'Accept all',
          rejectAll: 'Reject all',
          customize: 'Customize',
          save: 'Save preferences',
        },
        cookieBanner: {
          title: 'Cookie Consent',
          description: 'We use cookies to improve your experience.',
        },
      },
      de: {
        common: {
          acceptAll: 'Alle akzeptieren',
          rejectAll: 'Alle ablehnen',
          customize: 'Anpassen',
          save: 'Einstellungen speichern',
        },
        cookieBanner: {
          title: 'Cookie-Einwilligung',
          description: 'Wir verwenden Cookies, um Ihre Erfahrung zu verbessern.',
        },
      },
    },
  },
});
```

### Translation Keys

- `common`: Shared button labels
- `cookieBanner`: Banner text
- `consentManagerDialog`: Dialog text
- `consentType`: Category descriptions

---

## Callbacks

```ts
const consentManager = configureConsentManager({
  mode: 'c15t',
  backendURL: 'https://your-instance.c15t.dev',
  callbacks: {
    onBannerFetched(response) {
      console.log('Banner fetched:', response);
      // Initialize based on existing consent
    },

    onConsentSet(response) {
      console.log('Consent saved:', response);
      const { preferences, allConsented, anyConsented } = response;

      if (preferences.measurement) {
        initializeAnalytics();
      }
      if (preferences.marketing) {
        initializeAds();
      }
    },

    onError(error) {
      console.error('Consent error:', error);
      // Handle error (fallback to offline mode, etc.)
    },
  },
});
```

### Callback Types

| Callback | When Called | Payload |
|----------|-------------|---------|
| `onBannerFetched` | Banner data loaded | Banner config, existing consent |
| `onConsentSet` | User saves consent | Preferences, flags |
| `onError` | Error occurs | Error details |

---

## DOM Integration

For non-SPA sites, manually control banner visibility:

```ts
const store = createConsentManagerStore(consentManager);

// Check if banner should show
if (store.getState().showPopup) {
  document.getElementById('consent-banner').style.display = 'block';
}

// Handle accept button
document.getElementById('accept-btn').addEventListener('click', () => {
  store.getState().saveConsents('all');
  document.getElementById('consent-banner').style.display = 'none';
});

// Handle reject button
document.getElementById('reject-btn').addEventListener('click', () => {
  store.getState().saveConsents('necessary');
  document.getElementById('consent-banner').style.display = 'none';
});
```
