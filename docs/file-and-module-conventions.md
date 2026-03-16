# UPLim File And Module Conventions

This document defines the canonical file extension, special file names, and module-to-file mapping rules for UPLim projects.

## File Extension

All UPLim source files use:

- `.upl`

Examples:

- `main.upl`
- `page.upl`
- `layout.upl`
- `server.upl`
- `user_card.upl`
- `route.upl`

## Core Rule

A UPLim module is backed by a `.upl` file.

The language should support deterministic file-based module resolution.
Special filenames are allowed, but they must still resolve to ordinary modules with explicit meaning.

UPLim should also treat each file as one semantic unit wherever possible.
The language must push users toward modular structure instead of rewarding giant mixed-purpose files.

## Canonical Project Layout

```text
my-app/
├── uplim.toml
├── app/
│   ├── main.upl
│   ├── layout.upl
│   ├── page.upl
│   ├── routes/
│   │   └── health/
│   │       └── route.upl
│   └── dashboard/
│       ├── page.upl
│       └── layout.upl
├── modules/
│   ├── auth/
│   │   ├── mod.upl
│   │   └── session.upl
│   └── ai/
│       ├── mod.upl
│       └── tools.upl
├── ui/
│   ├── layout.upl
│   ├── navbar.upl
│   ├── hero.upl
│   └── footer.upl
├── components/
│   └── button.upl
├── types/
│   └── user.upl
└── tests/
    └── auth_test.upl
```

## Special File Names

### `main.upl`

- required application entrypoint unless `uplim.toml` overrides it
- default CLI and service bootstrap file
- maps to the application root module

### `page.upl`

- canonical UI or route-facing page entry
- used for app/web surfaces
- may exist at `app/page.upl` for root page and in nested directories such as `app/dashboard/page.upl`

Examples:

- `app/page.upl`
- `app/settings/page.upl`
- `app/admin/users/page.upl`

### `layout.upl`

- shared wrapper for child pages or route groups
- provides composition structure, shared dependencies, and common UI boundaries
- may exist at root or nested segments

Examples:

- `app/layout.upl`
- `app/dashboard/layout.upl`

### `route.upl`

- route handler entry for HTTP, RPC, webhook, or server actions
- used inside `routes/` folders or route segments

Examples:

- `app/routes/health/route.upl`
- `app/api/users/route.upl`

### `mod.upl`

- optional directory module root for non-app code
- groups submodules in `modules/`, `components/`, `types/`, or `std/`-style trees
- similar in purpose to a package index, but still explicit and file-based

Examples:

- `modules/auth/mod.upl`
- `modules/ai/mod.upl`

### `server.upl`

- explicit server bootstrap or host integration entry
- useful when the project needs a separate service-oriented startup path

## File Roles

UPLim should support file-level role annotations for stronger architectural signals.

Initial role direction:

- `@ui`
- `@entry`
- `@service`

Rules:

- one role per file
- `@entry` files should compose imports, not define components inline
- `@ui` files should export components or UI helpers
- `@service` files should isolate external effects and adapters
- a file may not mix `@entry` and `component`

## Module Resolution

### File modules

`import auth.session` resolves to one of:

1. `modules/auth/session.upl`
2. `auth/session.upl`

depending on the configured module roots in `uplim.toml`.

### Directory modules

`import auth` resolves to:

1. `modules/auth/mod.upl`
2. `auth/mod.upl`

### App segments

`app/dashboard/page.upl` resolves as the page entry for the `dashboard` segment, not as a generic utility module.

### No hidden inference

UPLim should avoid ambiguous module lookup.

Rules:

- no mixed extension resolution
- no implicit `.js` or `.ts` fallback
- no multiple equally-valid lookup paths
- manifest-defined roots win over ad hoc heuristics

## Imports

Canonical import style should be dotted module paths:

```upl
import auth.session
import ai.tools
import ui.button
```

For app-local composition, imports still target modules, not file paths:

```upl
import dashboard.widgets.summary_card
```

The compiler maps module paths to `.upl` files according to the module roots.

For UI-oriented projects, import structure should reinforce composition:

```upl
import ui.navbar
import ui.hero
import ui.footer
```

or, where the syntax evolves toward explicit named imports:

```upl
import Navbar from "@/ui/navbar"
import Hero from "@/ui/hero"
```

The exact import surface may evolve, but the architectural rule should not:
entry files compose exported units from dedicated modules.

## Manifest Integration

`uplim.toml` should define:

- `entry`
- optional `app_root`
- optional `module_roots`
- optional `test_roots`

Example:

```toml
[build]
entry = "app/main.upl"
app_root = "app"
module_roots = ["modules", "components", "types"]
test_roots = ["tests"]
```

## Conventions By Use Case

### Frontend app

- `app/page.upl`
- `app/layout.upl`
- nested `page.upl` and `layout.upl`
- reusable UI in `components/`
- page composition from `ui/` or other dedicated UI modules

### Backend service

- `app/main.upl` or `app/server.upl`
- handlers in `app/routes/**/route.upl`
- domain logic in `modules/`

### AI-native application

- `modules/ai/mod.upl`
- typed tools in `modules/ai/tools.upl`
- runtime-facing flows in `app/main.upl`, `server.upl`, or route handlers

### Game or simulation

- `app/main.upl`
- scenes or systems in `modules/`
- optional `page.upl` only if a web UI layer exists

## Recommendations

- Keep `.upl` as the only source extension.
- Reserve `page.upl`, `layout.upl`, `route.upl`, `main.upl`, `server.upl`, and `mod.upl` as semantic filenames.
- Prefer file-based determinism over magic discovery.
- Keep module resolution explicit in `uplim.toml`.
- Prefer one semantic unit per file.
- Do not let entry files become mixed layout, component, and runtime blobs.
