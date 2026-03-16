# UPLim `std/ai` API Specification

This document defines the first executable API contract for UPLim's AI-native standard library.

The goal is to make AI feel built in while preserving:

- deterministic compilation
- typed program flow
- capability-gated runtime access
- provider abstraction

## Design Rules

- every AI operation is explicit
- every AI operation is async
- typed generation requires schema-derivable target types
- AI failures return `AiError`, not untyped exceptions
- tool calling and MCP access require explicit capabilities

## Module Layout

Recommended stdlib layout:

```text
std/
└── ai/
    ├── mod.upl
    ├── llm.upl
    ├── embedding.upl
    ├── tools.upl
    ├── mcp.upl
    └── types.upl
```

## Core Types

```upl
enum AiProvider {
  OpenAI
  Anthropic
  Ollama
  Custom(name: String)
}

enum AiMode {
  Structured
  Text
  Tooling
}

type AiModelConfig {
  provider: AiProvider
  model: String
  mode: AiMode
  temperature: Float
}

type EmbeddingVector {
  values: [Float]
}

enum AiError {
  CapabilityDenied(capability: String)
  ProviderNotConfigured
  ModelUnavailable(model: String)
  InvalidSchema(reason: String)
  InvalidResponse(reason: String)
  ToolCallDenied(tool: String)
  McpUnavailable
  NetworkFailure(reason: String)
  Timeout
}
```

## Structured Generation

Primary API:

```upl
async fn generate<T>(
  prompt: String,
  model: String
): Result<T, AiError>
```

Rules:

- `T` must be schema-derivable
- runtime must request structured output from the configured provider
- runtime must reject free-form output when `T` is requested

Extended variant:

```upl
async fn generate_with<T>(
  prompt: String,
  config: AiModelConfig
): Result<T, AiError>
```

## Free-Text Generation

For explicitly unstructured use:

```upl
async fn complete(
  prompt: String,
  model: String
): Result<String, AiError>
```

This must not be used where typed structured flow is expected.

## Embeddings

```upl
async fn embed(
  input: String,
  model: String
): Result<EmbeddingVector, AiError>
```

Batch form:

```upl
async fn embed_many(
  input: [String],
  model: String
): Result<[EmbeddingVector], AiError>
```

## Tool Calling

Tool declarations must be typed.

Conceptual surface:

```upl
type ToolSpec<TIn, TOut> {
  name: String
  description: String
}

async fn call_tool<TIn, TOut>(
  prompt: String,
  tool: ToolSpec<TIn, TOut>,
  model: String
): Result<TOut, AiError>
```

Rules:

- `TIn` and `TOut` must be schema-derivable
- runtime exposes tool schema to the provider
- runtime validates both tool input and tool output

## MCP Client

Conceptual surface:

```upl
type McpSession {
  server_name: String
  protocol_version: String
}

async fn mcp_connect(
  server: String
): Result<McpSession, AiError>

async fn mcp_call<TOut>(
  session: McpSession,
  tool: String,
  args: Map[String, Any]
): Result<TOut, AiError>
```

Rules:

- MCP access requires `mcp_client`
- protocol version negotiation happens at connect time
- typed wrappers may sit on top of generic MCP calls

## Capability Mapping

`std/ai` functions map to manifest capabilities:

- `generate` with remote provider -> `ai_remote` and `network_client`
- `generate` with local provider -> `ai_local`
- `embed` -> `ai_embedding`
- `call_tool` -> `ai_tool_call`
- `mcp_connect` and `mcp_call` -> `mcp_client`

Undeclared access is a hard runtime error and should be diagnosable at compile time where configuration is known.

## Compiler Requirements

To support this API, the compiler must implement:

- schema derivation from UPLim types
- typed async lowering for AI operations
- diagnostics for missing capabilities
- metadata emission for tool schemas

## Runtime Requirements

The runtime must implement:

- provider adapters
- structured output enforcement
- schema validation
- timeout and cancellation
- typed error translation
- capability checks before provider execution

## Example

```upl
import ai.llm

type BugReport {
  summary: String
  root_cause: String
  safe_fix: String
}

async fn explain_bug(trace: String): Result<BugReport, AiError> {
  return await llm.generate<BugReport>(
    prompt: "Analyze this trace and return a safe fix plan: " + trace,
    model: "reasoning/default"
  )
}
```
