---
name: gsc-code-exec
description: SEO command centre across Google Search Console, Bing Webmaster Tools and IndexNow, using the Code Execution pattern (99%+ token reduction). Every run snapshots indexing status, performance and technical health, compares it with the previous run stored in the project, and turns the delta into ranked actions. Use to set up search consoles, submit sitemaps and URLs, inspect indexing, diagnose crawl problems, track SEO progress over time, or decide what to improve next.
---

# Search Consoles - Code Execution

One connection to **Google Search Console**, **Bing Webmaster Tools** and **IndexNow**, with no MCP server in between.

The skill does two different jobs:

1. **Operate** — submit sitemaps, submit URLs, inspect indexing, read performance
2. **Improve continuously** — every run writes a snapshot into the monitored project, compares it with the previous one, and reports what changed and what to do next

The second job is the reason this exists. A single reading tells you where you are; the comparison between readings tells you whether what you did last week worked.

## Security rule, not negotiable

**API keys never live in this skill.** They are read at call time from the environment of the project being monitored:

- Google: `GOOGLE_APPLICATION_CREDENTIALS`, or `gsc-credentials.json` in the project root
- Bing: `BING_API_KEY` in the project `.env`

Keys are held in memory for the duration of the call. They are never written to disk, never printed, and never stored in snapshots. Snapshots are safe to commit — this is verified, not assumed.

The IndexNow key is the one exception, and it is not a secret: the protocol *requires* publishing it on the domain. Never treat it as a credential.

## What each console allows

The single most useful thing to know before planning any indexing work:

| Operation | Google | Bing |
|---|---|---|
| Read performance | API | API |
| Inspect a URL's index status | API | partial |
| Submit a sitemap | API | API |
| **Request indexing of a URL** | **manual only** | **API** |

Google does not expose "Request indexing" through any API. The Indexing API exists but is documented for job postings and livestreams only; using it for ordinary pages goes against Google's guidelines. So on Google that step stays manual, and the skill's job is to hand you the exact shortlist of URLs worth requesting.

On Bing the same operation is fully automatable, and IndexNow covers Bing, Yandex, Seznam and Naver in one call without consuming Bing's quota.

## Setup

### Google Search Console

1. In [Google Cloud Console](https://console.cloud.google.com/), enable the **Search Console API**
2. Create a service account and download its JSON key
3. Point `GOOGLE_APPLICATION_CREDENTIALS` at it, or save it as `gsc-credentials.json` in the project root
4. In Search Console → Settings → Users and permissions, add the service account email (`client_email` in the JSON) with **Full** access

### Bing Webmaster Tools

1. Go to [bing.com/webmasters](https://www.bing.com/webmasters)
2. Choose **Import from Google Search Console** rather than adding the site manually: Bing accepts Google's verification, so no meta tag or DNS record is needed
3. Settings → API access → generate a key
4. Add `BING_API_KEY=...` to the project `.env`

Note: importing does **not** always carry sitemaps across. A domain-level property on Google does not map to a URL-prefix property on Bing, and the sitemap is left behind. Submit it explicitly with `submitFeed()`.

### IndexNow

No account required.

```typescript
import { ensureKey, notify } from './scripts/client-indexnow.js';

const key = ensureKey(process.cwd());   // creates public/<key>.txt if absent
// deploy the site so the file is live, THEN:
await notify('https://www.example.com', urls, process.cwd());
```

`notify()` refuses to submit while the key file is unreachable, because a submission sent too early is rejected with a 403 that is easy to miss in automation.

### Dependency

```bash
npm install google-auth-library
```

## The continuous improvement loop

```typescript
import { runAudit, formatReport } from './scripts/seo-monitor.js';

const report = await runAudit({
  gscProperty: 'sc-domain:example.com',
  siteUrl: 'https://www.example.com',
  cwd: process.cwd(),      // where .env is read and snapshots are written
  keepHistory: 30,         // older snapshots are pruned
});

console.log(formatReport(report));
```

Each run:

1. Reads Google (sitemaps, per-URL index status, performance, quick wins)
2. Reads Bing (sitemaps, quota, traffic, crawl issues)
3. Runs technical checks against the live site
4. Writes `.seo-monitor/snapshot-<timestamp>.json` plus `latest.json`
5. Compares with the previous snapshot
6. Returns ranked recommendations

Re-invoking days later answers the question that matters: *did indexing move, did any page fall out, did positions improve, what is still stuck.*

### Technical checks

Run against the live site, independent of either console:

- **Soft 404** — whether an invented URL wrongly answers 200. This one is worth more than it looks: an SPA catch-all rewrite makes every wrong URL a duplicate of the homepage, engines spend crawl budget on ghosts, and nothing in analytics reveals it
- **Prerendered words** — how much content is served with JavaScript disabled. AI assistant crawlers (GPTBot, ClaudeBot, PerplexityBot) do not execute JavaScript, so what they cannot read they cannot cite
- **sitemap.xml** reachable and how many URLs it declares
- **robots.txt** and **llms.txt** present
- **IndexNow key** configured in the project

### Recommendations

Only rules decided from the data are emitted, ordered by severity. Generic SEO advice is deliberately absent: advice that does not follow from the numbers is noise.

Examples of what it will tell you: URLs unknown to Google (with the shortlist to request manually), pages discovered but never crawled, pages that dropped out of the index since last run, queries ranking 4-20 with poor CTR, Bing not connected, sitemap missing on Bing, unused Bing quota while pages remain unindexed.

## Function reference

### Google (`client-gsc.js`)

| Function | Purpose |
|---|---|
| `listSites()` | Accessible properties |
| `querySearchAnalytics(request)` | Full analytics query, up to 25k rows |
| `getPerformanceOverview(site, from, to)` | Totals and daily series |
| `getQueriesForPage(site, page, from, to)` | Queries for one page |
| `getPagesForQuery(site, query, from, to)` | Pages for one query |
| `detectQuickWins(site, from, to, config?)` | Rank 4-20 with low CTR |
| `comparePeriods(site, p1s, p1e, p2s, p2e)` | Two periods side by side |
| `inspectUrl(site, url, lang?)` | Index status of one URL |
| `batchInspectUrls(site, urls[])` | Sequential inspection |
| `checkIndexingIssues(site, urls[])` | URLs grouped by status |
| `listSitemaps(site)` / `submitSitemap(site, url)` | Sitemap management |
| `daysAgo(n)` / `last7Days()` / `last28Days()` | Date helpers with the 3-day lag applied |

### Bing (`client-bing.js`)

| Function | Purpose |
|---|---|
| `hasApiKey(cwd?)` | Whether a key is reachable, without revealing it |
| `listSites(cwd?)` | Verified sites |
| `resolveSiteUrl(domain, cwd?)` | The identifier Bing actually holds |
| `listFeeds(site, cwd?)` / `submitFeed(site, feed, cwd?)` | Sitemaps |
| `getQuota(site, cwd?)` | Remaining submission allowance |
| `submitUrls(site, urls[], cwd?)` | **Submit for indexing**, batched at 500 |
| `getTrafficStats` / `getQueryStats` / `getPageStats` | Performance |
| `getCrawlStats` / `getCrawlIssues` | Crawl health |

`resolveSiteUrl()` exists because Bing may hold the site *without* `www` while the live site serves `www`. The API rejects an identifier it does not know, so matching on hostname avoids a failure that is otherwise puzzling.

`submitUrls()` reads the quota before and after: Bing answers 200 with an empty body whether or not it accepted, and the drop in quota is the only reliable acknowledgement.

### IndexNow (`client-indexnow.js`)

| Function | Purpose |
|---|---|
| `findKey(cwd?)` | Existing key, derived from the filename |
| `ensureKey(cwd?, publicDir?)` | Creates one if absent, never rotates a working key |
| `isKeyPublished(siteUrl, key)` | Whether the file is live |
| `notify(siteUrl, urls[], cwd?)` | Verify then submit |

The key is derived from the **filename**, not from a config entry, so there is a single source of truth. A second copy stored elsewhere would eventually drift and cause silent 403s.

### Monitor (`seo-monitor.js`)

| Function | Purpose |
|---|---|
| `runAudit(config)` | Full cycle: read, save, compare, recommend |
| `formatReport(report)` | Printable summary, free of credentials |
| `collectSnapshot(config)` | Reading only |
| `saveSnapshot` / `loadPreviousSnapshot` / `pruneSnapshots` | History |
| `compareSnapshots(prev, curr)` | Structured delta |
| `buildRecommendations(curr, diff)` | Actions from data |
| `runTechnicalChecks(siteUrl)` | Live-site checks alone |

## Operating notes

**Search Console data lags 2-3 days.** Asking for today returns zeros. The date helpers already account for this.

**URL inspection is capped at 2000 calls/day.** `collectSnapshot` inspects at most 200 URLs per run to stay well inside it.

**Bing's daily submission quota grows with site age.** A newly verified site may start around ten per day; established properties reach hundreds.

**A new property shows nothing for weeks.** Zero clicks on a site published days ago is expected, not a fault. That is exactly why snapshots matter: the first useful signal is the delta, not the absolute number.

## Troubleshooting

**"Google credentials not found"** — set `GOOGLE_APPLICATION_CREDENTIALS` or place `gsc-credentials.json` in the project root.

**403 from Google** — the service account is not a user on that property. Add its `client_email` in Search Console.

**"BING_API_KEY not found"** — add it to the `.env` of the project invoking the skill. It is never stored in the skill.

**Bing rejects the site URL** — use `resolveSiteUrl()` instead of assuming the identifier.

**IndexNow returns 403** — the key file is not reachable yet. Deploy, then submit.

**Empty analytics rows** — data lag, or genuinely no impressions yet.

## References

- [Search Console API](https://developers.google.com/webmaster-tools/v1/api_reference_index)
- [URL Inspection API](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect)
- [Bing Webmaster API](https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces)
- [IndexNow protocol](https://www.indexnow.org/documentation)
- [Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)
