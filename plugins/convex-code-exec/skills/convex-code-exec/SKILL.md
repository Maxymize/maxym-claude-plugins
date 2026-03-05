---
name: convex-code-exec
description: Direct Convex API access for project management, function execution, environment variables, tables/schema discovery, and AI-assisted code generation. Use when you need to interact with Convex deployments, execute queries/mutations/actions, list tables, or generate Convex-compliant code (99%+ token reduction). HYBRID - MCP still needed for functionSpec, logs, and runOneoffQuery only.
---

# Convex Code Execution

Direct connection to Convex APIs without full MCP server overhead.
Reduces token usage by 99%+ following Anthropic's Code Execution pattern.

**Strategy**: HYBRID (partial migration)
**Result**: User CAN use this for most operations but MAY still need Convex MCP for 3 specific features

## Coverage Analysis

### What This Skill Covers (100% Code Execution)

| Feature | API Endpoint | Status |
|---------|--------------|--------|
| Project Management | Management API | ✅ |
| Deployment Management | Management API | ✅ |
| Custom Domains | Management API | ✅ |
| Execute Queries | POST /api/query | ✅ |
| Execute Mutations | POST /api/mutation | ✅ |
| Execute Actions | POST /api/action | ✅ |
| Environment Variables | Deployment API v1 | ✅ |
| **Tables with JSON Schema** | GET /api/json_schemas | ✅ **NEW!** |
| Code Generation Helpers | Local utilities | ✅ |

### What Still Requires MCP Server

| Feature | Reason | MCP Tool |
|---------|--------|----------|
| Function Metadata | No public API exists | `functionSpec` |
| Execution Logs | Only CLI/Dashboard/webhook integrations | `logs` |
| Sandboxed One-off Queries | Requires MCP sandbox | `runOneoffQuery` |

> **Note**: The `/api/json_schemas` endpoint (Streaming Export API) now provides table listing with schema information, replacing the need for MCP's `tables` tool for most use cases.

**Recommendation**: Keep Convex MCP server installed only if you need `functionSpec` (function discovery), `logs` (streaming logs), or `runOneoffQuery` (sandbox queries). For all other operations, use this skill.

## IMPORTANT: First Invocation - Token Check

**Before executing ANY Convex operation**, Claude MUST check for the required tokens:

```typescript
import {
  checkAccessTokenWithGuidance,
  checkDeployKeyWithGuidance
} from './client-convex.js';

// For Management API (projects, deployments)
const accessCheck = checkAccessTokenWithGuidance();
if (!accessCheck.valid) {
  console.log(accessCheck.instructions);
  // ASK USER TO CONFIRM they have set the token
}

// For Deployment API (queries, mutations, env vars)
const deployCheck = checkDeployKeyWithGuidance();
if (!deployCheck.valid) {
  console.log(deployCheck.instructions);
  // ASK USER TO CONFIRM they have set the deploy key
}
```

## Setup

### 1. Get Your Tokens

**For Management API (project/team operations):**
1. Go to https://dashboard.convex.dev
2. Click team name → Settings → Access Tokens
3. Create new token

**For Deployment API (function execution):**
1. Go to your project in dashboard
2. Settings → Deploy Keys
3. Generate new deploy key
4. Also note your deployment URL (e.g., `https://your-deployment.convex.cloud`)

### 2. Set Environment Variables

```bash
# For Management API
export CONVEX_ACCESS_TOKEN="your-access-token"

# For Deployment API (function execution)
export CONVEX_URL="https://your-deployment.convex.cloud"
export CONVEX_DEPLOY_KEY="your-deploy-key"
```

Or add to `.env`:
```
CONVEX_ACCESS_TOKEN=your-access-token
CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key
```

### 3. Copy the Client

Copy `scripts/client-convex.ts` to your project and import the functions you need.

## Quick Start

### Execute Convex Functions

```typescript
import { runQuery, runMutation, runAction } from './client-convex.js';

// Run a query
const result = await runQuery('messages:list', { channelId: 'abc123' });
if (result.status === 'success') {
  console.log(result.value);
}

// Run a mutation
const mutationResult = await runMutation('messages:send', {
  channelId: 'abc123',
  content: 'Hello!'
});

// Run an action
const actionResult = await runAction('ai:generateResponse', {
  prompt: 'Hello'
});
```

### Manage Environment Variables

```typescript
import {
  listEnvironmentVariables,
  setEnvironmentVariable,
  getEnvironmentVariable
} from './client-convex.js';

// List all env vars
const envVars = await listEnvironmentVariables();
console.log(envVars);

// Get specific variable
const apiKey = await getEnvironmentVariable('OPENAI_API_KEY');

// Set a variable (invalidates all subscriptions!)
await setEnvironmentVariable('NEW_VAR', 'value');
```

### Manage Projects (requires Access Token)

```typescript
import {
  getTokenDetails,
  listProjects,
  createProject
} from './client-convex.js';

// Get team ID from token
const details = await getTokenDetails();
console.log('Team ID:', details.teamId);

// List projects
const { projects } = await listProjects(details.teamId!);
console.log(projects);

// Create new project
const result = await createProject(details.teamId!, {
  projectName: 'my-new-project',
  deploymentType: 'dev'
});
console.log('Deployment URL:', result.deployment.url);
```

### List Tables and Schema (Streaming Export API)

```typescript
import {
  listTablesWithSchema,
  listTables,
  getTableSchema
} from './client-convex.js';

// List all tables with their JSON schemas
const schemas = await listTablesWithSchema();
console.log('Tables:', Object.keys(schemas));

// Get table names only
const tableNames = await listTables();
console.log(tableNames); // ['users', 'messages', 'channels', ...]

// Get schema for a specific table
const userSchema = await getTableSchema('users');
if (userSchema) {
  console.log('User fields:', Object.keys(userSchema.properties));
}

// With metadata fields included
const schemasWithMeta = await listTablesWithSchema({ deltaSchema: true });
// Includes _ts, _deleted, _table fields
```

## Available Functions

### Management API

| Function | Description |
|----------|-------------|
| `getTokenDetails()` | Get info about current access token |
| `listProjects(teamId)` | List all projects in a team |
| `createProject(teamId, params)` | Create a new project |
| `deleteProject(projectId)` | Delete a project |
| `listDeployments(projectId)` | List deployments for a project |
| `createDeployKey(deploymentName, keyName)` | Generate deploy key |
| `listCustomDomains(deploymentName)` | List custom domains |
| `createCustomDomain(deploymentName, params)` | Add custom domain |
| `deleteCustomDomain(deploymentName, domain)` | Remove custom domain |

### Deployment API - Function Execution

| Function | Description |
|----------|-------------|
| `runQuery(path, args)` | Execute a query function |
| `runMutation(path, args)` | Execute a mutation function |
| `runAction(path, args)` | Execute an action function |
| `runFunction(identifier, args)` | Execute any function by identifier |

### Deployment API - Environment Variables

| Function | Description |
|----------|-------------|
| `listEnvironmentVariables()` | List all env vars |
| `getEnvironmentVariable(name)` | Get specific env var |
| `setEnvironmentVariable(name, value)` | Set a single env var |
| `updateEnvironmentVariables(vars)` | Set multiple env vars |
| `removeEnvironmentVariable(name)` | Remove an env var |

### Streaming Export API - Tables & Schema

| Function | Description |
|----------|-------------|
| `listTablesWithSchema(options?)` | List all tables with JSON Schema |
| `listTables()` | Get table names only |
| `getTableSchema(tableName)` | Get schema for specific table |

### Local Utilities - Token Validation

| Function | Description |
|----------|-------------|
| `checkAccessTokenWithGuidance()` | **CALL FIRST** - Check access token |
| `checkDeployKeyWithGuidance()` | **CALL FIRST** - Check deploy key |
| `hasAccessToken()` | Quick check for access token |
| `hasDeployKey()` | Quick check for deploy key |

### Local Utilities - Code Generation

| Function | Description |
|----------|-------------|
| `generateQueryTemplate(name, args, returnType, table?)` | Generate query function |
| `generateMutationTemplate(name, args, table?)` | Generate mutation function |
| `generateActionTemplate(name, args, useNode?)` | Generate action function |
| `generateInternalFunctionTemplate(name, type, args)` | Generate internal function |
| `generateSchemaTemplate(tables)` | Generate schema.ts |
| `generateHttpTemplate(routes)` | Generate http.ts |
| `generateCronTemplate(jobs)` | Generate crons.ts |
| `generatePaginatedQueryTemplate(name, table, filter?)` | Generate paginated query |
| `generateValidator(type)` | Convert type to validator string |
| `getConvexGuidelines()` | Get coding guidelines |
| `getErrorReference()` | Get error solutions |

### URL Utilities

| Function | Description |
|----------|-------------|
| `buildDeploymentUrl(name)` | Get deployment URL |
| `buildSiteUrl(name)` | Get HTTP actions URL |
| `getDashboardUrl(team, project)` | Get dashboard URL |
| `getDocsUrl(topic?)` | Get documentation URL |

## Code Generation Examples

### Generate a Schema

```typescript
import { generateSchemaTemplate } from './client-convex.js';

const schema = generateSchemaTemplate([
  {
    name: 'users',
    fields: {
      name: 'v.string()',
      email: 'v.string()',
      role: 'v.union(v.literal("admin"), v.literal("user"))',
    },
    indexes: [['email']]
  },
  {
    name: 'messages',
    fields: {
      channelId: 'v.id("channels")',
      authorId: 'v.optional(v.id("users"))',
      content: 'v.string()',
    },
    indexes: [['channelId']]
  }
]);

console.log(schema);
```

### Generate a Query

```typescript
import { generateQueryTemplate } from './client-convex.js';

const query = generateQueryTemplate(
  'listMessages',
  { channelId: 'v.id("channels")' },
  'v.array(v.object({ _id: v.id("messages"), content: v.string() }))',
  'messages'
);

console.log(query);
```

### Get Convex Guidelines

```typescript
import { getConvexGuidelines } from './client-convex.js';

// Use when generating Convex code to ensure best practices
console.log(getConvexGuidelines());
```

## Convex Coding Best Practices

When generating Convex code, ALWAYS follow these rules:

### Function Syntax
```typescript
// ALWAYS use this format
export const myFunction = query({
  args: { /* validators */ },
  returns: v.null(), // ALWAYS include return validator!
  handler: async (ctx, args) => { /* ... */ },
});
```

### Key Rules
1. **Validators**: Always use `v.null()` for null returns
2. **Queries**: Use `.withIndex()` NOT `.filter()`
3. **Actions**: Add `"use node";` for Node.js modules
4. **Internal**: Use `internalQuery/Mutation/Action` for private functions
5. **IDs**: Use `Id<'tableName'>` type, `v.id("tableName")` validator
6. **Indexes**: Name as `by_field1_and_field2`

## When to Use MCP vs This Skill

| Task | Use This Skill | Use MCP |
|------|----------------|---------|
| Execute deployed functions | ✅ | |
| Manage env variables | ✅ | |
| Create/manage projects | ✅ | |
| Generate Convex code | ✅ | |
| **List tables with schema** | ✅ `listTablesWithSchema()` | |
| Discover function metadata | | ✅ `functionSpec` |
| Stream execution logs | | ✅ `logs` |
| Run sandbox queries | | ✅ `runOneoffQuery` |

## Troubleshooting

### "HTTP 401: Unauthorized"
- Access token expired or invalid
- Deploy key doesn't have required permissions
- Generate new token from Convex dashboard

### "Function not found"
- Function not deployed. Run `npx convex dev` or `npx convex deploy`
- Check function path format: `file:functionName`

### "Validation error"
- Argument types don't match validators
- Missing required arguments
- Check function signature in Convex code

### "Environment variable update failed"
- Deploy key doesn't have write permission
- Use production deploy key, not dev

## Production Data Seeding

When you need to seed data in Production (fresh environment), use a Node.js script with `ConvexHttpClient`.

### Why CLI Doesn't Work for Production

1. **`npx convex run`** reads deployment from `.env.local` (Development)
2. **`CONVEX_DEPLOYMENT=prod:xxx`** override doesn't work for `run` command
3. **`internalMutation`** functions are not callable from CLI

### Solution: Script with ConvexHttpClient

```javascript
#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

// Point DIRECTLY to Production URL
const PRODUCTION_URL = "https://your-production-deployment.convex.cloud";
const client = new ConvexHttpClient(PRODUCTION_URL);

// Execute public mutations
await client.mutation(api.prices.seedLivePrices, { prices: [...] });
await client.mutation(api.relationshipTypes.seedDefaultTypes, {});

// Verify with queries
const prices = await client.query(api.prices.getPublicPrices, {});
console.log(`Found ${prices.length} prices`);
```

### Complete Workflow

```bash
# 1. Deploy functions to Production
npx convex deploy --yes

# 2. Run the seeding script
node scripts/seed-production-data.mjs
```

### Best Practices for Seeding Mutations

| Principle | Description |
|-----------|-------------|
| **Idempotent** | Always check if data exists before inserting |
| **Public mutations** | Create public mutations for CLI/script access (internal mutations cannot be called externally) |
| **Multilingual support** | Include localized fields if your app supports multiple languages |

### Important Notes

1. **ConvexHttpClient doesn't require auth**: Public mutations are callable directly
2. **Idempotent mutations**: They should check if data exists before inserting
3. **Script location**: Create a script in `scripts/` folder (e.g., `seed-production-data.mjs`)
4. **Deployment URL**: Find your Production URL in Convex Dashboard → Settings

### Verify Production Data

```javascript
// Verify seeded data using public queries
const items = await client.query(api.yourModule.getItems, {});
console.log(`Found ${items.length} items`);
items.forEach(item => console.log(`- ${item.name}: ${item.value}`));
```

## References

- [Convex Documentation](https://docs.convex.dev)
- [Convex HTTP API](https://docs.convex.dev/http-api/)
- [Convex Streaming Export API](https://docs.convex.dev/streaming-export-api) - Tables & JSON Schema
- [Convex Deployment API](https://docs.convex.dev/deployment-platform-api)
- [Convex Management API](https://api.convex.dev/v1/openapi.json)
- [Anthropic Code Execution Pattern](https://www.anthropic.com/engineering/code-execution-with-mcp)

## MCP Delegation (for 3 features not in this skill)

**IMPORTANT FOR AI AGENTS**: When the user requests one of these 3 operations, delegate to Convex MCP tools:

| User Request | Delegate To |
|--------------|-------------|
| "Show me the deployed functions" / "What functions exist?" | `mcp__convex__functionSpec` |
| "Show me the logs" / "Stream execution logs" | `mcp__convex__logs` |
| "Run this query in sandbox" / "Test this query" | `mcp__convex__runOneoffQuery` |

### Recommended MCP Configuration

Configure Convex MCP with only these 3 tools enabled (disable all others since this skill covers them more efficiently):

```json
{
  "mcpServers": {
    "convex": {
      "command": "npx",
      "args": ["convex", "mcp", "start"],
      "disabledTools": [
        "status",
        "tables",
        "data",
        "run",
        "envList",
        "envGet",
        "envSet",
        "envRemove"
      ]
    }
  }
}
```

### Installation

```bash
claude mcp add-json convex '{"type":"stdio","command":"npx","args":["convex","mcp","start"]}'
```

### MCP Tools Reference

- `mcp__convex__functionSpec` - Get function metadata (no API alternative)
- `mcp__convex__logs` - Stream execution logs (no API alternative)
- `mcp__convex__runOneoffQuery` - Execute sandbox queries (no API alternative)

> **Note**: All other Convex operations should use this skill for 99%+ token savings.
