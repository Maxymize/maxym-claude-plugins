---
name: shadcn-vue-code-exec
description: Get Vue components from shadcn-vue using the Code Execution pattern (99%+ token reduction). Use when you need to create Vue/Nuxt UI with components like button, form, dialog, table, tabs, or chart. This skill is HYBRID - uses Code Execution for fetch and MCP for AI functionality.
---

# shadcn-vue Code Execution (Hybrid)

Code Execution pattern to fetch shadcn-vue components directly from the API. This skill is **hybrid**: it uses Code Execution for data-intensive operations and delegates to the `shadcn-vue-mcp` server for AI-powered functionality.

## When to Use Code Execution vs MCP

| Use Case | Method | Reason |
|----------|--------|--------|
| Fetch component source code | **Code Exec** | 99% token savings |
| List/search components | **Code Exec** | Local catalog, instant |
| Component documentation | **Code Exec** | Direct fetch from API |
| Batch fetch multiple components | **Code Exec** | Efficient Promise.all |
| **Analyze user requirements** | **MCP** `requirement-structuring` | Requires LLM processing |
| **Filter components by requirements** | **MCP** `components-filter` | Requires AI logic |
| **Validate component quality** | **MCP** `component-quality-check` | Requires AI analysis |

### Hybrid Workflow Example

```typescript
// 1. USER: "I need a login form with validation"

// 2. USE MCP to analyze requirements (requires AI)
// Tool: mcp__shadcn-vue-mcp__requirement-structuring
// Input: { message: "login form with email, password and validation" }

// 3. USE MCP to filter needed components (requires AI)
// Tool: mcp__shadcn-vue-mcp__components-filter
// Input: { message: "<JSON output from step 2>" }

// 4. USE CODE EXEC for fast component fetch (token savings)
import { getComponents, extractDependencies, getInstallCommand } from './client-shadcn-vue.js';

const components = await getComponents(['form', 'input', 'label', 'button']);
const deps = extractDependencies(components);
console.log(getInstallCommand(['form', 'input', 'label', 'button']));

// 5. USE MCP to validate the final component quality (requires AI)
// Tool: mcp__shadcn-vue-mcp__component-quality-check
// Input: { componentCode: "<generated Vue code>" }
```

## Available MCP Tools (NOT uninstalled)

| MCP Tool | When to Use |
|----------|-------------|
| `mcp__shadcn-vue-mcp__requirement-structuring` | User describes UI in natural language |
| `mcp__shadcn-vue-mcp__components-filter` | Need intelligent component selection |
| `mcp__shadcn-vue-mcp__component-quality-check` | Validate accessibility/best practices |

## Setup (one-time per project)

1. Copy `scripts/client-shadcn-vue.ts` to your project (e.g., `lib/shadcn-vue.ts`)

2. No additional dependencies required (uses native `fetch`)

## Usage

```typescript
import {
  getComponent,
  getComponents,
  listComponents,
  searchComponents,
  getComponentsByCategory,
  getInstallCommand,
  getMainFileContent,
  extractDependencies
} from './client-shadcn-vue.js';

// Get a single component
const button = await getComponent('button');
console.log(button.files[0].content);  // Source code
console.log(button.install);            // Installation command
console.log(button.dependencies);       // npm dependencies

// Get multiple components together
const components = await getComponents(['button', 'input', 'card']);

// Search components by name
const inputs = searchComponents('input');
// ['input', 'input-group', 'input-otp', 'pin-input', 'tags-input']

// List all available components
const all = listComponents();
// [{ name: 'accordion', category: 'layout' }, ...]

// Get combined installation command
const cmd = getInstallCommand(['button', 'input', 'form']);
// npx shadcn-vue@latest add button input form

// Extract main file content
const mainCode = getMainFileContent(button);

// Extract dependencies from multiple components
const deps = extractDependencies(components);
// { npm: ['reka-ui', ...], registry: ['utils'] }
```

## Available Functions

| Function | Description |
|----------|-------------|
| `getComponent(name)` | Gets source code and info for a component |
| `getComponents(names[])` | Gets multiple components in parallel |
| `listComponents()` | Lists all components with categories |
| `searchComponents(query)` | Searches components by name |
| `getComponentsByCategory(cat)` | Gets all components in a category |
| `getInstallCommand(names[])` | Generates shadcn-vue command to install |
| `componentExists(name)` | Checks if a component exists |
| `getComponentCategory(name)` | Gets a component's category |
| `getMainFileContent(comp)` | Extracts the main .vue file |
| `getAllFilesContent(comp)` | Combines all files into a string |
| `extractDependencies(comps[])` | Extracts deduplicated dependencies |
| `getComponentDocUrl(type, name)` | Gets component documentation URL |
| `getComponentDocType(name)` | Determines if it's 'components' or 'charts' |
| `getComponentsDocUrls(names[])` | Gets doc URLs for multiple components |

## Component Categories

| Category | Components |
|----------|------------|
| `forms` | button, button-group, checkbox, combobox, form, input, input-group, input-otp, label, native-select, pin-input, radio-group, select, slider, switch, tags-input, textarea, toggle, toggle-group, field |
| `layout` | accordion, aspect-ratio, card, carousel, collapsible, resizable, separator, sidebar, table, tabs |
| `feedback` | alert, alert-dialog, progress, skeleton, sonner, spinner, stepper, toast, empty |
| `navigation` | breadcrumb, command, context-menu, dropdown-menu, menubar, navigation-menu, pagination |
| `data-display` | avatar, badge, calendar, data-table, date-picker, hover-card, scroll-area, tooltip, typography, kbd, item |
| `overlay` | dialog, drawer, popover, sheet |
| `charts` | chart, chart-area, chart-bar, chart-donut, chart-line, chart-radar |
| `misc` | lens |

## Recommended Patterns

**Process locally, report only what's necessary:**
```typescript
// Get component and extract only needed info
const component = await getComponent('dialog');

// Report only the installation command and dependencies
console.log(`Install: ${component.install}`);
console.log(`Dependencies: ${component.dependencies?.join(', ')}`);
// DON'T report the entire source in the context
```

**Batch fetch for complex form:**
```typescript
// Get all components needed for a form
const formComponents = await getComponents([
  'form', 'input', 'label', 'button',
  'select', 'checkbox', 'textarea'
]);

// Generate a single installation command
const installCmd = getInstallCommand([
  'form', 'input', 'label', 'button',
  'select', 'checkbox', 'textarea'
]);
console.log(installCmd);

// Extract all needed npm dependencies
const deps = extractDependencies(formComponents);
console.log(`npm install ${deps.npm.join(' ')}`);
```

**Create a dashboard page:**
```typescript
const dashboardComponents = await getComponents([
  'card', 'table', 'tabs', 'badge',
  'chart-area', 'chart-bar', 'chart-donut',
  'button', 'dropdown-menu'
]);

// Analyze dependencies
const deps = extractDependencies(dashboardComponents);
console.log('Registry deps to install first:', deps.registry);
console.log('NPM deps:', deps.npm);
```

## Component Response Structure

```typescript
interface ShadcnVueComponent {
  name: string;           // 'button'
  type: string;           // 'registry:ui'
  dependencies: string[]; // ['reka-ui']
  registryDependencies: string[]; // ['utils']
  files: {
    path: string;    // 'ui/button/Button.vue'
    content: string; // Complete source code
    type: string;    // 'registry:ui'
  }[];
  install: string;  // 'npx shadcn-vue@latest add button'
}
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
The component might not exist or the shadcn-vue.com API might be temporarily unavailable. Verify the name with `componentExists(name)`.

### Component not found in catalog
The catalog is static. If shadcn-vue has added new components, update `COMPONENT_CATALOG` in `client-shadcn-vue.ts`.

### Missing registry dependencies
Some components depend on others (e.g., `form` requires `label`). Use `extractDependencies()` to identify them and install them first.

## References

- [shadcn-vue](https://www.shadcn-vue.com)
- [shadcn-vue Registry](https://www.shadcn-vue.com/docs/registry)
- [Anthropic Code Execution](https://www.anthropic.com/engineering/code-execution-with-mcp)
