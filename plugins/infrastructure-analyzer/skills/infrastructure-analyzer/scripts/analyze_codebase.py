#!/usr/bin/env python3
"""
Analyzes a codebase to extract infrastructure information.
Detects tech stack, dependencies, frameworks, and generates structured data.
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Any, Optional


def detect_project_type(project_root: Path) -> Dict[str, Any]:
    """Detect the primary project type and framework."""
    project_info = {
        "type": "unknown",
        "framework": None,
        "language": None,
        "package_manager": None
    }

    # JavaScript/TypeScript projects
    if (project_root / "package.json").exists():
        try:
            with open(project_root / "package.json", "r") as f:
                pkg = json.load(f)
                deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}

                if "next" in deps:
                    project_info.update({"type": "frontend", "framework": "Next.js", "language": "JavaScript/TypeScript"})
                elif "react" in deps and "react-dom" in deps:
                    project_info.update({"type": "frontend", "framework": "React", "language": "JavaScript/TypeScript"})
                elif "vue" in deps:
                    project_info.update({"type": "frontend", "framework": "Vue.js", "language": "JavaScript/TypeScript"})
                elif "express" in deps:
                    project_info.update({"type": "backend", "framework": "Express.js", "language": "JavaScript/TypeScript"})
                elif "nestjs" in deps or "@nestjs/core" in deps:
                    project_info.update({"type": "backend", "framework": "NestJS", "language": "TypeScript"})

                if (project_root / "pnpm-lock.yaml").exists():
                    project_info["package_manager"] = "pnpm"
                elif (project_root / "yarn.lock").exists():
                    project_info["package_manager"] = "yarn"
                elif (project_root / "package-lock.json").exists():
                    project_info["package_manager"] = "npm"
        except Exception:
            pass

    # Python projects
    if (project_root / "requirements.txt").exists() or (project_root / "pyproject.toml").exists():
        project_info["language"] = "Python"
        if (project_root / "manage.py").exists():
            project_info.update({"type": "backend", "framework": "Django"})
        elif (project_root / "app.py").exists() or any((project_root / "app").glob("*.py")):
            # Check for Flask
            try:
                if (project_root / "requirements.txt").exists():
                    with open(project_root / "requirements.txt", "r") as f:
                        reqs = f.read()
                        if "flask" in reqs.lower():
                            project_info.update({"type": "backend", "framework": "Flask"})
                        elif "fastapi" in reqs.lower():
                            project_info.update({"type": "backend", "framework": "FastAPI"})
            except Exception:
                pass

        project_info["package_manager"] = "pip"

    # Ruby projects
    if (project_root / "Gemfile").exists():
        project_info.update({"language": "Ruby", "package_manager": "bundler"})
        if (project_root / "config.ru").exists() or (project_root / "config" / "application.rb").exists():
            project_info.update({"type": "backend", "framework": "Ruby on Rails"})

    # Go projects
    if (project_root / "go.mod").exists():
        project_info.update({"language": "Go", "package_manager": "go modules"})
        project_info["type"] = "backend"

    # PHP projects
    if (project_root / "composer.json").exists():
        project_info.update({"language": "PHP", "package_manager": "composer"})
        try:
            with open(project_root / "composer.json", "r") as f:
                composer = json.load(f)
                deps = {**composer.get("require", {}), **composer.get("require-dev", {})}
                if "laravel/framework" in deps:
                    project_info.update({"type": "backend", "framework": "Laravel"})
                elif "symfony/symfony" in deps:
                    project_info.update({"type": "backend", "framework": "Symfony"})
        except Exception:
            pass

    # Java/Kotlin projects
    if (project_root / "pom.xml").exists():
        project_info.update({"language": "Java", "package_manager": "maven"})
        project_info["type"] = "backend"
    elif (project_root / "build.gradle").exists() or (project_root / "build.gradle.kts").exists():
        project_info.update({"language": "Java/Kotlin", "package_manager": "gradle"})
        project_info["type"] = "backend"

    return project_info


def extract_dependencies(project_root: Path, project_type: str) -> Dict[str, str]:
    """Extract dependencies with versions."""
    deps = {}

    # JavaScript/TypeScript
    if (project_root / "package.json").exists():
        try:
            with open(project_root / "package.json", "r") as f:
                pkg = json.load(f)
                all_deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
                for name, version in all_deps.items():
                    deps[name] = version.lstrip("^~")
        except Exception:
            pass

    # Python
    if (project_root / "requirements.txt").exists():
        try:
            with open(project_root / "requirements.txt", "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        match = re.match(r"([a-zA-Z0-9_-]+)([=><]+)?([\d.]+)?", line)
                        if match:
                            pkg_name, _, version = match.groups()
                            deps[pkg_name] = version or "latest"
        except Exception:
            pass

    return deps


def detect_database(project_root: Path, dependencies: Dict[str, str]) -> Optional[Dict[str, str]]:
    """Detect database technology."""
    db_info = None

    # Check dependencies for database drivers
    db_keywords = {
        "postgresql": ["pg", "psycopg2", "postgres"],
        "mysql": ["mysql", "mysql2", "pymysql"],
        "mongodb": ["mongodb", "mongoose", "pymongo"],
        "redis": ["redis", "ioredis"],
        "sqlite": ["sqlite", "sqlite3"],
        "convex": ["convex"],
        "supabase": ["supabase"],
        "firebase": ["firebase"],
    }

    for db_name, keywords in db_keywords.items():
        for dep in dependencies.keys():
            if any(kw in dep.lower() for kw in keywords):
                db_info = {"type": db_name, "driver": dep}
                break
        if db_info:
            break

    # Check for environment variables
    env_files = [".env", ".env.local", ".env.example"]
    for env_file in env_files:
        env_path = project_root / env_file
        if env_path.exists():
            try:
                with open(env_path, "r") as f:
                    content = f.read()
                    if "DATABASE_URL" in content or "DB_HOST" in content:
                        if not db_info:
                            db_info = {"type": "detected via env vars"}
                        db_info["env_configured"] = True
            except Exception:
                pass

    return db_info


def detect_auth(dependencies: Dict[str, str]) -> Optional[Dict[str, str]]:
    """Detect authentication solution."""
    auth_keywords = {
        "NextAuth.js": ["next-auth"],
        "Auth0": ["auth0"],
        "Firebase Auth": ["firebase"],
        "Clerk": ["@clerk/"],
        "Supabase Auth": ["@supabase/"],
        "Passport": ["passport"],
        "JWT": ["jsonwebtoken", "jwt"],
        "Convex Auth": ["@convex-dev/auth"],
        "Stack Auth": ["@stackframe/"],
    }

    for auth_name, keywords in auth_keywords.items():
        for dep in dependencies.keys():
            if any(kw in dep for kw in keywords):
                return {"provider": auth_name, "package": dep}

    return None


def detect_payment_providers(dependencies: Dict[str, str]) -> List[Dict[str, str]]:
    """Detect payment integrations."""
    providers = []

    payment_keywords = {
        "Stripe": ["stripe"],
        "PayPal": ["paypal"],
        "Square": ["square"],
        "Braintree": ["braintree"],
    }

    for provider_name, keywords in payment_keywords.items():
        for dep in dependencies.keys():
            if any(kw in dep.lower() for kw in keywords):
                providers.append({"provider": provider_name, "package": dep})
                break

    return providers


def detect_email_providers(dependencies: Dict[str, str]) -> List[Dict[str, str]]:
    """Detect email service integrations."""
    providers = []

    email_keywords = {
        "Resend": ["resend"],
        "SendGrid": ["sendgrid"],
        "Mailgun": ["mailgun"],
        "Postmark": ["postmark"],
        "Nodemailer": ["nodemailer"],
    }

    for provider_name, keywords in email_keywords.items():
        for dep in dependencies.keys():
            if any(kw in dep.lower() for kw in keywords):
                providers.append({"provider": provider_name, "package": dep})
                break

    return providers


def detect_hosting(project_root: Path) -> Optional[str]:
    """Detect hosting platform."""
    hosting_indicators = {
        "Netlify": ["netlify.toml", "netlify"],
        "Vercel": ["vercel.json", ".vercel"],
        "AWS": [".aws", "serverless.yml"],
        "Heroku": ["Procfile"],
        "Docker": ["Dockerfile", "docker-compose.yml"],
    }

    for platform, files in hosting_indicators.items():
        for file_indicator in files:
            if (project_root / file_indicator).exists():
                return platform

    return None


def analyze_project(project_root: str) -> Dict[str, Any]:
    """Main analysis function."""
    root = Path(project_root)

    project_info = detect_project_type(root)
    dependencies = extract_dependencies(root, project_info["type"])

    analysis = {
        "project_root": str(root.resolve()),
        "project_name": root.name,
        "project_type": project_info["type"],
        "framework": project_info["framework"],
        "language": project_info["language"],
        "package_manager": project_info["package_manager"],
        "dependencies": dependencies,
        "database": detect_database(root, dependencies),
        "auth": detect_auth(dependencies),
        "payment_providers": detect_payment_providers(dependencies),
        "email_providers": detect_email_providers(dependencies),
        "hosting": detect_hosting(root),
    }

    return analysis


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python analyze_codebase.py <project_root>")
        sys.exit(1)

    project_root = sys.argv[1]
    result = analyze_project(project_root)
    print(json.dumps(result, indent=2))
