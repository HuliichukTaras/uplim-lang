# UPLim UI And Component Mini-Spec v0.1.1

This document defines the first-class UI surface required for UPLim to support structured component-based applications without collapsing into one-file string templates.

This is a language-direction document for v0.1.1.
It is intended to shape syntax, module rules, formatter behavior, and future semantic checks.

## 1. Problem

If UI in UPLim is modeled only as plain functions returning strings, the language encourages:

- all UI in one file
- string concatenation instead of composition
- no distinction between views and logic
- no component contracts
- no architectural pressure toward modularity

That is not a user failure.
That is a language design gap.

## 2. Goals

UPLim UI must be:

- component-based
- file-disciplined
- statically analyzable
- AI-readable
- renderable on the server
- compatible with future SSR, WASM, and edge runtimes

## 3. New Core Concepts

### `component`

`component` is a first-class declaration for reusable UI units.

Example:

```upl
export component Navbar() -> Html {
  view {
    nav {
      class: "site-nav"
      text "UPLim"
    }
  }
}
```

Rules:

- components are not generic functions
- components return `Html`
- components are pure by default
- components may accept typed props

### `Html`

`Html` is a built-in UI output type.

Purpose:

- distinguish UI values from `String`
- allow composition without reducing views to arbitrary string hacking
- provide a compiler-visible render target

### `view`

`view` defines structured UI output.

Example:

```upl
component Hero(title: String) -> Html {
  view {
    section {
      class: "hero"
      h1 { text title }
    }
  }
}
```

Rules:

- `view` may appear only inside `component`
- `view` lowers to an internal UI tree, not raw text concatenation
- `view` blocks must remain side-effect free

### `export`

UI modules must expose public surface explicitly.

Example:

```upl
export component Hero() -> Html { ... }
```

Rules:

- no implicit file exports
- entry files import public components through explicit module boundaries

## 4. File Roles

UPLim files may declare one explicit role annotation at file scope.

Initial roles:

- `@ui`
- `@entry`
- `@service`

Example:

```upl
@ui
export component Navbar() -> Html { ... }
```

```upl
@entry
import Navbar from "@/ui/navbar"

fn main() -> Html {
  return Page()
}
```

Rules:

- one role per file
- `@entry` files may not declare components
- `@ui` files should not contain runtime bootstrapping
- `@service` files may not contain `view` blocks

## 5. Import Discipline

UI composition must be import-driven.

Example:

```upl
import Layout from "@/ui/layout"
import Navbar from "@/ui/navbar"
import Hero from "@/ui/hero"
```

Rules:

- entry files compose exported units
- components must be imported from dedicated UI modules
- entry files may not embed unrelated component definitions inline

## 6. Composition Rules

Valid composition:

```upl
component Page() -> Html {
  view {
    Layout {
      Navbar()
      Hero()
      Features()
      Footer()
    }
  }
}
```

Invalid direction:

- concatenating all UI as raw strings
- mixing routing, boot logic, and five component definitions in one entry file
- using `fn` as the only UI abstraction

## 7. Semantic Constraints

The compiler should eventually enforce:

- `component` returns `Html`
- `view` appears only in `component`
- `@entry` and `component` may not coexist in one file
- imported component symbols resolve only to `component` exports
- UI trees remain pure unless capability-marked escape hatches are introduced later

## 8. Formatter Expectations

The canonical formatter should normalize:

- one top-level declaration per semantic unit where possible
- consistent indentation in `view` blocks
- stable ordering of imports
- compact prop and attribute syntax

## 9. Status

This mini-spec is a target for UPLim v0.1.1.

It is not yet the canonical parser/runtime implementation.
Its purpose is to freeze the architectural direction so the language stops encouraging one-file UI blobs.
