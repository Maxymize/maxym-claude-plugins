# gsc-code-exec

SEO command centre across **Google Search Console**, **Bing Webmaster Tools** and **IndexNow**, with snapshot history and continuous improvement recommendations. 99%+ token reduction versus MCP servers.

## Category

SEO & Analytics

## What it does

**Operates** the search consoles: submit sitemaps, submit URLs for indexing, inspect index status, read performance and crawl health.

**Improves continuously**: every run writes a snapshot into the monitored project, compares it with the previous run, and reports what changed and what to do next. Re-invoking days later answers whether the last round of work actually moved anything.

It also runs technical checks against the live site that neither console reports: whether invented URLs wrongly answer 200 instead of 404, and how much content is served with JavaScript disabled, which is what AI assistant crawlers actually read.

## One thing worth knowing before planning indexing work

Google does not expose "Request indexing" through any API, so that step stays manual. Bing does expose it, and IndexNow reaches Bing, Yandex, Seznam and Naver in a single call without consuming Bing's quota. The skill automates everything that can be automated and hands you the exact shortlist for the part that cannot.

## Installation

```
/plugin marketplace add Maxymize/maxym-claude-plugins
/plugin install gsc-code-exec@maxym-skills
```

## Credentials

API keys are read at call time from the environment of the project being monitored — `GOOGLE_APPLICATION_CREDENTIALS` for Google, `BING_API_KEY` in the project `.env` for Bing. They are never stored in the skill, never printed, and never written into snapshots.

## Usage

Activates automatically when Claude Code detects a relevant task. See `skills/gsc-code-exec/SKILL.md` for setup, the full function reference and operating notes.

## License

MIT
