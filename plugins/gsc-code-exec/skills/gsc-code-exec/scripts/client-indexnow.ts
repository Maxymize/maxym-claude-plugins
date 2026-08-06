/**
 * IndexNow - Code Execution Client
 *
 * IndexNow is an open protocol: one call reaches Bing, Yandex, Seznam and
 * Naver, which forward submissions to each other. No account, no OAuth, no
 * API key to guard, and submissions do NOT consume the Bing API quota — so
 * it stacks on top of Bing's SubmitUrlBatch instead of competing with it.
 *
 * Verification works through ownership of the domain: a key file must be
 * reachable at the site root before any submission is accepted.
 *
 * NOTE ON SECRETS — the IndexNow key is deliberately public: the protocol
 * requires publishing it on the domain. It is NOT an API key and must never
 * be confused with one. Real credentials (Bing, Google) never appear here.
 *
 * Protocol reference: https://www.indexnow.org/documentation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ============================================================
// CONFIGURATION
// ============================================================

/** Generic endpoint: participating engines share submissions with each other. */
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';

/** Where a static site typically publishes root-served files. */
const PUBLIC_DIRS = ['public', 'static', 'dist', '.'];

/** Protocol constraint: 8-128 hexadecimal characters. */
const KEY_PATTERN = /^[0-9a-f]{8,128}$/i;

// ============================================================
// TYPES
// ============================================================

export interface IndexNowKey {
  key: string;
  file: string;      // absolute path of the key file on disk
  publicPath: string; // path it will be served from
}

export interface IndexNowResult {
  status: number;
  submitted: number;
  accepted: boolean;
  note: string;
}

// ============================================================
// KEY MANAGEMENT
// ============================================================

/**
 * Finds an existing IndexNow key in the project.
 *
 * The key is derived from the FILENAME rather than from the file contents or
 * a config entry: that keeps a single source of truth. A second copy stored
 * elsewhere would eventually drift out of sync and cause silent 403s.
 */
export function findKey(cwd: string = process.cwd()): IndexNowKey | null {
  for (const dir of PUBLIC_DIRS) {
    const full = path.join(cwd, dir);
    if (!fs.existsSync(full)) continue;
    const match = fs
      .readdirSync(full)
      .find((name) => name.endsWith('.txt') && KEY_PATTERN.test(name.replace(/\.txt$/i, '')));
    if (match) {
      return {
        key: match.replace(/\.txt$/i, ''),
        file: path.join(full, match),
        publicPath: `/${match}`,
      };
    }
  }
  return null;
}

/**
 * Creates a key file if none exists. Returns the existing one otherwise, so
 * calling this repeatedly is safe and never rotates a working key.
 */
export function ensureKey(cwd: string = process.cwd(), publicDir = 'public'): IndexNowKey {
  const existing = findKey(cwd);
  if (existing) return existing;

  const key = crypto.randomBytes(16).toString('hex');
  const dir = path.join(cwd, publicDir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const file = path.join(dir, `${key}.txt`);
  fs.writeFileSync(file, key, 'utf8');
  return { key, file, publicPath: `/${key}.txt` };
}

/**
 * Confirms the key file is actually reachable on the live domain.
 *
 * Worth doing before every submission: publishing lags behind committing, and
 * a submission sent while the file is still missing is rejected with a 403
 * that is easy to miss in automation.
 */
export async function isKeyPublished(siteUrl: string, key: string): Promise<boolean> {
  try {
    const res = await fetch(`${siteUrl.replace(/\/+$/, '')}/${key}.txt`);
    if (!res.ok) return false;
    return (await res.text()).trim() === key;
  } catch {
    return false;
  }
}

// ============================================================
// SUBMISSION
// ============================================================

/**
 * Notifies the participating engines about new or updated URLs.
 *
 * Accepts up to 10,000 URLs per call. Status 200 means accepted, 202 means
 * accepted with the key still being validated — both are successes, and 202
 * is the normal answer for a domain submitting for the first time.
 */
export async function submitUrls(
  siteUrl: string,
  urls: string[],
  key: string
): Promise<IndexNowResult> {
  if (!urls.length) {
    return { status: 0, submitted: 0, accepted: false, note: 'no URLs to submit' };
  }

  const host = siteUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const base = siteUrl.replace(/\/+$/, '');

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host,
      key,
      keyLocation: `${base}/${key}.txt`,
      urlList: urls.slice(0, 10000),
    }),
  });

  const notes: Record<number, string> = {
    200: 'accepted',
    202: 'accepted, key pending validation',
    400: 'invalid request format',
    403: 'key not found or not valid on this host',
    422: 'URLs do not match the declared host',
    429: 'rate limited, retry later',
  };

  return {
    status: res.status,
    submitted: Math.min(urls.length, 10000),
    accepted: res.status === 200 || res.status === 202,
    note: notes[res.status] || `unexpected status ${res.status}`,
  };
}

/**
 * End-to-end submission: locate the key, verify it is live, then submit.
 * Fails loudly rather than sending a call that would be silently rejected.
 */
export async function notify(
  siteUrl: string,
  urls: string[],
  cwd: string = process.cwd()
): Promise<IndexNowResult> {
  const found = findKey(cwd);
  if (!found) {
    return {
      status: 0,
      submitted: 0,
      accepted: false,
      note: 'no IndexNow key in the project — run ensureKey() and deploy the file first',
    };
  }

  if (!(await isKeyPublished(siteUrl, found.key))) {
    return {
      status: 0,
      submitted: 0,
      accepted: false,
      note: `key file not reachable at ${siteUrl}${found.publicPath} — deploy before submitting`,
    };
  }

  return submitUrls(siteUrl, urls, found.key);
}
