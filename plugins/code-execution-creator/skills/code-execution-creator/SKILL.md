---
name: code-execution-creator
description: Create Code Execution skills from existing MCP servers for 99%+ token reduction. Use when you need to convert an MCP server into a Code Execution skill, create a client that connects directly to an API/database bypassing MCP, or migrate MCP tools to Anthropic's Code Execution pattern. Supports both Direct Connection (HTTP API, database) and MCP Bridge (when the underlying MCP server is needed) approaches.
---

# Code Execution Creator

Specialist in converting traditional MCP servers into Code Execution skills following the pattern documented by Anthropic for 98.7% token reduction.

## Reference

Original pattern: https://www.anthropic.com/engineering/code-execution-with-mcp

## Problem It Solves

Traditional MCP architecture has two critical limitations:

1. **Context overload**: All tool definitions loaded upfront (~100,000+ tokens)
2. **Intermediate token waste**: Every result transits through the model's context (e.g., 50,000 tokens for a transcript)

**Code Execution Solution**: The agent writes and executes code that interacts directly with APIs, processing data locally without passing through the context.

## Skill Creation Workflow

### PHASE 1: MCP Server Assessment

Before starting, analyze the target MCP server:

```
1. Identify all tools exposed by the MCP server
2. For each tool, document:
   - Name and description
   - Parameters (required/optional)
   - Operation type (READ/WRITE/SCHEMA/DESTRUCTIVE)
3. Determine the best approach:
   - DIRECT CONNECTION: If a public HTTP API or database exists
   - MCP BRIDGE: If the MCP server logic is needed
   - HYBRID: If some tools require AI (LLM processing)
```

### PHASE 2: Choose the Approach

#### Approach A: Direct Connection (Preferred)

**When to use:**
- Public HTTP APIs with documented endpoints
- Databases with native drivers (PostgreSQL, MySQL, MongoDB)
- Services with official SDKs

**Advantages:**
- No MCP process overhead
- No dependency on MCP packages
- Maximum token reduction (~99%+)

**Example: REST API**
```typescript
const API_BASE = 'https://api.example.com';

export async function getResource(id: string): Promise<Resource> {
  const response = await fetch(`${API_BASE}/resources/${id}.json`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
```

**Example: PostgreSQL Database**
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function query<T>(sql: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(sql, params);
  return result.rows;
}
```

#### Approach B: MCP Bridge

**When to use:**
- MCP server with complex business logic
- No public API available
- Authentication managed by the MCP server

**Structure:**
```typescript
// client.ts - MCP Bridge
export async function callMCPTool<T>(fullToolName: string, params: object): Promise<T> {
  const [serverName, toolName] = fullToolName.split('__');
  // Send JSON-RPC 2.0 request to MCP server
  // ...
}
```

#### Approach C: Hybrid

**When to use:**
- Some tools require AI processing (e.g., requirements analysis, quality check)
- Part of the functionality can be replicated with direct fetches

**Pattern:**
```markdown
| Operation | Method | Reason |
|-----------|--------|--------|
| Data fetch | **Code Exec** | 99% token savings |
| List/search | **Code Exec** | Local catalog |
| AI analysis | **MCP** | Requires LLM |
| Quality check | **MCP** | Requires AI analysis |
```

### PHASE 3: Create the Directory Structure

```bash
.claude/skills/<name>-code-exec/
├── SKILL.md                    # Skill documentation
└── scripts/
    └── client-<type>.ts        # Main client
```

**Naming conventions:**
- Skill: `<service-name>-code-exec`
- Client: `client-<type>.ts` (e.g., `client-magicui.ts`, `client-pg.ts`)

### PHASE 4: Implement the Client

#### Direct Connection Client Template (HTTP API)

```typescript
/**
 * <Name> Code Execution Client
 *
 * Direct connection to <service> API without MCP server overhead.
 * Reduces token usage by 99%+ following Anthropic's Code Execution pattern.
 *
 * @see https://www.anthropic.com/engineering/code-execution-with-mcp
 */

const API_BASE = 'https://api.example.com';

// Types
export interface Resource {
  name: string;
  // ...
}

// Local catalog for instant searches
export const CATALOG: Record<string, string[]> = {
  'category1': ['item1', 'item2'],
  'category2': ['item3', 'item4'],
};

export const ALL_ITEMS: string[] = Object.values(CATALOG).flat();

/**
 * Fetch a single resource
 */
export async function getResource(name: string): Promise<Resource> {
  const url = `${API_BASE}/${name}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Failed to fetch ${name}`);
  }
  return response.json();
}

/**
 * Fetch multiple resources in parallel
 */
export async function getResources(names: string[]): Promise<Resource[]> {
  return Promise.all(names.map(name =>
    getResource(name).catch(err => ({
      name,
      error: err.message
    } as Resource))
  ));
}

/**
 * Search in local catalog (instant, no network)
 */
export function search(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  return ALL_ITEMS.filter(name => name.toLowerCase().includes(lowerQuery));
}

/**
 * List all items with categories
 */
export function list(): { name: string; category: string }[] {
  const result: { name: string; category: string }[] = [];
  for (const [category, items] of Object.entries(CATALOG)) {
    for (const name of items) {
      result.push({ name, category });
    }
  }
  return result;
}

/**
 * Check existence
 */
export function exists(name: string): boolean {
  return ALL_ITEMS.includes(name);
}

/**
 * Get category
 */
export function getCategory(name: string): string | null {
  for (const [category, items] of Object.entries(CATALOG)) {
    if (items.includes(name)) return category;
  }
  return null;
}
```

#### Direct Connection Client Template (Database)

```typescript
/**
 * PostgreSQL Direct Client
 *
 * @see https://www.anthropic.com/engineering/code-execution-with-mcp
 */

import { Pool, QueryResultRow } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL ||
        'postgresql://user:pass@localhost:5432/db',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow>(
  sql: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  const p = getPool();
  const result = await p.query<T>(sql, params);
  return { rows: result.rows, rowCount: result.rowCount };
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Automatic cleanup
process.on('exit', () => { if (pool) pool.end(); });
```

### PHASE 5: Write SKILL.md

#### SKILL.md Template

```markdown
---
name: <name>-code-exec
description: <Description explaining WHAT it does and WHEN to use it>. Use when you need to <specific use cases>. Code Execution pattern for 99%+ token reduction.
---

# <Name> Code Execution

<Brief description of the pattern and service>

## Setup (one-time per project)

1. Install dependencies (if needed):
\`\`\`bash
npm install <packages>
\`\`\`

2. Copy `scripts/client-<type>.ts` to your project

3. Configure environment variables (if needed):
\`\`\`bash
export VAR_NAME="value"
\`\`\`

## Usage

\`\`\`typescript
import {
  getResource,
  getResources,
  search,
  list
} from './client-<type>.js';

// Single fetch example
const item = await getResource('name');
console.log(item);

// Batch fetch example
const items = await getResources(['a', 'b', 'c']);

// Local search example
const results = search('query');
\`\`\`

## Available Functions

| Function | Description |
|----------|-------------|
| `getResource(name)` | Fetch a single resource |
| `getResources(names[])` | Fetch multiple in parallel |
| `search(query)` | Search in local catalog |
| `list()` | List all resources |
| `exists(name)` | Check existence |

## Recommended Patterns

**Process locally, report summary:**
\`\`\`typescript
const data = await getResources(['a', 'b', 'c']);
const count = data.filter(d => d.active).length;
console.log(`${count} active resources`);
// Only the summary goes into the context
\`\`\`

## Advantages vs Traditional MCP

| Aspect | Traditional MCP | Code Execution |
|--------|-----------------|----------------|
| Tokens per request | ~5,000+ | ~200 |
| Latency | 2-3 MCP calls | 1 HTTP fetch |
| Batch operations | N separate calls | 1 Promise.all |

## Troubleshooting

### "Failed to fetch"
Verify the resource exists with `exists(name)`.

## References

- [Service](https://url)
- [Anthropic Code Execution](https://www.anthropic.com/engineering/code-execution-with-mcp)
```

### PHASE 6: For Hybrid Skills - Document Orchestration

If some MCP tools require AI processing, document clearly:

```markdown
## When to Use Code Execution vs MCP

| Use Case | Method | Reason |
|----------|--------|--------|
| Data fetch | **Code Exec** | 99% token savings |
| List/search | **Code Exec** | Local catalog |
| Requirements analysis | **MCP** `tool-name` | Requires LLM |
| Quality check | **MCP** `tool-name` | Requires AI |

## MCP Tools to Use (DO NOT uninstall)

| MCP Tool | When to Use |
|----------|-------------|
| `mcp__server__tool1` | When AI analysis is needed |
| `mcp__server__tool2` | When validation is needed |
```

### PHASE 7: Verify Complete Coverage (CRITICAL)

**BEFORE proceeding to tests, you MUST verify that Code Execution covers ALL functionality of the original MCP.**

#### Coverage Checklist

For EACH tool of the original MCP server, verify:

```
| Original MCP Tool | Code Exec Function | Coverage | Notes |
|-------------------|--------------------| ---------|-------|
| mcp__server__tool1 | getResource()     | 100%     |       |
| mcp__server__tool2 | search()          | 100%     |       |
| mcp__server__tool3 | -                 | 0%       | Requires AI |
| mcp__server__tool4 | partial()         | 80%      | Missing param X |
```

#### Criteria to Determine if HYBRID

The skill is **HYBRID** (CANNOT completely replace MCP) if:

1. **AI-powered tools**: The MCP tool uses an LLM internally for:
   - Natural language analysis (e.g., `requirement-structuring`)
   - Contextual code generation
   - Quality check with AI logic
   - Intelligent classification/categorization

2. **Complex business logic**: The MCP server implements logic that cannot be replicated with simple HTTP fetches

3. **State/session**: The MCP server maintains state between calls

4. **Complex authentication**: OAuth flow, refresh token, etc. managed by the server

**IF even ONE tool cannot be replicated → the skill is HYBRID**

#### What to Do if HYBRID

```markdown
WARNING: This is a HYBRID skill

Some tools of the `<name>` MCP server require AI functionality that CANNOT
be replicated with Code Execution.

**DO NOT UNINSTALL** the `<name>` MCP server.

The Code Execution skill handles: <list of functionality>
The MCP server is still needed for: <list of AI tools>
```

### PHASE 8: Create REAL and VERIFIABLE Tests

**Tests should NOT just be console.log. They must produce TANGIBLE OUTPUT that the user can verify.**

#### Test Principles

1. **Verifiable output**: Generate files (HTML, JSON) that the user can open
2. **Real operations**: Actual fetches from APIs, not mocks
3. **MCP vs Code Exec comparison**: Demonstrate they produce the same results
4. **Complete coverage**: Test EVERY function of the skill

#### Test Template with Verifiable Output

```typescript
// test/test-<name>-skill.ts
import * as fs from 'fs';
import * as path from 'path';
import {
  getResource,
  getResources,
  list,
  search,
  // ... all functions
} from '../.claude/skills/<name>-code-exec/scripts/client-<type>.js';

const OUTPUT_DIR = path.join(__dirname, 'output');

async function runTests() {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results: TestResult[] = [];
  const errors: string[] = [];

  console.log('='.repeat(60));
  console.log('Testing <Name> Code Execution Skill');
  console.log('Output directory:', OUTPUT_DIR);
  console.log('='.repeat(60));

  // ========================================
  // TEST 1: Local operations (catalog)
  // ========================================
  console.log('\n📋 Test 1: Local catalog');

  const allItems = list();
  const categories = [...new Set(allItems.map(i => i.category))];

  results.push({
    test: 'list()',
    success: allItems.length > 0,
    details: `${allItems.length} items in ${categories.length} categories`
  });

  // ========================================
  // TEST 2: Local search
  // ========================================
  console.log('\n🔍 Test 2: Local search');

  const searchResults = search('button');
  results.push({
    test: 'search("button")',
    success: searchResults.length > 0,
    details: `Found: ${searchResults.join(', ')}`
  });

  // ========================================
  // TEST 3: Single fetch (REAL OPERATION)
  // ========================================
  console.log('\n📥 Test 3: Single fetch from API');

  try {
    const item = await getResource('test-item');
    results.push({
      test: 'getResource("test-item")',
      success: true,
      details: `Received: ${JSON.stringify(item).substring(0, 100)}...`
    });

    // Save output for user verification
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'single-fetch.json'),
      JSON.stringify(item, null, 2)
    );
  } catch (error) {
    errors.push(`getResource failed: ${error}`);
    results.push({
      test: 'getResource("test-item")',
      success: false,
      details: `Error: ${error}`
    });
  }

  // ========================================
  // TEST 4: Batch fetch (REAL OPERATION)
  // ========================================
  console.log('\n📥 Test 4: Batch fetch from API');

  try {
    const items = await getResources(['item1', 'item2', 'item3']);
    const successCount = items.filter(i => !('error' in i)).length;

    results.push({
      test: 'getResources(["item1", "item2", "item3"])',
      success: successCount > 0,
      details: `${successCount}/${items.length} fetches succeeded`
    });

    // Save output for user verification
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'batch-fetch.json'),
      JSON.stringify(items, null, 2)
    );
  } catch (error) {
    errors.push(`getResources failed: ${error}`);
  }

  // ========================================
  // GENERATE VERIFIABLE HTML REPORT
  // ========================================
  const htmlReport = generateHTMLReport(results, errors, allItems);
  const reportPath = path.join(OUTPUT_DIR, 'test-report.html');
  fs.writeFileSync(reportPath, htmlReport);

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\n📄 HTML Report: ${reportPath}`);
  console.log(`📁 JSON Output: ${OUTPUT_DIR}/`);

  if (failed > 0) {
    console.log('\n⚠️  WARNING: Some tests failed!');
    console.log('Verify that the skill covers all MCP functionality.');
  }

  // Open report in browser (optional)
  console.log(`\nTo view the report: open ${reportPath}`);
}

interface TestResult {
  test: string;
  success: boolean;
  details: string;
}

function generateHTMLReport(
  results: TestResult[],
  errors: string[],
  catalog: { name: string; category: string }[]
): string {
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Report - <Name> Code Execution</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-8">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">Test Report: <Name> Code Execution</h1>

    <!-- Summary -->
    <div class="grid grid-cols-3 gap-4 mb-8">
      <div class="bg-white p-4 rounded shadow">
        <div class="text-4xl font-bold text-blue-600">${results.length}</div>
        <div class="text-gray-600">Total tests</div>
      </div>
      <div class="bg-white p-4 rounded shadow">
        <div class="text-4xl font-bold text-green-600">${passed}</div>
        <div class="text-gray-600">Passed</div>
      </div>
      <div class="bg-white p-4 rounded shadow">
        <div class="text-4xl font-bold text-red-600">${failed}</div>
        <div class="text-gray-600">Failed</div>
      </div>
    </div>

    <!-- Test Results -->
    <div class="bg-white rounded shadow mb-8">
      <h2 class="text-xl font-semibold p-4 border-b">Test Results</h2>
      <div class="divide-y">
        ${results.map(r => `
          <div class="p-4 flex items-center">
            <span class="text-2xl mr-4">${r.success ? '✅' : '❌'}</span>
            <div>
              <code class="font-mono text-sm bg-gray-100 px-2 py-1 rounded">${r.test}</code>
              <p class="text-gray-600 text-sm mt-1">${r.details}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Catalog -->
    <div class="bg-white rounded shadow">
      <h2 class="text-xl font-semibold p-4 border-b">Catalog (${catalog.length} items)</h2>
      <div class="p-4 max-h-96 overflow-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left border-b">
              <th class="pb-2">Name</th>
              <th class="pb-2">Category</th>
            </tr>
          </thead>
          <tbody>
            ${catalog.slice(0, 50).map(item => `
              <tr class="border-b">
                <td class="py-2 font-mono">${item.name}</td>
                <td class="py-2">${item.category}</td>
              </tr>
            `).join('')}
            ${catalog.length > 50 ? `
              <tr><td colspan="2" class="py-2 text-gray-500">... and ${catalog.length - 50} more</td></tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    </div>

    <p class="text-gray-500 text-sm mt-4">
      Generated: ${new Date().toISOString()}
    </p>
  </div>
</body>
</html>`;
}

runTests().catch(console.error);
```

#### Test Output

Tests MUST generate in the `test/output/` folder:

```
test/
├── test-<name>-skill.ts
└── output/
    ├── test-report.html      # Visual report openable in browser
    ├── single-fetch.json     # Single fetch result
    ├── batch-fetch.json      # Batch fetch result
    └── catalog.json          # Exported catalog
```

**The user can verify:**
1. Open `test-report.html` in browser to see results
2. Inspect JSON files to verify real data
3. Compare with original MCP output

## Final Checklist

Before considering the skill complete:

### 1. Verify Coverage (CRITICAL)
- [ ] **Complete coverage table**: For EACH MCP tool, documented if and how it's covered
- [ ] **Determined if HYBRID**: If even ONE tool is not replicable → HYBRID
- [ ] **If HYBRID**: Warned user to NOT uninstall MCP

### 2. TypeScript Client
- [ ] Single and batch fetch (Promise.all)
- [ ] Local catalog for instant searches
- [ ] Utility functions (search, list, exists)
- [ ] Error handling
- [ ] Complete JSDoc

### 3. SKILL.md
- [ ] Frontmatter with clear name and description
- [ ] Setup instructions
- [ ] Usage examples
- [ ] Functions table
- [ ] Recommended patterns
- [ ] Troubleshooting
- [ ] **If HYBRID**: "When to use Code Exec vs MCP" section
- [ ] **If HYBRID**: List of MCP tools to NOT uninstall

### 4. REAL and VERIFIABLE Tests
- [ ] Tests in the `test/` folder
- [ ] **Tangible output** generated in `test/output/`:
  - [ ] `test-report.html` - Visual report openable in browser
  - [ ] JSON files with real fetched data
- [ ] **Real operations**: Actual fetches from APIs, not mocks
- [ ] **Complete coverage**: Tested EVERY function of the skill
- [ ] Test executed successfully before declaring the skill complete

### 5. User Communication
- [ ] **If 100% migrated**: Inform they can uninstall MCP
- [ ] **If HYBRID**: Clearly explain:
  - Which functionality is in Code Exec (token savings)
  - Which still requires MCP (and why)
  - That they should NOT uninstall the MCP server

## Implemented Examples

### Magic UI ✅ 100% MIGRATED

```
.claude/skills/magic-ui-code-exec/
├── SKILL.md
└── scripts/
    └── client-magicui.ts
```

- **Approach**: Direct Connection - Fetch from `https://magicui.design/r/<component>.json`
- **Original MCP tools**: All replicable with HTTP fetch
- **Result**: User CAN uninstall magic-ui MCP server

### shadcn-vue ⚡ HYBRID

```
.claude/skills/shadcn-vue-code-exec/
├── SKILL.md
└── scripts/
    └── client-shadcn-vue.ts
```

- **Approach**: Code Exec for fetch + MCP for AI-powered tools
- **Replicated MCP tools**: `component-usage-doc`, `component-builder` (fetch)
- **Non-replicable MCP tools**:
  - `requirement-structuring` - Requires LLM processing
  - `components-filter` - Requires AI logic
  - `component-quality-check` - Requires AI analysis
- **Result**: User MUST NOT uninstall shadcn-vue-mcp server

### Supabase ✅ 100% MIGRATED

```
.claude/skills/supabase-code-exec/
├── SKILL.md
└── scripts/
    └── client-pg.ts
```

- **Approach**: Direct Connection - PostgreSQL `pg` driver
- **Original MCP tools**: All replicable with direct SQL queries
- **Result**: User CAN uninstall supabase MCP server (if only using basic functions)

## ES Modules Notes

If the project uses ES Modules (`"type": "module"` in package.json):

**Avoid:**
```typescript
if (require.main === module) { /* test */ }
```

**Use separate test files or:**
```typescript
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Test code
}
```
