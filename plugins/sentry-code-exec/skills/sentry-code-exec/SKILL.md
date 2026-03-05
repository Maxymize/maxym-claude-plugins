---
name: sentry-code-exec
description: Direct Sentry API access for error tracking, issue management, releases, and project monitoring using the Code Execution pattern (99%+ token reduction). Use when you need to interact with Sentry without MCP server overhead.
---

# Sentry Code Execution

Code Execution pattern to interact with Sentry API directly, without MCP server overhead. Covers all major Sentry features including organizations, projects, teams, issues, events, releases, and DSN management.

## Setup (one-time per project)

1. **Get your Sentry Auth Token:**
   - Visit [Sentry Settings → Auth Tokens](https://sentry.io/settings/account/api/auth-tokens/)
   - Click "Create New Token"
   - Give it a descriptive name (e.g., "Claude Code Integration")
   - Select required scopes:
     - `org:read` - Read organization data
     - `project:read` - Read project data
     - `project:write` - Create/modify projects
     - `team:read` - Read team data
     - `team:write` - Create/modify teams
     - `event:read` - Read error events
     - `event:write` - Write events (for releases)
   - Copy the generated token

2. **Set environment variables:**
   ```bash
   export SENTRY_AUTH_TOKEN="your_auth_token_here"
   export SENTRY_ORG="your-organization-slug"  # Optional but recommended
   export SENTRY_HOST="https://sentry.io"  # Optional (for self-hosted)
   ```

3. **Copy the client to your project:**
   ```bash
   cp .claude/skills/sentry-code-exec/scripts/client-sentry.ts lib/sentry-client.ts
   ```

## Quick Start

```typescript
import { createSentryClient, getSentryConfigFromEnv } from './client-sentry.js';

// Initialize from environment variables
const config = getSentryConfigFromEnv();
const sentry = createSentryClient(config);

// Or initialize manually
const sentry = createSentryClient({
  authToken: 'sntrys_...',
  host: 'https://sentry.io',
  organizationSlug: 'my-org'
});
```

## Organizations

### List all organizations
```typescript
const orgs = await sentry.listOrganizations();
console.log(`Found ${orgs.length} organizations`);

orgs.forEach(org => {
  console.log(`- ${org.name} (${org.slug})`);
  console.log(`  Status: ${org.status.name}`);
  console.log(`  Features: ${org.features.join(', ')}`);
});
```

### Get organization details
```typescript
const org = await sentry.getOrganization('my-org');
console.log(`Organization: ${org.name}`);
console.log(`Created: ${org.dateCreated}`);
console.log(`2FA Required: ${org.require2FA ? 'Yes' : 'No'}`);
```

## Projects

### List all projects
```typescript
const projects = await sentry.listProjects();
console.log(`Found ${projects.length} projects`);

projects.forEach(project => {
  console.log(`- ${project.name} (${project.slug})`);
  console.log(`  Platform: ${project.platform}`);
  console.log(`  Team: ${project.team?.name || 'No team'}`);
  console.log(`  First Event: ${project.firstEvent || 'Never'}`);
});
```

### Get project details
```typescript
const project = await sentry.getProject('my-project');
console.log(`Project: ${project.name}`);
console.log(`Platform: ${project.platform}`);
console.log(`Features: ${project.features.join(', ')}`);
console.log(`Has Sessions: ${project.hasSessions}`);
console.log(`Has Replays: ${project.hasReplays}`);
```

### Create a new project
```typescript
const newProject = await sentry.createProject(
  'backend-team',  // team slug
  {
    name: 'New API Service',
    slug: 'new-api-service',
    platform: 'node',
    defaultRules: true  // Create default alert rules
  }
);

console.log(`Created project: ${newProject.name} (ID: ${newProject.id})`);
```

### Update a project
```typescript
await sentry.updateProject('my-project', {
  name: 'Updated Project Name',
  platform: 'node-express'
});
```

### Delete a project
```typescript
await sentry.deleteProject('old-project');
console.log('Project deleted');
```

## Teams

### List all teams
```typescript
const teams = await sentry.listTeams();

teams.forEach(team => {
  console.log(`- ${team.name} (${team.slug})`);
  console.log(`  Members: ${team.memberCount}`);
  console.log(`  Has Access: ${team.hasAccess ? 'Yes' : 'No'}`);
});
```

### Create a team
```typescript
const newTeam = await sentry.createTeam({
  name: 'Frontend Team',
  slug: 'frontend-team'
});

console.log(`Created team: ${newTeam.name} (ID: ${newTeam.id})`);
```

### Delete a team
```typescript
await sentry.deleteTeam('old-team');
console.log('Team deleted');
```

## Issues & Error Tracking

### List issues in organization
```typescript
const issues = await sentry.listIssues({
  query: 'is:unresolved',  // Sentry search query
  statsPeriod: '24h',      // Last 24 hours
  sort: 'freq',            // Sort by frequency
  limit: 20
});

issues.forEach(issue => {
  console.log(`- ${issue.title}`);
  console.log(`  ID: ${issue.shortId}`);
  console.log(`  Level: ${issue.level}`);
  console.log(`  Status: ${issue.status}`);
  console.log(`  Platform: ${issue.platform}`);
  console.log(`  Count: ${issue.count}`);
  console.log(`  Users: ${issue.userCount}`);
  console.log(`  First seen: ${issue.firstSeen}`);
  console.log(`  Last seen: ${issue.lastSeen}`);
  console.log(`  Permalink: ${issue.permalink}`);
});
```

### List issues for a specific project
```typescript
const projectIssues = await sentry.listProjectIssues('my-project', {
  query: 'is:unresolved level:error',
  statsPeriod: '7d',
  limit: 10
});

console.log(`Found ${projectIssues.length} unresolved errors in the last 7 days`);
```

### Get issue details
```typescript
const issue = await sentry.getIssue('12345');

console.log(`Issue: ${issue.title}`);
console.log(`Culprit: ${issue.culprit}`);
console.log(`Type: ${issue.type}`);
console.log(`Metadata:`, issue.metadata);
console.log(`Comments: ${issue.numComments}`);
console.log(`Assigned to: ${issue.assignedTo?.name || 'Unassigned'}`);
```

### Update an issue
```typescript
// Resolve an issue
await sentry.updateIssue('12345', {
  status: 'resolved'
});

// Assign to a user
await sentry.updateIssue('12345', {
  assignedTo: 'user@example.com'
});

// Mark as seen
await sentry.updateIssue('12345', {
  hasSeen: true
});

// Bookmark an issue
await sentry.updateIssue('12345', {
  isBookmarked: true
});
```

### Bulk update issues
```typescript
// Resolve multiple issues
await sentry.bulkUpdateIssues(
  ['12345', '12346', '12347'],
  { status: 'resolved' }
);

console.log('Bulk resolved 3 issues');
```

### Bulk delete issues
```typescript
await sentry.bulkDeleteIssues(['12345', '12346']);
console.log('Deleted 2 issues');
```

### Delete a single issue
```typescript
await sentry.deleteIssue('12345');
console.log('Issue deleted');
```

## Events

### List events for an issue
```typescript
const events = await sentry.listIssueEvents('12345');

events.forEach(event => {
  console.log(`- Event ${event.eventID}`);
  console.log(`  Date: ${event.dateCreated}`);
  console.log(`  Message: ${event.message}`);
  console.log(`  User: ${event.user?.email || 'Anonymous'}`);
  console.log(`  Platform: ${event.platform}`);
});
```

### Get a specific event
```typescript
const event = await sentry.getProjectEvent('my-project', 'abc123def456');

console.log(`Event: ${event.title}`);
console.log(`Message: ${event.message}`);
console.log(`User:`, event.user);
console.log(`Tags:`, event.tags);
console.log(`Contexts:`, event.contexts);
console.log(`SDK:`, event.sdk);
```

### List project events
```typescript
const events = await sentry.listProjectEvents('my-project', {
  full: true,  // Include full event data
  limit: 50
});

console.log(`Retrieved ${events.length} events`);
```

## Releases

### List releases
```typescript
const releases = await sentry.listReleases();

releases.forEach(release => {
  console.log(`- ${release.version}`);
  console.log(`  Short Version: ${release.shortVersion}`);
  console.log(`  Created: ${release.dateCreated}`);
  console.log(`  Released: ${release.dateReleased || 'Not deployed'}`);
  console.log(`  Commits: ${release.commitCount}`);
  console.log(`  New Issues: ${release.newGroups}`);
  console.log(`  Deploys: ${release.deployCount}`);
  console.log(`  Projects: ${release.projects.map(p => p.slug).join(', ')}`);
});
```

### Get release details
```typescript
const release = await sentry.getRelease('1.0.0');
console.log(`Release: ${release.version}`);
console.log(`Authors:`, release.authors);
console.log(`Last commit:`, release.lastCommit);
```

### Create a release
```typescript
const newRelease = await sentry.createRelease({
  version: '1.2.3',
  ref: 'main',
  url: 'https://github.com/org/repo/releases/1.2.3',
  projects: ['my-project', 'another-project'],
  dateReleased: new Date().toISOString(),
  commits: [
    {
      id: 'abc123',
      repository: 'org/repo',
      message: 'Fix critical bug'
    },
    {
      id: 'def456',
      repository: 'org/repo',
      message: 'Add new feature'
    }
  ]
});

console.log(`Created release: ${newRelease.version}`);
```

### Update a release
```typescript
await sentry.updateRelease('1.2.3', {
  ref: 'production',
  url: 'https://github.com/org/repo/releases/1.2.3-final'
});
```

### Delete a release
```typescript
await sentry.deleteRelease('1.0.0-beta');
console.log('Release deleted');
```

### List release commits
```typescript
const commits = await sentry.listReleaseCommits('1.2.3');

commits.forEach(commit => {
  console.log(`- ${commit.id}: ${commit.message}`);
  console.log(`  Author: ${commit.author.name}`);
});
```

## Client Keys (DSN Management)

### List project DSNs
```typescript
const keys = await sentry.listProjectKeys('my-project');

keys.forEach(key => {
  console.log(`- ${key.name}`);
  console.log(`  DSN: ${key.dsn.public}`);
  console.log(`  Secret: ${key.dsn.secret}`);
  console.log(`  Security: ${key.dsn.security}`);
  console.log(`  Created: ${key.dateCreated}`);
});
```

### Create a new DSN
```typescript
const newKey = await sentry.createProjectKey('my-project', {
  name: 'Production Key'
});

console.log(`Created DSN: ${newKey.dsn.public}`);
console.log(`Use this in your app to send events to Sentry`);
```

### Delete a DSN
```typescript
await sentry.deleteProjectKey('my-project', 'key-id-123');
console.log('DSN deleted');
```

## Statistics

### Get organization stats
```typescript
const orgStats = await sentry.getOrganizationStats({
  stat: 'received',
  since: Math.floor(Date.now() / 1000) - 86400,  // Last 24h
  until: Math.floor(Date.now() / 1000),
  resolution: '1h'
});

console.log('Organization stats:', orgStats);
```

### Get project stats
```typescript
const projectStats = await sentry.getProjectStats('my-project', {
  stat: 'received',
  since: Math.floor(Date.now() / 1000) - 604800,  // Last 7 days
  until: Math.floor(Date.now() / 1000),
  resolution: '1d'
});

console.log('Project stats:', projectStats);
```

## Recommended Patterns

### Batch Operations for Efficiency
```typescript
// Get all data in parallel
const [orgs, projects, teams, issues] = await Promise.all([
  sentry.listOrganizations(),
  sentry.listProjects(),
  sentry.listTeams(),
  sentry.listIssues({ limit: 20 })
]);

console.log(`Loaded ${orgs.length} orgs, ${projects.length} projects, ${teams.length} teams, ${issues.length} issues`);
```

### Error Handling
```typescript
try {
  const issue = await sentry.getIssue('non-existent');
} catch (error) {
  if (error.message.includes('404')) {
    console.log('Issue not found');
  } else {
    throw error;
  }
}
```

### Progressive Disclosure
```typescript
// Get summary first
const issues = await sentry.listIssues({ limit: 10 });

// Then get details only for high-priority issues
for (const issue of issues) {
  if (issue.level === 'fatal' || issue.level === 'error') {
    const events = await sentry.listIssueEvents(issue.id);
    console.log(`Issue ${issue.shortId} has ${events.length} events`);
  }
}
```

### Working with Search Queries
```typescript
// Unresolved errors in the last 24 hours
const recentErrors = await sentry.listIssues({
  query: 'is:unresolved level:error',
  statsPeriod: '24h'
});

// Issues assigned to a specific user
const myIssues = await sentry.listIssues({
  query: 'assigned:user@example.com'
});

// Issues in a specific file
const fileIssues = await sentry.listIssues({
  query: 'stack.filename:app.js'
});

// High-frequency issues
const frequentIssues = await sentry.listIssues({
  query: 'is:unresolved',
  sort: 'freq',
  limit: 10
});
```

## API Coverage

This skill covers the major Sentry API endpoints:

| Category | Operations |
|----------|------------|
| **Organizations** | list, get details |
| **Projects** | list, get, create, update, delete |
| **Teams** | list, get, create, delete |
| **Issues** | list (org/project), get, update, delete, bulk update, bulk delete |
| **Events** | list (issue/project), get specific event |
| **Releases** | list, get, create, update, delete, list commits |
| **Client Keys (DSN)** | list, create, delete |
| **Statistics** | organization stats, project stats |

## Advantages vs Traditional MCP

| Aspect | Traditional MCP | Code Execution |
|--------|-----------------|----------------|
| Tokens per request | ~8,000+ (16+ tool definitions) | ~200 |
| Latency | Multiple MCP roundtrips | Direct HTTP calls |
| Batch operations | Sequential tool calls | Parallel with Promise.all |
| Type safety | JSON schemas only | Full TypeScript types |
| Filtering & processing | All data through context | Local processing |
| Search queries | Limited | Full Sentry query syntax |

## Security Best Practices

1. **Scope auth tokens appropriately:**
   - For read-only operations: Use tokens with only read scopes
   - For automation: Limit to required scopes only
   - Rotate tokens regularly

2. **Never commit auth tokens:**
   ```bash
   # Use environment variables
   echo "SENTRY_AUTH_TOKEN=sntrys_..." >> .env
   echo ".env" >> .gitignore
   ```

3. **Validate before destructive operations:**
   ```typescript
   // Check before deleting
   const issue = await sentry.getIssue(issueId);
   if (issue.status === 'unresolved' && issue.userCount > 100) {
     throw new Error('Cannot delete high-impact unresolved issue');
   }
   await sentry.deleteIssue(issueId);
   ```

## Troubleshooting

### "Sentry auth token is required"
Set the `SENTRY_AUTH_TOKEN` environment variable or pass `authToken` to the constructor.

### "Organization slug not set"
Either:
- Set `SENTRY_ORG` environment variable
- Pass `organizationSlug` in the constructor
- Call `sentry.setOrganization('my-org')` before making API calls

### 401 Unauthorized
Your auth token may be invalid or expired. Create a new one at [Sentry Settings](https://sentry.io/settings/account/api/auth-tokens/).

### 403 Forbidden
Your auth token doesn't have the required scopes. Create a new token with appropriate permissions.

### 404 Not Found
- Check that organization/project slugs are correct
- Verify the resource ID exists
- Ensure your token has access to the organization

### Rate Limiting
Sentry has rate limits (varies by plan). Use batching and caching to reduce API calls:
```typescript
// Cache organization list
let cachedOrgs: Organization[] | null = null;
async function getOrganizations() {
  if (!cachedOrgs) {
    cachedOrgs = await sentry.listOrganizations();
  }
  return cachedOrgs;
}
```

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SENTRY_AUTH_TOKEN` | Yes | Auth token | `sntrys_...` |
| `SENTRY_ORG` | Recommended | Default organization slug | `my-org` |
| `SENTRY_HOST` | Optional | Sentry instance URL | `https://sentry.io` (default) or your self-hosted instance |

## Self-Hosted Sentry

For self-hosted Sentry instances:

```typescript
const sentry = createSentryClient({
  authToken: 'your-token',
  host: 'https://sentry.example.com',  // Your instance
  organizationSlug: 'my-org'
});
```

## References

- [Sentry API Documentation](https://docs.sentry.io/api/)
- [Sentry MCP Server](https://docs.sentry.io/product/sentry-mcp/)
- [Sentry MCP GitHub](https://github.com/getsentry/sentry-mcp)
- [Create Auth Token Guide](https://docs.sentry.io/api/guides/create-auth-token/)
- [Events & Issues API](https://docs.sentry.io/api/events/)
- [Anthropic Code Execution Pattern](https://www.anthropic.com/engineering/code-execution-with-mcp)

## Migration from MCP

If you're currently using the Sentry MCP server, migration is straightforward:

**Before (MCP):**
```typescript
// Multiple tool calls, each passing through context
await mcp_sentry_list_issues({ query: 'is:unresolved' });
// → 8,000+ tokens for tool definitions
```

**After (Code Execution):**
```typescript
// Direct API call
const issues = await sentry.listIssues({ query: 'is:unresolved' });
// → ~200 tokens total
```

**Token savings: 97.5%+**

## Limitations

1. **AI-Powered Search Not Included**: The MCP server's AI-powered search tools (requiring OpenAI API key) are not replicated. Use standard Sentry search queries instead.
2. **Seer Integration**: Advanced AI features from Sentry's Seer are not available via REST API. These require the MCP server.
3. **Real-time Updates**: No WebSocket/SSE support for real-time issue notifications. Poll the API or use webhooks.

## When to Use MCP vs Code Execution

**Use Code Execution (this skill) for:**
- Listing and querying issues
- Managing projects, teams, and releases
- Bulk operations on issues
- DSN management
- Statistics and analytics
- General automation

**Use MCP server for:**
- AI-powered natural language search (`search_events`, `search_issues`)
- Seer integration for automated issue diagnosis
- Real-time interactive debugging sessions
