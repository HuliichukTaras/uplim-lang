import { Interpreter, Parser } from 'uplim-engine'

const parser = new Parser()
const parseResult = parser.parse('say "Facade OK"', 'facade-smoke.upl')

if (parseResult.errors.length > 0) {
  throw new Error(`Facade parser failed: ${parseResult.errors[0].message}`)
}

if (!parseResult.ast) {
  throw new Error('Facade parser did not produce an AST')
}

const interpreter = new Interpreter()
const output = interpreter.interpret(parseResult.ast)

if (output[0] !== 'Facade OK') {
  throw new Error(`Facade runtime produced unexpected output: ${JSON.stringify(output)}`)
}

console.log('Facade smoke OK')
