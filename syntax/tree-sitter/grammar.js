module.exports = grammar({
  name: 'uplim',

  extras: $ => [
    /\s/,
    $.line_comment,
    $.block_comment,
  ],

  word: $ => $.identifier,

  rules: {
    source_file: $ => repeat(choice($.item, $.statement)),

    item: $ => choice(
      $.import_declaration,
      $.struct_declaration,
      $.state_declaration,
      $.enum_declaration,
      $.function_declaration,
    ),

    statement: $ => choice(
      $.variable_declaration,
      $.return_statement,
      $.while_statement,
      $.for_in_statement,
      $.say_statement,
      $.expression_statement,
      $.block,
    ),

    import_declaration: $ => seq('import', $.module_path),
    module_path: $ => seq($.identifier, repeat(seq('.', $.identifier))),

    struct_declaration: $ => seq('struct', $.identifier, $.field_block),
    state_declaration: $ => seq('state', $.identifier, $.field_block),
    field_block: $ => seq('{', repeat($.field_declaration), '}'),
    field_declaration: $ => seq($.identifier, ':', $.type_ref, optional(',')),

    enum_declaration: $ => seq('enum', $.identifier, '{', $.identifier, repeat(seq(',', $.identifier)), optional(','), '}'),

    function_declaration: $ => seq(
      optional('pub'),
      optional('async'),
      choice('fn', 'func', 'f'),
      $.identifier,
      $.parameter_list,
      optional(seq('->', $.type_ref)),
      choice($.block, seq('=>', $.expression)),
    ),

    parameter_list: $ => seq('(', optional(seq($.parameter, repeat(seq(',', $.parameter)), optional(','))), ')'),
    parameter: $ => seq($.identifier, optional(seq(':', $.type_ref))),

    type_ref: $ => choice(
      'Int',
      'Float',
      'Bool',
      'String',
      'Void',
      'Any',
      seq('[', $.type_ref, ']'),
      seq($.identifier, '[', $.type_ref, repeat(seq(',', $.type_ref)), ']'),
      $.identifier,
    ),

    variable_declaration: $ => seq(
      choice('let', 'l', 'var', 'const'),
      choice($.identifier, $.object_pattern, $.array_pattern),
      optional(seq(':', $.type_ref)),
      choice('=', 'be'),
      $.expression,
    ),

    object_pattern: $ => seq('{', $.identifier, repeat(seq(',', $.identifier)), '}'),
    array_pattern: $ => seq('[', $.identifier, repeat(seq(',', $.identifier)), ']'),

    return_statement: $ => seq(choice('return', 'ret'), optional($.expression)),
    while_statement: $ => seq('while', $.expression, $.block),
    for_in_statement: $ => seq('for', $.identifier, 'in', $.expression, $.block),
    say_statement: $ => seq(choice('say', 'print', 'p'), $.expression),
    expression_statement: $ => $.expression,
    block: $ => seq('{', repeat($.statement), '}'),

    expression: $ => choice(
      $.with_expression,
      $.if_expression,
      $.match_expression,
      $.assignment_expression,
      $.binary_expression,
      $.unary_expression,
      $.postfix_expression,
      $.primary_expression,
    ),

    with_expression: $ => prec.right(seq($.postfix_expression, 'with', $.object_literal)),

    if_expression: $ => seq(
      choice('if', 'when'),
      $.expression,
      optional('do'),
      choice($.block, $.statement),
      optional(seq('else', choice($.block, $.if_expression, $.statement))),
    ),

    match_expression: $ => seq(
      choice('match', 'm'),
      $.expression,
      '{',
      $.match_arm,
      repeat(seq(',', $.match_arm)),
      optional(','),
      '}',
    ),

    match_arm: $ => seq($.expression, optional(seq('if', $.expression)), '=>', $.expression),

    assignment_expression: $ => prec.right(seq($.postfix_expression, '=', $.expression)),

    binary_expression: $ => choice(
      prec.left(1, seq($.expression, '||', $.expression)),
      prec.left(2, seq($.expression, '&&', $.expression)),
      prec.left(3, seq($.expression, choice('==', '!=', 'equals'), $.expression)),
      prec.left(4, seq($.expression, choice('<', '>', '<=', '>='), $.expression)),
      prec.left(5, seq($.expression, choice('+', '-', 'plus'), $.expression)),
      prec.left(6, seq($.expression, choice('*', '/', '%'), $.expression)),
      prec.left(7, seq($.expression, '..', $.expression, optional(seq('by', $.expression)))),
      prec.left(1, seq($.expression, '|>', $.expression)),
    ),

    unary_expression: $ => prec.right(seq(choice('!', '-', 'await'), $.expression)),

    postfix_expression: $ => prec.left(seq($.primary_expression, repeat1(choice(
      seq('.', $.identifier),
      seq('(', optional(seq($.expression, repeat(seq(',', $.expression)), optional(','))), ')'),
    )))),

    primary_expression: $ => choice(
      $.literal,
      $.identifier,
      $.struct_instantiation,
      $.array_literal,
      $.object_literal,
      $.list_comprehension,
      seq('(', $.expression, ')'),
    ),

    struct_instantiation: $ => seq($.identifier, '{', optional(seq($.init_field, repeat(seq(',', $.init_field)), optional(','))), '}'),
    init_field: $ => seq($.identifier, ':', $.expression),

    array_literal: $ => seq('[', optional(seq($.expression, repeat(seq(',', $.expression)), optional(','))), ']'),
    object_literal: $ => seq('{', optional(seq($.object_field, repeat(seq(',', $.object_field)), optional(','))), '}'),
    object_field: $ => seq($.identifier, ':', $.expression),
    list_comprehension: $ => seq('[', $.expression, '|', $.identifier, 'in', $.expression, optional(seq(',', $.expression)), ']'),

    literal: $ => choice($.number, $.string, 'true', 'false'),
    identifier: _ => /[A-Za-z_][A-Za-z0-9_]*/,
    number: _ => /[0-9]+(\.[0-9]+)?/,
    string: _ => /"([^"\\]|\\.)*"/,

    line_comment: _ => token(seq('//', /.*/)),
    block_comment: _ => token(seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')),
  },
})
