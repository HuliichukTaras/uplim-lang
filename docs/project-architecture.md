# UPLim Project Architecture

UPLim має власну стандартизовану архітектуру проєктів, що забезпечує чистоту коду, зручність підтримки та масштабованість.

## Структура Проєкту

\`\`\`
uplim-project/
├── app/                  # Головний entry-point
│   ├── routes/           # Файли-маршрути CLI/REPL/HTTP
│   ├── pages/            # Логіка сторінок або команд
│   ├── layout.upl        # Глобальний layout
│   └── main.upl          # Entry-point
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
├── uplim.config          # Конфігурація
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

## Файл uplim.config

\`\`\`json
{
  "name": "my-uplim-app",
  "version": "0.1.0",
  "description": "A new UPLim project",
  "targets": ["cli", "web", "wasm"],
  "mode": "simple",
  "entry": "app/main.upl",
  "output": "dist",
  "features": {
    "i18n": true,
    "testing": true,
    "compiler": false
  }
}
\`\`\`

## Створення Нового Проєкту

\`\`\`bash
# CLI команда
uplim new my-app

# З опціями
uplim new my-app --target web --i18n --testing
\`\`\`

## Стандарти

1. Кожен проєкт має `uplim.config`
2. `app/main.upl` — завжди вхідна точка
3. Компоненти в `components/` — чисті, без стану
4. Кожен файл — одна функціональність
5. Тести автоматично розпізнаються в `tests/`
6. Мови — через `lang/` JSON
7. Документація — Markdown + приклади

## Валідація Структури

\`\`\`bash
uplim validate
\`\`\`

Перевіряє наявність обов'язкових файлів та правильність структури.
