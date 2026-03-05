# c15t Hooks and Store

## Table of Contents
- [useConsentManager Hook](#useconsentmanager-hook)
- [Store API](#store-api)
- [Checking Consent](#checking-consent)
- [Setting Consent](#setting-consent)
- [Location Info](#location-info)

---

## useConsentManager Hook

Access consent state and methods from any component.

```tsx
import { useConsentManager } from '@c15t/react';

function MyComponent() {
  const {
    // State
    consents,           // Current consent preferences
    showPopup,          // Should show banner?
    locationInfo,       // User location (for GDPR/CCPA)
    isPrivacyDialogOpen,

    // Methods
    has,                // Check consent
    setConsent,         // Set and save consent
    setSelectedConsent, // Set without saving
    saveConsents,       // Save current selections
    setIsPrivacyDialogOpen,
    setLocationInfo,
  } = useConsentManager();

  return (
    <div>
      {has('marketing') && <MarketingComponent />}
      <button onClick={() => setIsPrivacyDialogOpen(true)}>
        Privacy Settings
      </button>
    </div>
  );
}
```

---

## Store API

For vanilla JavaScript usage:

```ts
import { createConsentManagerStore, configureConsentManager } from 'c15t';

const consentManager = configureConsentManager({
  mode: 'c15t',
  backendURL: 'https://your-instance.c15t.dev',
});

const store = createConsentManagerStore(consentManager, {
  initialGdprTypes: ['necessary', 'marketing'],
  ignoreGeoLocation: true, // dev mode
});

// Access state
const state = store.getState();
console.log(state.consents);

// Check consent
const hasMarketing = state.has('marketing');

// Set consent
state.setConsent('marketing', true);
```

---

## Checking Consent

The `has()` method supports simple and complex checks.

### Simple Check

```tsx
const hasAnalytics = has('measurement');
const hasMarketing = has('marketing');

if (hasMarketing) {
  initializeAds();
}
```

### Complex Checks

```tsx
// AND logic - all must be true
const hasAnalyticsAndMarketing = has({
  and: ['measurement', 'marketing'],
});

// OR logic - any must be true
const hasEitherAnalyticsOrMarketing = has({
  or: ['measurement', 'marketing'],
});

// NOT logic
const doesNotHaveMarketing = has({
  not: 'marketing',
});

// Nested checks
const complexCondition = has({
  and: [
    'necessary',
    { or: ['measurement', 'marketing'] },
    { not: 'advertising' },
  ]
});
```

---

## Setting Consent

### setSelectedConsent()

Sets consent choice without saving (for dialog/form use).

```tsx
// User toggles marketing switch
setSelectedConsent('marketing', true);
setSelectedConsent('measurement', false);

// Later, save all selections
saveConsents('custom');
```

### saveConsents()

Saves consent preferences and triggers callbacks.

```tsx
// Accept all
saveConsents('all');

// Save custom selections (from setSelectedConsent)
saveConsents('custom');

// Reject all (keep necessary only)
saveConsents('necessary');
```

### setConsent()

Convenience method - sets and saves in one call.

```tsx
// Enable marketing consent immediately
setConsent('marketing', true);

// Disable measurement
setConsent('measurement', false);
```

---

## Location Info

Access user location for jurisdiction-based consent (GDPR, CCPA, etc.).

```tsx
const { locationInfo, setLocationInfo } = useConsentManager();

// locationInfo is auto-populated from backend
console.log(locationInfo);
// { countryCode: 'DE', regionCode: 'BY', jurisdiction: 'GDPR' }

// Manual override if needed
setLocationInfo({
  countryCode: 'US',
  regionCode: 'CA',
  jurisdiction: 'CCPA'
});

// Clear location
setLocationInfo(null);
```

### LocationInfo Type

```ts
interface LocationInfo {
  countryCode: string;    // ISO 3166-1 alpha-2 (e.g., 'US', 'DE')
  regionCode?: string;    // Region/state code (e.g., 'CA', 'BY')
  jurisdiction?: string;  // 'GDPR' | 'CCPA' | etc.
}
```

---

## Consent Categories

Standard categories used across c15t:

| Category | Purpose | Always Required |
|----------|---------|-----------------|
| `necessary` | Essential cookies | Yes |
| `functional` | Enhanced functionality | No |
| `measurement` | Analytics | No |
| `marketing` | Advertising | No |

```tsx
// Configure categories
<ConsentManagerProvider
  options={{
    consentCategories: ['necessary', 'functional', 'measurement', 'marketing'],
  }}
>
```
