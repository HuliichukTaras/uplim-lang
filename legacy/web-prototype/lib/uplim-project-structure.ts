// UPLim Project Architecture Definition
// Defines standard folder structure and file conventions

export type UPLimProjectStructure = {
  root: string;
  folders: {
    app: string;           // Entry point, routes, pages, layout
    components: string;    // Reusable components
    types: string;         // Type definitions
    lang: string;          // Internationalization
    examples: string;      // Live examples
    tests: string;         // Test files
    compiler: string;      // Compiler files (optional)
    docs: string;          // Documentation
    public: string;        // Web assets
  };
  files: {
    config: string;        // uplim.config
    main: string;          // app/main.upl
    layout: string;        // app/layout.upl
    readme: string;        // README.md
  };
};

export const DEFAULT_PROJECT_STRUCTURE: UPLimProjectStructure = {
  root: '.',
  folders: {
    app: 'app',
    components: 'components',
    types: 'types',
    lang: 'lang',
    examples: 'examples',
    tests: 'tests',
    compiler: 'compiler',
    docs: 'docs',
    public: 'public',
  },
  files: {
    config: 'uplim.config',
    main: 'app/main.upl',
    layout: 'app/layout.upl',
    readme: 'README.md',
  },
};

export type UPLimConfig = {
  name: string;
  version: string;
  description: string;
  targets: ('web' | 'cli' | 'wasm' | 'docs')[];
  mode: 'simple' | 'compact';
  entry: string;
  output: string;
  features: {
    i18n: boolean;
    testing: boolean;
    compiler: boolean;
  };
  dependencies?: Record<string, string>;
};

export const DEFAULT_UPLIM_CONFIG: UPLimConfig = {
  name: 'my-uplim-app',
  version: '0.1.0',
  description: 'A new UPLim project',
  targets: ['cli'],
  mode: 'simple',
  entry: 'app/main.upl',
  output: 'dist',
  features: {
    i18n: false,
    testing: true,
    compiler: false,
  },
};

// File templates
export const FILE_TEMPLATES = {
  'app/main.upl': `# Main Entry Point
# Welcome to UPLim!

say "Hello from UPLim!"

make start() do
  say "Starting application..."
end

start()
`,

  'app/layout.upl': `# Global Layout and Interfaces

make header() do
  say "=== UPLim Application ==="
end

make footer() do
  say "=== End ==="
end
`,

  'app/pages/home.upl': `# Home Page

make home() do
  say "Welcome to the home page"
end
`,

  'components/button.upl': `# Button Component

make button(text, onClick) do
  say "Button:" text
  onClick()
end
`,

  'types/user.upl': `# User Type Definition

type User do
  name be Text
  age be Number
  email be Text
end
`,

  'lang/en.json': `{
  "app.title": "UPLim Application",
  "app.welcome": "Welcome to UPLim!",
  "common.hello": "Hello",
  "common.goodbye": "Goodbye"
}`,

  'lang/ua.json': `{
  "app.title": "UPLim Додаток",
  "app.welcome": "Ласкаво просимо до UPLim!",
  "common.hello": "Привіт",
  "common.goodbye": "До побачення"
}`,

  'examples/hello.upl': `# Hello World Example

say "Hello World from UPLim!"

let name be "Alice"
say "Hello" plus name
`,

  'tests/test_runner.upl': `# Test Runner

make test(name, expected, actual) do
  when expected equals actual do
    say "✓" name
  else
    say "✗" name
    say "  Expected:" expected
    say "  Got:" actual
  end
end

# Run tests
say "Running tests..."
test("Addition", 5, 2 plus 3)
test("String concat", "Hello Alice", "Hello" plus " Alice")
say "Tests complete!"
`,

  'docs/index.md': `# Documentation

Welcome to the UPLim project documentation.

## Getting Started

Run your application:

\`\`\`bash
uplim run app/main.upl
\`\`\`

## Project Structure

- \`app/\` - Main application entry point
- \`components/\` - Reusable components
- \`types/\` - Type definitions
- \`lang/\` - Internationalization files
- \`examples/\` - Example code
- \`tests/\` - Test files
- \`docs/\` - Documentation

## Syntax

See [syntax.md](./syntax.md) for full syntax reference.
`,

  'uplim.config': `{
  "name": "my-uplim-app",
  "version": "0.1.0",
  "description": "A new UPLim project",
  "targets": ["cli"],
  "mode": "simple",
  "entry": "app/main.upl",
  "output": "dist",
  "features": {
    "i18n": false,
    "testing": true,
    "compiler": false
  }
}`,

  'README.md': `# UPLim Project

A project built with UPLim - The Human Programming Language.

## Quick Start

\`\`\`bash
# Run the main application
uplim run app/main.upl

# Run tests
uplim test

# Build for production
uplim build
\`\`\`

## Project Structure

\`\`\`
app/           # Application entry point
├── main.upl   # Main file
├── layout.upl # Global layout
└── pages/     # Application pages

components/    # Reusable components
types/         # Type definitions
lang/          # Internationalization
examples/      # Example code
tests/         # Test files
docs/          # Documentation
\`\`\`

## Learn More

- [UPLim Documentation](./docs/index.md)
- [Syntax Reference](./docs/syntax.md)
- [Examples](./examples/)
`,
};

export class ProjectScaffolder {
  static async createProject(name: string, config?: Partial<UPLimConfig>): Promise<string> {
    const projectConfig: UPLimConfig = {
      ...DEFAULT_UPLIM_CONFIG,
      name,
      ...config,
    };

    const structure = DEFAULT_PROJECT_STRUCTURE;
    let output = `Creating UPLim project: ${name}\n\n`;

    // Create folder structure
    output += 'Creating folders:\n';
    Object.entries(structure.folders).forEach(([key, folder]) => {
      output += `  ✓ ${folder}/\n`;
    });

    // Create files
    output += '\nCreating files:\n';
    Object.entries(FILE_TEMPLATES).forEach(([path, content]) => {
      output += `  ✓ ${path}\n`;
    });

    output += '\n✓ Project created successfully!\n';
    output += `\nNext steps:\n`;
    output += `  cd ${name}\n`;
    output += `  uplim run app/main.upl\n`;

    return output;
  }

  static getTemplate(path: string): string {
    return FILE_TEMPLATES[path as keyof typeof FILE_TEMPLATES] || '';
  }

  static validateProjectStructure(files: string[]): {
    valid: boolean;
    missing: string[];
    warnings: string[];
  } {
    const required = ['uplim.config', 'app/main.upl', 'README.md'];
    const missing = required.filter(file => !files.includes(file));
    const warnings: string[] = [];

    if (!files.includes('app/layout.upl')) {
      warnings.push('Consider adding app/layout.upl for global layout');
    }

    if (!files.some(f => f.startsWith('tests/'))) {
      warnings.push('No tests found - consider adding tests/');
    }

    return {
      valid: missing.length === 0,
      missing,
      warnings,
    };
  }
}
