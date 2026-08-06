/**
 * Bing Webmaster Tools - Code Execution Client
 *
 * Direct connection to the Bing Webmaster API, no MCP server involved.
 *
 * Why this matters next to Search Console: Bing ALLOWS URL submission for
 * indexing through the API (SubmitUrl / SubmitUrlBatch). Google does not
 * expose that operation at all, so on Google the "Request indexing" step
 * stays manual while on Bing it can be fully automated.
 *
 * Bing also feeds Copilot, so being indexed here is what makes the site
 * citable by Microsoft's assistant.
 *
 * SECURITY — the API key never lives in this skill.
 * It is read from the environment of the project invoking the skill
 * (BING_API_KEY), it is never written to disk, never logged, and never
 * stored inside snapshots. See readApiKey() below.
 *
 * API reference: https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// CONFIGURATION
// ============================================================

const BING_API = 'https://ssl.bing.com/webmaster/api.svc/json';

// ============================================================
// TYPES
// ============================================================

export interface BingSite {
  Url: string;
  IsVerified?: boolean;
  AuthenticationCode?: string;
}

export interface BingQuota {
  DailyQuota: number;
  MonthlyQuota: number;
}

export interface BingFeed {
  Url: string;
  Status?: string;
  UrlCount?: number;
  LastCrawled?: string;
  Submitted?: string;
}

export interface BingTrafficStats {
  Date?: string;
  Clicks?: number;
  Impressions?: number;
  AvgClickPosition?: number;
  AvgImpressionPosition?: number;
}

export interface BingQueryStats {
  Query: string;
  Clicks?: number;
  Impressions?: number;
  AvgClickPosition?: number;
  AvgImpressionPosition?: number;
}

export interface BingCrawlIssue {
  Url?: string;
  IssueType?: number;
  HttpCode?: number;
}

export interface BingSubmitResult {
  submitted: number;
  quotaBefore: BingQuota | null;
  quotaAfter: BingQuota | null;
  consumed: number | null;
}

// ============================================================
// AUTHENTICATION
// ============================================================

/**
 * Reads the Bing API key from the invoking project's environment.
 *
 * Order: process.env first, then a .env file in the working directory.
 * The key is returned to the caller in memory only — never persisted,
 * never printed. Callers must not include it in any output.
 */
export function readApiKey(cwd: string = process.cwd()): string {
  if (process.env.BING_API_KEY) return process.env.BING_API_KEY.trim();

  const envFile = path.join(cwd, '.env');
  if (fs.existsSync(envFile)) {
    const line = fs
      .readFileSync(envFile, 'utf8')
      .split('\n')
      .find((l) => /^\s*BING_API_KEY\s*=/.test(l));
    if (line) {
      const value = line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
      if (value) return value;
    }
  }

  throw new Error(
    'BING_API_KEY not found. Add it to the .env of the project that invokes this skill, ' +
    'or export it in the environment. Generate it in Bing Webmaster Tools > Settings > API access.'
  );
}

/** True when a key is reachable, without revealing anything about it. */
export function hasApiKey(cwd: string = process.cwd()): boolean {
  try {
    readApiKey(cwd);
    return true;
  } catch {
    return false;
  }
}

async function bingRequest<T>(
  endpoint: string,
  params: Record<string, string> = {},
  body?: unknown,
  cwd?: string
): Promise<T> {
  const apikey = readApiKey(cwd);
  const query = new URLSearchParams({ apikey, ...params });
  const url = `${BING_API}/${endpoint}?${query.toString()}`;

  const response = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await response.text();

  if (!response.ok) {
    // Strip the key before surfacing anything about the failed request
    throw new Error(`Bing API ${response.status} on ${endpoint}: ${text.slice(0, 300)}`);
  }

  let parsed: { d?: T; ErrorCode?: number; Message?: string };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Bing API returned non-JSON on ${endpoint}: ${text.slice(0, 200)}`);
  }

  if (parsed.ErrorCode) {
    throw new Error(`Bing API error ${parsed.ErrorCode} on ${endpoint}: ${parsed.Message}`);
  }

  return parsed.d as T;
}

// ============================================================
// SITES
// ============================================================

/** Every site verified in the account behind the key. */
export async function listSites(cwd?: string): Promise<BingSite[]> {
  return (await bingRequest<BingSite[]>('GetUserSites', {}, undefined, cwd)) || [];
}

/**
 * Resolves the site identifier Bing actually holds for a domain.
 *
 * Necessary because Bing may have registered the site WITHOUT www while the
 * live site serves www (or the reverse), and the API rejects an identifier it
 * does not know. Matching on hostname alone avoids that mismatch.
 */
export async function resolveSiteUrl(domain: string, cwd?: string): Promise<string | null> {
  const target = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
  const sites = await listSites(cwd);
  const match = sites.find((s) => {
    const host = s.Url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
    return host === target;
  });
  return match ? match.Url : null;
}

// ============================================================
// SITEMAPS
// ============================================================

/** Sitemaps Bing knows about for a site. */
export async function listFeeds(siteUrl: string, cwd?: string): Promise<BingFeed[]> {
  return (await bingRequest<BingFeed[]>('GetFeeds', { siteUrl }, undefined, cwd)) || [];
}

/**
 * Submits a sitemap.
 *
 * Worth doing even after importing a site from Search Console: the import
 * carries sitemaps only when the Google property type matches, so a
 * domain-level property on Google often leaves Bing with no sitemap at all.
 */
export async function submitFeed(siteUrl: string, feedUrl: string, cwd?: string): Promise<void> {
  await bingRequest('SubmitFeed', {}, { siteUrl, feedUrl }, cwd);
}

// ============================================================
// URL SUBMISSION — the part Google does not offer
// ============================================================

/** Remaining submission allowance. Daily quota grows with site age. */
export async function getQuota(siteUrl: string, cwd?: string): Promise<BingQuota> {
  return bingRequest<BingQuota>('GetUrlSubmissionQuota', { siteUrl }, undefined, cwd);
}

/**
 * Submits URLs for indexing, in batches of 500 (the API limit).
 *
 * Reads the quota before and after so the caller can confirm the submission
 * was actually accepted: Bing answers 200 with an empty body either way, and
 * the drop in quota is the only reliable acknowledgement.
 */
export async function submitUrls(
  siteUrl: string,
  urls: string[],
  cwd?: string
): Promise<BingSubmitResult> {
  if (!urls.length) return { submitted: 0, quotaBefore: null, quotaAfter: null, consumed: null };

  let quotaBefore: BingQuota | null = null;
  try {
    quotaBefore = await getQuota(siteUrl, cwd);
  } catch {
    // Quota is diagnostic only: a failure here must not block the submission
  }

  const BATCH = 500;
  for (let i = 0; i < urls.length; i += BATCH) {
    await bingRequest('SubmitUrlBatch', {}, { siteUrl, urlList: urls.slice(i, i + BATCH) }, cwd);
  }

  let quotaAfter: BingQuota | null = null;
  try {
    quotaAfter = await getQuota(siteUrl, cwd);
  } catch {
    // ignored, see above
  }

  const consumed =
    quotaBefore && quotaAfter ? quotaBefore.DailyQuota - quotaAfter.DailyQuota : null;

  return { submitted: urls.length, quotaBefore, quotaAfter, consumed };
}

// ============================================================
// PERFORMANCE
// ============================================================

/** Clicks and impressions over time. */
export async function getTrafficStats(siteUrl: string, cwd?: string): Promise<BingTrafficStats[]> {
  return (await bingRequest<BingTrafficStats[]>('GetRankAndTrafficStats', { siteUrl }, undefined, cwd)) || [];
}

/** Queries the site appears for on Bing. */
export async function getQueryStats(siteUrl: string, cwd?: string): Promise<BingQueryStats[]> {
  return (await bingRequest<BingQueryStats[]>('GetQueryStats', { siteUrl }, undefined, cwd)) || [];
}

/** Per-page traffic. */
export async function getPageStats(siteUrl: string, cwd?: string): Promise<unknown[]> {
  return (await bingRequest<unknown[]>('GetPageStats', { siteUrl }, undefined, cwd)) || [];
}

/** Crawl volume over time. */
export async function getCrawlStats(siteUrl: string, cwd?: string): Promise<unknown[]> {
  return (await bingRequest<unknown[]>('GetCrawlStats', { siteUrl }, undefined, cwd)) || [];
}

/** Crawl problems Bing has recorded (404s, blocked pages, timeouts). */
export async function getCrawlIssues(siteUrl: string, cwd?: string): Promise<BingCrawlIssue[]> {
  return (await bingRequest<BingCrawlIssue[]>('GetCrawlIssues', { siteUrl }, undefined, cwd)) || [];
}

// ============================================================
// NOT USABLE — documented so nobody rediscovers them the hard way
// ============================================================
//
// GetChildrenUrlTrafficInfo → "SiteUriSchemeIsNotSupported" on domain
//   properties registered without an explicit scheme match.
// GetKeywordStats → requires a different parameter shape (q, country,
//   language) and fails with a null reference when called like the others.
//
// Both were tested against a live property before being excluded.
