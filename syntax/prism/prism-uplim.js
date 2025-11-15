// Prism.js language definition for UPLim
Prism.languages.upl = {
  comment: /#.*/,

  string: {
    pattern: /("""[\s\S]*?"""|"[^"]*"|'[^']*')/,
    greedy: true
  },

  keyword: /\b(module|import|export|type|fn|let|const|var|async|await|return|if|else|match|for|while|loop|break|continue|use|from|implements|extends|trait|interface|yield|struct|enum|public|private|protected|static|inline|external)\b/,

  boolean: /\b(true|false|null)\b/,

  type: /\b(Int|Float|String|Bool|Any|List|Map|Path|Result|Option|Id)\b/,

  number: /\b\d+(\.\d+)?\b/,

  function: {
    pattern: /\bfn\s+[A-Za-z_][A-Za-z0-9_]*/,
    inside: {
      keyword: /\bfn\b/,
      'function-name': /[A-Za-z_][A-Za-z0-9_]*/
    }
  },

  operator: /[=!<>]=?|[+\-*\/%]|&&|\|\||::|->|\?{1,2}/,

  punctuation: /[{}[\]();:,]/
};
