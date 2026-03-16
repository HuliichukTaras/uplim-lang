// Monaco Editor language definition for UPLim
export function registerUPLimLanguage() {
  if (typeof window === 'undefined') return;
  
  // @ts-ignore - Monaco is loaded via CDN
  const monaco = window.monaco;
  if (!monaco) return;

  monaco.languages.register({ id: "upl" });

  monaco.languages.setMonarchTokensProvider("upl", {
    keywords: [
      'module', 'import', 'export', 'type', 'fn', 'let', 'const', 'var',
      'async', 'await', 'return', 'if', 'else', 'match', 'for', 'while',
      'loop', 'break', 'continue', 'use', 'from', 'implements', 'extends',
      'trait', 'interface', 'yield', 'struct', 'enum', 'public', 'private',
      'protected', 'static', 'inline', 'external'
    ],
    
    types: [
      'Int', 'Float', 'String', 'Bool', 'Any', 'List', 'Map', 
      'Path', 'Result', 'Option', 'Id'
    ],
    
    operators: [
      '=', '==', '!=', '<', '>', '<=', '>=', '+', '-', '*', '/', '%',
      '&&', '||', '!', '?', '??', '::', ':', '->'
    ],

    tokenizer: {
      root: [
        [/#.*/, 'comment'],
        [/""".*?"""/, 'string'],
        [/".*?"/, 'string'],
        [/'.*?'/, 'string'],
        [/@types/, 'type'],
        [/@keywords/, 'keyword'],
        [/\b(true|false|null)\b/, 'constant.language'],
        [/\b\d+(\.\d+)?\b/, 'number'],
        [/\bfn\s+[A-Za-z_][A-Za-z0-9_]*/, 'entity.name.function'],
        [/@operators/, 'operator'],
        [/[{}[\]()]/, '@brackets'],
      ]
    }
  });

  monaco.languages.setLanguageConfiguration("upl", {
    comments: {
      lineComment: '#'
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ]
  });
}
