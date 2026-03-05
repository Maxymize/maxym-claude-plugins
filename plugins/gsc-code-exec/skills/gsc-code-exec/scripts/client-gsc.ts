/**
 * Google Search Console - Code Execution Client
 *
 * Direct connection to Google Search Console API without MCP server overhead.
 * Reduces token usage by 99%+ following Anthropic's Code Execution pattern.
 *
 * Authentication: Google Service Account (JSON key file)
 * API Reference: https://developers.google.com/webmaster-tools/v1/api_reference_index
 *
 * @see https://www.anthropic.com/engineering/code-execution-with-mcp
 */

import { GoogleAuth } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// CONFIGURATION
// ============================================================

const WEBMASTERS_API = 'https://searchconsole.googleapis.com/webmasters/v3';
const URL_INSPECTION_API = 'https://searchconsole.googleapis.com/v1';
const SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/webmasters',
];

// ============================================================
// TYPES
// ============================================================

export interface SearchAnalyticsRequest {
  siteUrl: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  dimensions?: ('query' | 'page' | 'country' | 'device' | 'searchAppearance' | 'date')[];
  type?: 'web' | 'image' | 'video' | 'news' | 'discover' | 'googleNews';
  aggregationType?: 'auto' | 'byNewsShowcasePanel' | 'byProperty' | 'byPage';
  rowLimit?: number; // max 25000
  startRow?: number;
  dataState?: 'all' | 'final';
  dimensionFilterGroups?: DimensionFilterGroup[];
}

export interface DimensionFilterGroup {
  groupType?: 'and';
  filters: DimensionFilter[];
}

export interface DimensionFilter {
  dimension: 'query' | 'page' | 'country' | 'device' | 'searchAppearance';
  operator: 'equals' | 'contains' | 'notEquals' | 'notContains' | 'includingRegex' | 'excludingRegex';
  expression: string;
}

export interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchAnalyticsResponse {
  rows: SearchAnalyticsRow[];
  responseAggregationType: string;
}

export interface SiteInfo {
  siteUrl: string;
  permissionLevel: string;
}

export interface SitemapInfo {
  path: string;
  lastSubmitted?: string;
  isPending: boolean;
  isSitemapsIndex: boolean;
  type?: string;
  lastDownloaded?: string;
  warnings?: string;
  errors?: string;
  contents?: SitemapContent[];
}

export interface SitemapContent {
  type: string;
  submitted: string;
  indexed?: string;
}

export interface UrlInspectionResult {
  inspectionResult: {
    inspectionResultLink: string;
    indexStatusResult: {
      verdict: string;
      coverageState: string;
      robotsTxtState: string;
      indexingState: string;
      lastCrawlTime?: string;
      pageFetchState: string;
      googleCanonical?: string;
      userCanonical?: string;
      crawledAs?: string;
      referringUrls?: string[];
    };
    mobileUsabilityResult?: {
      verdict: string;
      issues?: { issueType: string; severity: string; message: string }[];
    };
    richResultsResult?: {
      verdict: string;
      detectedItems?: { richResultType: string; items: unknown[] }[];
    };
  };
}

export interface QuickWin {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  potential: string;
}

export interface QuickWinsConfig {
  positionMin?: number;  // default 4
  positionMax?: number;  // default 20
  minImpressions?: number; // default 100
  maxCtr?: number;       // default 0.05 (5%)
}

export interface PeriodComparison {
  period1: { startDate: string; endDate: string };
  period2: { startDate: string; endDate: string };
  period1Data: SearchAnalyticsResponse;
  period2Data: SearchAnalyticsResponse;
  summary: {
    period1Clicks: number;
    period1Impressions: number;
    period2Clicks: number;
    period2Impressions: number;
    clicksChange: number;
    clicksChangePercent: string;
    impressionsChange: number;
    impressionsChangePercent: string;
  };
}

// ============================================================
// AUTHENTICATION
// ============================================================

let authClient: GoogleAuth | null = null;

function getCredentialsPath(): string {
  // Priority: env var > project-local file
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
  // Check common project locations
  const projectPaths = [
    path.join(process.cwd(), 'gsc-credentials.json'),
    path.join(process.cwd(), 'google-credentials.json'),
    path.join(process.cwd(), '.secrets', 'gsc-credentials.json'),
  ];
  for (const p of projectPaths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    'Google credentials not found. Set GOOGLE_APPLICATION_CREDENTIALS env var ' +
    'or place gsc-credentials.json in project root.'
  );
}

function getAuth(): GoogleAuth {
  if (!authClient) {
    const credentialsPath = getCredentialsPath();
    authClient = new GoogleAuth({
      keyFile: credentialsPath,
      scopes: SCOPES,
    });
  }
  return authClient;
}

async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const auth = getAuth();
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = typeof tokenResponse === 'string' ? tokenResponse : tokenResponse?.token;

  if (!token) throw new Error('Failed to obtain access token');

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GSC API ${response.status}: ${errorBody}`);
  }

  return response;
}

// ============================================================
// SITES / PROPERTIES
// ============================================================

/**
 * List all Search Console properties accessible by the service account
 */
export async function listSites(): Promise<SiteInfo[]> {
  const response = await authenticatedFetch(`${WEBMASTERS_API}/sites`);
  const data = await response.json() as { siteEntry?: SiteInfo[] };
  return data.siteEntry || [];
}

/**
 * Get details about a specific site/property
 */
export async function getSiteDetails(siteUrl: string): Promise<SiteInfo> {
  const encodedUrl = encodeURIComponent(siteUrl);
  const response = await authenticatedFetch(`${WEBMASTERS_API}/sites/${encodedUrl}`);
  return response.json() as Promise<SiteInfo>;
}

/**
 * Add a site to Search Console
 */
export async function addSite(siteUrl: string): Promise<void> {
  const encodedUrl = encodeURIComponent(siteUrl);
  await authenticatedFetch(`${WEBMASTERS_API}/sites/${encodedUrl}`, { method: 'PUT' });
}

/**
 * Remove a site from Search Console
 */
export async function deleteSite(siteUrl: string): Promise<void> {
  const encodedUrl = encodeURIComponent(siteUrl);
  await authenticatedFetch(`${WEBMASTERS_API}/sites/${encodedUrl}`, { method: 'DELETE' });
}

// ============================================================
// SEARCH ANALYTICS
// ============================================================

/**
 * Query search analytics data
 *
 * @example
 * // Top 10 queries last 7 days
 * const data = await querySearchAnalytics({
 *   siteUrl: 'sc-domain:example.com',
 *   startDate: '2026-02-25',
 *   endDate: '2026-03-04',
 *   dimensions: ['query'],
 *   rowLimit: 10
 * });
 */
export async function querySearchAnalytics(
  request: SearchAnalyticsRequest
): Promise<SearchAnalyticsResponse> {
  const { siteUrl, ...body } = request;
  const encodedUrl = encodeURIComponent(siteUrl);

  const response = await authenticatedFetch(
    `${WEBMASTERS_API}/sites/${encodedUrl}/searchAnalytics/query`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );

  const data = await response.json() as SearchAnalyticsResponse;
  return {
    rows: data.rows || [],
    responseAggregationType: data.responseAggregationType || 'auto',
  };
}

/**
 * Get performance overview (clicks, impressions, CTR, position) for a site
 */
export async function getPerformanceOverview(
  siteUrl: string,
  startDate: string,
  endDate: string
): Promise<{
  totalClicks: number;
  totalImpressions: number;
  averageCtr: number;
  averagePosition: number;
  dailyData: SearchAnalyticsRow[];
}> {
  const result = await querySearchAnalytics({
    siteUrl,
    startDate,
    endDate,
    dimensions: ['date'],
    rowLimit: 25000,
  });

  const totalClicks = result.rows.reduce((sum, r) => sum + r.clicks, 0);
  const totalImpressions = result.rows.reduce((sum, r) => sum + r.impressions, 0);
  const averageCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const weightedPosition = result.rows.reduce((sum, r) => sum + r.position * r.impressions, 0);
  const averagePosition = totalImpressions > 0 ? weightedPosition / totalImpressions : 0;

  return {
    totalClicks,
    totalImpressions,
    averageCtr,
    averagePosition,
    dailyData: result.rows,
  };
}

/**
 * Get top queries for a specific page
 */
export async function getQueriesForPage(
  siteUrl: string,
  pageUrl: string,
  startDate: string,
  endDate: string,
  rowLimit = 100
): Promise<SearchAnalyticsRow[]> {
  const result = await querySearchAnalytics({
    siteUrl,
    startDate,
    endDate,
    dimensions: ['query'],
    rowLimit,
    dimensionFilterGroups: [{
      filters: [{
        dimension: 'page',
        operator: 'equals',
        expression: pageUrl,
      }],
    }],
  });
  return result.rows;
}

/**
 * Get top pages for a specific query
 */
export async function getPagesForQuery(
  siteUrl: string,
  query: string,
  startDate: string,
  endDate: string,
  rowLimit = 100
): Promise<SearchAnalyticsRow[]> {
  const result = await querySearchAnalytics({
    siteUrl,
    startDate,
    endDate,
    dimensions: ['page'],
    rowLimit,
    dimensionFilterGroups: [{
      filters: [{
        dimension: 'query',
        operator: 'contains',
        expression: query,
      }],
    }],
  });
  return result.rows;
}

/**
 * Detect quick wins - pages with high impressions but low CTR in good positions
 */
export async function detectQuickWins(
  siteUrl: string,
  startDate: string,
  endDate: string,
  config: QuickWinsConfig = {}
): Promise<QuickWin[]> {
  const {
    positionMin = 4,
    positionMax = 20,
    minImpressions = 100,
    maxCtr = 0.05,
  } = config;

  const result = await querySearchAnalytics({
    siteUrl,
    startDate,
    endDate,
    dimensions: ['query', 'page'],
    rowLimit: 25000,
  });

  const quickWins: QuickWin[] = result.rows
    .filter(row =>
      row.position >= positionMin &&
      row.position <= positionMax &&
      row.impressions >= minImpressions &&
      row.ctr <= maxCtr
    )
    .sort((a, b) => b.impressions - a.impressions)
    .map(row => ({
      ...row,
      potential: row.position <= 10
        ? 'HIGH - Already on page 1, optimize title/description for CTR'
        : 'MEDIUM - Close to page 1, needs content/link optimization',
    }));

  return quickWins;
}

/**
 * Compare search performance between two time periods
 */
export async function comparePeriods(
  siteUrl: string,
  period1Start: string,
  period1End: string,
  period2Start: string,
  period2End: string,
  dimensions: SearchAnalyticsRequest['dimensions'] = ['query']
): Promise<PeriodComparison> {
  const [period1Data, period2Data] = await Promise.all([
    querySearchAnalytics({ siteUrl, startDate: period1Start, endDate: period1End, dimensions, rowLimit: 25000 }),
    querySearchAnalytics({ siteUrl, startDate: period2Start, endDate: period2End, dimensions, rowLimit: 25000 }),
  ]);

  const p1Clicks = period1Data.rows.reduce((s, r) => s + r.clicks, 0);
  const p1Impressions = period1Data.rows.reduce((s, r) => s + r.impressions, 0);
  const p2Clicks = period2Data.rows.reduce((s, r) => s + r.clicks, 0);
  const p2Impressions = period2Data.rows.reduce((s, r) => s + r.impressions, 0);

  const clicksChange = p2Clicks - p1Clicks;
  const impressionsChange = p2Impressions - p1Impressions;

  return {
    period1: { startDate: period1Start, endDate: period1End },
    period2: { startDate: period2Start, endDate: period2End },
    period1Data,
    period2Data,
    summary: {
      period1Clicks: p1Clicks,
      period1Impressions: p1Impressions,
      period2Clicks: p2Clicks,
      period2Impressions: p2Impressions,
      clicksChange,
      clicksChangePercent: p1Clicks > 0 ? ((clicksChange / p1Clicks) * 100).toFixed(1) + '%' : 'N/A',
      impressionsChange,
      impressionsChangePercent: p1Impressions > 0 ? ((impressionsChange / p1Impressions) * 100).toFixed(1) + '%' : 'N/A',
    },
  };
}

// ============================================================
// URL INSPECTION
// ============================================================

/**
 * Inspect a URL's indexing status
 */
export async function inspectUrl(
  siteUrl: string,
  inspectionUrl: string,
  languageCode = 'en'
): Promise<UrlInspectionResult> {
  const response = await authenticatedFetch(
    `${URL_INSPECTION_API}/urlInspection/index:inspect`,
    {
      method: 'POST',
      body: JSON.stringify({
        inspectionUrl,
        siteUrl,
        languageCode,
      }),
    }
  );
  return response.json() as Promise<UrlInspectionResult>;
}

/**
 * Batch inspect multiple URLs
 */
export async function batchInspectUrls(
  siteUrl: string,
  urls: string[],
  languageCode = 'en'
): Promise<{ url: string; result?: UrlInspectionResult; error?: string }[]> {
  // URL Inspection API has rate limits, process sequentially with small delay
  const results: { url: string; result?: UrlInspectionResult; error?: string }[] = [];

  for (const url of urls) {
    try {
      const result = await inspectUrl(siteUrl, url, languageCode);
      results.push({ url, result });
    } catch (error) {
      results.push({ url, error: (error as Error).message });
    }
    // Small delay to avoid rate limiting (2000 req/day limit)
    if (urls.indexOf(url) < urls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return results;
}

// ============================================================
// SITEMAPS
// ============================================================

/**
 * List all sitemaps for a site
 */
export async function listSitemaps(siteUrl: string): Promise<SitemapInfo[]> {
  const encodedUrl = encodeURIComponent(siteUrl);
  const response = await authenticatedFetch(`${WEBMASTERS_API}/sites/${encodedUrl}/sitemaps`);
  const data = await response.json() as { sitemap?: SitemapInfo[] };
  return data.sitemap || [];
}

/**
 * Get details about a specific sitemap
 */
export async function getSitemapDetails(siteUrl: string, sitemapUrl: string): Promise<SitemapInfo> {
  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const encodedFeedpath = encodeURIComponent(sitemapUrl);
  const response = await authenticatedFetch(
    `${WEBMASTERS_API}/sites/${encodedSiteUrl}/sitemaps/${encodedFeedpath}`
  );
  return response.json() as Promise<SitemapInfo>;
}

/**
 * Submit a sitemap
 */
export async function submitSitemap(siteUrl: string, sitemapUrl: string): Promise<void> {
  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const encodedFeedpath = encodeURIComponent(sitemapUrl);
  await authenticatedFetch(
    `${WEBMASTERS_API}/sites/${encodedSiteUrl}/sitemaps/${encodedFeedpath}`,
    { method: 'PUT' }
  );
}

/**
 * Delete a sitemap
 */
export async function deleteSitemap(siteUrl: string, sitemapUrl: string): Promise<void> {
  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const encodedFeedpath = encodeURIComponent(sitemapUrl);
  await authenticatedFetch(
    `${WEBMASTERS_API}/sites/${encodedSiteUrl}/sitemaps/${encodedFeedpath}`,
    { method: 'DELETE' }
  );
}

// ============================================================
// INDEXING ISSUES CHECKER
// ============================================================

/**
 * Check indexing issues for a list of URLs
 */
export async function checkIndexingIssues(
  siteUrl: string,
  urls: string[]
): Promise<{
  indexed: { url: string; lastCrawl?: string }[];
  notIndexed: { url: string; reason: string }[];
  errors: { url: string; error: string }[];
  summary: { total: number; indexed: number; notIndexed: number; errors: number };
}> {
  const inspections = await batchInspectUrls(siteUrl, urls);

  const indexed: { url: string; lastCrawl?: string }[] = [];
  const notIndexed: { url: string; reason: string }[] = [];
  const errors: { url: string; error: string }[] = [];

  for (const inspection of inspections) {
    if (inspection.error) {
      errors.push({ url: inspection.url, error: inspection.error });
    } else if (inspection.result) {
      const status = inspection.result.inspectionResult.indexStatusResult;
      if (status.verdict === 'PASS') {
        indexed.push({
          url: inspection.url,
          lastCrawl: status.lastCrawlTime,
        });
      } else {
        notIndexed.push({
          url: inspection.url,
          reason: status.coverageState || status.verdict,
        });
      }
    }
  }

  return {
    indexed,
    notIndexed,
    errors,
    summary: {
      total: urls.length,
      indexed: indexed.length,
      notIndexed: notIndexed.length,
      errors: errors.length,
    },
  };
}

// ============================================================
// UTILITY: Date helpers
// ============================================================

/**
 * Get date string for N days ago
 */
export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

/**
 * Get last 7 days range
 */
export function last7Days(): { startDate: string; endDate: string } {
  return { startDate: daysAgo(10), endDate: daysAgo(3) }; // 3-day latency
}

/**
 * Get last 28 days range
 */
export function last28Days(): { startDate: string; endDate: string } {
  return { startDate: daysAgo(31), endDate: daysAgo(3) };
}

/**
 * Get last 3 months range
 */
export function last3Months(): { startDate: string; endDate: string } {
  return { startDate: daysAgo(93), endDate: daysAgo(3) };
}
