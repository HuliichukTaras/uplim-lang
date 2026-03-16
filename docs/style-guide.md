# UPLim Style Guide

This document defines the canonical style direction for production-grade UPLim code.

The goal is not just readable demo syntax.
The goal is code that is deterministic, typed, analyzable, AI-readable, and ready for a real runtime.

## 1. Core Principles

UPLim code should be:

- deterministic
- schema-friendly
- state-aware
- testable
- explicit about effects
- easy for both humans and tools to read

UPLim code should avoid:

- hidden global mutation
- magic numbers without meaning
- JSON-shaped ad hoc objects instead of named data types
- business logic inside integration adapters
- event handling encoded as long `if` chains

## 2. State First

Prefer explicit state containers over scattered globals.

Bad:

```upl
let debug_mode = true
let rooms = [...]
let devices = [...]
```

Better:

```upl
struct SystemState {
  rooms: [Room]
  devices: [Device]
  energy_mode: EnergyMode
  armed: Bool
}

let state = SystemState {
  rooms: [...],
  devices: [...],
  energy_mode: EnergyMode.Normal,
  armed: false
}
```

Rules:

- keep one primary state object per runtime domain
- pass state explicitly into reducers and workflows
- prefer returning new state over implicit mutation

## 3. Named Data Contracts

When data has meaning, give it a named type.

Prefer:

```upl
struct Room {
  name: String
  floor: Int
  temperature: Int
  lights_on: Bool
  secure: Bool
}

struct Device {
  id: String
  kind: DeviceType
  room: String
  active: Bool
  usage_hours: Int
}

enum DeviceType {
  Light,
  Thermostat,
  Security,
  Appliance,
  Motor
}
```

Avoid using anonymous object literals as long-lived domain models.

## 4. Pure Logic Before Effects

Business logic should be pure where possible.

Prefer reducers and transformation functions:

```upl
fn toggle_lights(state: SystemState, room_name: String, on: Bool) -> SystemState {
  return state
}
```

Effects such as logging, network calls, persistence, and AI calls should sit at the edges.

## 5. Derived Data, Not Magic Numbers

Bad:

```upl
let active_count = 5
let total_load = calculate_power_usage(active_count, 60)
```

Better:

```upl
let active_devices = [d | d in state.devices if d.active]
let total_load = calculate_energy(active_devices)
```

Rules:

- compute values from source state when possible
- isolate policy constants in one place
- avoid unexplained literals inside domain workflows

## 6. Events Over If-Chains

Prefer declarative event tables or schedules over repetitive imperative branching.

Better:

```upl
struct Event {
  hour: Int
  action: ActionName
}

enum ActionName {
  MorningRoutine,
  ArmSecurity,
  NightRoutine
}
```

Rules:

- encode triggers as data
- keep dispatch separate from effectful implementation
- make schedules extensible without editing core control flow

## 7. Policies Are First-Class

Security and compliance logic should not be buried in random conditionals.

Direction:

```upl
policy HomeSecurity {
  require all Security devices active at night
  alert if breach
}
```

Until policy syntax becomes executable language surface, keep policy logic in isolated modules with explicit names.

## 8. Structured Logging

Prefer structured logs over free-form output.

Better:

```upl
log({
  level: "INFO",
  module: "ENERGY",
  message: "Eco mode enabled",
  timestamp: now()
})
```

Use `say` for demos, playground output, or intentionally human-facing console output.

## 9. Services Stay Thin

Files in integration layers should adapt external systems, not contain domain policy.

Good boundaries:

- `modules/` contains domain logic
- `schemas/` contains contracts and validation shapes
- `services/` contains adapters
- `ai/` contains prompts, tools, and agent orchestration

Rules:

- no business logic inside `services/`
- no direct imports from `src/` into reusable `modules/`
- no hidden side effects in module initialization

## 10. AI-Native, Not AI-Dependent

UPLim should be excellent for AI systems without turning semantic correctness into model behavior.

Good AI-native code:

- uses named schemas
- passes typed inputs to tools
- keeps prompts versioned
- treats AI outputs as validated data

Bad AI-native code:

- uses untyped free-form blobs as source of truth
- merges prompts, policies, and business logic into one file
- allows AI access from any layer without capability boundaries

## 11. Canonical Quality Bar

A good UPLim file should usually satisfy all of the following:

- domain entities are named
- state is explicit
- functions are small and composable
- data flow is visible
- effects are isolated
- logging is structured
- constants are intentional
- imports follow module boundaries

## 12. Direction

The language should evolve toward:

- stronger state and reducer ergonomics
- better event modeling
- first-class policies
- typed AI orchestration
- a standard library designed for deterministic production code

It should not evolve toward:

- DSL-like imitation without semantics
- uncontrolled globals
- opaque runtime behavior
- syntax sugar that hides ownership of state and effects
