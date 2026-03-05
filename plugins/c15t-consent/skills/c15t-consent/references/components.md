# c15t React Components

## Table of Contents
- [ConsentManagerProvider](#consentmanagerprovider)
- [CookieBanner](#cookiebanner)
- [ConsentManagerDialog](#consentmanagerdialog)
- [ConsentManagerWidget](#consentmanagerwidget)
- [Frame](#frame)

---

## ConsentManagerProvider

Root component that provides consent context to all child components.

```tsx
import { ConsentManagerProvider } from '@c15t/react';

<ConsentManagerProvider
  options={{
    mode: 'c15t', // or 'offline'
    backendURL: 'https://your-instance.c15t.dev',
    consentCategories: ['necessary', 'functional', 'measurement', 'marketing'],
    ignoreGeoLocation: false, // Set true for development
    legalLinks: {
      privacyPolicy: { href: '/privacy', label: 'Privacy Policy' },
      cookiePolicy: { href: '/cookies', label: 'Cookie Policy' },
      termsOfService: { href: '/terms', label: 'Terms of Service' },
    },
    callbacks: {
      onConsentSet({ preferences }) { /* ... */ },
      onBannerFetched(payload) { /* ... */ },
      onError({ error }) { /* ... */ },
    },
    scripts: [/* analytics scripts */],
  }}
>
  {children}
</ConsentManagerProvider>
```

### Options Reference

| Option | Type | Description |
|--------|------|-------------|
| `mode` | `'c15t'` \| `'offline'` | Storage mode |
| `backendURL` | `string` | consent.io instance URL |
| `consentCategories` | `string[]` | Categories to show |
| `ignoreGeoLocation` | `boolean` | Always show banner (dev) |
| `legalLinks` | `object` | Privacy/Terms links |
| `callbacks` | `object` | Event callbacks |
| `scripts` | `Script[]` | Scripts to load |
| `translations` | `TranslationConfig` | i18n config |

---

## CookieBanner

Initial consent banner shown to users.

```tsx
import { CookieBanner } from '@c15t/react';

// Simple usage
<CookieBanner />

// With legal links
<CookieBanner legalLinks={['privacyPolicy', 'cookiePolicy']} />

// Expanded/composable usage
<CookieBanner.Root>
  <CookieBanner.Card>
    <CookieBanner.Header>
      <CookieBanner.Title>Custom Title</CookieBanner.Title>
      <CookieBanner.Description>Custom description</CookieBanner.Description>
    </CookieBanner.Header>
    <CookieBanner.Footer>
      <CookieBanner.RejectButton>Decline</CookieBanner.RejectButton>
      <CookieBanner.CustomizeButton>Settings</CookieBanner.CustomizeButton>
      <CookieBanner.AcceptButton>Accept All</CookieBanner.AcceptButton>
    </CookieBanner.Footer>
  </CookieBanner.Card>
</CookieBanner.Root>
```

---

## ConsentManagerDialog

Modal for detailed consent preferences. Required by GDPR.

```tsx
import { ConsentManagerDialog } from '@c15t/react';

// Simple usage
<ConsentManagerDialog />

// With legal links
<ConsentManagerDialog legalLinks={['privacyPolicy', 'cookiePolicy']} />

// With focus trapping (default: true)
<ConsentManagerDialog trapFocus={true} />

// Expanded/composable usage
<ConsentManagerDialog.Root>
  <ConsentManagerDialog.Card>
    <ConsentManagerDialog.Header>
      <ConsentManagerDialog.HeaderTitle>Privacy Settings</ConsentManagerDialog.HeaderTitle>
      <ConsentManagerDialog.HeaderDescription>
        Customize your preferences
      </ConsentManagerDialog.HeaderDescription>
    </ConsentManagerDialog.Header>
    <ConsentManagerDialog.Content>
      <ConsentManagerWidget />
    </ConsentManagerDialog.Content>
    <ConsentManagerDialog.Footer>
      Custom Footer
    </ConsentManagerDialog.Footer>
  </ConsentManagerDialog.Card>
</ConsentManagerDialog.Root>
```

---

## ConsentManagerWidget

Composable widget for building custom consent UIs.

```tsx
import { ConsentManagerWidget } from '@c15t/react';

// Simple usage - renders consent toggles
<ConsentManagerWidget />

// Within custom dialog
<ConsentManagerDialog.Content>
  <ConsentManagerWidget />
</ConsentManagerDialog.Content>
```

---

## Frame

Conditionally render content based on consent category.

```tsx
import { Frame } from '@c15t/react';

// Block content until marketing consent given
<Frame
  category="marketing"
  fallback={<p>Enable marketing cookies to view this content</p>}
>
  <iframe src="https://youtube.com/embed/xxx" />
</Frame>

// Multiple categories (AND logic)
<Frame category={['marketing', 'measurement']}>
  <AnalyticsComponent />
</Frame>
```

### iframe Blocking (Headless)

```html
<!-- Renders immediately - no blocking -->
<iframe src="https://youtube.com/embed/unblocked" />

<!-- Blocked until consent granted -->
<iframe data-src="https://youtube.com/embed/123" data-category="marketing" />
```

---

## Headless Mode

For reduced bundle size, use headless package:

```bash
npm install @c15t/react-headless
```

```tsx
import { ConsentManagerProvider } from '@c15t/react-headless';

// No UI components included - build your own
```

---

## Accessibility Features

### Focus Management
- Traps focus within dialogs
- Sets initial focus on first interactive element
- Restores focus when dialog closes

### WCAG Compliance
- Supports 2.4.3 Focus Order
- Proper modal functionality
- Keyboard navigation support

```tsx
// Control focus trapping
<ConsentManagerDialog trapFocus={true} /> // default, recommended
<ConsentManagerDialog trapFocus={false} /> // not recommended
```
