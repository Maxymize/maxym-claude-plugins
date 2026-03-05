---
name: posthog-code-exec
description: Direct PostHog API access for analytics, feature flags, experiments, error tracking, surveys, and dashboards using the Code Execution pattern (99%+ token reduction). Use when you need to interact with PostHog without MCP server overhead.
---

# PostHog Code Execution

Code Execution pattern to interact with PostHog API directly, without MCP server overhead. Covers all 42 MCP tools across analytics, feature flags, experiments, error tracking, surveys, and dashboards.

## Setup (one-time per project)

1. **Get your PostHog Personal API Key:**
   - Visit [PostHog Settings → Personal API Keys](https://posthog.com/settings/user-api-keys)
   - Click "Create personal API key"
   - Give it a descriptive name (e.g., "Claude Code Integration")
   - Select appropriate scopes (or use full access for development)
   - Copy the generated key

2. **Set environment variables:**
   ```bash
   export POSTHOG_API_KEY="your_personal_api_key_here"
   export POSTHOG_PROJECT_ID="12345"  # Your project ID
   export POSTHOG_HOST="https://us.posthog.com"  # or https://eu.posthog.com for EU
   ```

3. **Copy the client to your project:**
   ```bash
   cp .claude/skills/posthog-code-exec/scripts/client-posthog.ts lib/posthog-client.ts
   ```

## Quick Start

```typescript
import { createPostHogClient, getPostHogConfigFromEnv } from './client-posthog.js';

// Initialize from environment variables
const config = getPostHogConfigFromEnv();
const posthog = createPostHogClient(config);

// Or initialize manually
const posthog = createPostHogClient({
  apiKey: 'phx_...',
  host: 'https://us.posthog.com',
  projectId: '12345'
});
```

## Feature Flags

### List all feature flags
```typescript
const { results: flags } = await posthog.getFeatureFlags();
console.log(`Found ${flags.length} feature flags`);

flags.forEach(flag => {
  console.log(`- ${flag.name} (${flag.key}): ${flag.active ? 'Active' : 'Inactive'}`);
});
```

### Create a feature flag
```typescript
const newFlag = await posthog.createFeatureFlag({
  key: 'new-checkout-flow',
  name: 'New Checkout Flow',
  active: true,
  rollout_percentage: 50,  // 50% rollout
  ensure_experience_continuity: true
});

console.log(`Created flag: ${newFlag.name} (ID: ${newFlag.id})`);
```

### Update a feature flag
```typescript
// Enable a flag at 100%
await posthog.updateFeatureFlag(flagId, {
  active: true,
  rollout_percentage: 100
});

// Disable a flag
await posthog.updateFeatureFlag(flagId, {
  active: false
});
```

### Get flag by key
```typescript
const flag = await posthog.getFeatureFlagByKey('new-checkout-flow');
console.log(`Flag status: ${flag.active ? 'Active' : 'Inactive'}`);
```

## Insights & Analytics

### List all insights
```typescript
const { results: insights } = await posthog.getInsights({ limit: 20 });

insights.forEach(insight => {
  console.log(`- ${insight.name} (ID: ${insight.id})`);
  console.log(`  Created: ${insight.created_at}`);
  console.log(`  Dashboards: ${insight.dashboards?.length || 0}`);
});
```

### Create an insight
```typescript
const insight = await posthog.createInsight({
  name: 'User Sign-ups This Month',
  description: 'Track new user registrations',
  query: {
    kind: 'TrendsQuery',
    series: [{
      event: 'user_signed_up',
      kind: 'EventsNode'
    }],
    dateRange: {
      date_from: '-30d'
    }
  }
});

console.log(`Created insight: ${insight.name} (ID: ${insight.id})`);
```

### Run a query (HogQL)
```typescript
const result = await posthog.runQuery({
  query: {
    kind: 'HogQLQuery',
    query: 'SELECT properties.$current_url, count() FROM events WHERE event = "$pageview" GROUP BY properties.$current_url ORDER BY count() DESC LIMIT 10'
  }
});

console.log('Top 10 pages:', result);
```

## Dashboards

### List all dashboards
```typescript
const { results: dashboards } = await posthog.getDashboards();

dashboards.forEach(dashboard => {
  console.log(`- ${dashboard.name} (${dashboard.tiles?.length || 0} tiles)`);
  console.log(`  Pinned: ${dashboard.pinned ? 'Yes' : 'No'}`);
});
```

### Create a dashboard
```typescript
const dashboard = await posthog.createDashboard({
  name: 'Growth Metrics',
  description: 'Key metrics for tracking growth',
  pinned: true,
  tags: ['growth', 'marketing']
});

console.log(`Created dashboard: ${dashboard.name} (ID: ${dashboard.id})`);
```

### Add insight to dashboard
```typescript
await posthog.addInsightToDashboard(
  dashboardId,
  insightId,
  {
    color: 'blue',
    layouts: {
      sm: { x: 0, y: 0, w: 6, h: 5 }
    }
  }
);

console.log('Insight added to dashboard');
```

## Error Tracking

### List errors
```typescript
const { results: errors } = await posthog.listErrors({
  status: 'active',
  limit: 20
});

errors.forEach(error => {
  console.log(`- ${error.fingerprint}`);
  console.log(`  First seen: ${error.first_seen}`);
  console.log(`  Occurrences: ${error.occurrences}`);
  console.log(`  Users affected: ${error.users_affected}`);
});
```

### Get error details
```typescript
const errorDetails = await posthog.getErrorDetails(errorId);

console.log(`Error type: ${errorDetails.exception.type}`);
console.log(`Error value: ${errorDetails.exception.value}`);
console.log(`Stack trace:`, errorDetails.stack_trace);
```

## Experiments

### List all experiments
```typescript
const { results: experiments } = await posthog.getExperiments();

experiments.forEach(exp => {
  console.log(`- ${exp.name}`);
  console.log(`  Feature flag: ${exp.feature_flag_key}`);
  console.log(`  Status: ${exp.archived ? 'Archived' : 'Active'}`);
});
```

### Create an experiment
```typescript
const experiment = await posthog.createExperiment({
  name: 'Checkout Button Color Test',
  description: 'A/B test for checkout button color',
  feature_flag_key: 'checkout-button-color',
  parameters: {
    minimum_detectable_effect: 1,
    recommended_sample_size: 1000,
    recommended_running_time: 14
  },
  metrics: [
    {
      type: 'primary',
      query: {
        kind: 'TrendsQuery',
        series: [{ event: 'checkout_completed' }]
      }
    }
  ]
});

console.log(`Created experiment: ${experiment.name} (ID: ${experiment.id})`);
```

### Get experiment results
```typescript
const results = await posthog.getExperimentResults(experimentId);

console.log(`Significant: ${results.significant ? 'Yes' : 'No'}`);
console.log(`Variants:`);
results.variants.forEach(v => {
  console.log(`  - ${v.key}: ${v.count} conversions (${v.exposure} exposure)`);
  console.log(`    Probability: ${(results.probability[v.key] * 100).toFixed(1)}%`);
});
```

## Surveys

### List all surveys
```typescript
const { results: surveys } = await posthog.getSurveys();

surveys.forEach(survey => {
  console.log(`- ${survey.name} (${survey.type})`);
  console.log(`  Questions: ${survey.questions.length}`);
});
```

### Create a survey
```typescript
const survey = await posthog.createSurvey({
  name: 'Product Feedback Survey',
  description: 'Gather user feedback on new features',
  type: 'popover',
  questions: [
    {
      type: 'rating',
      question: 'How satisfied are you with our product?'
    },
    {
      type: 'open',
      question: 'What could we improve?'
    }
  ],
  targeting: {
    targetingFlagFilters: {
      groups: [
        {
          variant: null,
          properties: [
            {
              key: 'is_active_user',
              value: true,
              type: 'person'
            }
          ]
        }
      ]
    }
  }
});

console.log(`Created survey: ${survey.name} (ID: ${survey.id})`);
```

### Get survey statistics
```typescript
const stats = await posthog.getSurveyStats(surveyId);
console.log(`Total responses: ${stats.total_responses}`);
console.log(`Completion rate: ${(stats.completion_rate * 100).toFixed(1)}%`);
```

### Get global surveys statistics
```typescript
const globalStats = await posthog.getSurveysGlobalStats();
console.log(`Total surveys: ${globalStats.total_surveys}`);
console.log(`Total responses: ${globalStats.total_responses}`);
console.log(`Average completion: ${(globalStats.average_completion_rate * 100).toFixed(1)}%`);
```

## LLM Analytics

### Get LLM costs
```typescript
const costs = await posthog.getLLMCosts({ days: 30 });

console.log(`Total cost (30 days): $${costs.total_cost.toFixed(2)}`);
costs.results.forEach(r => {
  console.log(`  ${r.date} - ${r.model}: $${r.total_cost.toFixed(4)} (${r.total_tokens} tokens)`);
});
```

## Organization & Project Management

### List organizations
```typescript
const { results: orgs } = await posthog.getOrganizations();

orgs.forEach(org => {
  console.log(`- ${org.name} (${org.id})`);
});
```

### Get organization details
```typescript
const orgDetails = await posthog.getOrganizationDetails('org_123');
console.log(`Organization: ${orgDetails.name}`);
console.log(`Features: ${orgDetails.available_features.join(', ')}`);
```

### List projects
```typescript
const { results: projects } = await posthog.getProjects();

projects.forEach(project => {
  console.log(`- ${project.name} (ID: ${project.id})`);
});
```

### Get event definitions
```typescript
const { results: events } = await posthog.getEventDefinitions({
  search: 'purchase',
  limit: 10
});

events.forEach(event => {
  console.log(`- ${event.name}`);
  console.log(`  Last seen: ${event.last_seen_at}`);
  console.log(`  Volume: ${event.volume_30_day}`);
});
```

### Get property definitions
```typescript
const { results: properties } = await posthog.getPropertyDefinitions('event');

properties.forEach(prop => {
  console.log(`- ${prop.name} (${prop.property_type})`);
});
```

## API Coverage

This skill covers **all 45 MCP tools** from the PostHog MCP server:

| Category | MCP Tool | Client Method |
|----------|----------|---------------|
| **Dashboards (6)** | dashboards-get-all | `getDashboards()` |
| | dashboard-get | `getDashboard()` |
| | dashboard-create | `createDashboard()` |
| | dashboard-update | `updateDashboard()` |
| | dashboard-delete | `deleteDashboard()` |
| | add-insight-to-dashboard | `addInsightToDashboard()` |
| **Feature Flags (5)** | feature-flag-get-all | `getFeatureFlags()` |
| | feature-flag-get-definition | `getFeatureFlag()` / `getFeatureFlagByKey()` |
| | create-feature-flag | `createFeatureFlag()` |
| | update-feature-flag | `updateFeatureFlag()` |
| | delete-feature-flag | `deleteFeatureFlag()` |
| **Experiments (6)** | experiment-get-all | `getExperiments()` |
| | experiment-get | `getExperiment()` |
| | experiment-results-get | `getExperimentResults()` |
| | experiment-create | `createExperiment()` |
| | experiment-update | `updateExperiment()` |
| | experiment-delete | `deleteExperiment()` |
| **Insights (6)** | insights-get-all | `getInsights()` |
| | insight-get | `getInsight()` |
| | insight-create-from-query | `createInsight()` |
| | insight-update | `updateInsight()` |
| | insight-delete | `deleteInsight()` |
| | insight-query | `queryInsight()` |
| **Queries (2)** | query-run | `runQuery()` |
| | query-generate-hogql-from-question | ⚡ HYBRID - requires AI |
| **Surveys (7)** | surveys-get-all | `getSurveys()` |
| | survey-get | `getSurvey()` |
| | survey-create | `createSurvey()` |
| | survey-update | `updateSurvey()` |
| | survey-delete | `deleteSurvey()` |
| | survey-stats | `getSurveyStats()` |
| | surveys-global-stats | `getSurveysGlobalStats()` |
| **Events & Props (2)** | event-definitions-list | `getEventDefinitions()` |
| | properties-list | `getPropertyDefinitions()` |
| **Org & Project (6)** | organizations-get | `getOrganizations()` |
| | organization-details-get | `getOrganizationDetails()` |
| | switch-organization | Use `setProjectId()` after getting org |
| | projects-get | `getProjects()` |
| | switch-project | `setProjectId()` |
| | property-definitions | `getPropertyDefinitions()` |
| **Error Tracking (2)** | list-errors | `listErrors()` |
| | error-details | `getErrorDetails()` |
| **LLM Analytics (1)** | get-llm-total-costs-for-project | `getLLMCosts()` |
| **Documentation (1)** | docs-search | Use WebSearch tool instead |

### Hybrid Note

The tool `query-generate-hogql-from-question` requires AI/LLM processing to generate HogQL from natural language. Use the MCP server for this specific functionality, or use `runQuery()` with manually written HogQL.

## Recommended Patterns

### Batch Operations
```typescript
// Get multiple resources efficiently
const [flags, insights, dashboards] = await Promise.all([
  posthog.getFeatureFlags(),
  posthog.getInsights({ limit: 10 }),
  posthog.getDashboards()
]);

console.log(`Loaded ${flags.results.length} flags, ${insights.results.length} insights, ${dashboards.results.length} dashboards`);
```

### Error Handling
```typescript
try {
  const flag = await posthog.getFeatureFlagByKey('non-existent');
} catch (error) {
  if (error.message.includes('not found')) {
    console.log('Flag does not exist, creating it...');
    await posthog.createFeatureFlag({
      key: 'non-existent',
      name: 'New Flag'
    });
  } else {
    throw error;
  }
}
```

### Progressive Disclosure
```typescript
// Only load full details when needed
const { results: flags } = await posthog.getFeatureFlags();

// Show summary
console.log(`Found ${flags.length} flags`);

// Load details only for active flags
const activeFlags = flags.filter(f => f.active);
for (const flag of activeFlags) {
  const details = await posthog.getFeatureFlag(flag.id);
  console.log(`Details for ${details.name}:`, details.filters);
}
```

## Advantages vs Traditional MCP

| Aspect | Traditional MCP | Code Execution |
|--------|-----------------|----------------|
| Tokens per request | ~5,000+ (42 tool definitions) | ~200 |
| Latency | Multiple MCP roundtrips | Direct HTTP calls |
| Batch operations | Sequential tool calls | Parallel with Promise.all |
| Type safety | JSON schemas only | Full TypeScript types |
| Filtering & processing | All data through context | Local processing |
| Rate limit handling | Manual retry logic | Built-in with fetch |

## Security Best Practices

1. **Scope API keys appropriately:**
   - For production: Create keys with minimal required scopes
   - For development: Use full access keys but rotate regularly

2. **Never commit API keys:**
   ```bash
   # Use environment variables
   echo "POSTHOG_API_KEY=phx_..." >> .env
   echo ".env" >> .gitignore
   ```

3. **Validate data before mutations:**
   ```typescript
   // Check before deleting
   const flag = await posthog.getFeatureFlag(flagId);
   if (flag.active) {
     throw new Error('Cannot delete active feature flag');
   }
   await posthog.deleteFeatureFlag(flagId);
   ```

## Troubleshooting

### "PostHog API key is required"
Set the `POSTHOG_API_KEY` environment variable or pass `apiKey` to the constructor.

### "Project ID not set"
Either:
- Set `POSTHOG_PROJECT_ID` environment variable
- Pass `projectId` in the constructor
- Call `posthog.setProjectId('12345')` before making API calls

### 401 Unauthorized
Your API key may be invalid or expired. Create a new one at [PostHog Settings](https://posthog.com/settings/user-api-keys).

### 403 Forbidden
Your API key doesn't have the required scopes. Create a new key with appropriate permissions.

### Rate Limiting
PostHog has rate limits:
- Analytics endpoints: 240/minute, 1200/hour
- Public endpoints (event capture, flags): No limits

Use batching and caching to reduce API calls.

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `POSTHOG_API_KEY` | Yes | Personal API key | `phx_...` |
| `POSTHOG_PROJECT_ID` | Recommended | Default project ID | `12345` |
| `POSTHOG_HOST` | Optional | PostHog instance URL | `https://us.posthog.com` (default) or `https://eu.posthog.com` |

## References

- [PostHog API Documentation](https://posthog.com/docs/api)
- [PostHog MCP Server (original)](https://github.com/PostHog/mcp)
- [Feature Flags API](https://posthog.com/docs/api/feature-flags)
- [Insights API](https://posthog.com/docs/api/insights)
- [Query API](https://posthog.com/docs/api/query)
- [Anthropic Code Execution Pattern](https://www.anthropic.com/engineering/code-execution-with-mcp)

## Migration from MCP

If you're currently using the PostHog MCP server, migration is straightforward:

**Before (MCP):**
```typescript
// Multiple tool calls, each passing through context
await mcp_posthog_feature_flag_get_all();
// → 5,000+ tokens for tool definitions
```

**After (Code Execution):**
```typescript
// Direct API call
const { results } = await posthog.getFeatureFlags();
// → ~200 tokens total
```

**Token savings: 96%+**
