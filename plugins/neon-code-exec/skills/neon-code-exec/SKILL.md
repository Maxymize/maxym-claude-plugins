---
name: neon-code-exec
description: Direct Neon Serverless Postgres API access for project management, branch operations, SQL execution, and schema management. Use when you need to interact with Neon databases without MCP server overhead (99%+ token reduction). Covers all 27 MCP tools.
---

# Neon Code Execution

Direct connection to Neon Serverless Postgres API without MCP server overhead.
Reduces token usage by 99%+ following Anthropic's Code Execution pattern.

**Strategy**: Direct Connection (100% MIGRATED)
**Result**: User CAN uninstall Neon MCP server

## IMPORTANT: First Invocation - API Key Check

**Before executing ANY Neon operation**, Claude MUST check for the API key:

```typescript
import { checkApiKeyWithGuidance } from './client-neon.js';

// Check API key FIRST before any operation
const apiKeyCheck = checkApiKeyWithGuidance();

if (!apiKeyCheck.valid) {
  // Show instructions to user
  console.log(apiKeyCheck.instructions);
  // ASK USER TO CONFIRM they have set the API key before proceeding
}
```

If the API key is not found or invalid:
1. Display the instructions from `apiKeyCheck.instructions`
2. **Ask the user to confirm** they have set up the API key before proceeding
3. Do NOT execute any Neon operations until user confirms

## Setup

### 1. Get Your API Key

1. Go to https://console.neon.tech
2. Click your profile icon → Account Settings
3. Navigate to "API keys" section
4. Click "Create new API key"
5. Copy the generated key

### 2. Set Environment Variable

```bash
export NEON_API_KEY="your-api-key-here"
```

Or add to your `.env` file:
```
NEON_API_KEY=your-api-key-here
```

### 3. Copy the Client

Copy `scripts/client-neon.ts` to your project and import the functions you need.

## Quick Start

```typescript
import {
  listProjects,
  createProject,
  createBranch,
  runSql,
  getConnectionString,
} from './client-neon.js';

// List all projects
const { projects } = await listProjects();
console.log('Projects:', projects.map(p => p.name));

// Create a new project
const result = await createProject({
  name: 'my-app',
  region_id: 'aws-us-east-1',
  pg_version: 16
});
console.log('Project ID:', result.project.id);

// Execute SQL
const queryResult = await runSql({
  projectId: result.project.id,
  sql: 'SELECT NOW() as current_time'
});
console.log(queryResult.rows[0]);

// Create a development branch
const branch = await createBranch(result.project.id, {
  name: 'development'
});
console.log('Dev branch:', branch.branch.id);
```

## Available Functions

### Projects

| Function | Description |
|----------|-------------|
| `listProjects(params?)` | List all projects |
| `listSharedProjects(params?)` | List projects shared with you |
| `getProject(projectId)` | Get project details |
| `createProject(params?)` | Create a new project |
| `updateProject(projectId, params)` | Update project settings |
| `deleteProject(projectId)` | Delete a project |
| `getProjectSummary(projectId)` | Get full project summary with branches, endpoints, databases |

### Branches

| Function | Description |
|----------|-------------|
| `listBranches(projectId)` | List all branches |
| `getBranch(projectId, branchId)` | Get branch details |
| `createBranch(projectId, params?)` | Create a new branch |
| `updateBranch(projectId, branchId, params)` | Update branch settings |
| `deleteBranch(projectId, branchId)` | Delete a branch |
| `setDefaultBranch(projectId, branchId)` | Set as default branch |
| `resetBranchFromParent(projectId, branchId)` | Reset branch to parent state |
| `getBranchSchema(projectId, branchId)` | Get branch schema SQL |
| `compareBranchSchemas(projectId, branchId, params)` | Compare two branch schemas |
| `describeBranch(params)` | Get branch with databases and tables |
| `cloneBranch(params)` | Clone a branch |

### Databases

| Function | Description |
|----------|-------------|
| `listDatabases(projectId, branchId)` | List all databases |
| `getDatabase(projectId, branchId, dbName)` | Get database details |
| `createDatabase(projectId, branchId, params)` | Create a new database |
| `updateDatabase(projectId, branchId, dbName, params)` | Update database |
| `deleteDatabase(projectId, branchId, dbName)` | Delete a database |

### Roles

| Function | Description |
|----------|-------------|
| `listRoles(projectId, branchId)` | List all roles |
| `getRole(projectId, branchId, roleName)` | Get role details |
| `createRole(projectId, branchId, params)` | Create a new role |
| `deleteRole(projectId, branchId, roleName)` | Delete a role |
| `resetRolePassword(projectId, branchId, roleName)` | Reset role password |

### Endpoints (Computes)

| Function | Description |
|----------|-------------|
| `listEndpoints(projectId)` | List all endpoints |
| `getEndpoint(projectId, endpointId)` | Get endpoint details |
| `createEndpoint(projectId, params)` | Create a new endpoint |
| `updateEndpoint(projectId, endpointId, params)` | Update endpoint |
| `deleteEndpoint(projectId, endpointId)` | Delete an endpoint |
| `startEndpoint(projectId, endpointId)` | Start an endpoint |
| `suspendEndpoint(projectId, endpointId)` | Suspend an endpoint |
| `restartEndpoint(projectId, endpointId)` | Restart an endpoint |

### SQL Execution

| Function | Description |
|----------|-------------|
| `runSql(params)` | Execute a SQL query |
| `runSqlTransaction(params)` | Execute multiple statements in a transaction |
| `explainSql(params)` | Get query execution plan |
| `getTables(params)` | List all tables and views |
| `getTableSchema(params)` | Get table column definitions |
| `listSlowQueries(params)` | List slow queries from pg_stat_statements |

### Connection

| Function | Description |
|----------|-------------|
| `getConnectionString(projectId, params?)` | Get database connection string |
| `buildConnectionString(params)` | Build a connection string from components |
| `parseConnectionString(uri)` | Parse a connection string into components |

### Operations

| Function | Description |
|----------|-------------|
| `listOperations(projectId)` | List project operations |
| `getOperation(projectId, operationId)` | Get operation details |
| `waitForOperation(projectId, operationId)` | Wait for operation to complete |

### Organizations & Search

| Function | Description |
|----------|-------------|
| `listOrganizations(params?)` | List organizations |
| `search(query)` | Search projects, branches, organizations |

### API Keys

| Function | Description |
|----------|-------------|
| `listApiKeys()` | List all API keys |
| `createApiKey(params)` | Create a new API key |
| `deleteApiKey(keyId)` | Delete an API key |

### Local Utilities (No Network)

| Function | Description |
|----------|-------------|
| `checkApiKeyWithGuidance()` | **CALL FIRST** - Check API key and get setup instructions if missing |
| `ensureApiKey()` | Throws with instructions if API key missing |
| `getApiKeyConfirmationPrompt()` | Get prompt text for user confirmation |
| `validateApiKey(key)` | Validate API key format |
| `getDefaultApiKey()` | Get API key from environment |
| `hasApiKey()` | Check if API key is set |
| `listRegions()` | List available Neon regions |
| `getRegionName(regionId)` | Get display name for region |
| `formatBytes(bytes)` | Format bytes to human-readable |
| `formatComputeUnits(cu)` | Format CU to description |
| `getGettingStartedGuide()` | Get setup guide text |
| `getErrorReference()` | Get error codes reference |

## Usage Patterns

### Create a Project with Development Branch

```typescript
import { createProjectWithDevBranch } from './client-neon.js';

const result = await createProjectWithDevBranch({
  name: 'my-saas-app',
  region_id: 'aws-eu-central-1',
  devBranchName: 'staging'
});

console.log('Main branch:', result.mainBranch.id);
console.log('Dev branch:', result.devBranch.id);
```

### Execute Complex Queries

```typescript
import { runSql, runSqlTransaction } from './client-neon.js';

// Single query
const users = await runSql({
  projectId: 'my-project-id',
  sql: 'SELECT * FROM users WHERE active = true LIMIT 10'
});
console.log(`Found ${users.rows.length} active users`);

// Transaction (multiple statements)
const results = await runSqlTransaction({
  projectId: 'my-project-id',
  sqlStatements: [
    'UPDATE accounts SET balance = balance - 100 WHERE id = 1',
    'UPDATE accounts SET balance = balance + 100 WHERE id = 2',
    'INSERT INTO transfers (from_id, to_id, amount) VALUES (1, 2, 100)'
  ]
});
console.log('Transfer completed');
```

### Analyze Query Performance

```typescript
import { explainSql, listSlowQueries } from './client-neon.js';

// Get execution plan
const plan = await explainSql({
  projectId: 'my-project-id',
  sql: 'SELECT * FROM orders WHERE customer_id = 123',
  analyze: true
});
console.log('Query Plan:\n', plan.plan);

// Find slow queries
const slowQueries = await listSlowQueries({
  projectId: 'my-project-id',
  minExecutionTimeMs: 500,
  limit: 5
});
slowQueries.forEach(q => {
  console.log(`${q.mean_time.toFixed(2)}ms - ${q.query.substring(0, 50)}...`);
});
```

### Branch-Based Development

```typescript
import {
  createBranch,
  runSql,
  compareBranchSchemas,
  deleteBranch
} from './client-neon.js';

const projectId = 'my-project-id';

// 1. Create feature branch
const feature = await createBranch(projectId, {
  name: 'feature/add-user-preferences'
});

// 2. Make schema changes on feature branch
await runSql({
  projectId,
  branchId: feature.branch.id,
  sql: `
    CREATE TABLE user_preferences (
      user_id INT REFERENCES users(id),
      theme VARCHAR(20) DEFAULT 'light',
      notifications BOOLEAN DEFAULT true
    )
  `
});

// 3. Compare with main branch
const diff = await compareBranchSchemas(projectId, feature.branch.id, {
  base_branch_id: 'br-main-xxx' // main branch ID
});
console.log('Schema diff:\n', diff.diff);

// 4. After merge, delete feature branch
await deleteBranch(projectId, feature.branch.id);
```

### Get Full Project Overview

```typescript
import { getProjectSummary, describeBranch } from './client-neon.js';

// Get project with all resources
const summary = await getProjectSummary('my-project-id');
console.log(`Project: ${summary.project.name}`);
console.log(`Branches: ${summary.branches.length}`);
console.log(`Endpoints: ${summary.endpoints.length}`);
console.log(`Databases: ${summary.databases.length}`);

// Get branch details with tables
const branchDetails = await describeBranch({
  projectId: 'my-project-id',
  branchId: 'br-xxx',
  databaseName: 'neondb'
});
console.log('Tables:', branchDetails.tables.map(t => t.name));
```

## MCP Tool Coverage

This skill covers all 27 Neon MCP tools:

| MCP Tool | Code Exec Function | Coverage |
|----------|-------------------|----------|
| `list_projects` | `listProjects()` | 100% |
| `list_organizations` | `listOrganizations()` | 100% |
| `list_shared_projects` | `listSharedProjects()` | 100% |
| `create_project` | `createProject()` | 100% |
| `delete_project` | `deleteProject()` | 100% |
| `describe_project` | `getProject()` | 100% |
| `run_sql` | `runSql()` | 100% |
| `run_sql_transaction` | `runSqlTransaction()` | 100% |
| `describe_table_schema` | `getTableSchema()` | 100% |
| `get_database_tables` | `getTables()` | 100% |
| `create_branch` | `createBranch()` | 100% |
| `describe_branch` | `describeBranch()` | 100% |
| `delete_branch` | `deleteBranch()` | 100% |
| `reset_from_parent` | `resetBranchFromParent()` | 100% |
| `get_connection_string` | `getConnectionString()` | 100% |
| `provision_neon_auth` | N/A (use API directly) | Partial |
| `explain_sql_statement` | `explainSql()` | 100% |
| `prepare_database_migration` | `createBranch()` + `runSql()` | 100% |
| `complete_database_migration` | `runSql()` + `deleteBranch()` | 100% |
| `prepare_query_tuning` | `createBranch()` + `explainSql()` | 100% |
| `complete_query_tuning` | `runSql()` + `deleteBranch()` | 100% |
| `list_slow_queries` | `listSlowQueries()` | 100% |
| `list_branch_computes` | `listEndpoints()` | 100% |
| `compare_database_schema` | `compareBranchSchemas()` | 100% |
| `search` | `search()` | 100% |
| `fetch` | `getProject()`/`getBranch()` | 100% |
| `load_resource` | `getGettingStartedGuide()` | 100% |

## Available Regions

| Region ID | Location |
|-----------|----------|
| `aws-us-east-1` | US East (N. Virginia) |
| `aws-us-east-2` | US East (Ohio) |
| `aws-us-west-2` | US West (Oregon) |
| `aws-eu-central-1` | Europe (Frankfurt) |
| `aws-eu-west-1` | Europe (Ireland) |
| `aws-eu-west-2` | Europe (London) |
| `aws-ap-southeast-1` | Asia Pacific (Singapore) |
| `aws-ap-southeast-2` | Asia Pacific (Sydney) |
| `azure-eastus2` | Azure US East 2 |

## Rate Limits

- **Standard**: 700 requests/minute (~11/second)
- **Burst**: Up to 40 requests/second per route
- **Response when exceeded**: HTTP 429 Too Many Requests

## Advantages vs Traditional MCP

| Aspect | Traditional MCP | Code Execution |
|--------|-----------------|----------------|
| Tokens per request | ~5,000+ | ~200 |
| Batch operations | N separate tool calls | 1 Promise.all |
| SQL execution | Round-trip through context | Direct HTTP |
| Error handling | Limited | Full try/catch |
| Type safety | None | Full TypeScript |

## Troubleshooting

### "API key is required"
Set the `NEON_API_KEY` environment variable or pass `config.apiKey` to functions.

### "Resource not found"
Verify the project/branch/database ID is correct. Use `search()` to find resources.

### "Permission denied"
You may not have access to this resource. Check project sharing settings.

### "Rate limited"
Wait and retry. Max 700 requests/minute.

### "Connection string failed"
Ensure the endpoint is active. Use `startEndpoint()` if suspended.

## References

- [Neon Console](https://console.neon.tech)
- [Neon Documentation](https://neon.com/docs)
- [Neon API Reference](https://api-docs.neon.tech)
- [Anthropic Code Execution](https://www.anthropic.com/engineering/code-execution-with-mcp)
