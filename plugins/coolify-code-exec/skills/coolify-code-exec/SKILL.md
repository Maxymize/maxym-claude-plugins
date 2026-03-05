---
name: coolify-code-exec
description: Direct Coolify REST API access for application management, deployments, servers, databases, services, projects, env vars, backups, and GitHub Apps using the Code Execution pattern (99%+ token reduction). Use when you need to deploy apps, manage infrastructure, check deployment status/logs, configure env vars, or manage Coolify resources without MCP server overhead. Triggers include "deploy Coolify", "Coolify status", "Coolify deploy", "Coolify env", "Coolify logs", "restart Coolify", "Coolify application", "gestione Coolify".
---

# Coolify Code Execution

Direct connection to Coolify REST API without MCP server overhead. Reduces token usage by 99%+ following Anthropic's Code Execution pattern.

Covers **ALL 107 Coolify API v1 endpoints** across 13 categories.

## Setup

### 1. Set Environment Variables

```bash
export COOLIFY_API_URL="http://your-coolify-server:8000"
export COOLIFY_TOKEN="your-api-token"
```

### 2. Get API Token

Coolify Dashboard → Keys & Tokens → Create API Token

Token permissions:
- `read-only` (default): View data only
- `read:sensitive`: Read including passwords/keys
- `*`: Full access (required for write operations)

### 3. Copy the Client

Copy `scripts/client-coolify.ts` to your project.

## Quick Start

```typescript
import { createCoolifyClient, getCoolifyConfigFromEnv } from './client-coolify.js';

const coolify = createCoolifyClient(getCoolifyConfigFromEnv());

// Get version
const version = await coolify.version();
console.log(`Coolify ${version}`);

// List applications
const apps = await coolify.listApplications();
apps.forEach(a => console.log(`- ${a.name} (${a.uuid}) [${a.status}]`));

// Deploy an application
const result = await coolify.deployApplication('app-uuid-here');
console.log(`Deploy: ${result.deployment_uuid}`);
```

## Usage Examples

### Applications

#### List all applications
```typescript
const apps = await coolify.listApplications();
apps.forEach(a => console.log(`${a.name} - ${a.status}`));
```

#### Get application details
```typescript
const app = await coolify.getApplication('b80cgsck48wk484o88w044gg');
console.log(`Name: ${app.name}`);
console.log(`Status: ${app.status}`);
console.log(`Build Pack: ${app.build_pack}`);
console.log(`Branch: ${app.git_branch}`);
```

#### Deploy / Restart application
```typescript
// Simple restart
await coolify.restartApplication('app-uuid');

// Deploy with tag
await coolify.deploy({ tag: 'production' });

// Force rebuild (no cache)
await coolify.forceRebuild('app-uuid');

// Quick deploy and get deployment UUID
const deployUuid = await coolify.quickDeploy('app-uuid');
console.log(`Deployment: ${deployUuid}`);
```

#### Start / Stop application
```typescript
await coolify.startApplication('app-uuid');
await coolify.stopApplication('app-uuid');
```

#### Get application logs
```typescript
const { logs } = await coolify.getApplicationLogs('app-uuid', 200);
console.log(logs);
```

#### Update application settings
```typescript
await coolify.updateApplication('app-uuid', {
  name: 'New Name',
  git_branch: 'develop',
  build_command: 'npm run build',
  start_command: 'npm start',
});
```

### Deployments

#### List deployments for an app
```typescript
const deployments = await coolify.listApplicationDeployments('app-uuid', 0, 5);
deployments.forEach(d => {
  console.log(`${d.status} - ${d.created_at} - ${d.commit_message}`);
});
```

#### Deploy and wait for completion
```typescript
const deployUuid = await coolify.quickDeploy('app-uuid');
const result = await coolify.waitForDeployment('app-uuid', deployUuid, 300000);
console.log(`Status: ${result.status}`);
if (result.status === 'failed') {
  console.log(`Logs:\n${result.logs}`);
}
```

#### Cancel a deployment
```typescript
await coolify.cancelDeployment('deployment-uuid');
```

### Environment Variables

#### List env vars
```typescript
const envs = await coolify.listApplicationEnvs('app-uuid');
envs.forEach(e => console.log(`${e.key}=${e.real_value}`));
```

#### Get env vars as key-value map
```typescript
const envMap = await coolify.getApplicationEnvMap('app-uuid');
console.log(envMap.DATABASE_URL);
console.log(envMap.CORS_ORIGINS);
```

#### Set multiple env vars at once
```typescript
await coolify.setApplicationEnvs('app-uuid', {
  NODE_ENV: 'production',
  LOG_LEVEL: 'info',
  NEW_FEATURE: 'enabled',
});
```

#### Create single env var
```typescript
await coolify.createApplicationEnv('app-uuid', {
  key: 'API_KEY',
  value: 'secret123',
  is_shown_once: true,
});
```

#### Delete env var
```typescript
await coolify.deleteApplicationEnv('app-uuid', 'env-uuid');
```

### Servers

#### List servers
```typescript
const servers = await coolify.listServers();
servers.forEach(s => console.log(`${s.name} (${s.ip}) - reachable: ${s.settings?.is_reachable}`));
```

#### Get server overview with resources
```typescript
const overview = await coolify.getServerOverview('server-uuid');
console.log(`Server: ${overview.name} (${overview.ip}) - ${overview.status}`);
console.log(`Resources: ${overview.resourceCount}`);
overview.resources.forEach(r => console.log(`  - ${r.name} [${r.type}] ${r.status}`));
```

#### Validate server
```typescript
const validation = await coolify.validateServer('server-uuid');
console.log(validation);
```

### Databases

#### List databases
```typescript
const dbs = await coolify.listDatabases();
dbs.forEach(db => console.log(`${db.name} (${db.type})`));
```

#### Create PostgreSQL database
```typescript
const db = await coolify.createPostgresql({
  server_uuid: 'server-uuid',
  project_uuid: 'project-uuid',
  environment_name: 'production',
  environment_uuid: 'env-uuid',
  destination_uuid: 'dest-uuid',
  name: 'my-postgres',
  postgres_user: 'app_user',
  postgres_password: 'your-db-password',
  postgres_db: 'app_database',
});
```

#### Start / Stop / Restart database
```typescript
await coolify.startDatabase('db-uuid');
await coolify.stopDatabase('db-uuid');
await coolify.restartDatabase('db-uuid');
```

#### Database backups
```typescript
// Create backup config
await coolify.createDatabaseBackup('db-uuid', {
  frequency: '0 */6 * * *', // every 6 hours
  enabled: true,
  backup_now: true,
});

// List backup executions
const executions = await coolify.listBackupExecutions('db-uuid', 'backup-uuid');
executions.forEach(e => console.log(`${e.status} - ${e.created_at}`));
```

### Services

#### List and manage services
```typescript
const services = await coolify.listServices();

// Start/stop/restart
await coolify.startService('service-uuid');
await coolify.stopService('service-uuid');
await coolify.restartService('service-uuid');
```

### Projects

#### List projects and environments
```typescript
const projects = await coolify.listProjects();
for (const project of projects) {
  console.log(`Project: ${project.name} (${project.uuid})`);
  const envs = await coolify.listEnvironments(project.uuid);
  envs.forEach(e => console.log(`  - ${e.name}`));
}
```

#### Create project with environment
```typescript
const project = await coolify.createProject({ name: 'My App', description: 'Production' });
await coolify.createEnvironment(project.uuid, 'staging');
```

### Teams

```typescript
const team = await coolify.getCurrentTeam();
console.log(`Team: ${team.name}`);

const members = await coolify.getCurrentTeamMembers();
members.forEach(m => console.log(`  - ${m.name} (${m.email})`));
```

### Security (Private Keys)

```typescript
const keys = await coolify.listPrivateKeys();
keys.forEach(k => console.log(`${k.name} (${k.uuid})`));
```

### GitHub Apps

```typescript
const apps = await coolify.listGithubApps();

// Get repos for a GitHub App
const repos = await coolify.getGithubAppRepos('github-app-uuid');

// Get branches for a repo
const branches = await coolify.getGithubAppRepoBranches('github-app-uuid', 'owner/repo');
```

## Available Functions

### System
| Function | Description |
|----------|-------------|
| `version()` | Get Coolify version |
| `health()` | Health check (returns boolean) |
| `enableApi()` | Enable API |
| `disableApi()` | Disable API |

### Applications (19 functions)
| Function | Description |
|----------|-------------|
| `listApplications()` | List all applications |
| `getApplication(uuid)` | Get application details |
| `createApplicationPublic(params)` | Create from public Git repo |
| `createApplicationPrivateGithub(params)` | Create from private GitHub App |
| `createApplicationPrivateKey(params)` | Create from private deploy key |
| `createApplicationDockerfile(params)` | Create from Dockerfile |
| `createApplicationDockerImage(params)` | Create from Docker image |
| `createApplicationDockerCompose(params)` | Create from Docker Compose |
| `updateApplication(uuid, params)` | Update application |
| `deleteApplication(uuid)` | Delete application |
| `getApplicationLogs(uuid, lines?)` | Get logs |
| `startApplication(uuid)` | Start/deploy |
| `stopApplication(uuid)` | Stop |
| `restartApplication(uuid)` | Restart |
| `listApplicationEnvs(uuid)` | List env vars |
| `createApplicationEnv(uuid, params)` | Create env var |
| `updateApplicationEnv(uuid, params)` | Update env var |
| `bulkUpdateApplicationEnvs(uuid, envs)` | Bulk update env vars |
| `deleteApplicationEnv(appUuid, envUuid)` | Delete env var |

### Deployments (5 functions)
| Function | Description |
|----------|-------------|
| `listDeployments()` | List running deployments |
| `getDeployment(uuid)` | Get deployment details |
| `listApplicationDeployments(appUuid, skip?, take?)` | List app deployments |
| `deploy(params)` | Deploy by tag/uuid/PR |
| `cancelDeployment(uuid)` | Cancel deployment |

### Servers (7 functions)
| Function | Description |
|----------|-------------|
| `listServers()` | List all servers |
| `getServer(uuid, resources?)` | Get server details |
| `createServer(params)` | Create server |
| `updateServer(uuid, params)` | Update server |
| `deleteServer(uuid)` | Delete server |
| `listServerResources(uuid)` | List resources on server |
| `getServerDomains(uuid)` | Get domain mappings |
| `validateServer(uuid)` | Validate connectivity |

### Databases (18 functions)
| Function | Description |
|----------|-------------|
| `listDatabases()` | List all databases |
| `getDatabase(uuid)` | Get database details |
| `createPostgresql(params)` | Create PostgreSQL |
| `createMysql(params)` | Create MySQL |
| `createMariadb(params)` | Create MariaDB |
| `createMongodb(params)` | Create MongoDB |
| `createRedis(params)` | Create Redis |
| `createClickhouse(params)` | Create ClickHouse |
| `createKeydb(params)` | Create KeyDB |
| `createDragonfly(params)` | Create DragonFly |
| `updateDatabase(uuid, params)` | Update database |
| `deleteDatabase(uuid)` | Delete database |
| `startDatabase(uuid)` | Start database |
| `stopDatabase(uuid)` | Stop database |
| `restartDatabase(uuid)` | Restart database |
| `listDatabaseBackups(uuid)` | List backup configs |
| `createDatabaseBackup(uuid, params)` | Create backup config |
| `updateDatabaseBackup(dbUuid, backupUuid, params)` | Update backup |
| `deleteDatabaseBackup(dbUuid, backupUuid)` | Delete backup |
| `listBackupExecutions(dbUuid, backupUuid)` | List backup runs |
| `deleteBackupExecution(dbUuid, backupUuid, execUuid)` | Delete backup run |

### Services (11 functions)
| Function | Description |
|----------|-------------|
| `listServices()` | List all services |
| `getService(uuid)` | Get service details |
| `createService(params)` | Create service |
| `updateService(uuid, params)` | Update service |
| `deleteService(uuid)` | Delete service |
| `startService(uuid)` | Start service |
| `stopService(uuid)` | Stop service |
| `restartService(uuid)` | Restart service |
| `listServiceEnvs(uuid)` | List env vars |
| `createServiceEnv(uuid, params)` | Create env var |
| `updateServiceEnv(uuid, params)` | Update env var |
| `bulkUpdateServiceEnvs(uuid, envs)` | Bulk update env vars |
| `deleteServiceEnv(serviceUuid, envUuid)` | Delete env var |

### Projects & Environments (8 functions)
| Function | Description |
|----------|-------------|
| `listProjects()` | List projects |
| `getProject(uuid)` | Get project |
| `createProject(params)` | Create project |
| `updateProject(uuid, params)` | Update project |
| `deleteProject(uuid)` | Delete project |
| `listEnvironments(projectUuid)` | List environments |
| `createEnvironment(projectUuid, name)` | Create environment |
| `getEnvironment(projectUuid, nameOrUuid)` | Get environment |
| `deleteEnvironment(projectUuid, nameOrUuid)` | Delete environment |

### Teams (5 functions)
| Function | Description |
|----------|-------------|
| `listTeams()` | List teams |
| `getTeam(id)` | Get team |
| `getTeamMembers(id)` | Get members |
| `getCurrentTeam()` | Current team |
| `getCurrentTeamMembers()` | Current team members |

### Security (5 functions)
| Function | Description |
|----------|-------------|
| `listPrivateKeys()` | List private keys |
| `getPrivateKey(uuid)` | Get key |
| `createPrivateKey(params)` | Create key |
| `updatePrivateKey(uuid, params)` | Update key |
| `deletePrivateKey(uuid)` | Delete key |

### Resources, Cloud Tokens, GitHub Apps
| Function | Description |
|----------|-------------|
| `listResources()` | List all resources |
| `listCloudTokens()` | List cloud tokens |
| `createCloudToken(params)` | Create token |
| `validateCloudToken(uuid)` | Validate token |
| `listGithubApps()` | List GitHub Apps |
| `getGithubAppRepos(uuid)` | Get repos |
| `getGithubAppRepoBranches(uuid, repo)` | Get branches |

### Utility / Batch Operations (7 functions)
| Function | Description |
|----------|-------------|
| `deployApplication(appUuid)` | Deploy and get UUID |
| `getApplicationStatus(uuid)` | Get status string |
| `getApplicationEnvMap(uuid)` | Env vars as key-value map |
| `setApplicationEnvs(uuid, vars)` | Set multiple env vars |
| `getDeploymentWithLogs(uuid)` | Deployment info + logs |
| `waitForDeployment(appUuid, depUuid, timeout?, interval?)` | Poll until finished |
| `getServerOverview(uuid)` | Server info + resources |
| `quickDeploy(appUuid)` | Deploy and return UUID |
| `forceRebuild(appUuid)` | Deploy without cache |

## Recommended Patterns

### Deploy and Wait
```typescript
async function deployAndWait(appUuid: string) {
  const deployUuid = await coolify.quickDeploy(appUuid);
  console.log(`Deployment started: ${deployUuid}`);

  const result = await coolify.waitForDeployment(appUuid, deployUuid, 300000, 10000);
  console.log(`Final status: ${result.status}`);

  if (result.status === 'failed') {
    console.error('Deploy failed. Last 50 lines:');
    console.error(result.logs.split('\n').slice(-50).join('\n'));
  }
  return result.status === 'finished';
}
```

### Process locally, report summary
```typescript
const apps = await coolify.listApplications();
const running = apps.filter(a => a.status?.includes('running')).length;
const stopped = apps.filter(a => !a.status?.includes('running')).length;
console.log(`Applications: ${running} running, ${stopped} stopped`);
// Only the summary enters the context
```

## API Coverage

This skill covers **ALL 107 Coolify API v1 endpoints**:

| Category | Endpoints | Coverage |
|----------|-----------|----------|
| System | 4 | 100% |
| Applications | 19 | 100% |
| Deployments | 5 | 100% |
| Servers | 8 | 100% |
| Databases | 21 | 100% |
| Services | 13 | 100% |
| Projects | 9 | 100% |
| Teams | 5 | 100% |
| Security | 5 | 100% |
| Resources | 1 | 100% |
| Cloud Tokens | 6 | 100% |
| GitHub Apps | 6 | 100% |
| **Total** | **107** | **100%** |

**This is a 100% MIGRATED skill.** No MCP server is needed.

## Advantages vs Traditional MCP

| Aspect | Traditional MCP | Code Execution |
|--------|-----------------|----------------|
| Tokens per request | ~5,000+ | ~200 |
| Tool definitions | Loaded upfront | On-demand |
| Batch operations | Sequential calls | Promise.all |
| Error context | Generic | Full HTTP errors |
| Total operations | Limited | 107 endpoints |

## Troubleshooting

### "COOLIFY_API_URL not set"
```bash
export COOLIFY_API_URL="http://your-coolify-server:8000"
export COOLIFY_TOKEN="1|your-token-here"
```

### "Unauthorized" (401)
- Verify token in Coolify Dashboard → Keys & Tokens
- Ensure token has `*` permission for write operations

### "Forbidden" (403)
- Token doesn't have sufficient permissions
- Check token scope (team-level access)

### Deployment stuck
Use `waitForDeployment()` with appropriate timeout, or `cancelDeployment()`.

### Connection refused
- Verify Coolify is running on the target server
- Check firewall/VPN access to the Coolify API port

## References

- [Coolify API Reference](https://coolify.io/docs/api-reference)
- [Coolify Authorization](https://coolify.io/docs/api-reference/authorization)
- [Anthropic Code Execution](https://www.anthropic.com/engineering/code-execution-with-mcp)
