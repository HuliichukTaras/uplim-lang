# UPLim Project Architecture

UPLim має власну стандартизовану архітектуру проєктів, що забезпечує чистоту коду, зручність підтримки та масштабованість.

> Це специфікація структури окремого UPLim-застосунку, а не layout цього monorepo. Активна структура репозиторію описана в `README.md` та `docs/index.md`.
> Canonical file naming and module mapping are defined in `docs/file-and-module-conventions.md`.

## Структура Проєкту

\`\`\`
uplim-project/
├── uplim.toml            # Канонічний manifest
├── app/
│   ├── main.upl          # Головний entry-point
│   ├── page.upl          # Root page entry
│   ├── layout.upl        # Глобальний layout
│   ├── routes/           # Файли-маршрути CLI/REPL/HTTP
│   │   └── health/
│   │       └── route.upl
│   └── dashboard/
│       ├── page.upl
│       └── layout.upl
│
├── modules/              # Domain modules
│   └── auth/
│       ├── mod.upl
│       └── session.upl
│
├── components/           # Повторно використовувані компоненти
│   └── button.upl
│
├── lang/                 # Багатомовність
│   ├── en.json
│   ├── es.json
│   └── ua.json
│
├── types/                # Типи, інтерфейси, DTO
│   └── user.upl
│
├── examples/             # Живі приклади
│   └── match_comprehension.upl
│
├── tests/                # Unit / behavior tests
│   ├── test_match.upl
│   └── runner.upl
│
├── compiler/             # Компілятор (опціонально)
│   └── emitter.upl
│
├── docs/                 # Документація
│   ├── index.md
│   └── syntax.md
│
├── public/               # Веб-асети
│   └── logo.svg
│
└── README.md
\`\`\`

## Принципи Архітектури

### 1. app/ як ядро
Вхідна точка програми, сторінки, маршрути, layout (як у Next.js App Router)

### 2. components/
Функціональні або UI-блоки, що використовуються повторно

### 3. pages/ ≠ routes/
- `pages/` — логіка сторінок
- `routes/` — маршрути/entry для CLI/REPL/API

### 4. types/
Статичні описові типи без виконуваного коду

### 5. lang/
JSON-файли локалізації для багатомовності

### 6. tests/
Тести завжди окремо, автоматично підхоплюються

### 7. examples/
Самодокументуючі приклади коду

### 8. compiler/
Якщо проєкт — мова програмування, є компілятор

## Файл uplim.toml

\`\`\`toml
[package]
name = "my-uplim-app"
version = "0.1.0"
edition = "v1"

[build]
entry = "app/main.upl"
profile = "wasm-component"
output = "dist/"
app_root = "app"
module_roots = ["modules", "components", "types"]

[features]
default = ["http"]
\`\`\`

## Створення Нового Проєкту

\`\`\`bash
# CLI команда
uplim new my-app

# З опціями
uplim new my-app --target web --i18n --testing
\`\`\`

## Стандарти

1. Кожен проєкт має `uplim.toml`
2. `app/main.upl` — завжди вхідна точка
3. `page.upl`, `layout.upl`, `route.upl` — зарезервовані semantic filenames
4. Кожен файл — одна функціональність
5. Тести автоматично розпізнаються в `tests/`
6. Мови — через `lang/` JSON
7. Документація — Markdown + приклади

## Валідація Структури

\`\`\`bash
uplim validate
\`\`\`

Перевіряє наявність обов'язкових файлів та правильність структури.
