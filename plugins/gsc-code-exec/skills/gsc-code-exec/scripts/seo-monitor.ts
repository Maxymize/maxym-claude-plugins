/**
 * SEO Monitor - continuous improvement loop across search consoles
 *
 * Every run takes a snapshot of the site's state on Google, Bing and at the
 * technical level, writes it to the invoking project, compares it with the
 * previous run and turns the delta into concrete actions.
 *
 * The point is not to display numbers. It is to answer, on every invocation:
 * what changed since last time, what is stuck, and what should be done next.
 *
 * SECURITY — no credential of any kind is ever written into a snapshot.
 * API keys are read from the invoking project's environment at call time and
 * stay in memory. Snapshots are safe to commit.
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  listSitemaps,
  inspectUrl,
  getPerformanceOverview,
  querySearchAnalytics,
  detectQuickWins,
  daysAgo,
} from './client-gsc.js';

import * as bing from './client-bing.js';
import * as indexnow from './client-indexnow.js';

// ============================================================
// CONFIGURATION
// ============================================================

/** Snapshots live in the project being monitored, not in the skill. */
const DEFAULT_STORE = '.seo-monitor';

/** URL inspection is capped: the Google API allows 2000 calls/day. */
const MAX_INSPECT = 200;

export interface MonitorConfig {
  /** Google property, e.g. "sc-domain:example.com" */
  gscProperty: string;
  /** Live site root, e.g. "https://www.example.com" */
  siteUrl: string;
  /** Project directory where snapshots are stored and .env is read from */
  cwd?: string;
  /** Folder name for the history, relative to cwd */
  store?: string;
  /** Skip Bing entirely (e.g. no key configured yet) */
  skipBing?: boolean;
}

// ============================================================
// TYPES
// ============================================================

export interface UrlState {
  url: string;
  verdict: string;
  coverageState: string;
  lastCrawl: string | null;
}

export interface SeoSnapshot {
  timestamp: string;
  siteUrl: string;
  gscProperty: string;
  google: {
    available: boolean;
    sitemaps: { path: string; submitted?: string; lastDownloaded?: string; errors?: string; warnings?: string }[];
    coverage: { indexed: number; discovered: number; unknown: number; error: number; total: number };
    urls: UrlState[];
    performance: { clicks: number; impressions: number; ctr: number; position: number } | null;
    topQueries: { query: string; clicks: number; impressions: number; position: number }[];
    quickWins: { query: string; impressions: number; position: number; ctr: number }[];
  };
  bing: {
    available: boolean;
    siteUrl: string | null;
    sitemaps: { url: string; status?: string }[];
    quota: { daily: number; monthly: number } | null;
    traffic: { clicks: number; impressions: number } | null;
    crawlIssues: number;
  };
  technical: {
    sitemapUrls: number;
    robotsTxt: boolean;
    llmsTxt: boolean;
    indexNowKey: boolean;
    softNotFound: boolean;   // true = a made-up URL wrongly answers 200
    prerenderWords: number;  // words served with JavaScript disabled
  };
}

export interface SnapshotDiff {
  previousRun: string | null;
  daysBetween: number | null;
  indexing: {
    indexedBefore: number;
    indexedNow: number;
    delta: number;
    newlyIndexed: string[];
    droppedOut: string[];
  };
  performance: {
    clicksDelta: number;
    impressionsDelta: number;
    positionDelta: number;
  } | null;
  queries: { gained: string[]; lost: string[] };
}

export interface Recommendation {
  severity: 'critical' | 'high' | 'medium' | 'low';
  area: string;
  title: string;
  detail: string;
  action: string;
  urls?: string[];
}

export interface AuditReport {
  snapshot: SeoSnapshot;
  diff: SnapshotDiff | null;
  recommendations: Recommendation[];
  snapshotFile: string;
}

// ============================================================
// TECHNICAL CHECKS
// ============================================================

const wordsWithoutJs = (html: string): number =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

const fetchOk = async (url: string): Promise<boolean> => {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
};

/**
 * Checks the site serves what crawlers need.
 *
 * The soft-404 test matters more than it looks: an SPA catch-all that answers
 * 200 for any invented path turns every wrong URL into a duplicate of the
 * homepage, and search engines spend crawl budget on ghosts instead of real
 * pages. It is invisible in analytics and only surfaces here.
 */
export async function runTechnicalChecks(
  siteUrl: string,
  cwd: string = process.cwd()
): Promise<SeoSnapshot['technical']> {
  const base = siteUrl.replace(/\/+$/, '');

  let sitemapUrls = 0;
  try {
    const xml = await (await fetch(`${base}/sitemap.xml`)).text();
    sitemapUrls = [...xml.matchAll(/<loc>/g)].length;
  } catch {
    sitemapUrls = 0;
  }

  let softNotFound = false;
  try {
    const res = await fetch(`${base}/__seo-monitor-probe-${Date.now()}`);
    softNotFound = res.status === 200;
  } catch {
    softNotFound = false;
  }

  let prerenderWords = 0;
  try {
    prerenderWords = wordsWithoutJs(await (await fetch(base)).text());
  } catch {
    prerenderWords = 0;
  }

  const [robotsTxt, llmsTxt] = await Promise.all([
    fetchOk(`${base}/robots.txt`),
    fetchOk(`${base}/llms.txt`),
  ]);

  return {
    sitemapUrls,
    robotsTxt,
    llmsTxt,
    indexNowKey: indexnow.findKey(cwd) !== null,
    softNotFound,
    prerenderWords,
  };
}

// ============================================================
// COLLECTION
// ============================================================

const sitemapUrlList = async (siteUrl: string): Promise<string[]> => {
  try {
    const xml = await (await fetch(`${siteUrl.replace(/\/+$/, '')}/sitemap.xml`)).text();
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  } catch {
    return [];
  }
};

/** Takes a full reading of the current state across both consoles. */
export async function collectSnapshot(config: MonitorConfig): Promise<SeoSnapshot> {
  const cwd = config.cwd || process.cwd();
  const urls = await sitemapUrlList(config.siteUrl);

  const technical = await runTechnicalChecks(config.siteUrl, cwd);

  // ---- Google ----
  const google: SeoSnapshot['google'] = {
    available: false,
    sitemaps: [],
    coverage: { indexed: 0, discovered: 0, unknown: 0, error: 0, total: urls.length },
    urls: [],
    performance: null,
    topQueries: [],
    quickWins: [],
  };

  try {
    const sitemaps = await listSitemaps(config.gscProperty);
    google.sitemaps = sitemaps.map((s: any) => ({
      path: s.path,
      submitted: s.contents?.[0]?.submitted,
      lastDownloaded: s.lastDownloaded,
      errors: s.errors,
      warnings: s.warnings,
    }));
    google.available = true;
  } catch {
    // property not accessible: everything below stays empty
  }

  if (google.available) {
    for (const url of urls.slice(0, MAX_INSPECT)) {
      try {
        const r: any = await inspectUrl(config.gscProperty, url);
        const i = r?.inspectionResult?.indexStatusResult || {};
        const state = String(i.coverageState || '');
        google.urls.push({
          url,
          verdict: i.verdict || 'UNKNOWN',
          coverageState: state,
          lastCrawl: i.lastCrawlTime ? i.lastCrawlTime.slice(0, 10) : null,
        });
        if (i.verdict === 'PASS') google.coverage.indexed++;
        else if (/unknown|sconosciut/i.test(state)) google.coverage.unknown++;
        else google.coverage.discovered++;
      } catch {
        google.coverage.error++;
      }
    }

    // Search Console data lags 2-3 days: asking for today would return zeros
    const from = daysAgo(31);
    const to = daysAgo(3);

    try {
      const perf = await getPerformanceOverview(config.gscProperty, from, to);
      google.performance = {
        clicks: perf.totalClicks ?? 0,
        impressions: perf.totalImpressions ?? 0,
        ctr: perf.averageCtr ?? 0,
        position: perf.averagePosition ?? 0,
      };
    } catch {
      // performance unavailable (new property, or no data yet)
    }

    try {
      const queries = await querySearchAnalytics({
        siteUrl: config.gscProperty,
        startDate: from,
        endDate: to,
        dimensions: ['query'],
        rowLimit: 25,
      });
      // Dimension values arrive in keys[], never as a named field
      google.topQueries = (queries.rows || []).map((r) => ({
        query: r.keys?.[0] ?? '',
        clicks: r.clicks ?? 0,
        impressions: r.impressions ?? 0,
        position: r.position ?? 0,
      }));
    } catch {
      // no query data yet
    }

    try {
      const wins = await detectQuickWins(config.gscProperty, from, to);
      google.quickWins = (wins || []).slice(0, 20).map((w) => ({
        query: w.keys?.[0] ?? '',
        impressions: w.impressions ?? 0,
        position: w.position ?? 0,
        ctr: w.ctr ?? 0,
      }));
    } catch {
      // no data yet
    }
  }

  // ---- Bing ----
  const bingState: SeoSnapshot['bing'] = {
    available: false,
    siteUrl: null,
    sitemaps: [],
    quota: null,
    traffic: null,
    crawlIssues: 0,
  };

  if (!config.skipBing && bing.hasApiKey(cwd)) {
    try {
      const resolved = await bing.resolveSiteUrl(config.siteUrl, cwd);
      if (resolved) {
        bingState.available = true;
        bingState.siteUrl = resolved;

        const [feeds, quota, traffic, issues] = await Promise.all([
          bing.listFeeds(resolved, cwd).catch(() => []),
          bing.getQuota(resolved, cwd).catch(() => null),
          bing.getTrafficStats(resolved, cwd).catch(() => []),
          bing.getCrawlIssues(resolved, cwd).catch(() => []),
        ]);

        bingState.sitemaps = feeds.map((f) => ({ url: f.Url, status: f.Status }));
        bingState.quota = quota ? { daily: quota.DailyQuota, monthly: quota.MonthlyQuota } : null;
        bingState.crawlIssues = issues.length;
        if (traffic.length) {
          bingState.traffic = {
            clicks: traffic.reduce((s, d) => s + (d.Clicks || 0), 0),
            impressions: traffic.reduce((s, d) => s + (d.Impressions || 0), 0),
          };
        }
      }
    } catch {
      // Bing unreachable: the snapshot stays valid with available=false
    }
  }

  return {
    timestamp: new Date().toISOString(),
    siteUrl: config.siteUrl,
    gscProperty: config.gscProperty,
    google,
    bing: bingState,
    technical,
  };
}

// ============================================================
// HISTORY
// ============================================================

const storeDir = (config: MonitorConfig): string =>
  path.join(config.cwd || process.cwd(), config.store || DEFAULT_STORE);

/** Writes a dated snapshot and refreshes latest.json. */
export function saveSnapshot(snapshot: SeoSnapshot, config: MonitorConfig): string {
  const dir = storeDir(config);
  fs.mkdirSync(dir, { recursive: true });

  const stamp = snapshot.timestamp.slice(0, 19).replace(/[:T]/g, '-');
  const file = path.join(dir, `snapshot-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(snapshot, null, 2), 'utf8');
  fs.writeFileSync(path.join(dir, 'latest.json'), JSON.stringify(snapshot, null, 2), 'utf8');
  return file;
}

/**
 * Loads the most recent snapshot EXCLUDING the one just written, which is
 * what makes a comparison meaningful rather than a diff against itself.
 */
export function loadPreviousSnapshot(config: MonitorConfig, excludeFile?: string): SeoSnapshot | null {
  const dir = storeDir(config);
  if (!fs.existsSync(dir)) return null;

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith('snapshot-') && f.endsWith('.json'))
    .map((f) => path.join(dir, f))
    .filter((f) => f !== excludeFile)
    .sort();

  if (!files.length) return null;
  try {
    return JSON.parse(fs.readFileSync(files[files.length - 1], 'utf8')) as SeoSnapshot;
  } catch {
    return null;
  }
}

/**
 * Keeps the history bounded. Without this, every invocation leaves a file
 * behind and a repository monitored daily accumulates hundreds of snapshots.
 * latest.json is never touched, so the most recent reading always survives.
 */
export function pruneSnapshots(config: MonitorConfig, keep = 30): number {
  const dir = storeDir(config);
  if (!fs.existsSync(dir)) return 0;

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith('snapshot-') && f.endsWith('.json'))
    .sort();

  const excess = files.slice(0, Math.max(0, files.length - keep));
  for (const f of excess) fs.unlinkSync(path.join(dir, f));
  return excess.length;
}

// ============================================================
// COMPARISON
// ============================================================

export function compareSnapshots(prev: SeoSnapshot | null, curr: SeoSnapshot): SnapshotDiff {
  if (!prev) {
    return {
      previousRun: null,
      daysBetween: null,
      indexing: {
        indexedBefore: 0,
        indexedNow: curr.google.coverage.indexed,
        delta: 0,
        newlyIndexed: [],
        droppedOut: [],
      },
      performance: null,
      queries: { gained: [], lost: [] },
    };
  }

  const wasIndexed = new Set(prev.google.urls.filter((u) => u.verdict === 'PASS').map((u) => u.url));
  const isIndexed = new Set(curr.google.urls.filter((u) => u.verdict === 'PASS').map((u) => u.url));

  const ms = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();

  const prevQueries = new Set(prev.google.topQueries.map((q) => q.query));
  const currQueries = new Set(curr.google.topQueries.map((q) => q.query));

  return {
    previousRun: prev.timestamp,
    daysBetween: Math.round(ms / 86400000),
    indexing: {
      indexedBefore: prev.google.coverage.indexed,
      indexedNow: curr.google.coverage.indexed,
      delta: curr.google.coverage.indexed - prev.google.coverage.indexed,
      newlyIndexed: [...isIndexed].filter((u) => !wasIndexed.has(u)),
      droppedOut: [...wasIndexed].filter((u) => !isIndexed.has(u)),
    },
    performance:
      prev.google.performance && curr.google.performance
        ? {
            clicksDelta: curr.google.performance.clicks - prev.google.performance.clicks,
            impressionsDelta: curr.google.performance.impressions - prev.google.performance.impressions,
            positionDelta: +(curr.google.performance.position - prev.google.performance.position).toFixed(1),
          }
        : null,
    queries: {
      gained: [...currQueries].filter((q) => q && !prevQueries.has(q)),
      lost: [...prevQueries].filter((q) => q && !currQueries.has(q)),
    },
  };
}

// ============================================================
// RECOMMENDATIONS
// ============================================================

/**
 * Turns the reading into things to do, ordered by severity.
 *
 * Only rules that can be decided from the data are included: no generic SEO
 * advice, because advice that does not follow from the numbers is noise.
 */
export function buildRecommendations(curr: SeoSnapshot, diff: SnapshotDiff | null): Recommendation[] {
  const out: Recommendation[] = [];
  const t = curr.technical;

  // ---- Technical, highest impact first ----
  if (t.softNotFound) {
    out.push({
      severity: 'critical',
      area: 'technical',
      title: 'Non-existent URLs answer 200 instead of 404',
      detail:
        'A made-up path returns the homepage with status 200. Every wrong URL becomes a duplicate ' +
        'of the homepage, and crawl budget is spent on pages that do not exist.',
      action:
        'Replace the SPA catch-all rewrite with a real 404 response, keeping an explicit rule for ' +
        'each valid route. Verify no route becomes unreachable before deploying.',
    });
  }

  if (t.prerenderWords < 200) {
    out.push({
      severity: 'critical',
      area: 'technical',
      title: `Homepage serves only ${t.prerenderWords} words without JavaScript`,
      detail:
        'Crawlers of AI assistants (GPTBot, ClaudeBot, PerplexityBot) do not execute JavaScript. ' +
        'What they cannot read, they cannot cite.',
      action: 'Add prerendering or server-side rendering so the main content exists in the served HTML.',
    });
  }

  if (t.sitemapUrls === 0) {
    out.push({
      severity: 'critical',
      area: 'technical',
      title: 'No sitemap reachable',
      detail: 'sitemap.xml is missing or empty, so engines have no declared list of pages.',
      action: 'Generate the sitemap at build time and submit it to both consoles.',
    });
  }

  if (!t.robotsTxt) {
    out.push({
      severity: 'high',
      area: 'technical',
      title: 'robots.txt missing',
      detail: 'Without it there is no explicit permission for AI assistant crawlers.',
      action: 'Publish robots.txt with explicit Allow rules for GPTBot, ClaudeBot, PerplexityBot and the rest.',
    });
  }

  if (!t.llmsTxt) {
    out.push({
      severity: 'low',
      area: 'aeo',
      title: 'llms.txt missing',
      detail: 'An emerging convention that hands AI assistants a structured summary of the site.',
      action: 'Publish llms.txt with services, products and key pages.',
    });
  }

  if (!t.indexNowKey) {
    out.push({
      severity: 'medium',
      area: 'indexnow',
      title: 'IndexNow not configured',
      detail:
        'One IndexNow call reaches Bing, Yandex, Seznam and Naver at once, and does not consume ' +
        'the Bing API quota.',
      action: 'Generate the key with ensureKey(), deploy the file, then notify the sitemap URLs.',
    });
  }

  // ---- Google indexing ----
  const unknown = curr.google.urls.filter((u) => /unknown|sconosciut/i.test(u.coverageState));
  if (unknown.length) {
    out.push({
      severity: 'high',
      area: 'google',
      title: `${unknown.length} URLs unknown to Google`,
      detail:
        'These pages have never been discovered. Resubmitting the sitemap helps, but manual ' +
        'requests are markedly faster.',
      action:
        'In Search Console, use URL inspection and click "Request indexing" for each. ' +
        'The API does not expose this operation, so it stays manual on Google.',
      urls: unknown.map((u) => u.url).slice(0, 20),
    });
  }

  const stale = curr.google.urls.filter(
    (u) => u.verdict !== 'PASS' && !/unknown|sconosciut/i.test(u.coverageState) && !u.lastCrawl
  );
  if (stale.length >= 5) {
    out.push({
      severity: 'medium',
      area: 'google',
      title: `${stale.length} URLs discovered but never crawled`,
      detail:
        'Google knows these pages but has not read them. Beyond a few weeks this usually points ' +
        'to crawl budget being wasted elsewhere, or to pages judged low value.',
      action:
        'Check no duplicate URLs are consuming crawl budget, and strengthen internal links pointing ' +
        'to these pages from pages that are already indexed.',
      urls: stale.map((u) => u.url).slice(0, 20),
    });
  }

  if (diff?.indexing.droppedOut.length) {
    out.push({
      severity: 'critical',
      area: 'google',
      title: `${diff.indexing.droppedOut.length} pages left the index since the last run`,
      detail: 'Pages previously indexed are no longer. Usually a content, canonical or status code change.',
      action: 'Inspect each URL and compare it against the previous snapshot to find what changed.',
      urls: diff.indexing.droppedOut.slice(0, 20),
    });
  }

  // ---- Performance ----
  for (const w of curr.google.quickWins.slice(0, 5)) {
    out.push({
      severity: 'medium',
      area: 'performance',
      title: `"${w.query}" ranks ${w.position.toFixed(1)} with ${(w.ctr * 100).toFixed(1)}% CTR`,
      detail: `${w.impressions} impressions and few clicks: the page is found but the snippet is not chosen.`,
      action: 'Rewrite title and meta description of the ranking page around this query.',
    });
  }

  // ---- Bing ----
  if (!curr.bing.available) {
    out.push({
      severity: 'medium',
      area: 'bing',
      title: 'Bing Webmaster Tools not connected',
      detail: 'Bing feeds Copilot: without it, an entire assistant cannot cite the site.',
      action:
        'Import the site from Search Console at bing.com/webmasters, generate an API key under ' +
        'Settings > API access, and add BING_API_KEY to the project .env.',
    });
  } else {
    if (!curr.bing.sitemaps.length) {
      out.push({
        severity: 'high',
        area: 'bing',
        title: 'No sitemap registered on Bing',
        detail:
          'Importing from Search Console does not always carry sitemaps across: a domain-level ' +
          'property on Google does not map to a URL-prefix property on Bing.',
        action: 'Submit the sitemap with submitFeed().',
      });
    }
    if (curr.bing.quota && curr.bing.quota.daily > 0 && curr.google.coverage.unknown > 0) {
      out.push({
        severity: 'low',
        area: 'bing',
        title: `${curr.bing.quota.daily} URL submissions available today on Bing`,
        detail: 'Unlike Google, Bing accepts indexing requests through the API.',
        action: 'Submit the pages that are not yet indexed with submitUrls().',
      });
    }
    if (curr.bing.crawlIssues > 0) {
      out.push({
        severity: 'medium',
        area: 'bing',
        title: `Bing reports ${curr.bing.crawlIssues} crawl issues`,
        detail: 'Broken pages, blocked resources or timeouts recorded while crawling.',
        action: 'Read the detail with getCrawlIssues() and fix by type.',
      });
    }
  }

  const rank = { critical: 0, high: 1, medium: 2, low: 3 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

// ============================================================
// ORCHESTRATION
// ============================================================

/**
 * One full cycle: read, save, compare with the previous run, recommend.
 * This is the entry point a scheduled or repeated invocation should call.
 */
export async function runAudit(config: MonitorConfig & { keepHistory?: number }): Promise<AuditReport> {
  const snapshot = await collectSnapshot(config);
  const snapshotFile = saveSnapshot(snapshot, config);

  // Read the previous run BEFORE pruning, so a tight history limit can never
  // delete the very snapshot this run needs to compare against.
  const previous = loadPreviousSnapshot(config, snapshotFile);
  const diff = compareSnapshots(previous, snapshot);
  const recommendations = buildRecommendations(snapshot, previous ? diff : null);

  pruneSnapshots(config, config.keepHistory ?? 30);

  return { snapshot, diff: previous ? diff : null, recommendations, snapshotFile };
}

/** Compact human-readable summary, safe to print: contains no credentials. */
export function formatReport(report: AuditReport): string {
  const { snapshot: s, diff, recommendations } = report;
  const lines: string[] = [];

  lines.push(`SEO snapshot — ${s.siteUrl} — ${s.timestamp.slice(0, 16).replace('T', ' ')}`);
  lines.push('');

  lines.push('GOOGLE');
  if (s.google.available) {
    const c = s.google.coverage;
    lines.push(`  indexed ${c.indexed}/${c.total} · discovered ${c.discovered} · unknown ${c.unknown}`);
    if (s.google.performance) {
      const p = s.google.performance;
      lines.push(`  ${p.clicks} clicks · ${p.impressions} impressions · avg position ${p.position.toFixed(1)}`);
    }
  } else {
    lines.push('  property not accessible');
  }

  lines.push('BING');
  if (s.bing.available) {
    lines.push(`  sitemaps ${s.bing.sitemaps.length} · quota ${s.bing.quota?.daily ?? '?'} today · crawl issues ${s.bing.crawlIssues}`);
  } else {
    lines.push('  not connected');
  }

  lines.push('TECHNICAL');
  lines.push(
    `  sitemap ${s.technical.sitemapUrls} URLs · robots ${s.technical.robotsTxt ? 'yes' : 'NO'} · ` +
    `llms.txt ${s.technical.llmsTxt ? 'yes' : 'no'} · IndexNow ${s.technical.indexNowKey ? 'yes' : 'no'}`
  );
  lines.push(
    `  prerendered words ${s.technical.prerenderWords} · soft 404 ${s.technical.softNotFound ? 'PRESENT' : 'none'}`
  );

  if (diff) {
    lines.push('');
    lines.push(`SINCE LAST RUN (${diff.daysBetween} days)`);
    lines.push(`  indexed ${diff.indexing.delta >= 0 ? '+' : ''}${diff.indexing.delta}`);
    if (diff.indexing.newlyIndexed.length) lines.push(`  newly indexed: ${diff.indexing.newlyIndexed.length}`);
    if (diff.indexing.droppedOut.length) lines.push(`  dropped out: ${diff.indexing.droppedOut.length}`);
    if (diff.performance) {
      lines.push(
        `  clicks ${diff.performance.clicksDelta >= 0 ? '+' : ''}${diff.performance.clicksDelta} · ` +
        `impressions ${diff.performance.impressionsDelta >= 0 ? '+' : ''}${diff.performance.impressionsDelta}`
      );
    }
  } else {
    lines.push('');
    lines.push('First run: no previous snapshot to compare against.');
  }

  lines.push('');
  lines.push(`ACTIONS (${recommendations.length})`);
  for (const r of recommendations) {
    lines.push(`  [${r.severity}] ${r.title}`);
    lines.push(`      ${r.action}`);
  }

  return lines.join('\n');
}
