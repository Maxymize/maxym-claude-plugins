# c15t Next.js Setup

## Table of Contents
- [CLI Setup (Recommended)](#cli-setup)
- [Manual Setup - App Router](#manual-setup-app-router)
- [Manual Setup - Pages Router](#manual-setup-pages-router)
- [Script Loader Configuration](#script-loader)
- [Client-Side Options](#client-side-options)

---

## CLI Setup

```bash
npx @c15t/cli generate
```

---

## Manual Setup - App Router

### 1. Install Package

```bash
npm install @c15t/nextjs
# or
pnpm add @c15t/nextjs
# or
yarn add @c15t/nextjs
```

### 2. Optional: Next.js Rewrites

Hide backend URL from users:

```ts
// next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/c15t/:path*',
        destination: `${process.env.NEXT_PUBLIC_C15T_URL}/:path*`,
      },
    ];
  },
};

export default config;
```

### 3. Create Consent Manager Component

```tsx
// app/consent-manager.tsx
import {
  ConsentManagerDialog,
  ConsentManagerProvider,
  CookieBanner,
} from '@c15t/nextjs';
import type { ReactNode } from 'react';

export default function ConsentManager({ children }: { children: ReactNode }) {
  return (
    <ConsentManagerProvider
      options={{
        mode: 'c15t',
        backendURL: '/api/c15t',
        consentCategories: ['necessary', 'marketing'],
        ignoreGeoLocation: true, // Set false in production
      }}
    >
      <CookieBanner />
      <ConsentManagerDialog />
      {children}
    </ConsentManagerProvider>
  );
}
```

### 4. Add to Layout

```tsx
// app/layout.tsx
import { ConsentManager } from './consent-manager';

export default function Layout({ children }: { children: ReactNode }) {
  return <ConsentManager>{children}</ConsentManager>;
}
```

---

## Manual Setup - Pages Router

### 1. Install and Create Provider

```tsx
// pages/_app.tsx
import { ConsentManagerProvider, CookieBanner, ConsentManagerDialog } from '@c15t/nextjs/pages';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ConsentManagerProvider
      options={{
        mode: 'c15t',
        backendURL: '/api/c15t',
        consentCategories: ['necessary', 'marketing'],
      }}
    >
      <CookieBanner />
      <ConsentManagerDialog />
      <Component {...pageProps} />
    </ConsentManagerProvider>
  );
}
```

---

## Script Loader

### App Router (Client Component Required)

```tsx
// app/consent-manager.client.tsx
'use client';

import { ClientSideOptionsProvider } from '@c15t/nextjs/client';
import { googleTagManager } from '@c15t/scripts/google-tag-manager';

export function ConsentManagerClient() {
  return (
    <ClientSideOptionsProvider
      scripts={[
        googleTagManager({ id: 'GTM-XXXXXXX' }),
        {
          id: 'custom-analytics',
          src: 'https://analytics.example.com/script.js',
          category: 'analytics',
        }
      ]}
    />
  );
}
```

Import in layout:

```tsx
// app/consent-manager.tsx
import { ConsentManagerProvider } from '@c15t/nextjs';
import { ConsentManagerClient } from './consent-manager.client';

export default function ConsentManager({ children }: { children: ReactNode }) {
  return (
    <ConsentManagerProvider options={{ /* ... */ }}>
      <ConsentManagerClient />
      {children}
    </ConsentManagerProvider>
  );
}
```

### Pages Router

```tsx
// pages/_app.tsx
import { ConsentManagerProvider } from '@c15t/nextjs/pages';
import { googleTagManager } from '@c15t/scripts/google-tag-manager';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ConsentManagerProvider
      options={{
        scripts: [
          googleTagManager({ id: 'GTM-XXXXXXX' }),
        ]
      }}
    >
      <Component {...pageProps} />
    </ConsentManagerProvider>
  );
}
```

---

## Client-Side Options

Scripts and callbacks cannot be serialized server-side. Use `ClientSideOptionsProvider`:

```tsx
'use client';

import { ClientSideOptionsProvider } from '@c15t/nextjs/client';

export function ConsentManagerClient() {
  return (
    <ClientSideOptionsProvider
      scripts={[/* scripts */]}
      callbacks={{
        onConsentSet({ preferences }) {
          console.log('Consent set:', preferences);
        },
        onBannerFetched(payload) {
          console.log('Banner fetched:', payload);
        },
        onError({ error }) {
          console.error('Error:', error);
        }
      }}
    />
  );
}
```

---

## Storing Consent Options

### Hosted (Recommended)

Use consent.io for managed storage:

```tsx
<ConsentManagerProvider
  options={{
    mode: 'c15t',
    backendURL: 'https://your-instance.consent.io',
  }}
>
```

### Offline Mode

Store locally in browser:

```tsx
<ConsentManagerProvider
  options={{
    mode: 'offline',
  }}
>
```
