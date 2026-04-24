# CLAUDE.md - Development Context & Guidelines

This file contains essential context and guidelines for Claude instances working on this project.

**Key workflow reminders:**

- The product is called **Windrose**. `pg-weather` is the repository / directory / `package.json` `name` slug only — never use it as a display name in user-facing copy, page titles, README, or marketing.
- Never try to run the local dev server. The Human is always running it in another tab on port 3000.
- Always test your work with the /browse skill to confirm it works as expected.
- This project uses JSX for it's template engine but it is NOT a React (client) project.
- When trying different approaches for a given problem, always go back and remove or refactor.
- Use code comments sparingly. Save them for when the extra context is really needed.

## Design System

Always read `DESIGN.md` before making any visual or UI decisions. All font choices, colors, spacing, border radius, and aesthetic direction are defined there. Do not deviate without explicit user approval. In QA mode, flag any code that doesn't match `DESIGN.md`.

## General codebase notes

### Code Quality Standards

**STRICT LINTING ENFORCED:**

ALWAYS check for TS errors and linting issues before finishing a work loop (`bun run check`)

- **Zero warnings allowed** (`--max-warnings 0`)
- **No "any" types allowed** (`noExplicitAny: error`)
- **No console statements allowed** (`noConsole: error`) — use `log` from `src/server/services/logger.ts` instead
- **No unsafe writes**

### Package Management

- Uses `bun` as the package manager (not npm, pnpm or yarn)
- Lock file: `bun.lock`

## Architecture Decisions

### Code Quality Tools

- **Biome**: Code linting for TypeScript
- **Prettier**: Code formatting with consistent style
- **TypeScript**: Strict mode enabled for type safety

### No Web Components

Shadow DOM and custom element lifecycles can't be tested without browser-level infrastructure (happy-dom, Puppeteer, etc.). Prefer pure functions for logic and Preact islands for client-side interactivity — both are testable with `bun:test`.

### Testing Strategies by Module Type

ALWAYS run test suites via the `package.json` *test scripts* so the env vars are correct.
NEVER try to roll your own lint or test commands.

**API Controllers** (`src/server/controllers/api/*.test.ts`):
- Mock service layer dependencies only
- Test actual HTTP Response objects (status codes, headers, JSON content)
- Focus on request/response handling and error scenarios

**View Controllers** (`src/server/controllers/app/*.test.ts`):
- Mock service layer dependencies only  
- Test actual HTML output using `renderToString()`
- Verify specific content appears in rendered HTML
- Test redirect responses with actual status codes and Location headers

**Services** (`src/server/services/*.test.ts`):
- Use real PostgreSQL database for testing with .env.test configuration
- Test complete CRUD operations with actual SQL queries
- Use table truncation and cleanup for test isolation

**Test Utilities** (`src/server/test-utils/*.ts`):
- Unit test adapters and helper functions directly
- Focus on input/output transformations
- Test edge cases and error handling

**Client Scripts** (`src/client/**/*.test.ts`):
- Use happy-dom for DOM globals (auto-loaded via bunfig.toml prelude)
- Set up DOM fixtures matching server-rendered HTML in `beforeEach`
- Clean up with `document.body.innerHTML = ""` in `afterEach`
- Call `init()` and assert DOM state changes
- For Preact components, render into a container and assert output
- Use dynamic imports for page init functions to get fresh module context (avoid top-level imports with module caching)

### Best Practices

- **Test user interactions**: Focus on user behavior rather than implementation
- **Authenticated contexts**: Test components with guest and logged-in users
- **Error scenarios**: Test error handling and edge cases

## Architecture Patterns

### Server-side Rendering Flow

- Data fetched synchronously in route handlers is always available before template renders
- No need for loading states when data is fetched server-side before rendering
- Routes return Response objects with proper headers, not JSX elements directly
- Templates receive fully resolved data as props

### Server Startup

- Migrations run automatically on startup (`await runMigrations()` before `Bun.serve()`)
- If a migration fails, the server won't start (fail-safe)
- No need to run migrations manually before starting the server

### Logging

- Use `log.info(category, message)`, `log.warn(...)`, `log.error(...)` from `src/server/services/logger.ts`
- Never use `console.*` directly in server code — Biome enforces `noConsole: error`
- CLI scripts (`cli.ts`, `bootstrap.ts`) and test files are exempt from this rule
- Output format: `[LEVEL] [category] message` — goes to stdout/stderr for platform capture

### Service Layer Abstraction

- Business logic should live in `/src/server/services/` directory
- Services provide single source of truth for data operations
- Services should be pure functions when possible for easier testing
- Services can be shared across both API and view routes
- Example: `analytics.ts` service for visitor stats and analytics

### Type Safety Across Layers

- Export types from service modules alongside functions
- Import and use service types in templates for consistency
- Avoid duplicating type definitions across files
- Maintain type safety from service → route → template
- Example: `VisitorStats` type exported from analytics service

## Routing Structure

### Route Organization

- Separate API routes (`/src/server/routes/api.ts`) and view routes (`/src/server/routes/app.tsx`)
- Routes use Bun's native `routes: {}` configuration for better performance
- API routes return JSON responses using `Response.json()`
- View routes render HTML using `renderToString()` wrapped in Response objects
- Both route types can share services for business logic

### Route Handler Patterns

- API routes: `(req) => Response | Promise<Response>`
- View routes: `(req) => Response` (after fetching data from services)
- Avoid circular dependencies between routes (don't fetch API routes from view routes)
- Use services to share logic between different route types

## Project Structure

### Directory Layout

```
src/
├── client/                        # Browser-side code
│   ├── main.ts                    # Entry point — routes to page init functions
│   ├── style.css                  # Global styles (CSS entry point)
│   ├── components/                # Reusable client components (CSS)
│   │   ├── nav.css
│   │   └── layout.css
│   └── pages/                     # Page-specific JS & CSS (co-located)
│       ├── home.ts / home.css
│       ├── about.ts / about.css
│       └── contact.ts / contact.css
│
├── server/                        # Server-side code (Bun/TypeScript)
│   ├── main.ts                    # Server entry point
│   ├── routes/
│   │   ├── app.tsx                # View route map
│   │   └── api.ts                 # API route map
│   ├── controllers/               # Route handlers (grouped by domain)
│   │   ├── app/                   # View controllers — return HTML
│   │   ├── api/                   # API controllers — return JSON
│   │   └── auth/                  # Auth controllers — login/logout flows
│   ├── templates/                 # Full-page JSX templates
│   ├── components/                # Reusable server JSX components
│   ├── services/                  # Business logic & data access
│   ├── middleware/                # HTTP middleware (auth, CSRF)
│   ├── utils/                     # Shared utilities (response, crypto, etc.)
│   ├── database/
│   │   ├── cli.ts / migrate.ts    # Migration tooling
│   │   └── migrations/            # Numbered migration files
│   └── test-utils/                # Test infrastructure (setup, factories, helpers)
│
└── types/                         # Global TypeScript type declarations
```

### Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| Files & directories | kebab-case | `route-handler.ts`, `test-utils/` |
| JSX component exports | PascalCase | `Home`, `Layout`, `CsrfField` |
| Controller namespace exports | camelCase | `home`, `examplesApi`, `login` |
| Service functions | camelCase | `getExamples`, `createCsrfToken` |
| Type exports | PascalCase | `Example`, `VisitorStats`, `AuthContext` |
| Migrations | `NNN_snake_case.ts` | `001_initial_setup.ts` |
| Test files | Co-located `.test.ts` | `home.test.ts` next to `home.tsx` |

**Controller barrel export naming:** App controllers export plain names (`home`, `about`). API controllers use an `Api` suffix (`examplesApi`, `statsApi`) to disambiguate when both domains share a resource name.

### How Files Connect (Adding a New Page)

To add a new page called "dashboard", create files in this order:

1. **Service** (if it needs data): `src/server/services/dashboard.ts`
   - Export functions and types
2. **Template**: `src/server/templates/dashboard.tsx`
   - Import types from service, accept data as props
   - Wrap in `<Layout title="Dashboard" name="dashboard">`
3. **Controller**: `src/server/controllers/app/dashboard.tsx`
   - Import service functions and template
   - Fetch data, pass to template via `render(<Dashboard ... />)`
   - Export as `const dashboard = { index(req) { ... } }`
4. **Barrel export**: Add `export { dashboard } from "./dashboard"` to `controllers/app/index.ts`
5. **Route**: Add `"/dashboard": dashboard.index` to `routes/app.tsx`
6. **Client JS** (if interactive): `src/client/pages/dashboard.ts`
   - Export an `init()` function
   - Register it in `src/client/main.ts`
7. **Client CSS** (if page-specific styles): `src/client/pages/dashboard.css`
8. **Test**: `src/server/controllers/app/dashboard.test.ts`

For an **API endpoint**, the flow is similar but skips templates:
1. Service → 2. Controller in `controllers/api/` → 3. Barrel export with `Api` suffix → 4. Route in `routes/api.ts` → 5. Test

### Key Patterns

- **Routes** are thin — they only map URL paths to controller methods
- **Controllers** orchestrate: fetch from services, then render templates or return JSON
- **Services** own all business logic and data access — controllers never query the DB directly
- **Templates** are pure presentation — they receive fully resolved data as props
- **Client scripts** use `data-page` on `<body>` for page routing (set by the `Layout` component's `name` prop)
