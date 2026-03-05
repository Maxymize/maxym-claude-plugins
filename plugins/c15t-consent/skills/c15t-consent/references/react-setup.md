# c15t React Setup

## Table of Contents
- [Installation](#installation)
- [Basic Setup](#basic-setup)
- [With Scripts](#with-scripts)
- [Callbacks](#callbacks)
- [Storing Consent](#storing-consent)

---

## Installation

```bash
npm install @c15t/react
# or
pnpm add @c15t/react
# or
yarn add @c15t/react
```

---

## Basic Setup

```tsx
// App.tsx
import {
  ConsentManagerProvider,
  CookieBanner,
  ConsentManagerDialog,
} from '@c15t/react';

export function App({ children }: { children: React.ReactNode }) {
  return (
    <ConsentManagerProvider
      options={{
        mode: 'c15t',
        backendURL: 'https://your-backend.consent.io',
        consentCategories: ['necessary', 'measurement', 'marketing'],
      }}
    >
      <CookieBanner />
      <ConsentManagerDialog />
      {children}
    </ConsentManagerProvider>
  );
}
```

---

## With Scripts

```tsx
import { ConsentManagerProvider } from '@c15t/react';
import { googleTagManager } from '@c15t/scripts/google-tag-manager';
import { metaPixel } from '@c15t/scripts/meta-pixel';

export function App({ children }: { children: React.ReactNode }) {
  return (
    <ConsentManagerProvider
      options={{
        scripts: [
          googleTagManager({ id: 'GTM-XXXXXXX' }),
          metaPixel({ pixelId: '123456789012345' }),
          {
            id: 'custom-script',
            src: 'https://example.com/script.js',
            category: 'analytics',
          }
        ],
      }}
    >
      {children}
    </ConsentManagerProvider>
  );
}
```

---

## Callbacks

```tsx
<ConsentManagerProvider
  options={{
    callbacks: {
      onConsentSet({ preferences, allConsented, anyConsented }) {
        console.log('Consent updated:', preferences);

        if (preferences.measurement) {
          // Initialize analytics
        }
      },
      onBannerFetched(payload) {
        console.log('Banner fetched:', payload);
      },
      onError({ error }) {
        console.error('Consent error:', error);
      }
    }
  }}
>
```

---

## Storing Consent

### Hosted Mode (c15t backend)

```tsx
<ConsentManagerProvider
  options={{
    mode: 'c15t',
    backendURL: 'https://your-instance.consent.io',
  }}
>
```

### Offline Mode (browser storage)

```tsx
<ConsentManagerProvider
  options={{
    mode: 'offline',
  }}
>
```

---

## Headless Mode

For reduced bundle size, use headless package:

```bash
npm install @c15t/react-headless
```

```tsx
import { ConsentManagerProvider } from '@c15t/react-headless';

// No UI components included - build your own UI
```

---

## Component Reference

### CookieBanner

Displays the initial consent banner:

```tsx
import { CookieBanner } from '@c15t/react';

<CookieBanner />
```

### ConsentManagerDialog

Modal for detailed consent preferences:

```tsx
import { ConsentManagerDialog } from '@c15t/react';

<ConsentManagerDialog />
```

### ConsentManagerWidget

Composable widget for custom UIs:

```tsx
import { ConsentManagerWidget } from '@c15t/react';

<ConsentManagerWidget />
```

### Frame

Conditionally render content based on consent:

```tsx
import { Frame } from '@c15t/react';

<Frame category="marketing" fallback={<p>Content blocked</p>}>
  <iframe src="https://youtube.com/embed/xxx" />
</Frame>
```
