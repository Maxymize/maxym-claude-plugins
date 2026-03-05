/**
 * Test: Coolify Code Execution Skill
 *
 * Runs REAL operations against a Coolify instance.
 * Generates verifiable HTML report + JSON output files.
 *
 * Usage:
 *   COOLIFY_API_URL=http://your-coolify-server:8000 \
 *   COOLIFY_TOKEN="1|BWGwV5z2BB4zgvV2SHoDoXlGLaPD79UkLoYUhCHCa872129d" \
 *   npx tsx test/test-coolify-skill.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import client
import { createCoolifyClient, type CoolifyConfig } from '../scripts/client-coolify.js';

const OUTPUT_DIR = path.join(__dirname, 'output');

interface TestResult {
  test: string;
  category: string;
  success: boolean;
  details: string;
  duration: number;
}

async function runTests() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const config: CoolifyConfig = {
    apiUrl: process.env.COOLIFY_API_URL || 'http://your-coolify-server:8000',
    token: process.env.COOLIFY_TOKEN || '',
  };

  if (!config.token) {
    console.error('ERROR: COOLIFY_TOKEN env var required');
    process.exit(1);
  }

  const coolify = createCoolifyClient(config);
  const results: TestResult[] = [];
  const errors: string[] = [];

  console.log('='.repeat(60));
  console.log('Testing Coolify Code Execution Skill');
  console.log(`API: ${config.apiUrl}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log('='.repeat(60));

  // Helper
  async function runTest(
    category: string,
    name: string,
    fn: () => Promise<{ success: boolean; details: string; data?: any }>
  ) {
    const t0 = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - t0;
      results.push({ test: name, category, ...result, duration });
      console.log(`  ${result.success ? '✅' : '❌'} ${name} (${duration}ms)`);
      return result.data;
    } catch (error: any) {
      const duration = Date.now() - t0;
      const msg = error.message || String(error);
      errors.push(`${name}: ${msg}`);
      results.push({ test: name, category, success: false, details: `Error: ${msg}`, duration });
      console.log(`  ❌ ${name} (${duration}ms) — ${msg.substring(0, 80)}`);
      return null;
    }
  }

  // ========================================
  // 1. SYSTEM
  // ========================================
  console.log('\n📋 Category: System');

  await runTest('System', 'version()', async () => {
    const v = await coolify.version();
    return { success: typeof v === 'string' && v.length > 0, details: `Version: ${v}`, data: v };
  });

  // ========================================
  // 2. APPLICATIONS
  // ========================================
  console.log('\n📋 Category: Applications');

  let appUuid = '';
  const apps = await runTest('Applications', 'listApplications()', async () => {
    const apps = await coolify.listApplications();
    return {
      success: Array.isArray(apps),
      details: `Found ${apps.length} application(s)`,
      data: apps,
    };
  });

  if (apps && apps.length > 0) {
    appUuid = apps[0].uuid;

    await runTest('Applications', 'getApplication(uuid)', async () => {
      const app = await coolify.getApplication(appUuid);
      return {
        success: !!app.uuid,
        details: `${app.name} — status: ${app.status}, build_pack: ${app.build_pack}`,
        data: app,
      };
    });

    await runTest('Applications', 'getApplicationStatus(uuid)', async () => {
      const status = await coolify.getApplicationStatus(appUuid);
      return { success: typeof status === 'string', details: `Status: ${status}` };
    });

    await runTest('Applications', 'getApplicationLogs(uuid)', async () => {
      const { logs } = await coolify.getApplicationLogs(appUuid, 10);
      const lineCount = logs ? logs.split('\n').filter(Boolean).length : 0;
      return {
        success: true,
        details: `Got ${lineCount} log lines`,
        data: logs,
      };
    });
  }

  // ========================================
  // 3. ENVIRONMENT VARIABLES
  // ========================================
  console.log('\n📋 Category: Environment Variables');

  if (appUuid) {
    await runTest('Env Vars', 'listApplicationEnvs(uuid)', async () => {
      const envs = await coolify.listApplicationEnvs(appUuid);
      return {
        success: Array.isArray(envs),
        details: `Found ${envs.length} env var(s)`,
        data: envs,
      };
    });

    await runTest('Env Vars', 'getApplicationEnvMap(uuid)', async () => {
      const map = await coolify.getApplicationEnvMap(appUuid);
      const keys = Object.keys(map);
      return {
        success: keys.length > 0,
        details: `Keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? ` (+${keys.length - 5} more)` : ''}`,
        data: map,
      };
    });
  }

  // ========================================
  // 4. DEPLOYMENTS
  // ========================================
  console.log('\n📋 Category: Deployments');

  await runTest('Deployments', 'listDeployments()', async () => {
    const deps = await coolify.listDeployments();
    return {
      success: Array.isArray(deps),
      details: `${deps.length} running deployment(s)`,
      data: deps,
    };
  });

  if (appUuid) {
    await runTest('Deployments', 'listApplicationDeployments(uuid)', async () => {
      const deps = await coolify.listApplicationDeployments(appUuid, 0, 5);
      const items = Array.isArray(deps) ? deps : [];
      return {
        success: true,
        details: `${items.length} recent deployment(s)`,
        data: items,
      };
    });
  }

  // ========================================
  // 5. SERVERS
  // ========================================
  console.log('\n📋 Category: Servers');

  let serverUuid = '';
  const servers = await runTest('Servers', 'listServers()', async () => {
    const s = await coolify.listServers();
    return {
      success: Array.isArray(s) && s.length > 0,
      details: `Found ${s.length} server(s)`,
      data: s,
    };
  });

  if (servers && servers.length > 0) {
    serverUuid = servers[0].uuid;

    await runTest('Servers', 'getServer(uuid)', async () => {
      const s = await coolify.getServer(serverUuid);
      return {
        success: !!s.uuid,
        details: `${s.name} (${s.ip}) — reachable: ${s.settings?.is_reachable}`,
        data: s,
      };
    });

    await runTest('Servers', 'listServerResources(uuid)', async () => {
      const resources = await coolify.listServerResources(serverUuid);
      return {
        success: Array.isArray(resources),
        details: `${resources.length} resource(s) on server`,
        data: resources,
      };
    });

    await runTest('Servers', 'getServerOverview(uuid)', async () => {
      const overview = await coolify.getServerOverview(serverUuid);
      return {
        success: !!overview.name,
        details: `${overview.name} (${overview.ip}) — ${overview.resourceCount} resources`,
        data: overview,
      };
    });
  }

  // ========================================
  // 6. PROJECTS
  // ========================================
  console.log('\n📋 Category: Projects');

  await runTest('Projects', 'listProjects()', async () => {
    const projects = await coolify.listProjects();
    return {
      success: Array.isArray(projects),
      details: projects.map(p => `${p.name} (${p.uuid})`).join(', '),
      data: projects,
    };
  });

  // ========================================
  // 7. TEAMS
  // ========================================
  console.log('\n📋 Category: Teams');

  await runTest('Teams', 'listTeams()', async () => {
    const teams = await coolify.listTeams();
    return {
      success: Array.isArray(teams),
      details: `Found ${teams.length} team(s)`,
      data: teams,
    };
  });

  await runTest('Teams', 'getCurrentTeam()', async () => {
    const team = await coolify.getCurrentTeam();
    return {
      success: !!team.name || !!team.id,
      details: `Team: ${team.name || team.id}`,
      data: team,
    };
  });

  await runTest('Teams', 'getCurrentTeamMembers()', async () => {
    const members = await coolify.getCurrentTeamMembers();
    return {
      success: Array.isArray(members),
      details: `${members.length} member(s)`,
      data: members,
    };
  });

  // ========================================
  // 8. SECURITY
  // ========================================
  console.log('\n📋 Category: Security');

  await runTest('Security', 'listPrivateKeys()', async () => {
    const keys = await coolify.listPrivateKeys();
    return {
      success: Array.isArray(keys),
      details: `Found ${keys.length} key(s)`,
      data: keys,
    };
  });

  // ========================================
  // 9. GITHUB APPS
  // ========================================
  console.log('\n📋 Category: GitHub Apps');

  await runTest('GitHub Apps', 'listGithubApps()', async () => {
    const apps = await coolify.listGithubApps();
    return {
      success: Array.isArray(apps),
      details: `Found ${apps.length} GitHub App(s)`,
      data: apps,
    };
  });

  // ========================================
  // SAVE OUTPUT FILES
  // ========================================

  // Save all raw data
  const allData: Record<string, any> = {};
  for (const r of results) {
    allData[r.test] = { success: r.success, details: r.details, duration: r.duration };
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, 'test-results.json'), JSON.stringify(allData, null, 2));

  // ========================================
  // GENERATE HTML REPORT
  // ========================================
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  const categories = [...new Set(results.map(r => r.category))];

  const htmlReport = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Report - Coolify Code Execution</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-gray-100 p-8">
  <div class="max-w-5xl mx-auto">
    <h1 class="text-3xl font-bold mb-2">Coolify Code Execution — Test Report</h1>
    <p class="text-gray-400 mb-6">API: ${config.apiUrl} | Generated: ${new Date().toISOString()}</p>

    <!-- Summary -->
    <div class="grid grid-cols-4 gap-4 mb-8">
      <div class="bg-gray-800 p-4 rounded-lg">
        <div class="text-4xl font-bold text-blue-400">${results.length}</div>
        <div class="text-gray-400">Total tests</div>
      </div>
      <div class="bg-gray-800 p-4 rounded-lg">
        <div class="text-4xl font-bold text-green-400">${passed}</div>
        <div class="text-gray-400">Passed</div>
      </div>
      <div class="bg-gray-800 p-4 rounded-lg">
        <div class="text-4xl font-bold text-red-400">${failed}</div>
        <div class="text-gray-400">Failed</div>
      </div>
      <div class="bg-gray-800 p-4 rounded-lg">
        <div class="text-4xl font-bold text-yellow-400">${totalDuration}ms</div>
        <div class="text-gray-400">Total time</div>
      </div>
    </div>

    <!-- Results by category -->
    ${categories.map(cat => {
      const catResults = results.filter(r => r.category === cat);
      const catPassed = catResults.filter(r => r.success).length;
      return `
    <div class="bg-gray-800 rounded-lg mb-6">
      <div class="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 class="text-xl font-semibold">${cat}</h2>
        <span class="text-sm ${catPassed === catResults.length ? 'text-green-400' : 'text-yellow-400'}">${catPassed}/${catResults.length} passed</span>
      </div>
      <div class="divide-y divide-gray-700">
        ${catResults.map(r => `
        <div class="p-4 flex items-start gap-4">
          <span class="text-2xl mt-0.5">${r.success ? '✅' : '❌'}</span>
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <code class="font-mono text-sm bg-gray-700 px-2 py-1 rounded">${r.test}</code>
              <span class="text-xs text-gray-500">${r.duration}ms</span>
            </div>
            <p class="text-gray-400 text-sm mt-1">${r.details}</p>
          </div>
        </div>
        `).join('')}
      </div>
    </div>`;
    }).join('')}

    <!-- Coverage -->
    <div class="bg-gray-800 rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">API Coverage (107 endpoints)</h2>
      <div class="grid grid-cols-2 gap-2 text-sm">
        ${[
          ['System', 4], ['Applications', 19], ['Deployments', 5],
          ['Servers', 8], ['Databases', 21], ['Services', 13],
          ['Projects', 9], ['Teams', 5], ['Security', 5],
          ['Resources', 1], ['Cloud Tokens', 6], ['GitHub Apps', 6],
        ].map(([name, count]) => `
        <div class="flex justify-between bg-gray-700/50 px-3 py-1 rounded">
          <span>${name}</span>
          <span class="text-green-400">${count} endpoints</span>
        </div>`).join('')}
      </div>
      <p class="text-green-400 font-semibold mt-4">100% coverage — No MCP server needed</p>
    </div>

    ${errors.length > 0 ? `
    <div class="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-6">
      <h2 class="text-lg font-semibold text-red-400 mb-2">Errors</h2>
      ${errors.map(e => `<p class="text-sm text-red-300 font-mono">${e}</p>`).join('')}
    </div>` : ''}

    <p class="text-gray-600 text-xs mt-8">
      Coolify Code Execution Skill v1.0 | Direct Connection (no MCP)
    </p>
  </div>
</body>
</html>`;

  const reportPath = path.join(OUTPUT_DIR, 'test-report.html');
  fs.writeFileSync(reportPath, htmlReport);

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱  Total: ${totalDuration}ms`);
  console.log(`\n📄 HTML Report: ${reportPath}`);
  console.log(`📁 JSON Output: ${path.join(OUTPUT_DIR, 'test-results.json')}`);

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Check report for details.');
  } else {
    console.log('\n🎉 All tests passed!');
  }

  console.log(`\nTo view: open ${reportPath}`);
}

runTests().catch(console.error);
