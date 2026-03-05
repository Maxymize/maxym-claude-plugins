---
name: c15t-consent
description: Implement GDPR/CCPA-compliant consent management with c15t. Use when implementing cookie banners, consent dialogs, analytics script loading based on consent, privacy preferences, or any consent-related UI. Covers React, Next.js, and vanilla JavaScript setups with integrations for Google Tag Manager, Meta Pixel, PostHog, TikTok, LinkedIn, and more. Supports both hosted (consent.io) and self-hosted backends.
---

# c15t Consent Management

## Overview

c15t is an open-source consent management system for building GDPR, CCPA, and other privacy regulation compliant applications. It provides cookie banners, consent dialogs, script loading based on consent, and backend storage for consent records.

## 🚨 Critical Patterns (Quick Reference)

**Avoid these blocking errors - see "Detailed Implementation Patterns" section at the end for full code examples.**

| Pattern | ❌ WRONG | ✅ CORRECT |
|---------|----------|------------|
| **Server/Client Split** | `'use client'` on ConsentManagerProvider | Keep ConsentProvider as SERVER component, callbacks in CLIENT component |
| **Database Adapter** | `drizzleAdapter` | `kyselyAdapter` with `kysely` + `pg` packages |
| **i18n Routing** | ConsentProvider in root layout | ConsentProvider in `app/[locale]/layout.tsx` with locale prop |
| **Backend URL** | `backendURL: '/api/c15t?locale=it'` | `backendURL: '/api/c15t'` (no query params) |
| **Migrations** | Skip migrations | Run `npx tsx scripts/migrate-c15t.ts` BEFORE using backend |

**Component nesting order:**
```
ConsentProvider (server) → ConsentManagerClient (client) → CookieBanner (client) → children
```

**Required packages:** `@c15t/nextjs`, `@c15t/backend`, `kysely`, `pg`

## Workflow Decision Tree

```
User request received
        │
        ▼
┌───────────────────┐
│ 1. Analyze Design │  → [styling-theming.md]
│    System         │     Extract colors, fonts,
└───────────────────┘     radius, shadows
        │
        ▼
┌───────────────────┐
│ 2. What framework?│
└───────────────────┘
        │
   ┌────┴────┬──────────┐
   ▼         ▼          ▼
Next.js   React    Vanilla JS
   │         │          │
   ▼         ▼          ▼
[nextjs-   [react-   [javascript-
 setup.md]  setup.md]  setup.md]
        │
        ▼
┌───────────────────┐
│ 3. Need backend?  │
│    (audit trail)  │
└───────────────────┘
        │
   ┌────┴────┐
   ▼         ▼
  Yes       No
   │         │
   │         ▼
   │      mode: 'offline'
   ▼
┌───────────────────┐
│ 4. Which database?│  ← ASK USER
└───────────────────┘
   │
   ├─→ Neon      → Use skill: neon-code-exec
   ├─→ Supabase  → Use skill: supabase-code-exec
   ├─→ Other SQL → [self-hosting.md]
   └─→ MongoDB   → [self-hosting.md]
        │
        ▼
┌───────────────────┐
│ 5. Need analytics?│
└───────────────────┘
        │
   ┌────┴────┐
   ▼         ▼
  Yes       No
   │         │
   ▼         ▼
[integrations.md]  Done
```

## Design-First Implementation

**ALWAYS analyze the site's design system BEFORE implementing c15t components.**

### Design Analysis Checklist

1. **Find design tokens** in `tailwind.config.js`, `globals.css`, or `theme.ts`
2. **Extract**:
   - Primary/secondary colors
   - Border radius values
   - Font family and weights
   - Shadow styles
   - Button variants
3. **Apply to theme** using CSS variables or Tailwind classes

See [styling-theming.md](references/styling-theming.md) for complete theming guide.

### Quick Theme Example

```tsx
// After analyzing site: uses Indigo (#6366f1), rounded-xl, Inter font
<CookieBanner
  theme={{
    'banner.card': {
      className: 'bg-white rounded-xl shadow-lg',
      style: {
        '--banner-font-family': 'Inter, sans-serif',
      },
    },
    'banner.footer.accept-button': 'bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg',
    'banner.footer.reject-button': 'bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg',
  }}
/>
```

## Quick Start - React

```tsx
import {
  ConsentManagerProvider,
  CookieBanner,
  ConsentManagerDialog,
} from '@c15t/react';

export function App({ children }) {
  return (
    <ConsentManagerProvider
      options={{
        mode: 'c15t',
        backendURL: 'https://your-instance.c15t.dev',
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

## Quick Start - Next.js App Router

```tsx
// app/consent-manager.tsx
'use client';

import {
  ConsentManagerProvider,
  CookieBanner,
  ConsentManagerDialog,
} from '@c15t/nextjs';

export default function ConsentManager({ children }) {
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
      {children}
    </ConsentManagerProvider>
  );
}

// app/layout.tsx
import ConsentManager from './consent-manager';

export default function Layout({ children }) {
  return <ConsentManager>{children}</ConsentManager>;
}
```

## Consent Categories

| Category | Purpose | Required |
|----------|---------|----------|
| `necessary` | Essential site functionality | Always on |
| `functional` | Enhanced features, preferences | Optional |
| `measurement` | Analytics (GA4, PostHog, etc.) | Optional |
| `marketing` | Advertising (Meta, TikTok, etc.) | Optional |

## Script Loading

Load analytics/marketing scripts only when consent is granted:

```tsx
import { ConsentManagerProvider } from '@c15t/react';
import { googleTagManager } from '@c15t/scripts/google-tag-manager';
import { metaPixel } from '@c15t/scripts/meta-pixel';

<ConsentManagerProvider
  options={{
    scripts: [
      googleTagManager({ id: 'GTM-XXXXXXX' }),
      metaPixel({ pixelId: '123456789012345' }),
    ],
  }}
>
```

## Checking Consent

```tsx
import { useConsentManager } from '@c15t/react';

function MyComponent() {
  const { has, setConsent } = useConsentManager();

  // Simple check
  if (has('marketing')) {
    initializeAds();
  }

  // Complex check
  const canTrack = has({
    and: ['measurement', { or: ['functional', 'marketing'] }]
  });

  return (
    <button onClick={() => setConsent('marketing', true)}>
      Enable Personalized Ads
    </button>
  );
}
```

## Storage Modes

### Offline (localStorage only)
```tsx
options={{
  mode: 'offline',
}}
```
No backend needed. Good for simple sites, portfolios, blogs.

### Self-Hosted (with database)

**ASK USER: "Which database do you want to use for consent storage?"**

| Database | Adapter to Use | Skill/Tool | Free Tier |
|----------|----------------|------------|-----------|
| **Neon** | **Kysely** ✅ | `neon-code-exec` skill | 0.5GB |
| **Supabase** | **Kysely** ✅ | `supabase-code-exec` skill | 500MB |
| **Other PostgreSQL** | **Kysely** ✅ | Manual | - |
| **MySQL** | Kysely | Manual | - |
| **MongoDB** | MongoDB | Manual | Atlas 512MB |

**⚠️ IMPORTANT: Use Kysely adapter, NOT Drizzle** (see Critical Implementation Patterns above)

#### Neon (Recommended for Next.js)

1. **Use `neon-code-exec` skill** to create database and get connection string
2. **Configure c15t with Kysely adapter:**

```tsx
// lib/c15t.ts
import { c15tInstance } from '@c15t/backend/v2';
import { kyselyAdapter } from '@c15t/backend/v2/db/adapters/kysely';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

export const c15t = c15tInstance({
  appName: 'my-app',
  basePath: '/api/c15t',
  adapter: kyselyAdapter({
    db: new Kysely({
      dialect: new PostgresDialect({
        pool: new Pool({
          connectionString: process.env.DATABASE_URL
        })
      })
    }),
    provider: 'postgresql'
  }),
  trustedOrigins: ['localhost', 'myapp.com'],
});
```

3. **Run migrations:** Create `scripts/migrate-c15t.ts` (see project example)
4. **Execute:** `npx tsx scripts/migrate-c15t.ts`

**Required packages:**
```bash
npm install kysely pg @c15t/backend @c15t/nextjs
```

#### Supabase

1. **Use `supabase-code-exec` skill** to execute SQL and manage schema
2. **Configure with Kysely adapter:**

```tsx
import { c15tInstance } from '@c15t/backend/v2';
import { kyselyAdapter } from '@c15t/backend/v2/db/adapters/kysely';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

export const c15t = c15tInstance({
  adapter: kyselyAdapter({
    db: new Kysely({
      dialect: new PostgresDialect({
        pool: new Pool({
          connectionString: process.env.SUPABASE_DATABASE_URL
        })
      })
    }),
    provider: 'postgresql'
  })
});
```

#### Database NOT Supported

| Database | Status | Alternative |
|----------|--------|-------------|
| **Convex** | ❌ Not compatible | Use Neon alongside Convex |
| **Firebase** | ❌ Not compatible | Use offline mode |
| **PlanetScale** | ⚠️ Via MySQL adapter | Limited support |

See [self-hosting.md](references/self-hosting.md) for complete adapter documentation.

## Reference Files

| File | Contents |
|------|----------|
| [styling-theming.md](references/styling-theming.md) | **Design analysis workflow**, CSS variables, theme keys, Tailwind, dark mode |
| [nextjs-setup.md](references/nextjs-setup.md) | Next.js App/Pages Router setup, rewrites, ClientSideOptionsProvider |
| [react-setup.md](references/react-setup.md) | React setup, callbacks, headless mode |
| [javascript-setup.md](references/javascript-setup.md) | Vanilla JS setup, store API, DOM integration |
| [components.md](references/components.md) | All React components (CookieBanner, ConsentManagerDialog, Frame, etc.) |
| [hooks-store.md](references/hooks-store.md) | useConsentManager hook, store API, consent checking, location info |
| [integrations.md](references/integrations.md) | GTM, GA4, Meta Pixel, PostHog, TikTok, LinkedIn, Microsoft UET, X Pixel |
| [self-hosting.md](references/self-hosting.md) | Backend setup, database adapters, Cloudflare Workers |

## Common Patterns

### Conditional Content Based on Consent

```tsx
import { Frame } from '@c15t/react';

<Frame
  category="marketing"
  fallback={<p>Enable marketing cookies to view video</p>}
>
  <iframe src="https://youtube.com/embed/xxx" />
</Frame>
```

### Custom Banner Buttons

```tsx
<CookieBanner.Root>
  <CookieBanner.Card>
    <CookieBanner.Header>
      <CookieBanner.Title>We value your privacy</CookieBanner.Title>
    </CookieBanner.Header>
    <CookieBanner.Footer>
      <CookieBanner.RejectButton>Decline</CookieBanner.RejectButton>
      <CookieBanner.CustomizeButton>Settings</CookieBanner.CustomizeButton>
      <CookieBanner.AcceptButton>Accept All</CookieBanner.AcceptButton>
    </CookieBanner.Footer>
  </CookieBanner.Card>
</CookieBanner.Root>
```

### Callbacks for Analytics Initialization

```tsx
<ConsentManagerProvider
  options={{
    callbacks: {
      onConsentSet({ preferences }) {
        if (preferences.measurement) {
          posthog.opt_in_capturing();
        } else {
          posthog.opt_out_capturing();
        }
      },
    },
  }}
>
```

### Legal Links in Dialog

```tsx
<ConsentManagerProvider
  options={{
    legalLinks: {
      privacyPolicy: { href: '/privacy', label: 'Privacy Policy' },
      cookiePolicy: { href: '/cookies', label: 'Cookie Policy' },
    },
  }}
>
  <ConsentManagerDialog legalLinks={['privacyPolicy', 'cookiePolicy']} />
</ConsentManagerProvider>
```

## Packages

| Package | Purpose |
|---------|---------|
| `@c15t/react` | React components and hooks |
| `@c15t/react-headless` | Headless (no UI) for custom designs |
| `@c15t/nextjs` | Next.js-optimized components |
| `@c15t/nextjs/client` | **REQUIRED** for Next.js 15 App Router client components |
| `@c15t/scripts` | Prebuilt analytics integrations |
| `@c15t/backend` | Self-hosted backend |
| `@c15t/backend/v2/db/adapters/kysely` | **REQUIRED** Kysely database adapter |
| `@c15t/cli` | CLI for setup and migrations |
| `c15t` | Core vanilla JavaScript library |
| `kysely` | **REQUIRED** SQL query builder for database adapter |
| `pg` | **REQUIRED** PostgreSQL client for Kysely |

## 🔧 Troubleshooting Common Errors

### Error: "headers() was called outside a request scope"

**Cause:** ConsentManagerProvider marked as `'use client'` or callbacks/scripts in server component

**Solution:** Separate server and client components (see **Pattern 1** in "Detailed Implementation Patterns" section)

```tsx
// ❌ WRONG
'use client';
<ConsentManagerProvider options={{ callbacks: {...} }}>

// ✅ CORRECT
// ConsentProvider.tsx (server - no 'use client')
<ConsentManagerProvider options={{ mode: 'c15t', ... }}>

// ConsentManagerClient.tsx ('use client')
<ClientSideOptionsProvider callbacks={{...}}>
```

**Special case: Localized apps with `[locale]` routing** - See **Pattern 4** in "Detailed Implementation Patterns" section for complete i18n solution.

### Error: "[fumadb] Drizzle adapter requires query mode"

**Cause:** Using `drizzleAdapter` instead of `kyselyAdapter`

**Solution:** Switch to Kysely adapter (see **Pattern 2** in "Detailed Implementation Patterns" section)

```bash
npm install kysely pg
```

```tsx
// ❌ WRONG
import { drizzleAdapter } from '@c15t/backend/v2/db/adapters/drizzle';

// ✅ CORRECT
import { kyselyAdapter } from '@c15t/backend/v2/db/adapters/kysely';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
```

### Error: "Cannot find module '@c15t/nextjs/client'"

**Cause:** Missing package or incorrect import

**Solution:** Install correct package and use proper import

```bash
npm install @c15t/nextjs
```

```tsx
import { ClientSideOptionsProvider } from '@c15t/nextjs/client';
```

### Error: Banner not showing in development

**Cause:** GeoLocation blocking (c15t hides banner in certain regions by default)

**Solution:** Add `ignoreGeoLocation` flag in development

```tsx
<ConsentManagerProvider
  options={{
    mode: 'c15t',
    ignoreGeoLocation: process.env.NODE_ENV === 'development', // Always show in dev
  }}
>
```

### Error: Database connection failed

**Cause:** Missing DATABASE_URL or incorrect connection string

**Solution:**

1. Check `.env` or `.env.local`:
```bash
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
```

2. Verify connection string format for your database:
   - **Neon:** `postgresql://[user]:[password]@[endpoint]/[database]?sslmode=require`
   - **Supabase:** `postgresql://postgres:[password]@[project-ref].pooler.supabase.com:6543/postgres`

3. Test connection:
```bash
npx tsx scripts/migrate-c15t.ts
```

### Error: TypeScript errors on theme customization

**Cause:** Invalid theme keys or complex custom theming

**Solution:** Start with default components, add theming incrementally

```tsx
// ✅ Start simple
<CookieBanner />

// ✅ Then add basic styling
<CookieBanner
  theme={{
    'banner.footer.accept-button': 'bg-blue-600 text-white'
  }}
/>
```

For complex theming, see [styling-theming.md](references/styling-theming.md)

### Error: Callbacks not firing

**Cause:** Callbacks in wrong component (server vs client)

**Solution:** Move callbacks to `ClientSideOptionsProvider`

```tsx
// ❌ WRONG - callbacks in ConsentManagerProvider
<ConsentManagerProvider options={{ callbacks: {...} }}>

// ✅ CORRECT - callbacks in ClientSideOptionsProvider
<ClientSideOptionsProvider callbacks={{
  onConsentSet(response) {
    console.log('Consent set:', response);
  }
}}>
```

### Build succeeds but runtime error

**Cause:** Component architecture mismatch

**Solution:** Follow exact pattern from **Pattern 3** in "Detailed Implementation Patterns" section

**Required structure:**
```
ConsentProvider (server)
  └─ ConsentManagerClient (client)
      ├─ CookieBanner (client)
      └─ children
```

### Migration fails with "relation already exists"

**Cause:** Tables already created (safe to ignore if using `IF NOT EXISTS`)

**Solution:** This is normal - migrations are idempotent

If you need fresh tables:
```sql
-- Run this in your database console
DROP TABLE IF EXISTS c15t_consent_preferences CASCADE;
DROP TABLE IF EXISTS c15t_consent_records CASCADE;
```

Then re-run migration:
```bash
npx tsx scripts/migrate-c15t.ts
```

---

## 📖 Detailed Implementation Patterns (Reference)

**This section contains complete code examples for the patterns summarized in "Critical Patterns (Quick Reference)" at the top.**

### Pattern 1: Next.js 15 App Router - Server/Client Separation

**❌ WRONG - Will cause "headers() called outside request scope" error:**
```tsx
// DON'T: Put everything in a 'use client' component
'use client';
import { ConsentManagerProvider } from '@c15t/nextjs';

export function ConsentProvider({ children }) {
  return (
    <ConsentManagerProvider options={{ mode: 'c15t', backendURL: '/api/c15t' }}>
      {/* callbacks here */}
      {children}
    </ConsentManagerProvider>
  );
}
```

**✅ CORRECT - Separate server and client concerns:**
```tsx
// ConsentProvider.tsx (SERVER component - no 'use client')
import { ConsentManagerProvider } from '@c15t/nextjs';

export function ConsentProvider({ children }) {
  return (
    <ConsentManagerProvider
      options={{
        mode: 'c15t',
        backendURL: '/api/c15t',
        consentCategories: ['necessary', 'functionality', 'measurement', 'marketing'],
        ignoreGeoLocation: process.env.NODE_ENV === 'development',
        legalLinks: {
          privacyPolicy: { href: '/privacy', label: 'Privacy Policy' },
          cookiePolicy: { href: '/cookies', label: 'Cookie Policy' }
        }
      }}
    >
      {children}
    </ConsentManagerProvider>
  );
}

// ConsentManagerClient.tsx (CLIENT component for callbacks/scripts)
'use client';
import { ClientSideOptionsProvider } from '@c15t/nextjs/client';

export function ConsentManagerClient({ children }) {
  return (
    <ClientSideOptionsProvider
      callbacks={{
        onBannerFetched(response) {
          console.log('Banner fetched', response);
        },
        onConsentSet(response) {
          console.log('Consent set', response);
        },
        onError(error) {
          console.error('c15t error', error);
        }
      }}
    >
      {children}
    </ClientSideOptionsProvider>
  );
}

// app/layout.tsx
import { ConsentProvider } from '@/components/consent/ConsentProvider';
import { ConsentManagerClient } from '@/components/consent/ConsentManagerClient';
import { CookieBanner } from '@/components/consent/CookieBanner';

export default function Layout({ children }) {
  return (
    <ConsentProvider>
      <ConsentManagerClient>
        <CookieBanner />
        {children}
      </ConsentManagerClient>
    </ConsentProvider>
  );
}
```

**Why this matters:**
- `ConsentManagerProvider` needs to run server-side to access Next.js APIs like `headers()`
- Callbacks and scripts must be client-side (cannot be serialized)
- Mixing them causes runtime errors in Next.js 15

### Pattern 2: Database Adapter - Kysely (NOT Drizzle)

**❌ WRONG - Drizzle causes "query mode" errors:**
```tsx
import { drizzleAdapter } from '@c15t/backend/v2/db/adapters/drizzle';
import { drizzle } from 'drizzle-orm/postgres-js';

const db = drizzle(queryClient); // Missing query mode config
export const c15t = c15tInstance({
  adapter: drizzleAdapter({ db, provider: 'postgresql' }) // WILL FAIL
});
```

**✅ CORRECT - Use Kysely adapter (officially documented):**
```tsx
import { kyselyAdapter } from '@c15t/backend/v2/db/adapters/kysely';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

export const c15t = c15tInstance({
  adapter: kyselyAdapter({
    db: new Kysely({
      dialect: new PostgresDialect({
        pool: new Pool({
          connectionString: process.env.DATABASE_URL
        })
      })
    }),
    provider: 'postgresql'
  })
});
```

**Why this matters:**
- ALL c15t documentation examples use Kysely
- Drizzle adapter exists but requires undocumented "query mode" configuration
- Kysely is the officially supported and tested adapter
- Using Kysely prevents "[fumadb] Drizzle adapter requires query mode" errors

**Required packages:**
```bash
npm install kysely pg
```

### Pattern 3: Component Architecture

**Required file structure:**
```
src/components/consent/
├── ConsentProvider.tsx          # Server component (options)
├── ConsentManagerClient.tsx     # Client component (callbacks/scripts)
├── ConsentMonitor.tsx           # Client component (GA4 integration)
├── CookieBanner.tsx             # Client component (UI)
└── GoogleAnalytics.tsx          # Client component (GA script)
```

**Integration order in layout.tsx:**
```tsx
<ConsentProvider>              {/* Server: base configuration */}
  <ConsentManagerClient>       {/* Client: callbacks, scripts */}
    <CookieBanner />          {/* Client: UI component */}
    {children}
  </ConsentManagerClient>
</ConsentProvider>
```

### Pattern 4: Internationalization (i18n) with Dynamic Language Switching

**Problem:** Cookie banner doesn't change language when user switches locale via language selector (requires hard refresh)

**Root Cause:** Using client-side locale detection (`usePathname()`) inside a client component that wraps `ConsentManagerProvider`

**✅ CORRECT Architecture for i18n:**

1. **Place ConsentProvider in `[locale]/layout.tsx`** (not root layout):
```tsx
// app/[locale]/layout.tsx - SERVER component
import { ConsentProvider } from '@/components/consent/ConsentProvider';

type SupportedLocale = 'en' | 'it' | 'es';

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  const supportedLocales: SupportedLocale[] = ['en', 'it', 'es'];
  const validLocale = supportedLocales.includes(locale as SupportedLocale)
    ? (locale as SupportedLocale)
    : 'en';

  // ConsentProvider is a SERVER component - receives locale from URL params
  return (
    <ConsentProvider locale={validLocale}>
      {children}
    </ConsentProvider>
  );
}
```

2. **Create ConsentProvider as SERVER component** (no 'use client'):
```tsx
// src/components/consent/ConsentProvider.tsx - NO 'use client'
import { ConsentManagerProvider } from '@c15t/nextjs';
import { ConsentManagerClient } from './ConsentManagerClient';
import { CookieBannerClient } from './CookieBannerClient';

export function ConsentProvider({ children, locale = 'en' }) {
  const legalLinks = {
    privacyPolicy: {
      href: `/${locale}/legal/privacy-policy`,
      label: locale === 'it' ? 'Informativa sulla Privacy' :
             locale === 'es' ? 'Política de Privacidad' :
             'Privacy Policy'
    },
    cookiePolicy: {
      href: `/${locale}/legal/cookie-policy`,
      label: locale === 'it' ? 'Politica sui Cookie' :
             locale === 'es' ? 'Política de Cookies' :
             'Cookie Policy'
    }
  };

  return (
    <ConsentManagerProvider
      options={{
        mode: 'c15t',
        backendURL: '/api/c15t',  // NO query params - use Referer header
        consentCategories: ['necessary', 'functionality', 'measurement', 'marketing'],
        ignoreGeoLocation: process.env.NODE_ENV === 'development',
        legalLinks,
      }}
    >
      <ConsentManagerClient>
        <CookieBannerClient locale={locale} legalLinks={legalLinks} />
        {children}
      </ConsentManagerClient>
    </ConsentManagerProvider>
  );
}
```

3. **Create CookieBannerClient as CLIENT component** with translated text:
```tsx
// src/components/consent/CookieBannerClient.tsx
'use client';

import { CookieBanner, ConsentManagerDialog } from '@c15t/nextjs';
import { getDirectTranslations } from '@/lib/c15t-translations';

export function CookieBannerClient({ locale, legalLinks }) {
  const translations = getDirectTranslations(locale);

  return (
    <>
      <CookieBanner
        title={translations.cookieBanner.title}
        description={translations.cookieBanner.description}
        acceptButtonText={translations.common.acceptAll}
        rejectButtonText={translations.common.rejectAll}
        customizeButtonText={translations.common.customize}
      />
      <ConsentManagerDialog legalLinks={['privacyPolicy', 'cookiePolicy']} />
    </>
  );
}
```

4. **Create translations file:**
```tsx
// src/lib/c15t-translations.ts
const translations = {
  en: {
    common: { acceptAll: 'Accept All', rejectAll: 'Reject All', customize: 'Customize' },
    cookieBanner: {
      title: 'We Respect Your Privacy',
      description: 'This site uses cookies to enhance your browsing experience...'
    }
  },
  it: {
    common: { acceptAll: 'Accetta Tutto', rejectAll: 'Rifiuta Tutto', customize: 'Personalizza' },
    cookieBanner: {
      title: 'Rispettiamo la Tua Privacy',
      description: 'Questo sito utilizza cookie per migliorare la tua esperienza...'
    }
  },
  es: { /* Spanish translations */ }
};

export function getDirectTranslations(locale: 'en' | 'it' | 'es') {
  return translations[locale] || translations.en;
}
```

**Why this works:**
- Locale comes from Next.js routing params (server-side)
- No client-side `usePathname()` or `window.location` detection
- When user navigates to `/it/`, Next.js renders with `locale='it'`
- `ConsentProvider` re-renders with new locale automatically
- No hard refresh needed

**Key points:**
- `backendURL` should be plain `/api/c15t` (no query parameters)
- API route can extract locale from `Referer` header if needed
- Direct text props on `CookieBanner` ensure immediate translation updates

### Pattern 5: Database Migration

**Always run migrations BEFORE using c15t backend:**
```bash
npx tsx scripts/migrate-c15t.ts
```

**Migration creates:**
- `c15t_consent_records` - Main consent storage
- `c15t_consent_preferences` - Category-level tracking
- 5 optimized indexes

**Check existing implementation in project:**
- Migration script: `scripts/migrate-c15t.ts`
- Uses Neon serverless SQL client
- Safe to run multiple times (uses `IF NOT EXISTS`)
