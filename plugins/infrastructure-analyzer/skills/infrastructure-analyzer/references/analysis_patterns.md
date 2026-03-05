# Infrastructure Analysis Patterns

This document provides analysis patterns for different technology stacks to ensure comprehensive and consistent infrastructure documentation.

## Table of Contents
- [Next.js / React Projects](#nextjs--react-projects)
- [Django Projects](#django-projects)
- [Ruby on Rails Projects](#ruby-on-rails-projects)
- [Express.js / Node.js Projects](#expressjs--nodejs-projects)
- [Laravel / PHP Projects](#laravel--php-projects)
- [Go Projects](#go-projects)
- [FastAPI / Flask Projects](#fastapi--flask-projects)

---

## Next.js / React Projects

### Key Files to Analyze
- `package.json` - Dependencies and scripts
- `next.config.js` / `next.config.mjs` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS setup
- `.env.example` / `.env.local` - Environment variables
- `app/` or `pages/` - Routing structure
- `middleware.ts` - Middleware (auth, i18n)
- `convex/`, `supabase/`, `prisma/` - Backend integration folders

### Stack Components to Document
1. **Frontend Framework**: Next.js version, App Router vs Pages Router
2. **UI Library**: React version, component library (shadcn/ui, MUI, Chakra)
3. **Styling**: Tailwind, CSS Modules, Styled Components
4. **State Management**: Context API, Redux, Zustand, Jotai
5. **Backend Integration**: Convex, Supabase, Firebase, tRPC
6. **Database**: PostgreSQL (via Prisma/Drizzle), MongoDB, Convex DB
7. **Auth**: NextAuth.js, Clerk, Auth0, Supabase Auth, Convex Auth
8. **API Routes**: `/app/api/` or `/pages/api/`
9. **Deployment**: Vercel, Netlify, AWS Amplify

### Architecture Diagram Pattern
```
┌─────────────────────────────────────────────────────────────┐
│                    CDN (Vercel/Netlify)                     │
├─────────────────────────────────────────────────────────────┤
│  Next.js (SSR/SSG)         │  API Routes / Serverless Fns  │
│  ├─ App Router/Pages       │  └─ /api/* endpoints          │
│  ├─ React Components       │                               │
│  └─ Middleware             │                               │
├─────────────────────────────────────────────────────────────┤
│              Backend Service (Convex/Supabase/etc)          │
│  ├─ Database               ├─ Auth                          │
│  ├─ Real-time subscriptions└─ Storage                       │
│  └─ Server Actions                                          │
├─────────────────────────────────────────────────────────────┤
│  Payment   │  Email        │  Analytics    │  Monitoring   │
└─────────────────────────────────────────────────────────────┘
```

---

## Django Projects

### Key Files to Analyze
- `requirements.txt` / `pyproject.toml` - Python dependencies
- `settings.py` - Django configuration
- `urls.py` - URL routing
- `models.py` - Database models
- `manage.py` - Django CLI
- `wsgi.py` / `asgi.py` - WSGI/ASGI config
- `.env` - Environment variables

### Stack Components to Document
1. **Framework**: Django version
2. **Database**: PostgreSQL, MySQL, SQLite (via ORM)
3. **ORM**: Django ORM
4. **Auth**: Django Auth, django-allauth, Social Auth
5. **API**: Django REST Framework, GraphQL
6. **Task Queue**: Celery + Redis/RabbitMQ
7. **Cache**: Redis, Memcached
8. **Static Files**: WhiteNoise, S3
9. **Deployment**: Heroku, AWS (Elastic Beanstalk), DigitalOcean

### Architecture Diagram Pattern
```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer / CDN                      │
├─────────────────────────────────────────────────────────────┤
│  Django Application (WSGI/ASGI)                            │
│  ├─ Views / Templates      │  ├─ Django REST Framework     │
│  ├─ Middleware             │  └─ GraphQL (optional)        │
│  └─ URL Routing            │                               │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL/MySQL          │  Redis (Cache + Queue)        │
├─────────────────────────────────────────────────────────────┤
│  Celery Workers            │  Static Files (S3/CDN)        │
└─────────────────────────────────────────────────────────────┘
```

---

## Ruby on Rails Projects

### Key Files to Analyze
- `Gemfile` - Ruby gem dependencies
- `config/routes.rb` - Routing
- `config/database.yml` - Database config
- `config/application.rb` - Application settings
- `app/models/` - ActiveRecord models
- `app/controllers/` - Controllers
- `app/views/` - ERB templates

### Stack Components to Document
1. **Framework**: Rails version, Ruby version
2. **Database**: PostgreSQL, MySQL (via ActiveRecord)
3. **ORM**: ActiveRecord
4. **Auth**: Devise, Clearance
5. **Background Jobs**: Sidekiq, Resque
6. **API**: Rails API mode, Grape
7. **Frontend**: Hotwire/Turbo, Stimulus, React (via Webpacker)
8. **Deployment**: Heroku, AWS, Render

---

## Express.js / Node.js Projects

### Key Files to Analyze
- `package.json` - Dependencies
- `server.js` / `app.js` - Entry point
- `routes/` - Route definitions
- `models/` - Database models
- `middlewares/` - Custom middleware

### Stack Components to Document
1. **Framework**: Express.js version, Node.js version
2. **Database**: MongoDB (Mongoose), PostgreSQL (Sequelize/Knex)
3. **Auth**: Passport.js, JWT
4. **Template Engine**: EJS, Pug, Handlebars (if SSR)
5. **API**: RESTful, GraphQL (Apollo Server)
6. **Deployment**: Heroku, AWS Lambda, DigitalOcean

---

## Laravel / PHP Projects

### Key Files to Analyze
- `composer.json` - PHP dependencies
- `config/` - Configuration files
- `routes/web.php` - Web routes
- `routes/api.php` - API routes
- `app/Models/` - Eloquent models
- `.env.example` - Environment variables

### Stack Components to Document
1. **Framework**: Laravel version, PHP version
2. **Database**: MySQL, PostgreSQL (via Eloquent ORM)
3. **Auth**: Laravel Auth, Sanctum, Passport
4. **Queue**: Laravel Queue, Redis, Beanstalkd
5. **Cache**: Redis, Memcached
6. **Frontend**: Blade templates, Inertia.js, Livewire
7. **Deployment**: Laravel Forge, AWS, Vapor

---

## Go Projects

### Key Files to Analyze
- `go.mod` - Go module dependencies
- `main.go` - Entry point
- `cmd/` - Command-line tools
- `internal/` - Internal packages
- `api/` - API handlers

### Stack Components to Document
1. **Language**: Go version
2. **Framework**: Gin, Echo, Fiber, Chi (or standard library)
3. **Database**: PostgreSQL, MySQL (via GORM, sqlx)
4. **API**: RESTful, gRPC, GraphQL
5. **Deployment**: Docker, Kubernetes, AWS ECS

---

## FastAPI / Flask Projects

### Key Files to Analyze
- `requirements.txt` / `pyproject.toml` - Dependencies
- `main.py` / `app.py` - Entry point
- `models.py` - Pydantic/SQLAlchemy models
- `routers/` - API routes (FastAPI)
- `blueprints/` - Blueprints (Flask)

### Stack Components to Document
1. **Framework**: FastAPI or Flask version, Python version
2. **Database**: PostgreSQL, MySQL (via SQLAlchemy)
3. **ORM**: SQLAlchemy, Tortoise ORM
4. **Auth**: OAuth2, JWT
5. **API**: RESTful, GraphQL (Strawberry, Ariadne)
6. **ASGI/WSGI**: Uvicorn, Gunicorn, Hypercorn
7. **Deployment**: Docker, AWS Lambda, Heroku

---

## Common Sections Across All Stacks

### Standard Documentation Sections

1. **Tech Stack Table**
   - Framework, Language, Version
   - Database, ORM
   - Auth solution
   - Payment provider
   - Email provider
   - Hosting platform

2. **Architecture Diagram**
   - ASCII art diagram showing layers
   - Frontend → Backend → Database → External Services

3. **Database Schema**
   - List of tables/collections
   - Key relationships
   - Indexes

4. **API Endpoints**
   - RESTful routes or GraphQL schema
   - HTTP methods
   - Authentication requirements

5. **Frontend Structure**
   - Directory layout
   - Key components
   - Routing strategy

6. **External Integrations**
   - Payment (Stripe, PayPal)
   - Email (Resend, SendGrid)
   - Auth (Auth0, Clerk)
   - Analytics (Google Analytics, Plausible)
   - Monitoring (Sentry, Datadog)

7. **Security**
   - Auth implementation
   - Session management
   - CORS configuration
   - Security headers
   - Data encryption

8. **Performance**
   - Caching strategy
   - CDN usage
   - Database indexing
   - Image optimization

9. **Environment Variables**
   - Required env vars
   - API keys
   - Database URLs

10. **Dependencies**
    - Key dependencies with versions
    - Production vs development dependencies

11. **Deployment**
    - Hosting platform
    - CI/CD pipeline
    - Environment setup

---

## Detection Heuristics

### Database Detection
- **PostgreSQL**: `pg`, `psycopg2`, `postgres`, `DATABASE_URL` with `postgres://`
- **MySQL**: `mysql`, `mysql2`, `pymysql`, `DATABASE_URL` with `mysql://`
- **MongoDB**: `mongodb`, `mongoose`, `pymongo`, `MONGO_URI`
- **SQLite**: `sqlite`, `sqlite3`, `db.sqlite3`
- **Convex**: `convex` package, `CONVEX_DEPLOYMENT`
- **Supabase**: `@supabase/` packages, `SUPABASE_URL`

### Auth Detection
- **NextAuth.js**: `next-auth` package
- **Clerk**: `@clerk/` packages
- **Auth0**: `auth0` package
- **Supabase Auth**: `@supabase/auth-*`
- **Convex Auth**: `@convex-dev/auth`
- **Django Auth**: `django.contrib.auth`
- **Devise**: `devise` gem

### Payment Detection
- **Stripe**: `stripe` package, `STRIPE_SECRET_KEY`
- **PayPal**: `paypal` package
- **Square**: `square` package

### Email Detection
- **Resend**: `resend` package
- **SendGrid**: `sendgrid` package
- **Mailgun**: `mailgun` package
- **Nodemailer**: `nodemailer` package

### Hosting Detection
- **Netlify**: `netlify.toml`, `netlify/` folder
- **Vercel**: `vercel.json`, `.vercel/` folder
- **Heroku**: `Procfile`
- **AWS**: `.aws/`, `serverless.yml`
- **Docker**: `Dockerfile`, `docker-compose.yml`
