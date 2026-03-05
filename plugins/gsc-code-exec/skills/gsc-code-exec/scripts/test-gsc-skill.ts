/**
 * Test script for GSC Code Execution Skill
 *
 * Run with: npx tsx .claude/skills/gsc-code-exec/scripts/test-gsc-skill.ts
 *
 * Requires:
 * - GOOGLE_APPLICATION_CREDENTIALS env var or gsc-credentials.json in project root
 * - Service account added to GSC property
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  listSites,
  getSiteDetails,
  querySearchAnalytics,
  getPerformanceOverview,
  detectQuickWins,
  comparePeriods,
  inspectUrl,
  listSitemaps,
  getQueriesForPage,
  last7Days,
  last28Days,
  last3Months,
  daysAgo,
} from './client-gsc.js';

const OUTPUT_DIR = path.join(process.cwd(), 'test', 'output', 'gsc');

interface TestResult {
  test: string;
  success: boolean;
  details: string;
  duration: number;
}

async function runTests() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results: TestResult[] = [];
  const errors: string[] = [];
  let siteUrl = '';

  console.log('='.repeat(60));
  console.log('Testing Google Search Console Code Execution Skill');
  console.log('Output directory:', OUTPUT_DIR);
  console.log('='.repeat(60));

  // ========================================
  // TEST 1: List sites
  // ========================================
  console.log('\n📋 Test 1: listSites()');
  const t1 = Date.now();
  try {
    const sites = await listSites();
    results.push({
      test: 'listSites()',
      success: sites.length > 0,
      details: `Found ${sites.length} properties: ${sites.map(s => s.siteUrl).join(', ')}`,
      duration: Date.now() - t1,
    });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'sites.json'), JSON.stringify(sites, null, 2));

    // Use first site for remaining tests
    siteUrl = sites[0]?.siteUrl || '';
    console.log(`  Using site: ${siteUrl}`);
  } catch (error) {
    errors.push(`listSites failed: ${error}`);
    results.push({ test: 'listSites()', success: false, details: `Error: ${error}`, duration: Date.now() - t1 });
  }

  if (!siteUrl) {
    console.error('\n❌ No sites found. Cannot continue tests.');
    generateReport(results, errors);
    return;
  }

  // ========================================
  // TEST 2: Get site details
  // ========================================
  console.log('\n🔍 Test 2: getSiteDetails()');
  const t2 = Date.now();
  try {
    const details = await getSiteDetails(siteUrl);
    results.push({
      test: 'getSiteDetails()',
      success: !!details.siteUrl,
      details: `Permission: ${details.permissionLevel}`,
      duration: Date.now() - t2,
    });
  } catch (error) {
    errors.push(`getSiteDetails failed: ${error}`);
    results.push({ test: 'getSiteDetails()', success: false, details: `Error: ${error}`, duration: Date.now() - t2 });
  }

  // ========================================
  // TEST 3: Search Analytics - top queries
  // ========================================
  console.log('\n📊 Test 3: querySearchAnalytics() - top queries');
  const t3 = Date.now();
  const { startDate, endDate } = last28Days();
  try {
    const analytics = await querySearchAnalytics({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 50,
    });
    results.push({
      test: 'querySearchAnalytics(queries)',
      success: true,
      details: `${analytics.rows.length} queries found`,
      duration: Date.now() - t3,
    });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'top-queries.json'), JSON.stringify(analytics.rows, null, 2));
  } catch (error) {
    errors.push(`querySearchAnalytics failed: ${error}`);
    results.push({ test: 'querySearchAnalytics(queries)', success: false, details: `Error: ${error}`, duration: Date.now() - t3 });
  }

  // ========================================
  // TEST 4: Search Analytics - top pages
  // ========================================
  console.log('\n📄 Test 4: querySearchAnalytics() - top pages');
  const t4 = Date.now();
  try {
    const pages = await querySearchAnalytics({
      siteUrl,
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 50,
    });
    results.push({
      test: 'querySearchAnalytics(pages)',
      success: true,
      details: `${pages.rows.length} pages found`,
      duration: Date.now() - t4,
    });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'top-pages.json'), JSON.stringify(pages.rows, null, 2));
  } catch (error) {
    errors.push(`querySearchAnalytics(pages) failed: ${error}`);
    results.push({ test: 'querySearchAnalytics(pages)', success: false, details: `Error: ${error}`, duration: Date.now() - t4 });
  }

  // ========================================
  // TEST 5: Performance overview
  // ========================================
  console.log('\n📈 Test 5: getPerformanceOverview()');
  const t5 = Date.now();
  try {
    const overview = await getPerformanceOverview(siteUrl, startDate, endDate);
    results.push({
      test: 'getPerformanceOverview()',
      success: true,
      details: `Clicks: ${overview.totalClicks}, Impressions: ${overview.totalImpressions}, CTR: ${(overview.averageCtr * 100).toFixed(1)}%, Avg Position: ${overview.averagePosition.toFixed(1)}`,
      duration: Date.now() - t5,
    });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'overview.json'), JSON.stringify(overview, null, 2));
  } catch (error) {
    errors.push(`getPerformanceOverview failed: ${error}`);
    results.push({ test: 'getPerformanceOverview()', success: false, details: `Error: ${error}`, duration: Date.now() - t5 });
  }

  // ========================================
  // TEST 6: Quick wins
  // ========================================
  console.log('\n🎯 Test 6: detectQuickWins()');
  const t6 = Date.now();
  try {
    const wins = await detectQuickWins(siteUrl, startDate, endDate, {
      minImpressions: 10, // lower threshold for testing
    });
    results.push({
      test: 'detectQuickWins()',
      success: true,
      details: `${wins.length} quick wins found`,
      duration: Date.now() - t6,
    });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'quick-wins.json'), JSON.stringify(wins, null, 2));
  } catch (error) {
    errors.push(`detectQuickWins failed: ${error}`);
    results.push({ test: 'detectQuickWins()', success: false, details: `Error: ${error}`, duration: Date.now() - t6 });
  }

  // ========================================
  // TEST 7: Compare periods
  // ========================================
  console.log('\n📊 Test 7: comparePeriods()');
  const t7 = Date.now();
  try {
    const comparison = await comparePeriods(
      siteUrl,
      daysAgo(60), daysAgo(31),
      daysAgo(30), daysAgo(3),
    );
    results.push({
      test: 'comparePeriods()',
      success: true,
      details: `Clicks: ${comparison.summary.period1Clicks} → ${comparison.summary.period2Clicks} (${comparison.summary.clicksChangePercent})`,
      duration: Date.now() - t7,
    });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'period-comparison.json'), JSON.stringify(comparison.summary, null, 2));
  } catch (error) {
    errors.push(`comparePeriods failed: ${error}`);
    results.push({ test: 'comparePeriods()', success: false, details: `Error: ${error}`, duration: Date.now() - t7 });
  }

  // ========================================
  // TEST 8: List sitemaps
  // ========================================
  console.log('\n🗺️ Test 8: listSitemaps()');
  const t8 = Date.now();
  try {
    const sitemaps = await listSitemaps(siteUrl);
    results.push({
      test: 'listSitemaps()',
      success: true,
      details: `${sitemaps.length} sitemaps found`,
      duration: Date.now() - t8,
    });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemaps.json'), JSON.stringify(sitemaps, null, 2));
  } catch (error) {
    errors.push(`listSitemaps failed: ${error}`);
    results.push({ test: 'listSitemaps()', success: false, details: `Error: ${error}`, duration: Date.now() - t8 });
  }

  // ========================================
  // TEST 9: URL Inspection
  // ========================================
  console.log('\n🔎 Test 9: inspectUrl()');
  const t9 = Date.now();
  const testUrl = siteUrl.startsWith('sc-domain:')
    ? `https://${siteUrl.replace('sc-domain:', '')}/`
    : siteUrl;
  try {
    const inspection = await inspectUrl(siteUrl, testUrl);
    const verdict = inspection.inspectionResult.indexStatusResult.verdict;
    results.push({
      test: 'inspectUrl()',
      success: true,
      details: `Verdict: ${verdict}, Coverage: ${inspection.inspectionResult.indexStatusResult.coverageState}`,
      duration: Date.now() - t9,
    });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'url-inspection.json'), JSON.stringify(inspection, null, 2));
  } catch (error) {
    errors.push(`inspectUrl failed: ${error}`);
    results.push({ test: 'inspectUrl()', success: false, details: `Error: ${error}`, duration: Date.now() - t9 });
  }

  // ========================================
  // TEST 10: Date helpers
  // ========================================
  console.log('\n📅 Test 10: Date helpers');
  const t10 = Date.now();
  const d7 = last7Days();
  const d28 = last28Days();
  const d90 = last3Months();
  results.push({
    test: 'Date helpers',
    success: true,
    details: `7d: ${d7.startDate}→${d7.endDate}, 28d: ${d28.startDate}→${d28.endDate}, 3m: ${d90.startDate}→${d90.endDate}`,
    duration: Date.now() - t10,
  });

  // ========================================
  // GENERATE REPORT
  // ========================================
  generateReport(results, errors);
}

function generateReport(results: TestResult[], errors: string[]) {
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Report - GSC Code Execution</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-8">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-2">Test Report: Google Search Console Code Execution</h1>
    <p class="text-gray-500 mb-6">Generated: ${new Date().toISOString()}</p>

    <div class="grid grid-cols-3 gap-4 mb-8">
      <div class="bg-white p-4 rounded shadow">
        <div class="text-4xl font-bold text-blue-600">${results.length}</div>
        <div class="text-gray-600">Total tests</div>
      </div>
      <div class="bg-white p-4 rounded shadow">
        <div class="text-4xl font-bold text-green-600">${passed}</div>
        <div class="text-gray-600">Passed</div>
      </div>
      <div class="bg-white p-4 rounded shadow">
        <div class="text-4xl font-bold text-red-600">${failed}</div>
        <div class="text-gray-600">Failed</div>
      </div>
    </div>

    <div class="bg-white rounded shadow mb-8">
      <h2 class="text-xl font-semibold p-4 border-b">Test Results</h2>
      <div class="divide-y">
        ${results.map(r => `
          <div class="p-4 flex items-center">
            <span class="text-2xl mr-4">${r.success ? '✅' : '❌'}</span>
            <div class="flex-1">
              <code class="font-mono text-sm bg-gray-100 px-2 py-1 rounded">${r.test}</code>
              <p class="text-gray-600 text-sm mt-1">${r.details}</p>
            </div>
            <span class="text-gray-400 text-sm">${r.duration}ms</span>
          </div>
        `).join('')}
      </div>
    </div>

    ${errors.length > 0 ? `
    <div class="bg-red-50 rounded shadow mb-8 p-4">
      <h2 class="text-xl font-semibold text-red-700 mb-2">Errors</h2>
      <ul class="list-disc list-inside text-red-600">
        ${errors.map(e => `<li>${e}</li>`).join('')}
      </ul>
    </div>` : ''}

    <div class="bg-white rounded shadow p-4">
      <h2 class="text-xl font-semibold mb-2">Output Files</h2>
      <ul class="list-disc list-inside text-sm text-gray-600">
        <li>sites.json - All GSC properties</li>
        <li>top-queries.json - Top 50 search queries</li>
        <li>top-pages.json - Top 50 pages</li>
        <li>overview.json - Performance overview</li>
        <li>quick-wins.json - SEO optimization opportunities</li>
        <li>period-comparison.json - Month-over-month comparison</li>
        <li>sitemaps.json - Submitted sitemaps</li>
        <li>url-inspection.json - URL indexing status</li>
      </ul>
    </div>
  </div>
</body>
</html>`;

  const reportPath = path.join(OUTPUT_DIR, 'test-report.html');
  fs.writeFileSync(reportPath, html);

  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`\n📄 HTML Report: ${reportPath}`);
  console.log(`📁 JSON Output: ${OUTPUT_DIR}/`);
  console.log(`\nTo view: open ${reportPath}`);
}

runTests().catch(console.error);
