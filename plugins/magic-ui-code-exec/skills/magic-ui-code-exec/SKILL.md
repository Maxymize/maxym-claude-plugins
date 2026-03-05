---
name: magic-ui-code-exec
description: Get animated UI components from Magic UI using the Code Execution pattern (99%+ token reduction). Use when you need to create landing pages, hero sections, animated components, button effects, background patterns, or modern UI elements without using traditional MCP tools.
---

# Magic UI Code Execution

Code Execution pattern to fetch Magic UI components directly from the API, without MCP server overhead.

## Setup (one-time per project)

1. Copy `scripts/client-magicui.ts` to your project (e.g., `lib/magic-ui.ts`)

2. No additional dependencies required (uses native `fetch`)

## Usage

```typescript
import {
  getComponent,
  getComponents,
  listComponents,
  searchComponents,
  getComponentsByCategory,
  getInstallCommand
} from './client-magicui.js';

// Get a single component
const marquee = await getComponent('marquee');
console.log(marquee.content);  // Source code
console.log(marquee.install);  // Installation command

// Get multiple components together
const components = await getComponents(['shimmer-button', 'bento-grid', 'globe']);

// Search components by name
const buttons = searchComponents('button');
// ['shimmer-button', 'rainbow-button', 'shiny-button', ...]

// List all available components
const all = listComponents();
// [{ name: 'marquee', category: 'components' }, ...]

// Get combined installation command
const cmd = getInstallCommand(['marquee', 'shimmer-button']);
// npx shadcn@latest add "https://magicui.design/r/marquee.json" "https://magicui.design/r/shimmer-button.json"
```

## Available Functions

| Function | Description |
|----------|-------------|
| `getComponent(name)` | Gets source code and info for a component |
| `getComponents(names[])` | Gets multiple components in parallel |
| `listComponents()` | Lists all components with categories |
| `searchComponents(query)` | Searches components by name |
| `getComponentsByCategory(cat)` | Gets all components in a category |
| `getInstallCommand(names[])` | Generates shadcn command to install components |
| `componentExists(name)` | Checks if a component exists |
| `getComponentCategory(name)` | Gets a component's category |

## Component Categories

| Category | Components |
|----------|------------|
| `components` | marquee, terminal, hero-video-dialog, bento-grid, animated-list, dock, globe, tweet-card, orbiting-circles, avatar-circles, icon-cloud, file-tree, code-comparison, scroll-progress, lens, pointer |
| `buttons` | rainbow-button, shimmer-button, shiny-button, interactive-hover-button, pulsating-button, ripple-button |
| `backgrounds` | warp-background, flickering-grid, animated-grid-pattern, retro-grid, ripple, dot-pattern, grid-pattern, interactive-grid-pattern |
| `text-animations` | text-animate, line-shadow-text, aurora-text, number-ticker, animated-shiny-text, animated-gradient-text, text-reveal, hyper-text, word-rotate, typing-animation, scroll-based-velocity, sparkles-text, morphing-text, spinning-text |
| `special-effects` | animated-beam, border-beam, shine-border, magic-card, meteors, neon-gradient-card, confetti, particles, cool-mode |
| `device-mocks` | safari, iphone-15-pro, android |
| `animations` | blur-fade |

## Recommended Patterns

**Process locally, report only what's necessary:**
```typescript
// Get component and extract only needed info
const component = await getComponent('shimmer-button');

// Report only the installation command and component signature
console.log(`Install: ${component.install}`);
console.log(`Props: ${extractProps(component.content)}`);
// DON'T report the entire source in the context
```

**Batch fetch for landing page:**
```typescript
// Get all components needed for a landing page
const landingComponents = await getComponents([
  'hero-video-dialog',
  'bento-grid',
  'marquee',
  'shimmer-button',
  'animated-list'
]);

// Generate a single installation command
const installCmd = getInstallCommand([
  'hero-video-dialog', 'bento-grid', 'marquee',
  'shimmer-button', 'animated-list'
]);
console.log(installCmd);
```

## Advantages vs Traditional MCP

| Aspect | Traditional MCP | Code Execution |
|--------|-----------------|----------------|
| Tokens per request | ~5,000+ | ~200 |
| Latency | 2-3 MCP calls | 1 HTTP fetch |
| Batch operations | N separate calls | 1 Promise.all |
| Caching | No | Possible in-memory |
| Offline catalog | No | Yes (COMPONENT_CATALOG) |

## Troubleshooting

### "Failed to fetch component"
The component might not exist or the magicui.design API might be temporarily unavailable. Verify the name with `componentExists(name)`.

### Component not found in catalog
The catalog is static. If Magic UI has added new components, update `COMPONENT_CATALOG` in `client-magicui.ts`.

## References

- [Magic UI](https://magicui.design)
- [Anthropic Code Execution](https://www.anthropic.com/engineering/code-execution-with-mcp)
