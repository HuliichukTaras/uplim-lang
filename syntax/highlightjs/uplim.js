// Highlight.js language definition for UPLim
export default function(hljs) {
  return {
    name: "UPLim",
    aliases: ["upl"],
    keywords: {
      keyword:
        "module import export type fn let const var async await return if else match for while loop break continue true false null use from implements extends trait interface yield struct enum public private protected static inline external",
      type:
        "Int Float String Bool Any List Map Path Result Option Id",
      literal: "true false null"
    },
    contains: [
      hljs.COMMENT('#', '$'),
      hljs.NUMBER_MODE,
      {
        className: 'string',
        variants: [
          { begin: '"""', end: '"""' },
          { begin: '"', end: '"' },
          { begin: "'", end: "'" }
        ]
      },
      {
        className: 'function',
        beginKeywords: 'fn',
        end: /\(/,
        excludeEnd: true,
        contains: [
          {
            className: 'title',
            begin: /[A-Za-z_][A-Za-z0-9_]*/
          }
        ]
      }
    ]
  };
}
