---
name: railway-code-exec
description: Direct Railway GraphQL API access for deployment, project management, services, environments, variables, logs, and domains using the Code Execution pattern (99%+ token reduction). Use when you need to deploy apps, manage infrastructure, check logs, or configure Railway services without MCP server overhead.
---

# Railway Code Execution

Direct connection to Railway's GraphQL API without MCP server overhead. Reduces token usage by 99%+ following Anthropic's Code Execution pattern.

## Setup

### 1. Get your Railway API Token

1. Go to [Railway Account Tokens](https://railway.com/account/tokens)
2. Create a new token (Team token or Personal token)
3. Copy the token

### 2. Set Environment Variable

```bash
export RAILWAY_TOKEN="your-railway-token"
```

### 3. Copy the Client

Copy `scripts/client-railway.ts` to your project.

## Quick Start

```typescript
import { createRailwayClient, getRailwayConfigFromEnv } from './client-railway.js';

// Initialize client
const railway = createRailwayClient(getRailwayConfigFromEnv());

// List all projects
const projects = await railway.listProjects();
projects.forEach(p => console.log(`- ${p.name} (${p.id})`));

// Deploy a service
await railway.deploy(serviceId, environmentId);
```

## Usage Examples

### Projects

#### List all projects
```typescript
const projects = await railway.listProjects();
projects.forEach(p => {
  console.log(`${p.name} - Created: ${p.createdAt}`);
});
```

#### Get project with services and environments
```typescript
const project = await railway.getProject(projectId);
console.log(`Project: ${project.name}`);
console.log(`Services: ${project.services?.edges.map(e => e.node.name).join(', ')}`);
console.log(`Environments: ${project.environments?.edges.map(e => e.node.name).join(', ')}`);
```

#### Create a new project
```typescript
const project = await railway.createProject({
  name: 'My New App',
  description: 'Production application',
  prDeploys: true
});
console.log(`Created: ${project.id}`);
```

#### Delete a project
```typescript
await railway.deleteProject(projectId);
```

### Services

#### List services in a project
```typescript
const services = await railway.listServices(projectId);
services.forEach(s => console.log(`- ${s.name} (${s.id})`));
```

#### Create a service from GitHub repo
```typescript
const service = await railway.createService({
  projectId,
  name: 'backend-api',
  source: {
    repo: 'username/repo-name'
  },
  branch: 'main'
});
```

#### Create a service from Docker image
```typescript
const redis = await railway.createService({
  projectId,
  name: 'redis-cache',
  source: {
    image: 'redis:7-alpine'
  }
});
```

#### Update service configuration
```typescript
await railway.updateServiceInstance(serviceId, environmentId, {
  startCommand: 'npm start',
  buildCommand: 'npm run build',
  healthcheckPath: '/health',
  numReplicas: 2,
  region: 'us-west1'
});
```

### Deployments

#### Deploy a service
```typescript
await railway.deploy(serviceId, environmentId);
console.log('Deployment triggered!');
```

#### Get latest deployment
```typescript
const deployment = await railway.getLatestDeployment(projectId, environmentId, serviceId);
if (deployment) {
  console.log(`Status: ${deployment.status}`);
  console.log(`URL: ${deployment.url}`);
}
```

#### List recent deployments
```typescript
const deployments = await railway.listDeployments({
  projectId,
  environmentId,
  serviceId
}, 10);

deployments.forEach(d => {
  console.log(`${d.status} - ${d.createdAt} - ${d.url || 'No URL'}`);
});
```

#### Rollback deployment
```typescript
const deployment = await railway.getDeployment(deploymentId);
if (deployment.canRollback) {
  await railway.rollback(deploymentId);
  console.log('Rolled back!');
}
```

#### Stop/Cancel deployment
```typescript
await railway.stopDeployment(deploymentId);
// or
await railway.cancelDeployment(deploymentId);
```

### Logs

#### Get build logs
```typescript
const buildLogs = await railway.getBuildLogs(deploymentId, 100);
buildLogs.forEach(log => {
  console.log(`[${log.timestamp}] ${log.message}`);
});
```

#### Get runtime logs
```typescript
const runtimeLogs = await railway.getDeploymentLogs(deploymentId, {
  limit: 100,
  filter: 'error'
});
runtimeLogs.forEach(log => {
  console.log(`[${log.severity}] ${log.message}`);
});
```

#### Get HTTP access logs
```typescript
const httpLogs = await railway.getHttpLogs(deploymentId, 50);
httpLogs.forEach(log => {
  console.log(`${log.method} ${log.path} - ${log.httpStatus} (${log.totalDuration}ms)`);
});
```

#### Get environment-level logs
```typescript
const envLogs = await railway.getEnvironmentLogs(environmentId);
envLogs.forEach(log => {
  console.log(`[${log.tags?.serviceId}] ${log.message}`);
});
```

### Environment Variables

#### Get all variables
```typescript
const vars = await railway.getVariables(projectId, environmentId, serviceId);
Object.entries(vars).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});
```

#### Set a single variable
```typescript
await railway.setVariable({
  projectId,
  environmentId,
  serviceId,
  name: 'DATABASE_URL',
  value: 'postgres://...'
});
```

#### Set multiple variables at once
```typescript
await railway.setVariables({
  projectId,
  environmentId,
  serviceId,
  variables: {
    NODE_ENV: 'production',
    API_KEY: 'secret123',
    LOG_LEVEL: 'info'
  }
});
```

#### Delete a variable
```typescript
await railway.deleteVariable({
  projectId,
  environmentId,
  serviceId,
  name: 'OLD_VAR'
});
```

### Environments

#### List environments
```typescript
const environments = await railway.listEnvironments(projectId);
environments.forEach(e => console.log(`- ${e.name} (${e.id})`));
```

#### Create a new environment
```typescript
const staging = await railway.createEnvironment({
  projectId,
  name: 'staging',
  sourceEnvironmentId: productionEnvId // Clone from production
});
```

#### Delete an environment
```typescript
await railway.deleteEnvironment(stagingEnvId);
```

### Domains

#### Generate a Railway domain
```typescript
const domain = await railway.generateDomain(serviceId, environmentId);
console.log(`Generated: ${domain.domain}`);
```

#### Add a custom domain
```typescript
const customDomain = await railway.addCustomDomain(serviceId, environmentId, 'api.myapp.com');
console.log('DNS Records to configure:');
customDomain.status.dnsRecords.forEach(record => {
  console.log(`  ${record.hostlabel} -> ${record.requiredValue}`);
});
```

### Volumes

#### Create a volume
```typescript
const volume = await railway.createVolume(serviceId, environmentId, '/data', 'app-data');
console.log(`Volume created: ${volume.id}`);
```

#### Create a backup
```typescript
await railway.createVolumeBackup(volumeInstanceId);
```

### Templates

#### Deploy from a template
```typescript
const result = await railway.deployTemplate('postgres', projectId, environmentId);
console.log(`Deployed to project: ${result.projectId}`);
```

### Utility

#### List available regions
```typescript
const regions = await railway.listRegions();
regions.forEach(r => {
  console.log(`${r.name} - ${r.location}, ${r.country}`);
});
```

#### Get current user
```typescript
const user = await railway.me();
console.log(`Logged in as: ${user.name} (${user.email})`);
```

## API Coverage

This skill covers **all 14 MCP tools** from the Railway MCP server:

| MCP Tool | Client Method | Coverage |
|----------|---------------|----------|
| check-railway-status | `me()` | 100% |
| list-projects | `listProjects()` | 100% |
| create-project-and-link | `createProject()` | 100% |
| list-services | `listServices()` | 100% |
| link-service | `getService()` / `connectService()` | 100% |
| deploy | `deploy()` | 100% |
| deploy-template | `deployTemplate()` | 100% |
| create-environment | `createEnvironment()` | 100% |
| link-environment | `getEnvironment()` | 100% |
| list-variables | `getVariables()` | 100% |
| set-variables | `setVariable()` / `setVariables()` | 100% |
| generate-domain | `generateDomain()` | 100% |
| get-logs | `getBuildLogs()` / `getDeploymentLogs()` / `getHttpLogs()` | 100% |

### Additional Operations (Beyond MCP)

The Code Execution client provides **40+ additional operations** not available in the MCP server:

| Category | Operations |
|----------|------------|
| **Projects** | `updateProject()`, `deleteProject()`, `transferProject()` |
| **Services** | `getServiceInstance()`, `updateServiceInstance()`, `disconnectService()`, `deleteService()` |
| **Deployments** | `listDeployments()`, `getDeployment()`, `getLatestDeployment()`, `redeploy()`, `rollback()`, `restartDeployment()`, `stopDeployment()`, `cancelDeployment()`, `removeDeployment()` |
| **Environments** | `renameEnvironment()`, `deleteEnvironment()` |
| **Variables** | `getVariablesForDeployment()`, `deleteVariable()` |
| **Domains** | `addCustomDomain()` |
| **Volumes** | `createVolume()`, `createVolumeBackup()` |
| **TCP Proxies** | `listTcpProxies()` |
| **Regions** | `listRegions()` |
| **Workspace** | `getWorkspace()` |
| **Auth** | `getProjectTokenInfo()` |

## Recommended Patterns

### Deploy and Wait for Status

```typescript
async function deployAndWait(serviceId: string, environmentId: string, projectId: string) {
  // Trigger deployment
  await railway.deploy(serviceId, environmentId);

  // Poll for status
  let status: string;
  do {
    await new Promise(r => setTimeout(r, 5000)); // Wait 5s
    const deployment = await railway.getLatestDeployment(projectId, environmentId, serviceId);
    status = deployment?.status || 'UNKNOWN';
    console.log(`Status: ${status}`);
  } while (['BUILDING', 'DEPLOYING', 'INITIALIZING', 'QUEUED'].includes(status));

  return status === 'SUCCESS';
}
```

### Clone Environment with Variables

```typescript
async function cloneEnvironment(projectId: string, sourceEnvId: string, newName: string) {
  // Create new environment
  const newEnv = await railway.createEnvironment({
    projectId,
    name: newName,
    sourceEnvironmentId: sourceEnvId
  });

  // Get source variables
  const services = await railway.listServices(projectId);
  for (const service of services) {
    const vars = await railway.getVariables(projectId, sourceEnvId, service.id);
    await railway.setVariables({
      projectId,
      environmentId: newEnv.id,
      serviceId: service.id,
      variables: vars
    });
  }

  return newEnv;
}
```

### Batch Deploy All Services

```typescript
async function deployAllServices(projectId: string, environmentId: string) {
  const services = await railway.listServices(projectId);

  await Promise.all(
    services.map(s => railway.deploy(s.id, environmentId))
  );

  console.log(`Triggered ${services.length} deployments`);
}
```

## Advantages vs Traditional MCP

| Aspect | Traditional MCP | Code Execution |
|--------|-----------------|----------------|
| Tokens per request | ~5,000+ | ~200 |
| Tool definitions | 14 tools loaded upfront | On-demand |
| Batch operations | Sequential calls | Promise.all |
| Error context | Generic | Full GraphQL errors |
| Additional operations | Limited to 14 | 50+ operations |

## Token Types

Railway supports three types of API tokens:

| Token Type | Scope | Use Case |
|------------|-------|----------|
| **Personal Token** | All your resources | Development, personal projects |
| **Team Token** | Team resources only | CI/CD, shared automation |
| **Project Token** | Single project + environment | Deployment pipelines |

## Troubleshooting

### "Railway API token not found"
Set the `RAILWAY_TOKEN` environment variable:
```bash
export RAILWAY_TOKEN="your-token-here"
```

### "Unauthorized" error
- Verify your token is valid at [railway.com/account/tokens](https://railway.com/account/tokens)
- Team tokens cannot access personal resources
- Project tokens can only access their specific project

### "Project/Service not found"
Use the Railway dashboard's command palette (Cmd/Ctrl + K) to copy correct IDs.

### GraphQL errors
The client throws descriptive errors. Check the error message for specific field or mutation issues.

## References

- [Railway Public API Guide](https://docs.railway.com/guides/public-api)
- [Railway API Reference](https://docs.railway.com/reference/public-api)
- [Railway MCP Server](https://docs.railway.com/reference/mcp-server)
- [Manage Deployments](https://docs.railway.com/guides/manage-deployments)
- [Manage Variables](https://docs.railway.com/guides/manage-variables)
- [Manage Services](https://docs.railway.com/guides/manage-services)
- [Manage Projects](https://docs.railway.com/guides/manage-projects)
- [Anthropic Code Execution](https://www.anthropic.com/engineering/code-execution-with-mcp)
