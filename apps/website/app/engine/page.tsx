import type { Metadata } from "next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BrainCircuit,
  Boxes,
  Cpu,
  FileCode2,
  Layers3,
  Rocket,
  Shield,
  Sparkles,
  TerminalSquare,
  Workflow,
} from "lucide-react"

export const metadata: Metadata = {
  title: "UPLim Engine",
  description:
    "The real UPLim engine: compiler pipeline, runtime surface, AI-native capabilities, and the path from prototype to production core.",
  alternates: {
    canonical: "/engine",
  },
  openGraph: {
    title: "UPLim Engine",
    description:
      "Compiler, runtime, Wasm strategy, AI-native capabilities, and the concrete architecture behind UPLim.",
    url: "/engine",
    siteName: "UPLim",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UPLim Engine",
    description:
      "Compiler, runtime, Wasm strategy, AI-native capabilities, and the concrete architecture behind UPLim.",
  },
}

const pillars = [
  {
    icon: FileCode2,
    title: "Compiler frontend",
    body: "Lexer, parser, diagnostics, AST, and the migration path toward HIR and typed MIR in the Rust core.",
  },
  {
    icon: Layers3,
    title: "Runtime surface",
    body: "A small capability-based host ABI for files, HTTP, async tasks, logging, AI access, and MCP tools.",
  },
  {
    icon: Cpu,
    title: "Execution backends",
    body: "TypeScript prototype today, Wasm components plus Wasmtime next, then Cranelift-first native execution.",
  },
  {
    icon: BrainCircuit,
    title: "AI-native layer",
    body: "Typed AI calls, structured outputs, tool calling, and provider abstraction without nondeterministic compilation.",
  },
]

const pipeline = [
  "source",
  "lexer/parser",
  "AST",
  "HIR",
  "typed MIR",
  "borrow-checked MIR",
  "backend IR",
  "artifact",
]

const currentNow = [
  "TypeScript parser and interpreter in the active monorepo",
  "JavaScript emitter for compatibility and playground flows",
  "Manifest-backed project build, render, and serve pipeline",
  "Rust workspace scaffold for uplimc, manifest validation, and parser migration",
]

const nextSteps = [
  "Expand the Rust parser until it covers the active .upl subset",
  "Freeze one readable canonical syntax instead of multiple language modes",
  "Add HIR, name resolution, and semantic checks",
  "Define the Wasm/WIT runtime boundary and move execution off the prototype stack",
]

const runtimeCapabilities = [
  "filesystem",
  "http",
  "async tasks",
  "structured logging",
  "typed host errors",
  "ai providers",
  "tool calling",
  "mcp resources",
]

export default function EnginePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_32%),radial-gradient(circle_at_80%_20%,_rgba(56,189,248,0.14),_transparent_24%),linear-gradient(180deg,_#f8fdff_0%,_#eef9ff_40%,_#ffffff_100%)]">
      <section className="relative overflow-hidden border-b border-sky-100/80">
        <div className="absolute inset-0 opacity-50">
          <div className="absolute left-[8%] top-20 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute right-[10%] top-10 h-52 w-52 rounded-full bg-sky-400/20 blur-3xl" />
        </div>
        <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-4 py-18 sm:px-6 lg:px-8 lg:flex-row lg:items-end lg:justify-between lg:py-24">
          <div className="max-w-3xl">
            <Badge className="mb-5 rounded-full bg-sky-100 px-4 py-1 text-sky-800 hover:bg-sky-100">
              Real compiler and runtime surface
            </Badge>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              UPLim Engine is the concrete architecture behind the language.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
              One readable syntax, one real toolchain, and one portable execution model for web, backend, and
              AI-native applications.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#runtime-contract" className="inline-flex">
                <Button size="lg" className="rounded-full bg-sky-600 px-6 text-white hover:bg-sky-700">
                  Explore Runtime
                </Button>
              </a>
              <a href="#roadmap" className="inline-flex">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-sky-200 bg-white/80 px-6 text-slate-800 hover:bg-sky-50"
                >
                  View Roadmap
                </Button>
              </a>
            </div>
          </div>

          <Card className="w-full max-w-xl border-sky-200/80 bg-slate-950 text-slate-100 shadow-[0_24px_80px_-32px_rgba(2,132,199,0.55)]">
            <CardHeader className="border-b border-white/10 pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <TerminalSquare className="h-5 w-5 text-sky-300" />
                Canonical pipeline
              </CardTitle>
              <CardDescription className="text-slate-300">
                One lowering path from readable UPLim code to portable and native artifacts.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-3">
                {pipeline.map((step, index) => (
                  <div
                    key={step}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <span className="font-mono text-sm text-sky-100">{step}</span>
                    <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-10 flex max-w-3xl flex-col gap-4">
          <Badge variant="outline" className="w-fit rounded-full border-sky-200 bg-white/70 px-4 py-1 text-sky-700">
            Engine pillars
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Four parts define the real engine surface.
          </h2>
          <p className="text-lg leading-8 text-slate-700">
            UPLim Engine describes how the language is compiled, how it runs, how it stays safe, and how AI
            integrates without becoming compiler magic.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {pillars.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="border-sky-100 bg-white/85 shadow-sm backdrop-blur">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl text-slate-950">{title}</CardTitle>
                <CardDescription className="text-base leading-7 text-slate-700">{body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section id="roadmap" className="border-y border-sky-100/80 bg-white/75">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-20">
          <Card className="border-sky-100 bg-white/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl text-slate-950">
                <Workflow className="h-6 w-6 text-sky-700" />
                What exists now
              </CardTitle>
              <CardDescription className="text-base leading-7 text-slate-700">
                The current repo already contains useful engine pieces. The problem was naming and positioning, not the
                absence of technical substance.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {currentNow.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm leading-6 text-slate-800"
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-emerald-100 bg-emerald-50/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl text-slate-950">
                <Rocket className="h-6 w-6 text-emerald-700" />
                What comes next
              </CardTitle>
              <CardDescription className="text-base leading-7 text-slate-700">
                This page points to the actual implementation roadmap instead of a legacy status dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {nextSteps.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-sm leading-6 text-slate-800"
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <Card id="runtime-contract" className="border-slate-200 bg-slate-950 text-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Shield className="h-6 w-6 text-cyan-300" />
                Runtime contract
              </CardTitle>
              <CardDescription className="text-slate-300">
                The runtime stays small, explicit, and capability-gated.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {runtimeCapabilities.map((item) => (
                <Badge
                  key={item}
                  className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-slate-100 hover:bg-white/8"
                >
                  {item}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card className="border-sky-100 bg-white/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl text-slate-950">
                <Boxes className="h-6 w-6 text-sky-700" />
                Canonical language feel
              </CardTitle>
              <CardDescription className="text-base leading-7 text-slate-700">
                UPLim should stay readable and direct. Natural words like <span className="font-mono">be</span>,{" "}
                <span className="font-mono">plus</span>, <span className="font-mono">equals</span>, and{" "}
                <span className="font-mono">when ... do</span> can live in the main language as long as they lower to
                one consistent AST.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-3xl bg-sky-50 p-5 text-sm leading-7 text-slate-900">
                <code>{`let name be "UPLim"
say "Hello" plus name
when name equals "UPLim" do
  say "Welcome to the future!"`}</code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-t border-sky-100/80 bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-600">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
          <Badge className="rounded-full bg-white/15 px-4 py-1 text-white hover:bg-white/15">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Engine page, redefined
          </Badge>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">
            UPLim Engine now means the real compiler and runtime story.
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-cyan-50">
            This route now presents the language architecture, execution model, and next implementation steps instead
            of an old control panel.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#runtime-contract" className="inline-flex">
              <Button size="lg" className="rounded-full bg-white px-6 text-sky-700 hover:bg-sky-50">
                Inspect Runtime
              </Button>
            </a>
            <a href="#roadmap" className="inline-flex">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
              >
                Follow Roadmap
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
