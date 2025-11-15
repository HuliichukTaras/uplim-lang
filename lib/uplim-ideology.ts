// UPLim Language Ideology - Core Principles
export const UPLIM_IDEOLOGY = {
  name: "UPLim",
  tagline: "The Human Programming Language",
  motto: "Write once, run everywhere. Simple, safe, and universal.",
  
  core_principles: {
    universality: {
      title: "Universal Compilation",
      rules: [
        "Compile to WebAssembly for browsers, servers, and sandboxed environments",
        "Compile to LLVM IR for native performance on any platform",
        "Transpile to JavaScript/TypeScript when needed for legacy compatibility",
        "One codebase works everywhere: browser, server, mobile, desktop, embedded"
      ],
      targets: ["wasm", "llvm", "native", "javascript", "browser", "server", "mobile", "desktop", "iot", "embedded"],
      keywords: ["universal", "cross-platform", "everywhere", "portable", "compile-once"]
    },
    
    safety: {
      title: "Safe by Default",
      rules: [
        "No null, undefined, or unexpected exceptions",
        "Strong static typing with inference",
        "Memory-safe: no pointers, use-after-free, or race conditions",
        "Thread-safe concurrency enforced by compiler",
        "Built-in Result, Option, and match for error handling"
      ],
      keywords: ["safe", "memory-safe", "type-safe", "thread-safe", "result", "option"]
    },
    
    simplicity: {
      title: "Simple to Use",
      rules: [
        "Natural language-like syntax",
        "Read code like sentences",
        "No computer science degree required",
        "Perfect for learning and prototyping",
        "Minimal syntax with maximum expressiveness"
      ],
      syntax_keywords: ["let", "say", "when", "do", "make", "be", "plus", "minus"],
      avoid_keywords: ["var", "const", "console.log", "function", "def", "fn"],
      keywords: ["simple", "readable", "human-like", "natural"]
    },
    
    speed: {
      title: "Extremely Fast",
      rules: [
        "Always compiled, never just interpreted",
        "Zero-cost abstractions like Rust",
        "Minimal runtime overhead",
        "Cold start under 20ms",
        "Native async/await and event loop"
      ],
      keywords: ["fast", "compiled", "zero-cost", "performance", "async", "native"]
    },
    
    scalability: {
      title: "Scales Effortlessly",
      rules: [
        "Microservices and distributed systems ready",
        "Edge functions (Cloudflare, Deno Deploy, Vercel Edge)",
        "Integration with Redis, Kafka, message queues",
        "Memory and CPU optimized via LLVM"
      ],
      keywords: ["scalable", "microservices", "edge", "distributed"]
    }
  },
  
  compilation_pipeline: {
    frontend: ["UPLim source", "AST", "High-Level IR (HLIR)"],
    middle: ["HLIR", "UPLim Universal IR (UIR)"],
    backends: {
      wasm: "UIR → WebAssembly",
      native: "UIR → LLVM IR → native binaries",
      javascript: "UIR → JavaScript/TypeScript"
    }
  },
  
  interoperability: {
    ffi: ["C ABI bridge", "JavaScript bridge", "JVM bridge (optional)", ".NET bridge (optional)"],
    purpose: "UPLim can call existing libraries and be embedded in other ecosystems"
  },
  
  anti_patterns: [
    "Copying syntax from JavaScript, Python, or Rust",
    "Adding clever syntax that reduces readability",
    "Sacrificing simplicity for performance",
    "Adding features without safety guarantees",
    "Breaking existing code without migration path"
  ],
  
  unique_features: [
    "Universal compilation: WASM + LLVM + JS in one toolchain",
    "Dual syntax: Simple Mode (natural language) and Compact Mode",
    "AI-native: built-in AI agent support (optional)",
    "Self-improving Engine for language evolution",
    "FFI to C, JS, JVM, .NET",
    "LSP integration for all major editors"
  ],
  
  editor_integration: {
    required: ["LSP server", "syntax highlighting", "IntelliSense", "diagnostics", "formatting"],
    optional: ["AI suggestions", "refactoring tools", "performance hints"]
  }
} as const;

export type IdeologyViolation = {
  type: 'syntax' | 'safety' | 'complexity' | 'performance' | 'philosophy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestion: string;
};

export function validateAgainstIdeology(proposal: string): IdeologyViolation[] {
  const violations: IdeologyViolation[] = [];
  const lowerProposal = proposal.toLowerCase();
  
  // Check for banned keywords
  const bannedKeywords = ['var', 'const', 'console.log', 'printf', 'iostream', 'nullptr'];
  bannedKeywords.forEach(keyword => {
    if (lowerProposal.includes(keyword)) {
      violations.push({
        type: 'syntax',
        severity: 'high',
        message: `Using "${keyword}" contradicts UPLim's simplicity principle`,
        suggestion: `Instead of "${keyword}", use UPLim-specific keywords: let, say`
      });
    }
  });
  
  // Check for null/undefined mentions
  if (lowerProposal.includes('null') || lowerProposal.includes('undefined')) {
    violations.push({
      type: 'safety',
      severity: 'critical',
      message: 'UPLim has no null/undefined - this violates safety principles',
      suggestion: 'Use Option<T> or Result<T, E> to represent absence of value'
    });
  }
  
  // Check for non-universal compilation targets
  if (lowerProposal.includes('interpreter only') || lowerProposal.includes('no compilation')) {
    violations.push({
      type: 'philosophy',
      severity: 'critical',
      message: 'UPLim must always support compilation to maintain universality',
      suggestion: 'Ensure all features support WASM, LLVM, and JS compilation targets'
    });
  }
  
  return violations;
}
