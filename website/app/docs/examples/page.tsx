export default function ExamplesPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
        Examples
      </h1>
      
      <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        Fibonacci
      </h2>
      <div className="rounded-md bg-muted p-4">
        <pre className="text-sm font-mono">
{`func fib(n) {
  if n < 2 { return n }
  return fib(n-1) + fib(n-2)
}

say fib(10)`}
        </pre>
      </div>
    </div>
  );
}
