Prism.languages.uplim = {
  'comment': [
    {
      pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
      lookbehind: true
    },
    {
      pattern: /(^|[^\\:])\/\/.*/,
      lookbehind: true
    }
  ],
  'string': {
    pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    greedy: true
  },
  'keyword': /\b(?:let|make|when|do|end|return|match|case|if|else|for|while|break|continue|async|await|spawn|type|impl|trait|module|import|export|extern|unsafe|pub|mut|const|static)\b/,
  'type': /\b(?:Int|Float|Bool|String|Char|Unit|Array|Option|Result|Map|Set|i8|i16|i32|i64|u8|u16|u32|u64|f32|f64|usize|isize)\b/,
  'boolean': /\b(?:true|false)\b/,
  'constant': /\b(?:None|Some|Ok|Err)\b/,
  'function': /\b[a-z_][a-zA-Z0-9_]*(?=\s*\()/,
  'number': /\b(?:0x[0-9a-fA-F]+|0b[01]+|\d+\.?\d*(?:[eE][+-]?\d+)?)\b/,
  'operator': /[-+*\/%=!<>]=?|&&|\|\||->|=>|\?|::/,
  'punctuation': /[{}[\];(),.:]/
};
