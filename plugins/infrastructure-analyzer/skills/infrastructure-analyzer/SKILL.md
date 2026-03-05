---
name: infrastructure-analyzer
description: Analyze project codebase and generate comprehensive infrastructure documentation in Markdown and HTML formats. Use when the user requests infrastructure analysis, technical documentation, stack overview, or architecture documentation for any software project (Next.js, Django, Rails, Go, Laravel, etc.). Generates professional, printable docs saved as Infrastructure_analysis_[projectname].md and .html in the docs/ folder.
---

# Infrastructure Analyzer

Generate comprehensive infrastructure analysis documentation for any software project.

## Overview

This skill analyzes a codebase to extract and document the complete technical infrastructure, producing professional documentation in both Markdown and HTML formats. The HTML version includes embedded CSS styling and is ready for PDF printing.

**Outputs:**
- `Infrastructure_analysis_[projectname].md` - Markdown version
- `Infrastructure_analysis_[projectname].html` - Print-ready HTML with embedded styling

**Documented components:**
- Technology stack (framework, language, dependencies with versions)
- Architecture diagram and system layers
- Database schema and relationships
- API endpoints and routes
- External integrations (payments, email, auth, analytics)
- Security implementation
- Performance optimization strategies
- Environment variables
- Deployment configuration

## Workflow

### Step 1: Identify Project Root

Determine the project root directory. If not explicitly provided, use the current working directory.

### Step 2: Run Codebase Analysis

Execute the analysis script to extract structured project data:

```bash
python3 scripts/analyze_codebase.py <project_root>
```

The script returns JSON containing:
- `project_name`: Project folder name
- `project_type`: frontend, backend, or fullstack
- `framework`: Next.js, Django, Rails, FastAPI, etc.
- `language`: JavaScript/TypeScript, Python, Ruby, Go, PHP, etc.
- `package_manager`: npm, pnpm, yarn, pip, bundler, etc.
- `dependencies`: Dictionary of package names → versions
- `database`: Detected database technology (PostgreSQL, MongoDB, Convex, etc.)
- `auth`: Authentication provider (NextAuth, Clerk, Convex Auth, etc.)
- `payment_providers`: Payment integrations (Stripe, PayPal, etc.)
- `email_providers`: Email services (Resend, SendGrid, etc.)
- `hosting`: Deployment platform (Netlify, Vercel, AWS, etc.)

### Step 3: Deep Codebase Analysis

Perform comprehensive analysis based on detected stack type. Consult `references/analysis_patterns.md` for stack-specific guidance.

**For Frontend Projects (Next.js, React, Vue):**
- Analyze `app/` or `pages/` structure for routing architecture
- Check `middleware.ts` for i18n/auth logic
- Identify UI library (shadcn/ui, MUI, Chakra UI, Tailwind)
- Document state management (Context API, Redux, Zustand, Jotai)
- Identify styling approach (Tailwind, CSS Modules, Styled Components)

**For Backend Projects (Django, Rails, Express, FastAPI, Go):**
- Read models/schema files for database structure
- Analyze routes/URLs for API endpoint documentation
- Identify ORM (Django ORM, ActiveRecord, Sequelize, GORM)
- Document middleware and authentication flow
- Check for background job processors (Celery, Sidekiq, Bull)

**Database Schema:**
- **Convex**: Read `convex/schema.ts`
- **Prisma**: Read `prisma/schema.prisma`
- **Django**: Read `*/models.py` files
- **Rails**: Read `db/schema.rb` or `app/models/`
- **Drizzle**: Read `drizzle/schema.ts`
- **Migrations**: Check `migrations/` or `db/migrate/` folders

**API Endpoints:**
- **Next.js**: `app/api/` (App Router) or `pages/api/` (Pages Router)
- **Django**: `*/urls.py` + `*/views.py` files
- **Rails**: `config/routes.rb`
- **Express**: `routes/` folder or `app.js`/`server.js`
- **FastAPI**: `routers/` folder or `main.py`
- **Laravel**: `routes/web.php` and `routes/api.php`

**Environment Variables:**
- Read `.env.example`, `.env.local`, or `.env.template`
- List all required API keys and configuration variables
- Document environment-specific configurations

**Deployment Detection:**
- **Netlify**: `netlify.toml` file
- **Vercel**: `vercel.json` or `.vercel/` folder
- **Docker**: `Dockerfile`, `docker-compose.yml`
- **Heroku**: `Procfile`
- **AWS**: `.aws/` folder, `serverless.yml`

### Step 4: Generate Markdown Documentation

Create `Infrastructure_analysis_[projectname].md` with these sections:

```markdown
# [Project Name] - Infrastructure Analysis

> Technical review document - [Version] ([Date])

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | [Framework] | [Version] |
| UI | [Library] | [Version] |
| Backend | [Service/Framework] | [Version] |
| Database | [Database] | [Version] |
| Auth | [Provider] | [Version] |
| Payments | [Provider] | [Version] |
| Email | [Service] | [Version] |
| Hosting | [Platform] | - |
| Language | [Language] | [Version] |

---

## Architecture

```
[ASCII diagram showing system architecture layers and data flow]
Use appropriate pattern from references/analysis_patterns.md
```

---

## Database Schema

### Main Tables
| Table | Purpose | Relationships |
|-------|---------|---------------|
| `table_name` | Description | → related_tables |

### [Additional schema details as needed]

---

## API Endpoints

### Mutations/Routes (Write Operations)
| Function/Route | Description |
|----------------|-------------|
| `endpoint_name` | What it does |

### Queries/Routes (Read Operations)
| Function/Route | Description |
|----------------|-------------|
| `endpoint_name` | What it does |

---

## Frontend Structure

```
app/[locale]/
├── (group)/       # Description
├── folder/        # Description
└── page.tsx       # Description
```

### Key Components
- `path/to/component.tsx` - Description
- Component organization and patterns

---

## External Integrations

### [Service Name]
- **Purpose**: What it's used for
- **Integration**: How it's integrated
- **Configuration**: Key settings

---

## Security

| Aspect | Implementation |
|--------|----------------|
| Auth | [Solution description] |
| Session | [Session handling] |
| Headers | [Security headers] |
| Encryption | [Data encryption approach] |
| CORS | [CORS configuration] |

---

## Performance

- **Caching**: [Strategy description]
- **CDN**: [CDN usage]
- **Images**: [Optimization approach]
- **Bundle**: [Bundle optimization]
- **Database**: [Indexing strategy]

---

## Environment Variables

```env
# Category
VARIABLE_NAME=...

# API Keys
SERVICE_API_KEY=...
```

---

## Dependencies

```json
{
  "package": "version",
  "key-dependency": "version"
}
```

---

## Strengths & Areas for Improvement

**Strengths:**
- [Positive architectural decisions]
- [Well-implemented features]

**Areas for Improvement:**
- [Potential enhancements]
- [Technical debt considerations]

---

*Generated: [Date]*
```

### Step 5: Generate HTML Documentation

1. Read the HTML template from `assets/html_template.html`
2. Convert Markdown sections to HTML
3. Replace template placeholders:
   - `{{PROJECT_NAME}}` → Detected project name
   - `{{VERSION}}` → Version from package.json or "v1.0.0"
   - `{{DATE}}` → Current date (e.g., "December 27, 2025")
   - `{{CONTENT}}` → HTML-converted markdown sections

**HTML Structure Guidelines:**

- **Tables**: Use semantic `<table>` with `<th>` and `<td>` tags
- **Architecture Diagrams**: Wrap in `<div class="diagram">...</div>` to preserve ASCII art formatting
- **Cards**: Use `<div class="card-grid">` with `<div class="card">` for integrations section
- **Code Blocks**: Use `<pre>...</pre>` for multiline code, `<code>...</code>` for inline
- **Badges**: Use `<span class="badge [color]">...</span>` for version tags
  - Colors: `pink`, `purple`, `blue`, `green`, `orange`
- **Environment Variables**: Wrap in `<div class="env-block">` with syntax highlighting

**Section-Specific HTML:**

```html
<!-- Tech Stack Table -->
<h2>Tech Stack</h2>
<table>
  <tr>
    <th>Layer</th>
    <th>Technology</th>
    <th>Version</th>
  </tr>
  <tr>
    <td>Frontend</td>
    <td>Next.js</td>
    <td><span class="badge pink">15.5.7</span></td>
  </tr>
</table>

<!-- Architecture Diagram -->
<h2>Architecture</h2>
<div class="diagram">
┌─────────────────────────────────────┐
│         System Architecture         │
└─────────────────────────────────────┘
</div>

<!-- Integration Cards -->
<h2>External Integrations</h2>
<div class="card-grid">
  <div class="card">
    <h4>Service Name</h4>
    <p>Description of integration</p>
  </div>
  <div class="card purple">
    <h4>Another Service</h4>
    <p>Description</p>
  </div>
</div>
```

### Step 6: Save Files

Save both documentation files to the appropriate directory:

1. Check if `docs/` folder exists in project root
2. **If `docs/` exists**: Save files to `docs/Infrastructure_analysis_[projectname].md` and `.html`
3. **If `docs/` does not exist**: Save files to project root: `Infrastructure_analysis_[projectname].md` and `.html`

Inform the user upon completion:

```
✅ Infrastructure analysis complete!

Generated files:
- docs/Infrastructure_analysis_[projectname].md
- docs/Infrastructure_analysis_[projectname].html (ready for PDF printing)
```

## Quality Standards

### Completeness
- All major stack components documented
- All external integrations listed with purpose and configuration
- All API endpoints cataloged with descriptions
- Database schema fully mapped with relationships
- Security measures explicitly documented

### Clarity
- Use clear, accessible language
- Define technical acronyms on first use
- Provide context for architectural decisions
- Include examples where helpful

### Visual Appeal (HTML)
- Professional gradient headers (pink → purple)
- Alternating row colors in tables for readability
- Color-coded version badges
- ASCII architecture diagrams in styled containers
- Print-optimized layout (A4/Letter page size)

### Accuracy
- Verify versions directly from package files
- Cross-reference detected services with actual usage in code
- Validate API routes against actual implementation
- Ensure environment variables match actual requirements

## Edge Cases

### Monorepo / Multi-Stack Projects

If the project contains multiple applications (e.g., `apps/frontend/`, `apps/backend/`, `packages/`):

1. Ask the user: "This appears to be a monorepo. Would you like analysis for:
   - A specific component (e.g., frontend only)
   - Combined documentation showing full architecture
   - Separate docs for each component"
2. Run analysis on requested components
3. For combined docs, create unified architecture diagram showing all components

### Missing or Undetected Information

When key information cannot be automatically detected:
- Mark as "Not detected - manual verification recommended" in tables
- Add ⚠️ warning icon in HTML version
- Suggest manual review in relevant sections

### Large Codebases

For projects with 100+ dependencies:
- List top 20-30 most important dependencies in main documentation
- Add note: "See package.json for complete dependency list"
- Focus on production dependencies over dev dependencies

### Legacy or Unusual Stack Configurations

If the detection script doesn't recognize the stack:
- Proceed with manual analysis
- Document what was found through file inspection
- Note: "Stack: Custom configuration - see dependency list"

## Example Usage

**User Request:**
> "Analyze the infrastructure of my Next.js project and create documentation"

**Agent Response:**
1. Run `python3 scripts/analyze_codebase.py .`
2. Analyze additional Next.js-specific files (middleware, app structure)
3. Generate both .md and .html documents
4. Save to `docs/` folder
5. Report completion with file paths

**User Request:**
> "I need technical documentation for this Django API"

**Agent Response:**
1. Detect Django project structure
2. Analyze models, URLs, views, settings
3. Document REST framework configuration if present
4. Generate documentation with Django-specific sections
5. Save and report completion

## Resources

This skill includes bundled resources in three categories:

### scripts/
- `analyze_codebase.py` - Automated codebase analysis to extract project metadata, dependencies, and integrations

### references/
- `analysis_patterns.md` - Stack-specific analysis patterns, architecture diagram templates, and detection heuristics for different frameworks

### assets/
- `html_template.html` - Professional HTML template with embedded CSS styling, ready for PDF printing
