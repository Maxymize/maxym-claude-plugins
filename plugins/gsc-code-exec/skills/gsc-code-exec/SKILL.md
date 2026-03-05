---
name: gsc-code-exec
description: Direct Google Search Console API access for search analytics, URL inspection, sitemap management, and indexing status using the Code Execution pattern (99%+ token reduction). Use when you need to check search performance, inspect URL indexing, manage sitemaps, detect SEO quick wins, or compare traffic periods without MCP server overhead.
---

# Google Search Console - Code Execution

Direct connection to Google Search Console API without MCP server overhead. 100% coverage of all GSC API endpoints.

## Setup (one-time)

### 1. Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the **Search Console API** (APIs & Services > Enable APIs)
4. Enable the **Indexing API** (optional, for URL inspection)

### 2. Service Account

1. Go to IAM & Admin > Service Accounts
2. Create a new service account
3. Download the JSON key file
4. Place it at one of these locations:
   - Set `GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json` env var
   - Or save as `gsc-credentials.json` in project root
   - Or save as `.secrets/gsc-credentials.json`

### 3. Grant Access in GSC

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your property
3. Settings > Users and permissions > Add user
4. Add the service account email (from JSON file, field `client_email`)
5. Set permission level to **Full** (or **Restricted** for read-only)

### 4. Install dependency

```bash
npm install google-auth-library
```

## Usage

```typescript
import {
  listSites,
  querySearchAnalytics,
  inspectUrl,
  listSitemaps,
  detectQuickWins,
  comparePeriods,
  getPerformanceOverview,
  checkIndexingIssues,
  last28Days,
} from './.claude/skills/gsc-code-exec/scripts/client-gsc.js';

// List all properties
const sites = await listSites();

// Search analytics - top queries
const { startDate, endDate } = last28Days();
const analytics = await querySearchAnalytics({
  siteUrl: 'sc-domain:example.com',
  startDate,
  endDate,
  dimensions: ['query'],
  rowLimit: 50,
});

// Performance overview
const overview = await getPerformanceOverview(
  'sc-domain:example.com',
  startDate,
  endDate
);

// URL inspection
const inspection = await inspectUrl(
  'sc-domain:example.com',
  'https://example.com/it/'
);

// Quick wins detection
const wins = await detectQuickWins(
  'sc-domain:example.com',
  startDate,
  endDate
);

// Period comparison (this month vs last month)
const comparison = await comparePeriods(
  'sc-domain:example.com',
  '2026-02-01', '2026-02-28',
  '2026-01-01', '2026-01-31'
);

// Check indexing issues
const issues = await checkIndexingIssues(
  'sc-domain:example.com',
  ['https://example.com/it/', 'https://example.com/en/']
);
```

## Available Functions

### Sites/Properties
| Function | Description |
|----------|-------------|
| `listSites()` | List all GSC properties |
| `getSiteDetails(siteUrl)` | Get details about a property |
| `addSite(siteUrl)` | Add a site to GSC |
| `deleteSite(siteUrl)` | Remove a site from GSC |

### Search Analytics
| Function | Description |
|----------|-------------|
| `querySearchAnalytics(request)` | Full search analytics query (up to 25k rows) |
| `getPerformanceOverview(siteUrl, start, end)` | Summary with totals and daily data |
| `getQueriesForPage(siteUrl, pageUrl, start, end)` | Top queries for a specific page |
| `getPagesForQuery(siteUrl, query, start, end)` | Top pages for a specific query |
| `detectQuickWins(siteUrl, start, end, config?)` | Find SEO optimization opportunities |
| `comparePeriods(siteUrl, p1Start, p1End, p2Start, p2End)` | Compare two time periods |

### URL Inspection
| Function | Description |
|----------|-------------|
| `inspectUrl(siteUrl, url, lang?)` | Inspect a single URL's index status |
| `batchInspectUrls(siteUrl, urls[], lang?)` | Inspect multiple URLs sequentially |
| `checkIndexingIssues(siteUrl, urls[])` | Categorize URLs by indexing status |

### Sitemaps
| Function | Description |
|----------|-------------|
| `listSitemaps(siteUrl)` | List all submitted sitemaps |
| `getSitemapDetails(siteUrl, sitemapUrl)` | Get sitemap details and stats |
| `submitSitemap(siteUrl, sitemapUrl)` | Submit a new sitemap |
| `deleteSitemap(siteUrl, sitemapUrl)` | Remove a submitted sitemap |

### Date Helpers
| Function | Description |
|----------|-------------|
| `daysAgo(n)` | Get date string for N days ago |
| `last7Days()` | Last 7 days range (with 3-day latency offset) |
| `last28Days()` | Last 28 days range |
| `last3Months()` | Last 3 months range |

## Coverage Table (vs MCP Servers)

| MCP Tool | Code Exec Function | Coverage |
|----------|-------------------|----------|
| `list_properties` | `listSites()` | 100% |
| `get_site_details` | `getSiteDetails()` | 100% |
| `add_site` | `addSite()` | 100% |
| `delete_site` | `deleteSite()` | 100% |
| `get_search_analytics` | `querySearchAnalytics()` | 100% |
| `get_performance_overview` | `getPerformanceOverview()` | 100% |
| `inspect_url_enhanced` | `inspectUrl()` | 100% |
| `batch_url_inspection` | `batchInspectUrls()` | 100% |
| `check_indexing_issues` | `checkIndexingIssues()` | 100% |
| `get_sitemaps` / `list_sitemaps` | `listSitemaps()` | 100% |
| `get_sitemap_details` | `getSitemapDetails()` | 100% |
| `submit_sitemap` | `submitSitemap()` | 100% |
| `get_search_by_page_query` | `getQueriesForPage()` / `getPagesForQuery()` | 100% |
| `compare_search_periods` | `comparePeriods()` | 100% |
| `detectQuickWins` | `detectQuickWins()` | 100% |

**Result: 100% MIGRATED - No MCP server needed.**

## Recommended Patterns

**Process locally, report summary:**
```typescript
const data = await querySearchAnalytics({
  siteUrl: 'sc-domain:example.com',
  startDate: daysAgo(31),
  endDate: daysAgo(3),
  dimensions: ['query'],
  rowLimit: 25000,
});
// Process 25k rows locally, only summary goes to context
const topQueries = data.rows.slice(0, 20);
const totalClicks = data.rows.reduce((s, r) => s + r.clicks, 0);
console.log(`Total clicks: ${totalClicks}, showing top 20 of ${data.rows.length}`);
```

## Advantages vs MCP

| Aspect | MCP Server | Code Execution |
|--------|-----------|----------------|
| Tokens per request | ~5,000+ | ~200 |
| Setup | npm install + config + process | Just credentials file |
| Batch operations | N separate MCP calls | 1 Promise.all |
| Data processing | All through context | Local processing |
| Quick wins analysis | MCP overhead per call | Single fetch + local filter |

## Troubleshooting

### "Google credentials not found"
Set the `GOOGLE_APPLICATION_CREDENTIALS` env var or place `gsc-credentials.json` in project root.

### "403 Forbidden"
The service account email hasn't been added to the GSC property. Add it in GSC Settings > Users and permissions.

### "Quota exceeded"
The API has limits: 2,000 requests/day for URL Inspection, 600/min for Search Analytics. Use batch functions sparingly.

### Empty rows in search analytics
Data has a 2-3 day latency. Use the `last7Days()` / `last28Days()` helpers which account for this.

## References

- [Google Search Console API](https://developers.google.com/webmaster-tools/v1/api_reference_index)
- [URL Inspection API](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect)
- [Anthropic Code Execution Pattern](https://www.anthropic.com/engineering/code-execution-with-mcp)
