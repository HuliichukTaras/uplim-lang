export default function(hljs) {
  const KEYWORDS = [
    'let', 'make', 'when', 'do', 'end', 'return', 'match', 'case',
    'if', 'else', 'for', 'while', 'break', 'continue',
    'async', 'await', 'spawn', 'type', 'impl', 'trait',
    'module', 'import', 'export', 'extern', 'unsafe', 'pub',
    'mut', 'const', 'static'
  ];

  const TYPES = [
    'Int', 'Float', 'Bool', 'String', 'Char', 'Unit',
    'Array', 'Option', 'Result', 'Map', 'Set',
    'i8', 'i16', 'i32', 'i64', 'u8', 'u16', 'u32', 'u64',
    'f32', 'f64', 'usize', 'isize'
  ];

  const LITERALS = ['true', 'false', 'None', 'Some', 'Ok', 'Err'];

  const BUILTINS = [
    'say', 'print', 'println', 'panic', 'assert',
    'len', 'clone', 'copy'
  ];

  return {
    name: 'UPLim',
    aliases: ['uplim', 'upl'],
    keywords: {
      keyword: KEYWORDS,
      type: TYPES,
      literal: LITERALS,
      built_in: BUILTINS
    },
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      {
        className: 'string',
        variants: [
          { begin: '"', end: '"', contains: [hljs.BACKSLASH_ESCAPE] },
          { begin: "'", end: "'", contains: [hljs.BACKSLASH_ESCAPE] }
        ]
      },
      {
        className: 'number',
        variants: [
          { begin: '\\b0x[0-9a-fA-F]+' },
          { begin: '\\b0b[01]+' },
          { begin: '\\b\\d+\\.\\d+' },
          { begin: '\\b\\d+' }
        ]
      },
      {
        className: 'function',
        beginKeywords: 'make',
        end: '\\(',
        excludeEnd: true,
        contains: [{ className: 'title', begin: hljs.IDENT_RE }]
      },
      {
        className: 'type',
        begin: /\b[A-Z][a-zA-Z0-9]*/
      }
    ]
  };
}
