# UPLim AI-Native Architecture

This document defines how UPLim becomes AI-native without making the compiler nondeterministic.

## Product Position

UPLim should feel like a language with AI built in.

That does not mean the compiler guesses code or that semantic correctness depends on model output.
It means the language, standard library, manifest, runtime, and tooling all treat AI as a first-class capability.

## Core Rule

AI is built into the runtime contract, not into the parser or borrow checker.

Compiler phases remain deterministic:

- parsing
- name resolution
- type checking
- ownership and borrow checking
- MIR lowering
- backend lowering

AI behavior happens only at runtime through typed host capabilities.

## Design Principles

- strong typing at the call boundary
- structured outputs instead of free-form parsing whenever possible
- provider abstraction instead of hardcoded vendor logic
- explicit capability gating
- local and remote model support
- typed tool calls and MCP interoperability
- reproducible fallbacks and explicit error handling

## Language Surface

UPLim should expose AI through a standard library such as `std/ai`.

Conceptually:

```uplim
import ai.llm

type FixPlan {
  summary: String
  steps: [String]
  risks: [String]
}

async fn suggest_fix(problem: String): Result<FixPlan, AiError> {
  return await llm.generate<FixPlan>(
    prompt: "Suggest a safe fix for this problem: " + problem,
    model: "reasoning/default"
  )
}
```

AI operations should look like normal async calls returning `Result<T, AiError>`.

## Typed Outputs

UPLim structs intended for AI responses should be compilable into JSON schema contracts.

Compiler/runtime responsibilities:

- derive JSON schema from UPLim type definitions
- pass that schema to the selected provider
- reject malformed or partial results as typed runtime errors
- keep structured parsing out of userland string hacking

## Provider Model

The standard library should expose a provider-neutral client interface.

Suggested provider classes:

- remote OpenAI-compatible
- remote Anthropic-compatible
- local Ollama-compatible
- future custom provider adapters

Provider selection should live in `uplim.toml` and environment configuration, not in language syntax.

## Tool Calling

UPLim should support typed tool invocation through the AI runtime.

Capabilities:

- declare tools in UPLim
- expose tools to models through typed schemas
- validate tool input and output against compiler-known types
- support model-selected tool calls through a controlled runtime loop

## MCP Integration

UPLim should support the Model Context Protocol as the standard way to connect models with external tools and resources.

Initial direction:

- MCP client support in the AI runtime
- typed wrappers for MCP tools and resources
- protocol version negotiation at runtime
- capability-gated access from UPLim programs

## Manifest and Capabilities

AI access must be explicit in `uplim.toml`.

Suggested capability set:

- `ai.remote`
- `ai.local`
- `ai.embedding`
- `ai.tool_call`
- `mcp.client`
- `network.client`
- `filesystem.read`

Suggested manifest shape:

```toml
[ai]
provider = "openai"
model = "gpt-4o-mini"
mode = "structured"
allow_tool_calls = true
allow_mcp = true

[capabilities]
ai_remote = true
ai_local = false
ai_tool_call = true
mcp_client = true
network_client = true
```

## Runtime Execution Model

At runtime:

1. UPLim code calls `std/ai`.
2. Wasmtime host checks declared capabilities.
3. Runtime selects the configured provider adapter.
4. Runtime passes structured schema and tool definitions to the provider.
5. Provider response is validated into compiler-known UPLim types.
6. Errors become `AiError` values, not hidden exceptions.

## Safety Constraints

AI-native does not mean unlimited authority.

Rules:

- no hidden network access
- no implicit filesystem access
- no automatic code execution without explicit tool declarations
- no compiler decisions delegated to models
- no silent fallback from structured mode to loose text mode

## Compiler Implications

The compiler must add support for:

- type-to-schema derivation
- AI capability annotations
- typed tool signature metadata
- async runtime lowering for AI requests
- diagnostics for undeclared AI capabilities

The compiler must not:

- call models during compilation to decide semantics
- accept model output as a source of truth for type safety
