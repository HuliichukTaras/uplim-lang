import {
  ArrayLiteral,
  ArrayPattern,
  AssignmentExpression,
  ASTNode,
  BinaryExpression,
  BlockStatement,
  CallExpression,
  Expression,
  ExpressionStatement,
  ForInStatement,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  ImportDeclaration,
  IfStatement,
  ListComprehension,
  Literal,
  MatchExpression,
  MemberExpression,
  ObjectLiteral,
  ObjectPattern,
  Parser,
  PipelineExpression,
  Program,
  RangeExpression,
  ReturnStatement,
  SayStatement,
  StructDeclaration,
  StructInstantiation,
  TypeAnnotation,
  UnaryExpression,
  VariableDeclaration,
  WhileStatement,
  WithExpression,
} from './parser'

const INDENT = '  '

export interface FormatSourceResult {
  formatted: string
  errors: { message: string; line: number; column: number; severity: 'error' | 'warning' }[]
}

export function formatSource(source: string, filename = 'unknown'): FormatSourceResult {
  const parser = new Parser()
  const result = parser.parse(source, filename)
  if (result.errors.length > 0) {
    return { formatted: source, errors: result.errors }
  }
  return { formatted: `${formatProgram(result.ast)}\n`, errors: [] }
}

export function formatProgram(program: Program): string {
  return program.body.map(node => formatNode(node, 0)).join('\n\n')
}

function formatNode(node: ASTNode, depth: number): string {
  switch (node.type) {
    case 'VariableDeclaration':
      return formatVariableDeclaration(node as VariableDeclaration)
    case 'FunctionDeclaration':
      return formatFunctionDeclaration(node as FunctionDeclaration, depth)
    case 'StructDeclaration':
      return formatStructDeclaration(node as StructDeclaration, depth)
    case 'EnumDeclaration':
      return formatEnumDeclaration(node as StructDeclaration & { members?: string[] }, depth)
    case 'ImportDeclaration':
      return `import ${(node as ImportDeclaration).source}`
    case 'SayStatement':
      return `${indent(depth)}say ${formatExpression((node as SayStatement).argument)}`
    case 'IfStatement':
      return formatIfStatement(node as IfStatement, depth)
    case 'WhileStatement':
      return formatWhileStatement(node as WhileStatement, depth)
    case 'ForInStatement':
      return formatForInStatement(node as ForInStatement, depth)
    case 'ReturnStatement':
      return formatReturnStatement(node as ReturnStatement, depth)
    case 'ExpressionStatement':
      return `${indent(depth)}${formatExpression((node as ExpressionStatement).expression)}`
    case 'BlockStatement':
      return formatBlock(node as BlockStatement, depth)
    default:
      return `${indent(depth)}${formatExpression(node as unknown as Expression)}`
  }
}

function formatVariableDeclaration(node: VariableDeclaration): string {
  return `${node.kind} ${formatPattern(node.pattern)}${formatType(node.typeAnnotation)} = ${formatExpression(node.value)}`
}

function formatFunctionDeclaration(node: FunctionDeclaration, depth: number): string {
  const header = [
    indent(depth),
    node.isPub ? 'pub ' : '',
    node.isAsync ? 'async ' : '',
    'fn ',
    node.name,
    '(',
    node.params.map(param => `${param.name}${formatType(param.typeAnnotation)}`).join(', '),
    ')',
    node.returnType ? ` -> ${formatTypeRef(node.returnType)}` : '',
    ' ',
  ].join('')
  return `${header}${formatBlock(node.body, depth)}`
}

function formatStructDeclaration(node: StructDeclaration, depth: number): string {
  const keyword = node.kind === 'state' ? 'state' : 'struct'
  const fields = node.fields.map(field => `${indent(depth + 1)}${field.name}: ${formatTypeRef(field.typeAnnotation)}`).join('\n')
  return `${indent(depth)}${keyword} ${node.name} {\n${fields}\n${indent(depth)}}`
}

function formatEnumDeclaration(node: { name: string; members?: string[] }, depth: number): string {
  const members = (node.members ?? []).map(member => `${indent(depth + 1)}${member}`).join(',\n')
  return `${indent(depth)}enum ${node.name} {\n${members}\n${indent(depth)}}`
}

function formatIfStatement(node: IfStatement, depth: number): string {
  let result = `${indent(depth)}if ${formatExpression(node.test)} ${formatBlock(node.consequent, depth)}`
  if (node.alternate) {
    if (node.alternate.type === 'IfStatement') {
      result += ` else ${formatIfStatement(node.alternate, 0).trimStart()}`
    } else {
      result += ` else ${formatBlock(node.alternate, depth)}`
    }
  }
  return result
}

function formatWhileStatement(node: WhileStatement, depth: number): string {
  return `${indent(depth)}while ${formatExpression(node.test)} ${formatBlock(node.body, depth)}`
}

function formatForInStatement(node: ForInStatement, depth: number): string {
  return `${indent(depth)}for ${node.iterator} in ${formatExpression(node.source)} ${formatBlock(node.body, depth)}`
}

function formatReturnStatement(node: ReturnStatement, depth: number): string {
  return node.argument
    ? `${indent(depth)}return ${formatExpression(node.argument)}`
    : `${indent(depth)}return`
}

function formatBlock(block: BlockStatement, depth: number): string {
  if (block.body.length === 0) {
    return '{}'
  }

  const body = block.body.map(stmt => formatNode(stmt, depth + 1)).join('\n')
  return `{\n${body}\n${indent(depth)}}`
}

function formatPattern(pattern: Identifier | ObjectPattern | ArrayPattern): string {
  switch (pattern.type) {
    case 'Identifier':
      return pattern.name
    case 'ObjectPattern':
      return `{ ${pattern.properties.map(property => property.key === property.value ? property.key : `${property.key}: ${property.value}`).join(', ')} }`
    case 'ArrayPattern':
      return `[${pattern.elements.join(', ')}]`
  }
}

function formatExpression(expr: Expression): string {
  switch (expr.type) {
    case 'Literal':
      return formatLiteral(expr as Literal)
    case 'Identifier':
      return (expr as Identifier).name
    case 'UnaryExpression':
      return `${(expr as UnaryExpression).operator}${formatExpression((expr as UnaryExpression).argument)}`
    case 'BinaryExpression': {
      const binary = expr as BinaryExpression
      return `${formatExpression(binary.left)} ${binary.operator} ${formatExpression(binary.right)}`
    }
    case 'CallExpression': {
      const call = expr as CallExpression
      return `${formatExpression(call.callee)}(${call.arguments.map(formatExpression).join(', ')})`
    }
    case 'MemberExpression': {
      const member = expr as MemberExpression
      return `${formatExpression(member.object)}.${member.property.name}`
    }
    case 'AssignmentExpression': {
      const assignment = expr as AssignmentExpression
      return `${formatExpression(assignment.left)} = ${formatExpression(assignment.right)}`
    }
    case 'PipelineExpression': {
      const pipeline = expr as PipelineExpression
      return `${formatExpression(pipeline.left)} |> ${formatExpression(pipeline.right)}`
    }
    case 'RangeExpression': {
      const range = expr as RangeExpression
      return `${formatExpression(range.start)}..${formatExpression(range.end)}${range.step ? ` by ${formatExpression(range.step)}` : ''}`
    }
    case 'ListComprehension': {
      const comprehension = expr as ListComprehension
      return `[${formatExpression(comprehension.expression)} | ${comprehension.element} in ${formatExpression(comprehension.source)}${comprehension.filter ? `, ${formatExpression(comprehension.filter)}` : ''}]`
    }
    case 'ArrayLiteral':
      return `[${(expr as ArrayLiteral).elements.map(formatExpression).join(', ')}]`
    case 'ObjectLiteral':
      return formatInlineObject(expr as ObjectLiteral)
    case 'StructInstantiation': {
      const instantiation = expr as StructInstantiation
      return `${instantiation.structName} ${formatInlineStructFields(instantiation.fields)}`
    }
    case 'WithExpression': {
      const withExpr = expr as WithExpression
      return `${formatExpression(withExpr.base)} with ${formatInlineObject(withExpr.updates)}`
    }
    case 'FunctionExpression': {
      const fn = expr as FunctionExpression
      const header = `fn${fn.name ? ` ${fn.name}` : ''}(${fn.params.join(', ')})`
      return `${header} ${formatBlock(fn.body, 0)}`
    }
    case 'MatchExpression': {
      const matchExpr = expr as MatchExpression
      const arms = matchExpr.arms.map(arm => `  ${formatExpression(arm.pattern)}${arm.guard ? ` if ${formatExpression(arm.guard)}` : ''} => ${formatExpression(arm.value)}`).join(',\n')
      return `match ${formatExpression(matchExpr.value)} {\n${arms}\n}`
    }
    case 'IfStatement':
      return formatIfStatement(expr as IfStatement, 0)
    case 'AwaitExpression':
      return `await ${formatExpression((expr as { argument: Expression }).argument)}`
    default:
      return (expr as ASTNode).type
  }
}

function formatLiteral(node: Literal): string {
  if (typeof node.value === 'string') {
    return JSON.stringify(node.value)
  }
  return String(node.value)
}

function formatInlineObject(node: ObjectLiteral): string {
  return `{ ${node.properties.map(property => `${property.key}: ${formatExpression(property.value)}`).join(', ')} }`
}

function formatInlineStructFields(fields: { name: string; value: Expression }[]): string {
  return `{ ${fields.map(field => `${field.name}: ${formatExpression(field.value)}`).join(', ')} }`
}

function formatType(annotation?: TypeAnnotation): string {
  return annotation ? `: ${formatTypeRef(annotation)}` : ''
}

function formatTypeRef(annotation: TypeAnnotation): string {
  if (annotation.isArray && annotation.params?.[0]) {
    return `[${formatTypeRef(annotation.params[0])}]`
  }
  if (annotation.params && annotation.params.length > 0) {
    return `${annotation.name}[${annotation.params.map(formatTypeRef).join(', ')}]`
  }
  return annotation.name
}

function indent(depth: number): string {
  return INDENT.repeat(depth)
}
