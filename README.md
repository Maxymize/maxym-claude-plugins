# MAXYM Skills Marketplace

> Curated collection of 21 productivity and development skills for Claude Code by [MAXYM](https://maxymizebusiness.com)

Most skills follow Anthropic's **Code Execution pattern** for **99%+ token reduction** — replacing traditional MCP servers with direct API connections.

## Quick Start

```bash
# 1. Register the marketplace
/plugin marketplace add Maxymize/maxym-claude-plugins

# 2. Install any plugin
/plugin install <plugin-name>@maxym-skills
```

## Plugin Catalog

### Code Execution Skills (API Direct Connection)

| Plugin | Description | Category |
|--------|-------------|----------|
| `convex-code-exec` | Convex API — projects, functions, env vars, schema | Database |
| `coolify-code-exec` | Coolify REST API — apps, deployments, servers | DevOps |
| `gsc-code-exec` | Google Search Console — analytics, URL inspection, SEO | SEO |
| `magic-ui-code-exec` | Magic UI animated components — landing pages, effects | UI |
| `nanobanana-image-code-exec` | Google Gemini 3 Pro — image generation and editing | AI/Images |
| `neon-code-exec` | Neon Serverless Postgres — branches, SQL, schema (27 tools) | Database |
| `openai-image-code-exec` | OpenAI DALL-E 3 — image generation and editing | AI/Images |
| `posthog-code-exec` | PostHog API — analytics, feature flags, experiments (45 tools) | Analytics |
| `railway-code-exec` | Railway GraphQL API — deploy, services, logs (50+ ops) | DevOps |
| `sentry-code-exec` | Sentry API — error tracking, issues, releases | Monitoring |
| `shadcn-vue-code-exec` | shadcn-vue components for Vue/Nuxt (Hybrid) | UI |
| `stack-auth-code-exec` | Stack Auth documentation and setup guides | Auth |
| `stripe-code-exec` | Stripe API — payments, subscriptions, invoices | Payments |
| `supabase-code-exec` | PostgreSQL/Supabase direct connection — SQL, schemas | Database |
| `veo-video-code-exec` | Google Veo 3.1 — AI video generation | AI/Video |

### Specialized Skills

| Plugin | Description | Category |
|--------|-------------|----------|
| `c15t-consent` | GDPR/CCPA consent management — cookie banners, privacy | Privacy |
| `infrastructure-analyzer` | Codebase analysis → infrastructure documentation | Docs |
| `react-flow-editor` | Interactive node-based diagram editors with React Flow | UI |

### Builder Skills

| Plugin | Description | Category |
|--------|-------------|----------|
| `code-execution-creator` | Convert MCP servers into Code Execution skills | Meta |
| `mcp-builder` | Create MCP servers (Python/TypeScript) | Meta |
| `skill-creator` | Create Claude Code skills | Meta |

## Install All Plugins

```bash
/plugin marketplace add Maxymize/maxym-claude-plugins

# Code Execution Skills
/plugin install convex-code-exec@maxym-skills
/plugin install coolify-code-exec@maxym-skills
/plugin install gsc-code-exec@maxym-skills
/plugin install magic-ui-code-exec@maxym-skills
/plugin install nanobanana-image-code-exec@maxym-skills
/plugin install neon-code-exec@maxym-skills
/plugin install openai-image-code-exec@maxym-skills
/plugin install posthog-code-exec@maxym-skills
/plugin install railway-code-exec@maxym-skills
/plugin install sentry-code-exec@maxym-skills
/plugin install shadcn-vue-code-exec@maxym-skills
/plugin install stack-auth-code-exec@maxym-skills
/plugin install stripe-code-exec@maxym-skills
/plugin install supabase-code-exec@maxym-skills
/plugin install veo-video-code-exec@maxym-skills

# Specialized Skills
/plugin install c15t-consent@maxym-skills
/plugin install infrastructure-analyzer@maxym-skills
/plugin install react-flow-editor@maxym-skills

# Builder Skills
/plugin install code-execution-creator@maxym-skills
/plugin install mcp-builder@maxym-skills
/plugin install skill-creator@maxym-skills
```

## What is Code Execution?

Based on [Anthropic's research](https://www.anthropic.com/engineering/code-execution-with-mcp), the Code Execution pattern replaces traditional MCP tool calls with direct API connections:

| Aspect | Traditional MCP | Code Execution |
|--------|-----------------|----------------|
| Tokens per request | ~5,000+ | ~200 |
| Tool definitions | Loaded upfront (~100K tokens) | On-demand |
| Batch operations | Sequential calls | Promise.all |
| Data processing | Through model context | Local processing |

**Result: 98.7% reduction in token consumption.**

## License

MIT

## Author

**MAXYM** — [maxymizebusiness.com](https://maxymizebusiness.com)
