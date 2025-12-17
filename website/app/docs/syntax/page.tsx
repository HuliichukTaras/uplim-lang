export default function SyntaxPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
        UPLim Syntax
      </h1>
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        UPLim supports two modes: <strong>Simple</strong> and <strong>Compressed</strong>.
      </p>

      <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        Variables
      </h2>
      <div className="rounded-md bg-muted p-4">
        <pre className="text-sm font-mono">
{`let x = 10
l y = 20  // Compressed mode`}
        </pre>
      </div>

       <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        Functions
      </h2>
      <div className="rounded-md bg-muted p-4">
        <pre className="text-sm font-mono">
{`func add(a, b) {
  return a + b
}

f sub(a, b) => a - b  // Short syntax`}
        </pre>
      </div>
    </div>
  );
}
