export default function StdLibPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
        Standard Library
      </h1>
      <p className="leading-7 [&:not(:first-child)]:mt-6">
        Core modules available in UPLim.
      </p>

      <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        Math
      </h2>
      <p className="leading-7">
        Basic mathematical functions.
      </p>

      <h2 className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
        IO
      </h2>
      <p className="leading-7">
        Input/Output operations (`print`, `read`).
      </p>
    </div>
  );
}
