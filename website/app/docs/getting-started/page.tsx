export default function GettingStartedPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
        Getting Started with UPLim
      </h1>
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        UPLim is a simple, cross-platform programming language designed for humans.
      </p>
      
      <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        Installation
      </h2>
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        To install the UPLim CLI, use npm:
      </p>
      <div className="rounded-md bg-muted p-4">
        <code className="text-sm font-mono">npm install -g uplim-lang</code>
      </div>
      
      <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        Your First Program
      </h2>
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        Create a file named <code>hello.upl</code>:
      </p>
      <div className="rounded-md bg-muted p-4">
        <pre className="text-sm font-mono">
{`say "Hello, World!"`}
        </pre>
      </div>
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        Run it:
      </p>
        <div className="rounded-md bg-muted p-4">
        <code className="text-sm font-mono">uplim run hello.upl</code>
      </div>
    </div>
  );
}
