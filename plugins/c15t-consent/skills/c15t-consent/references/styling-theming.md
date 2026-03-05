# c15t Styling and Theming Guide

## Table of Contents
- [Design Analysis Workflow](#design-analysis-workflow)
- [Theme System Overview](#theme-system-overview)
- [CSS Variables](#css-variables)
- [Theme Keys Reference](#theme-keys-reference)
- [Tailwind CSS Integration](#tailwind-css-integration)
- [Dark Mode Support](#dark-mode-support)
- [Complete Examples](#complete-examples)

---

## Design Analysis Workflow

Before implementing c15t components, analyze the site's design system to create cohesive consent UI.

### Step 1: Extract Design Tokens

Analyze the codebase for existing design patterns:

```bash
# Look for Tailwind config
tailwind.config.js / tailwind.config.ts

# Look for CSS variables
globals.css / variables.css / theme.css

# Look for design system files
design-tokens.ts / theme.ts / colors.ts
```

### Step 2: Identify Key Design Elements

| Element | What to Extract | Where to Apply |
|---------|-----------------|----------------|
| **Primary Color** | Brand/action color | Accept button, links |
| **Background** | Card/modal backgrounds | `--banner-background-color` |
| **Text Colors** | Headings, body text | Title, description |
| **Border Radius** | Buttons, cards, inputs | `--banner-border-radius` |
| **Shadows** | Card elevation | `--banner-box-shadow` |
| **Font Family** | Typography stack | `--banner-font-family` |
| **Button Styles** | Primary/secondary variants | Accept/Reject buttons |
| **Spacing** | Padding, gaps | Component spacing |

### Step 3: Map to c15t Theme

```tsx
// Example: Extracted from site analysis
const siteDesign = {
  primaryColor: '#6366f1',      // Indigo from Tailwind
  backgroundColor: '#ffffff',
  borderRadius: '0.75rem',      // rounded-xl
  fontFamily: 'Inter, sans-serif',
  shadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
};

// Apply to c15t theme
<CookieBanner
  theme={{
    'banner.card': {
      style: {
        '--banner-background-color': siteDesign.backgroundColor,
        '--banner-border-radius': siteDesign.borderRadius,
        '--banner-box-shadow': siteDesign.shadow,
        '--banner-font-family': siteDesign.fontFamily,
      },
    },
    'banner.footer.accept-button': {
      style: {
        '--button-primary-bg': siteDesign.primaryColor,
      },
    },
  }}
/>
```

---

## Theme System Overview

c15t uses a hierarchical theme key system:

```
'componentName.elementPath.subElement'

Examples:
- 'banner.root'
- 'banner.header.title'
- 'banner.footer.accept-button'
- 'dialog.card'
- 'widget.accordion.item'
```

### Theme Value Types

```tsx
// 1. String (class names)
'banner.root': 'my-custom-class'

// 2. Object with className and/or style
'banner.root': {
  className: 'my-custom-class',
  style: {
    '--banner-background-color': '#ffffff',
  },
}

// 3. CSS Modules
import styles from './Banner.module.css';
'banner.root': styles.container
```

---

## CSS Variables

### Cookie Banner Variables

```tsx
<CookieBanner
  theme={{
    'banner.card': {
      style: {
        // Background & Colors
        '--banner-background-color': '#ffffff',
        '--banner-border-color': '#e5e7eb',

        // Typography
        '--banner-font-family': 'Inter, sans-serif',
        '--banner-title-color': '#111827',
        '--banner-description-color': '#6b7280',

        // Spacing & Shape
        '--banner-border-radius': '12px',
        '--banner-padding': '24px',
        '--banner-box-shadow': '0 25px 50px -12px rgb(0 0 0 / 0.25)',

        // Width & Position
        '--banner-max-width': '420px',
      },
    },
  }}
/>
```

### Button Variables

```tsx
'banner.footer.accept-button': {
  style: {
    '--button-primary-bg': '#6366f1',
    '--button-primary-hover-bg': '#4f46e5',
    '--button-primary-text': '#ffffff',
    '--button-border-radius': '8px',
    '--button-padding-x': '16px',
    '--button-padding-y': '10px',
    '--button-font-weight': '500',
  },
}

'banner.footer.reject-button': {
  style: {
    '--button-secondary-bg': 'transparent',
    '--button-secondary-hover-bg': '#f3f4f6',
    '--button-secondary-text': '#374151',
    '--button-secondary-border': '1px solid #d1d5db',
  },
}
```

### Dialog Variables

```tsx
<ConsentManagerDialog
  theme={{
    'dialog.card': {
      style: {
        '--dialog-background-color': '#ffffff',
        '--dialog-border-radius': '16px',
        '--dialog-max-width': '500px',
        '--dialog-box-shadow': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
    },
    'dialog.overlay': {
      style: {
        '--dialog-overlay-bg': 'rgba(0, 0, 0, 0.5)',
        '--dialog-overlay-blur': '4px',
      },
    },
  }}
/>
```

### Widget/Accordion Variables

```tsx
'widget.accordion.item': {
  style: {
    '--accordion-item-bg': '#f9fafb',
    '--accordion-item-border': '1px solid #e5e7eb',
    '--accordion-item-border-radius': '8px',
  },
}

'widget.accordion.trigger': {
  style: {
    '--accordion-trigger-padding': '16px',
    '--accordion-trigger-hover-bg': '#f3f4f6',
  },
}
```

### Switch Variables

```tsx
'widget.switch': {
  style: {
    '--switch-bg': '#e5e7eb',
    '--switch-checked-bg': '#6366f1',
    '--switch-thumb-bg': '#ffffff',
    '--switch-border-radius': '9999px',
  },
}
```

---

## Theme Keys Reference

### CookieBanner Theme Keys

```tsx
const cookieBannerTheme = {
  'banner.root': '',           // Outer container
  'banner.card': '',           // Main card wrapper
  'banner.header': '',         // Header section
  'banner.header.title': '',   // Title text
  'banner.header.description': '', // Description text
  'banner.footer': '',         // Footer section
  'banner.footer.sub-group': '', // Button group wrapper
  'banner.footer.reject-button': '',
  'banner.footer.customize-button': '',
  'banner.footer.accept-button': '',
}
```

### ConsentManagerDialog Theme Keys

```tsx
const dialogTheme = {
  'dialog.root': '',           // Root container
  'dialog.overlay': '',        // Background overlay
  'dialog.card': '',           // Dialog card
  'dialog.header': '',
  'dialog.header.title': '',
  'dialog.header.description': '',
  'dialog.content': '',        // Contains widget
  'dialog.footer': '',
}
```

### ConsentManagerWidget Theme Keys

```tsx
const widgetTheme = {
  'widget.root': '',
  'widget.accordion': '',
  'widget.accordion.item': '',
  'widget.accordion.trigger': '',
  'widget.accordion.trigger-inner': '',
  'widget.accordion.content': '',
  'widget.footer': '',
  'widget.footer.sub-group': '',
  'widget.footer.reject-button': '',
  'widget.footer.accept-button': '',
  'widget.footer.save-button': '',
}
```

---

## Tailwind CSS Integration

### Direct Tailwind Classes

```tsx
<CookieBanner
  theme={{
    'banner.card': 'bg-white rounded-2xl shadow-2xl p-6 max-w-md',
    'banner.header.title': 'text-xl font-bold text-gray-900',
    'banner.header.description': 'text-sm text-gray-600 mt-2',
    'banner.footer': 'flex gap-3 mt-6',
    'banner.footer.accept-button': 'bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium',
    'banner.footer.reject-button': 'bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg',
  }}
/>
```

### Using !important Override

```tsx
// When default styles conflict
'banner.card': '!bg-red-500 !rounded-none'
```

### Combining with CSS Variables

```tsx
'banner.card': {
  className: 'bg-white rounded-2xl shadow-2xl',
  style: {
    '--banner-padding': '1.5rem',
  },
}
```

---

## Dark Mode Support

### Automatic Detection

c15t detects `.dark` class on root element by default.

### Manual Configuration

```tsx
<ConsentManagerProvider
  options={{
    react: {
      colorScheme: 'dark', // 'light' | 'dark' | 'system'
    },
  }}
>
```

### Dark Mode CSS Variables

```tsx
// Light mode
'banner.card': {
  style: {
    '--banner-background-color': '#ffffff',
    '--banner-title-color': '#111827',
  },
}

// Or use Tailwind dark mode
'banner.card': 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white'
```

---

## Complete Examples

### Example 1: Modern Minimal (Based on Site Analysis)

```tsx
// Site uses: Indigo primary, rounded-xl, Inter font, subtle shadows
<ConsentManagerProvider
  options={{
    mode: 'c15t',
    backendURL: 'https://your-instance.c15t.dev',
  }}
>
  <CookieBanner
    theme={{
      'banner.card': {
        className: 'bg-white border border-gray-200',
        style: {
          '--banner-border-radius': '1rem',
          '--banner-box-shadow': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          '--banner-font-family': 'Inter, sans-serif',
        },
      },
      'banner.header.title': 'text-lg font-semibold text-gray-900',
      'banner.header.description': 'text-sm text-gray-600 mt-2',
      'banner.footer': 'flex flex-col sm:flex-row gap-3 mt-6',
      'banner.footer.accept-button': 'bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors',
      'banner.footer.customize-button': 'bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition-colors',
      'banner.footer.reject-button': 'text-gray-500 hover:text-gray-700 px-4 py-2.5 font-medium transition-colors',
    }}
  />
</ConsentManagerProvider>
```

### Example 2: Brand Colors (E-commerce Site)

```tsx
// Site uses: Green primary (#10b981), rounded corners, bold CTAs
const ecommerceTheme = {
  'banner.card': {
    className: 'bg-white shadow-xl',
    style: {
      '--banner-border-radius': '0.75rem',
      '--banner-max-width': '400px',
    },
  },
  'banner.footer.accept-button': {
    className: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wide',
    style: {
      '--button-border-radius': '0.5rem',
    },
  },
  'banner.footer.reject-button': 'border-2 border-gray-300 text-gray-600 font-medium',
};
```

### Example 3: Dark Theme (SaaS Dashboard)

```tsx
const darkTheme = {
  'banner.card': {
    style: {
      '--banner-background-color': '#1f2937',
      '--banner-border-color': '#374151',
      '--banner-title-color': '#f9fafb',
      '--banner-description-color': '#9ca3af',
    },
  },
  'banner.footer.accept-button': {
    style: {
      '--button-primary-bg': '#3b82f6',
      '--button-primary-hover-bg': '#2563eb',
    },
  },
  'banner.footer.reject-button': {
    style: {
      '--button-secondary-bg': '#374151',
      '--button-secondary-text': '#e5e7eb',
    },
  },
};
```

### Example 4: No Default Styles (Full Custom)

```tsx
<CookieBanner
  noStyle
  theme={{
    'banner.root': 'fixed bottom-0 left-0 right-0 p-4',
    'banner.card': 'bg-white rounded-lg shadow-lg p-6 max-w-lg mx-auto',
    // ... define all styles from scratch
  }}
/>
```

---

## Global Theme Provider

Apply consistent theming across all c15t components:

```tsx
import { ThemeProvider } from '@c15t/react';

const globalTheme = {
  // Banner
  'banner.card': 'bg-white rounded-xl shadow-lg',
  'banner.footer.accept-button': 'bg-brand-primary text-white',

  // Dialog
  'dialog.card': 'bg-white rounded-xl shadow-xl',

  // Widget
  'widget.accordion.item': 'bg-gray-50 rounded-lg',
};

function App() {
  return (
    <ThemeProvider theme={globalTheme}>
      <ConsentManagerProvider options={/* ... */}>
        <CookieBanner />
        <ConsentManagerDialog />
      </ConsentManagerProvider>
    </ThemeProvider>
  );
}
```

---

## Design System Integration Checklist

When implementing c15t in an existing project:

- [ ] Extract primary/secondary colors from design system
- [ ] Match border-radius values (buttons, cards, inputs)
- [ ] Use same font-family and font-weights
- [ ] Apply consistent shadow styles
- [ ] Match button styles (primary, secondary, ghost)
- [ ] Verify dark mode compatibility
- [ ] Test responsive behavior
- [ ] Ensure accessibility contrast ratios
