---
name: stack-auth-code-exec
description: Access Stack Auth documentation using the Code Execution pattern (99%+ token reduction). Use when you need to look up Stack Auth setup instructions, authentication guides, API references, component documentation, or integrate Stack Auth into a project. Replaces the stack-auth MCP server entirely.
---

# Stack Auth Code Execution

Direct access to Stack Auth documentation without MCP server overhead. This skill provides instant local search and on-demand fetching of Stack Auth documentation.

## Setup (one-time per project)

1. Copy `scripts/client-stack-auth.ts` to your project (e.g., `lib/stack-auth-docs.ts`)

2. No additional dependencies required (uses native `fetch`)

## Usage

```typescript
import {
  listDocs,
  searchDocs,
  getDocById,
  getSetupInstructions,
  listCategories,
  listDocsByCategory,
  getQuickReference,
  getDocUrl
} from './client-stack-auth.js';

// List all documentation pages
const allDocs = listDocs();
console.log(`${allDocs.length} documentation pages available`);

// Search documentation (instant, local)
const results = searchDocs('oauth google');
console.log(results.slice(0, 5));

// Fetch specific documentation page
const setupDocs = await getDocById('/docs/getting-started/setup');
console.log(setupDocs.content);

// Get setup instructions
const setup = await getSetupInstructions();
console.log(setup.content);

// List categories
const categories = listCategories();
// ['getting-started', 'components', 'concepts', 'auth-providers', ...]

// List docs by category
const componentDocs = listDocsByCategory('components');
// [{ id: '/docs/components/sign-in', title: '<SignIn />', ... }, ...]

// Get quick reference for common topics
const authDocs = getQuickReference('authentication');
// Returns relevant docs for authentication topic

// Get URL to open in browser
const url = getDocUrl('/docs/components/sign-in');
// https://stack-auth.com/docs/components/sign-in
```

## Available Functions

| Function | Description | Network |
|----------|-------------|---------|
| `listDocs()` | List all documentation pages | No |
| `listCategories()` | Get all documentation categories | No |
| `listDocsByCategory(category)` | Get docs in a category | No |
| `searchDocs(query)` | Search docs by keyword | No |
| `docExists(id)` | Check if doc exists | No |
| `getDocMetadata(id)` | Get doc info without content | No |
| `getDocById(id)` | Fetch doc with full content | Yes |
| `getDocsByIds(ids[])` | Fetch multiple docs in parallel | Yes |
| `getSetupInstructions()` | Get Stack Auth setup guide | Yes |
| `getQuickReference(topic)` | Get docs for common topics | No |
| `getDocUrl(id)` | Get URL for browser | No |

## Documentation Categories

| Category | Description | Docs |
|----------|-------------|------|
| `getting-started` | Setup and basics | 7 |
| `components` | React components | 16 |
| `concepts` | Core concepts | 6 |
| `auth-providers` | OAuth providers | 15 |
| `customization` | Styling and i18n | 9 |
| `apps` | Features (teams, API keys) | 6 |
| `sdk` | SDK reference | 5 |
| `sdk-types` | TypeScript types | 12 |
| `rest-api` | REST API overview | 2 |
| `api-client` | Client API endpoints | 9 |
| `api-server` | Server API endpoints | 9 |
| `webhooks` | Webhook events | 10 |
| `others` | Integrations | 4 |

## Recommended Patterns

**Search locally, fetch only what you need:**
```typescript
// Step 1: Search locally (instant)
const results = searchDocs('oauth google');

// Step 2: Fetch only the most relevant
const doc = await getDocById(results[0].id);

// Step 3: Report summary, not full content
console.log(`Setup: ${doc.title}`);
console.log(`URL: ${getDocUrl(doc.id)}`);
```

**Quick reference for common tasks:**
```typescript
// Get all docs related to a topic
const setupDocs = getQuickReference('setup');
const authDocs = getQuickReference('authentication');
const teamDocs = getQuickReference('teams');

// Topics: 'setup', 'authentication', 'oauth', 'teams', 'api', 'components', 'hooks', 'customization'
```

**Batch fetch for comprehensive guides:**
```typescript
const ids = [
  '/docs/getting-started/setup',
  '/docs/components/sign-in',
  '/docs/components/user-button'
];

const docs = await getDocsByIds(ids);
docs.forEach(doc => {
  console.log(`## ${doc.title}\n${doc.content?.substring(0, 500)}...`);
});
```

## Coverage vs MCP Tools

| MCP Tool | Code Exec Function | Coverage |
|----------|-------------------|----------|
| `list_available_docs` | `listDocs()` | ✅ 100% |
| `search_docs` | `searchDocs(query)` | ✅ 100% |
| `get_docs_by_id` | `getDocById(id)` | ✅ 100% |
| `get_stack_auth_setup_instructions` | `getSetupInstructions()` | ✅ 100% |
| `search` | `searchDocs(query)` | ✅ 100% |
| `fetch` | `getDocById(id)` | ✅ 100% |

**Result: 100% MIGRATED** - You can safely uninstall the Stack Auth MCP server.

## Advantages vs Traditional MCP

| Aspect | Traditional MCP | Code Execution |
|--------|-----------------|----------------|
| Tokens per search | ~2,000+ | ~50 (local) |
| Tokens per fetch | ~5,000+ | ~200 |
| Latency (search) | 500ms+ | <1ms (local) |
| Batch operations | N separate calls | 1 Promise.all |
| Offline catalog | No | Yes |

## Troubleshooting

### "Documentation page not found"
The page ID might not be in the catalog. Use `listDocs()` to see all available pages, or `searchDocs()` to find similar pages.

### Content extraction incomplete
The `getDocById()` function extracts text content from HTML. For full formatted content, use `getDocUrl()` and open in browser.

### Category not found
Use `listCategories()` to see all available categories.

## References

- [Stack Auth](https://stack-auth.com)
- [Stack Auth Documentation](https://stack-auth.com/docs)
- [Anthropic Code Execution](https://www.anthropic.com/engineering/code-execution-with-mcp)
