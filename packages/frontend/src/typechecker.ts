import type {
  ArrayLiteral,
  AssignmentExpression,
  ASTNode,
  BinaryExpression,
  BlockStatement,
  CallExpression,
  Expression,
  ExpressionStatement,
  ForInStatement,
  FunctionDeclaration,
  IfStatement,
  Literal,
  MatchExpression,
  MemberExpression,
  ObjectLiteral,
  Program,
  ReturnStatement,
  StructDeclaration,
  StructInstantiation,
  TypeAnnotation,
  UnaryExpression,
  VariableDeclaration,
  WhileStatement,
  WithExpression,
} from './parser'

export interface TypeDiagnostic {
  code: string
  message: string
  severity: 'error' | 'warning'
  location: {
    line: number
    column: number
  }
}

type PrimitiveTypeName = 'Int' | 'Float' | 'Bool' | 'String' | 'Void' | 'Any'

type TypeValue =
  | { kind: 'primitive'; name: PrimitiveTypeName }
  | { kind: 'array'; element: TypeValue }
  | { kind: 'object'; properties: Record<string, TypeValue> }
  | { kind: 'named'; name: string }
  | { kind: 'unknown' }

interface FunctionSignature {
  params: TypeValue[]
  returnType: TypeValue
}

interface TypeCheckResult {
  diagnostics: TypeDiagnostic[]
}

const INT_TYPE: TypeValue = { kind: 'primitive', name: 'Int' }
const FLOAT_TYPE: TypeValue = { kind: 'primitive', name: 'Float' }
const BOOL_TYPE: TypeValue = { kind: 'primitive', name: 'Bool' }
const STRING_TYPE: TypeValue = { kind: 'primitive', name: 'String' }
const VOID_TYPE: TypeValue = { kind: 'primitive', name: 'Void' }
const ANY_TYPE: TypeValue = { kind: 'primitive', name: 'Any' }
const UNKNOWN_TYPE: TypeValue = { kind: 'unknown' }

class Scope {
  private values = new Map<string, TypeValue>()

  constructor(private readonly parent?: Scope) {}

  define(name: string, type: TypeValue) {
    this.values.set(name, type)
  }

  get(name: string): TypeValue | undefined {
    return this.values.get(name) ?? this.parent?.get(name)
  }
}

export function typeCheckProgram(program: Program): TypeCheckResult {
  const checker = new TypeChecker()
  checker.checkProgram(program)
  return { diagnostics: checker.diagnostics }
}

class TypeChecker {
  diagnostics: TypeDiagnostic[] = []
  private functions = new Map<string, FunctionSignature>()
  private structs = new Map<string, StructDeclaration>()

  checkProgram(program: Program) {
    const globalScope = new Scope()

    for (const node of program.body) {
      if (node.type === 'FunctionDeclaration') {
        const fn = node as FunctionDeclaration
        this.functions.set(fn.name, {
          params: fn.params.map(param => this.typeFromAnnotation(param.typeAnnotation) ?? ANY_TYPE),
          returnType: this.typeFromAnnotation(fn.returnType) ?? ANY_TYPE,
        })
      } else if (node.type === 'StructDeclaration') {
        const structDecl = node as StructDeclaration
        this.structs.set(structDecl.name, structDecl)
      }
    }

    for (const [name, signature] of this.functions) {
      globalScope.define(name, { kind: 'named', name: `fn(${signature.params.length})` })
    }

    for (const node of program.body) {
      this.checkStatement(node, globalScope)
    }
  }

  private checkStatement(node: ASTNode, scope: Scope, expectedReturn: TypeValue = VOID_TYPE) {
    switch (node.type) {
      case 'VariableDeclaration':
        this.checkVariableDeclaration(node as VariableDeclaration, scope)
        return
      case 'FunctionDeclaration':
        this.checkFunctionDeclaration(node as FunctionDeclaration, scope)
        return
      case 'SayStatement':
        this.inferExpression((node as unknown as { argument: Expression }).argument, scope)
        return
      case 'IfStatement':
        this.checkIfStatement(node as IfStatement, scope, expectedReturn)
        return
      case 'WhileStatement':
        this.checkWhileStatement(node as WhileStatement, scope, expectedReturn)
        return
      case 'ForInStatement':
        this.checkForInStatement(node as ForInStatement, scope, expectedReturn)
        return
      case 'ReturnStatement':
        this.checkReturnStatement(node as ReturnStatement, scope, expectedReturn)
        return
      case 'ExpressionStatement':
        this.inferExpression((node as unknown as { expression: Expression }).expression, scope)
        return
      case 'BlockStatement':
        this.checkBlock(node as BlockStatement, new Scope(scope), expectedReturn)
        return
      case 'StructDeclaration':
      case 'EnumDeclaration':
      case 'ImportDeclaration':
      case 'ModelDeclaration':
        return
      default:
        return
    }
  }

  private checkBlock(block: BlockStatement, scope: Scope, expectedReturn: TypeValue) {
    for (const stmt of block.body) {
      this.checkStatement(stmt, scope, expectedReturn)
    }
  }

  private checkVariableDeclaration(node: VariableDeclaration, scope: Scope) {
    const valueType = this.inferExpression(node.value, scope)
    const annotatedType = this.typeFromAnnotation(node.typeAnnotation)

    if (node.pattern.type === 'Identifier') {
      if (annotatedType && !this.isAssignable(valueType, annotatedType)) {
        this.pushError(
          node,
          'TYPE_MISMATCH',
          `Cannot assign ${this.describeType(valueType)} to ${node.pattern.name}: ${this.describeType(annotatedType)}.`,
        )
      }
      scope.define(node.pattern.name, annotatedType ?? valueType)
    }
  }

  private checkFunctionDeclaration(node: FunctionDeclaration, scope: Scope) {
    const fnScope = new Scope(scope)
    for (const param of node.params) {
      fnScope.define(param.name, this.typeFromAnnotation(param.typeAnnotation) ?? ANY_TYPE)
    }
    const expectedReturn = this.typeFromAnnotation(node.returnType) ?? ANY_TYPE
    this.checkBlock(node.body, fnScope, expectedReturn)
  }

  private checkIfStatement(node: IfStatement, scope: Scope, expectedReturn: TypeValue) {
    const conditionType = this.inferExpression(node.test, scope)
    if (!this.isBool(conditionType) && !this.isAny(conditionType)) {
      this.pushError(node.test, 'COND_NOT_BOOL', `If condition must be Bool, got ${this.describeType(conditionType)}.`)
    }
    this.checkBlock(node.consequent, new Scope(scope), expectedReturn)
    if (node.alternate) {
      if (node.alternate.type === 'IfStatement') {
        this.checkIfStatement(node.alternate, new Scope(scope), expectedReturn)
      } else {
        this.checkBlock(node.alternate, new Scope(scope), expectedReturn)
      }
    }
  }

  private checkWhileStatement(node: WhileStatement, scope: Scope, expectedReturn: TypeValue) {
    const conditionType = this.inferExpression(node.test, scope)
    if (!this.isBool(conditionType) && !this.isAny(conditionType)) {
      this.pushError(node.test, 'COND_NOT_BOOL', `While condition must be Bool, got ${this.describeType(conditionType)}.`)
    }
    this.checkBlock(node.body, new Scope(scope), expectedReturn)
  }

  private checkForInStatement(node: ForInStatement, scope: Scope, expectedReturn: TypeValue) {
    const sourceType = this.inferExpression(node.source, scope)
    const loopScope = new Scope(scope)
    if (sourceType.kind === 'array') {
      loopScope.define(node.iterator, sourceType.element)
    } else {
      loopScope.define(node.iterator, ANY_TYPE)
      if (!this.isAny(sourceType)) {
        this.pushError(
          node.source,
          'FOR_SOURCE_INVALID',
          `for-in source must be an array-like value, got ${this.describeType(sourceType)}.`,
        )
      }
    }
    this.checkBlock(node.body, loopScope, expectedReturn)
  }

  private checkReturnStatement(node: ReturnStatement, scope: Scope, expectedReturn: TypeValue) {
    const actualType = node.argument ? this.inferExpression(node.argument, scope) : VOID_TYPE
    if (!this.isAssignable(actualType, expectedReturn)) {
      this.pushError(
        node,
        'RETURN_TYPE_MISMATCH',
        `Return type ${this.describeType(actualType)} does not match expected ${this.describeType(expectedReturn)}.`,
      )
    }
  }

  private inferExpression(expr: Expression, scope: Scope): TypeValue {
    switch (expr.type) {
      case 'Literal':
        return this.typeFromLiteral(expr)
      case 'Identifier':
        return this.resolveIdentifier(expr, scope)
      case 'UnaryExpression':
        return this.inferUnaryExpression(expr, scope)
      case 'BinaryExpression':
        return this.inferBinaryExpression(expr, scope)
      case 'CallExpression':
        return this.inferCallExpression(expr, scope)
      case 'AssignmentExpression':
        return this.inferAssignmentExpression(expr, scope)
      case 'ArrayLiteral':
        return this.inferArrayLiteral(expr, scope)
      case 'ObjectLiteral':
        return this.inferObjectLiteral(expr, scope)
      case 'IfStatement':
        return this.inferIfExpression(expr, scope)
      case 'MatchExpression':
        return this.inferMatchExpression(expr, scope)
      case 'StructInstantiation':
        return this.inferStructInstantiation(expr, scope)
      case 'WithExpression':
        return this.inferWithExpression(expr, scope)
      case 'MemberExpression':
        return this.inferMemberExpression(expr, scope)
      case 'PipelineExpression':
        this.inferExpression(expr.left, scope)
        return this.inferExpression(expr.right, scope)
      case 'RangeExpression':
        this.inferExpression(expr.start, scope)
        this.inferExpression(expr.end, scope)
        if (expr.step) this.inferExpression(expr.step, scope)
        return { kind: 'array', element: INT_TYPE }
      case 'ListComprehension':
        return { kind: 'array', element: this.inferExpression(expr.expression, scope) }
      case 'AwaitExpression':
        return this.inferExpression(expr.argument, scope)
      case 'FunctionExpression':
        return { kind: 'named', name: `fn(${expr.params.length})` }
      default:
        return UNKNOWN_TYPE
    }
  }

  private resolveIdentifier(expr: { location: { line: number; column: number }; name: string }, scope: Scope): TypeValue {
    const resolved = scope.get(expr.name)
    if (resolved) {
      return resolved
    }
    if (expr.name === 'true' || expr.name === 'false') {
      return BOOL_TYPE
    }
    this.pushError({ type: 'Identifier', location: expr.location }, 'UNDEFINED_NAME', `Name ${expr.name} is not defined in this scope.`)
    return UNKNOWN_TYPE
  }

  private inferUnaryExpression(expr: UnaryExpression, scope: Scope): TypeValue {
    const rhs = this.inferExpression(expr.argument, scope)
    if (expr.operator === '!') {
      if (!this.isBool(rhs) && !this.isAny(rhs)) {
        this.pushError(expr, 'UNARY_NOT_BOOL', `Operator ! requires Bool, got ${this.describeType(rhs)}.`)
      }
      return BOOL_TYPE
    }

    if (expr.operator === '-') {
      if (!this.isNumeric(rhs) && !this.isAny(rhs)) {
        this.pushError(expr, 'UNARY_NOT_NUMERIC', `Operator - requires Int or Float, got ${this.describeType(rhs)}.`)
      }
      return rhs
    }

    return ANY_TYPE
  }

  private inferBinaryExpression(expr: BinaryExpression, scope: Scope): TypeValue {
    const left = this.inferExpression(expr.left, scope)
    const right = this.inferExpression(expr.right, scope)

    switch (expr.operator) {
      case '+':
        if (this.isString(left) && this.isString(right)) return STRING_TYPE
        if (this.sameNumericType(left, right)) return left
        this.pushError(expr, 'BINARY_PLUS_TYPE', `Operator + requires matching numeric types or String + String, got ${this.describeType(left)} and ${this.describeType(right)}.`)
        return ANY_TYPE
      case '-':
      case '*':
      case '/':
        if (this.sameNumericType(left, right)) return left
        this.pushError(expr, 'BINARY_NUMERIC_TYPE', `Operator ${expr.operator} requires matching numeric types, got ${this.describeType(left)} and ${this.describeType(right)}.`)
        return ANY_TYPE
      case '%':
        if (this.isInt(left) && this.isInt(right)) return INT_TYPE
        this.pushError(expr, 'BINARY_MOD_TYPE', `Operator % requires Int operands, got ${this.describeType(left)} and ${this.describeType(right)}.`)
        return ANY_TYPE
      case '==':
      case '!=':
        if (this.isComparableEquality(left, right)) return BOOL_TYPE
        this.pushError(expr, 'BINARY_EQUALITY_TYPE', `Operator ${expr.operator} requires comparable matching types, got ${this.describeType(left)} and ${this.describeType(right)}.`)
        return BOOL_TYPE
      case '<':
      case '>':
      case '<=':
      case '>=':
        if (this.sameNumericType(left, right)) return BOOL_TYPE
        this.pushError(expr, 'BINARY_COMPARE_TYPE', `Operator ${expr.operator} requires matching numeric types, got ${this.describeType(left)} and ${this.describeType(right)}.`)
        return BOOL_TYPE
      case '&&':
      case '||':
        if ((this.isBool(left) || this.isAny(left)) && (this.isBool(right) || this.isAny(right))) return BOOL_TYPE
        this.pushError(expr, 'BINARY_BOOL_TYPE', `Operator ${expr.operator} requires Bool operands, got ${this.describeType(left)} and ${this.describeType(right)}.`)
        return BOOL_TYPE
      default:
        return ANY_TYPE
    }
  }

  private inferCallExpression(expr: CallExpression, scope: Scope): TypeValue {
    if (expr.callee.type === 'Identifier') {
      const signature = this.functions.get(expr.callee.name)
      if (signature) {
        if (expr.arguments.length !== signature.params.length) {
          this.pushError(
            expr,
            'CALL_ARITY_MISMATCH',
            `Function ${expr.callee.name} expects ${signature.params.length} arguments, got ${expr.arguments.length}.`,
          )
        }

        for (let index = 0; index < Math.min(expr.arguments.length, signature.params.length); index++) {
          const actual = this.inferExpression(expr.arguments[index], scope)
          const expected = signature.params[index]
          if (!this.isAssignable(actual, expected)) {
            this.pushError(
              expr.arguments[index],
              'CALL_ARG_TYPE_MISMATCH',
              `Argument ${index + 1} for ${expr.callee.name} expects ${this.describeType(expected)}, got ${this.describeType(actual)}.`,
            )
          }
        }

        return signature.returnType
      }
    }

    for (const arg of expr.arguments) {
      this.inferExpression(arg, scope)
    }

    return ANY_TYPE
  }

  private inferAssignmentExpression(expr: AssignmentExpression, scope: Scope): TypeValue {
    const valueType = this.inferExpression(expr.right, scope)
    if (expr.left.type === 'Identifier') {
      const targetType = scope.get(expr.left.name) ?? ANY_TYPE
      if (!this.isAssignable(valueType, targetType)) {
        this.pushError(
          expr,
          'ASSIGN_TYPE_MISMATCH',
          `Cannot assign ${this.describeType(valueType)} to ${expr.left.name}: ${this.describeType(targetType)}.`,
        )
      }
      return targetType
    }

    return valueType
  }

  private inferArrayLiteral(expr: ArrayLiteral, scope: Scope): TypeValue {
    if (expr.elements.length === 0) return { kind: 'array', element: ANY_TYPE }
    const elementTypes = expr.elements.map(element => this.inferExpression(element, scope))
    const firstType = elementTypes[0]
    for (const elementType of elementTypes.slice(1)) {
      if (!this.sameType(firstType, elementType) && !this.isAny(firstType) && !this.isAny(elementType)) {
        this.pushError(expr, 'ARRAY_ELEMENT_MISMATCH', `Array elements must share one type, got ${this.describeType(firstType)} and ${this.describeType(elementType)}.`)
        return { kind: 'array', element: ANY_TYPE }
      }
    }
    return { kind: 'array', element: firstType }
  }

  private inferObjectLiteral(expr: ObjectLiteral, scope: Scope): TypeValue {
    const properties: Record<string, TypeValue> = {}
    for (const prop of expr.properties) {
      properties[prop.key] = this.inferExpression(prop.value, scope)
    }
    return { kind: 'object', properties }
  }

  private inferIfExpression(expr: IfStatement, scope: Scope): TypeValue {
    const conditionType = this.inferExpression(expr.test, scope)
    if (!this.isBool(conditionType) && !this.isAny(conditionType)) {
      this.pushError(expr.test, 'COND_NOT_BOOL', `If condition must be Bool, got ${this.describeType(conditionType)}.`)
    }

    const thenType = this.inferBlockExpression(expr.consequent, new Scope(scope))
    if (!expr.alternate) return VOID_TYPE
    const elseType = expr.alternate.type === 'IfStatement'
      ? this.inferIfExpression(expr.alternate, new Scope(scope))
      : this.inferBlockExpression(expr.alternate, new Scope(scope))

    if (!this.sameType(thenType, elseType) && !this.isAny(thenType) && !this.isAny(elseType)) {
      this.pushError(expr, 'IF_BRANCH_TYPE_MISMATCH', `If branches must return the same type, got ${this.describeType(thenType)} and ${this.describeType(elseType)}.`)
      return ANY_TYPE
    }

    return thenType
  }

  private inferMatchExpression(expr: MatchExpression, scope: Scope): TypeValue {
    this.inferExpression(expr.value, scope)
    let armType: TypeValue | null = null
    for (const arm of expr.arms) {
      if (arm.guard) this.inferExpression(arm.guard, scope)
      const currentType = this.inferExpression(arm.value, scope)
      if (!armType) {
        armType = currentType
        continue
      }
      if (!this.sameType(armType, currentType) && !this.isAny(armType) && !this.isAny(currentType)) {
        this.pushError(expr, 'MATCH_ARM_TYPE_MISMATCH', `Match arms must return one type, got ${this.describeType(armType)} and ${this.describeType(currentType)}.`)
        return ANY_TYPE
      }
    }
    return armType ?? VOID_TYPE
  }

  private inferStructInstantiation(expr: StructInstantiation, scope: Scope): TypeValue {
    const structDecl = this.structs.get(expr.structName)
    if (!structDecl) return { kind: 'named', name: expr.structName }

    const expectedFields = new Map(structDecl.fields.map(field => [field.name, this.typeFromAnnotation(field.typeAnnotation) ?? ANY_TYPE]))
    for (const field of expr.fields) {
      const actualType = this.inferExpression(field.value, scope)
      const expectedType = expectedFields.get(field.name)
      if (expectedType && !this.isAssignable(actualType, expectedType)) {
        this.pushError(
          field.value,
          'STRUCT_FIELD_TYPE_MISMATCH',
          `Field ${field.name} expects ${this.describeType(expectedType)}, got ${this.describeType(actualType)}.`,
        )
      }
    }

    return { kind: 'named', name: expr.structName }
  }

  private inferWithExpression(expr: WithExpression, scope: Scope): TypeValue {
    const baseType = this.inferExpression(expr.base, scope)
    const updatesType = this.inferObjectLiteral(expr.updates, scope)

    if (baseType.kind === 'object') {
      const updatesObject = updatesType.kind === 'object' ? updatesType.properties : {}
      return {
        kind: 'object',
        properties: {
          ...baseType.properties,
          ...updatesObject,
        },
      }
    }

    if (baseType.kind === 'named') {
      const structDecl = this.structs.get(baseType.name)
      if (!structDecl) {
        return baseType
      }

      const expectedFields = new Map(
        structDecl.fields.map(field => [field.name, this.typeFromAnnotation(field.typeAnnotation) ?? ANY_TYPE]),
      )

      for (const property of expr.updates.properties) {
        const expectedType = expectedFields.get(property.key)
        const actualType = this.inferExpression(property.value, scope)
        if (!expectedType) {
          this.pushError(property.value, 'WITH_UNKNOWN_FIELD', `Field ${property.key} does not exist on ${baseType.name}.`)
          continue
        }
        if (!this.isAssignable(actualType, expectedType)) {
          this.pushError(
            property.value,
            'WITH_FIELD_TYPE_MISMATCH',
            `Field ${property.key} on ${baseType.name} expects ${this.describeType(expectedType)}, got ${this.describeType(actualType)}.`,
          )
        }
      }

      return baseType
    }

    if (!this.isAny(baseType) && baseType.kind !== 'unknown') {
      this.pushError(expr, 'WITH_BASE_INVALID', `with requires an object or named state value, got ${this.describeType(baseType)}.`)
    }

    return baseType
  }

  private inferMemberExpression(expr: MemberExpression, scope: Scope): TypeValue {
    const baseType = this.inferExpression(expr.object, scope)
    if (baseType.kind === 'object') {
      return baseType.properties[expr.property.name] ?? ANY_TYPE
    }
    if (baseType.kind === 'named') {
      const structDecl = this.structs.get(baseType.name)
      if (structDecl) {
        const field = structDecl.fields.find(item => item.name === expr.property.name)
        if (field) return this.typeFromAnnotation(field.typeAnnotation) ?? ANY_TYPE
      }
    }
    return ANY_TYPE
  }

  private inferBlockExpression(block: BlockStatement, scope: Scope): TypeValue {
    if (block.body.length === 0) return VOID_TYPE
    for (const stmt of block.body.slice(0, -1)) {
      this.checkStatement(stmt, scope)
    }

    const last = block.body[block.body.length - 1]
    if (last.type === 'ExpressionStatement') {
      return this.inferExpression((last as ExpressionStatement).expression, scope)
    }
    if (last.type === 'ReturnStatement') {
      return (last as ReturnStatement).argument ? this.inferExpression((last as ReturnStatement).argument!, scope) : VOID_TYPE
    }

    this.checkStatement(last, scope)
    return VOID_TYPE
  }

  private typeFromLiteral(expr: Literal): TypeValue {
    if (typeof expr.value === 'number') {
      return expr.raw.includes('.') ? FLOAT_TYPE : INT_TYPE
    }
    if (typeof expr.value === 'boolean') return BOOL_TYPE
    if (typeof expr.value === 'string') return STRING_TYPE
    return ANY_TYPE
  }

  private typeFromAnnotation(annotation?: TypeAnnotation): TypeValue | undefined {
    if (!annotation) return undefined
    if (annotation.isArray && annotation.params?.[0]) {
      return { kind: 'array', element: this.typeFromAnnotation(annotation.params[0]) ?? ANY_TYPE }
    }
    if (annotation.name === 'Map' && annotation.params?.length === 2) {
      return {
        kind: 'named',
        name: `Map[${this.describeType(this.typeFromAnnotation(annotation.params[0]) ?? ANY_TYPE)},${this.describeType(this.typeFromAnnotation(annotation.params[1]) ?? ANY_TYPE)}]`,
      }
    }
    if (annotation.name === 'Result' && annotation.params?.length === 2) {
      return {
        kind: 'named',
        name: `Result[${this.describeType(this.typeFromAnnotation(annotation.params[0]) ?? ANY_TYPE)},${this.describeType(this.typeFromAnnotation(annotation.params[1]) ?? ANY_TYPE)}]`,
      }
    }
    if (['Int', 'Float', 'Bool', 'String', 'Void', 'Any'].includes(annotation.name)) {
      return { kind: 'primitive', name: annotation.name as PrimitiveTypeName }
    }
    return { kind: 'named', name: annotation.name }
  }

  private isAssignable(actual: TypeValue, expected: TypeValue): boolean {
    if (this.isAny(expected)) return true
    if (this.isAny(actual)) return this.isAny(expected)
    if (actual.kind === 'unknown' || expected.kind === 'unknown') return true
    return this.sameType(actual, expected)
  }

  private sameType(left: TypeValue, right: TypeValue): boolean {
    if (left.kind !== right.kind) return false
    switch (left.kind) {
      case 'primitive':
        return left.name === (right as TypeValue & { kind: 'primitive' }).name
      case 'named':
        return left.name === (right as TypeValue & { kind: 'named' }).name
      case 'array':
        return this.sameType(left.element, (right as TypeValue & { kind: 'array' }).element)
      case 'object': {
        const rightProps = (right as TypeValue & { kind: 'object' }).properties
        const leftKeys = Object.keys(left.properties)
        const rightKeys = Object.keys(rightProps)
        if (leftKeys.length !== rightKeys.length) return false
        return leftKeys.every(key => rightProps[key] && this.sameType(left.properties[key], rightProps[key]))
      }
      case 'unknown':
        return true
      default:
        return false
    }
  }

  private sameNumericType(left: TypeValue, right: TypeValue): left is TypeValue {
    return (this.isInt(left) && this.isInt(right)) || (this.isFloat(left) && this.isFloat(right))
  }

  private isComparableEquality(left: TypeValue, right: TypeValue) {
    if (!this.sameType(left, right) && !this.isAny(left) && !this.isAny(right)) return false
    return this.isPrimitiveComparable(left)
  }

  private isPrimitiveComparable(type: TypeValue) {
    return this.isInt(type) || this.isFloat(type) || this.isBool(type) || this.isString(type) || this.isAny(type)
  }

  private isNumeric(type: TypeValue) {
    return this.isInt(type) || this.isFloat(type)
  }

  private isInt(type: TypeValue) {
    return type.kind === 'primitive' && type.name === 'Int'
  }

  private isFloat(type: TypeValue) {
    return type.kind === 'primitive' && type.name === 'Float'
  }

  private isBool(type: TypeValue) {
    return type.kind === 'primitive' && type.name === 'Bool'
  }

  private isString(type: TypeValue) {
    return type.kind === 'primitive' && type.name === 'String'
  }

  private isAny(type: TypeValue) {
    return type.kind === 'primitive' && type.name === 'Any'
  }

  private describeType(type: TypeValue): string {
    switch (type.kind) {
      case 'primitive':
        return type.name
      case 'array':
        return `[${this.describeType(type.element)}]`
      case 'object':
        return 'Object'
      case 'named':
        return type.name
      case 'unknown':
        return 'Unknown'
    }
  }

  private pushError(node: ASTNode, code: string, message: string) {
    this.diagnostics.push({
      code,
      message,
      severity: 'error',
      location: {
        line: node.location.line,
        column: node.location.column,
      },
    })
  }
}
