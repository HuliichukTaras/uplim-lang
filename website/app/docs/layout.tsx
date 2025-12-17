import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
       <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
             <Link href="/" className="font-bold text-xl">UPLim</Link>
          </div>
          <div className="flex items-center gap-4">
              <Link href="/docs/getting-started">Docs</Link>
              <Link href="/">Home</Link>
          </div>
        </div>
      </nav>

      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block border-r">
          <div className="h-full py-6 pr-6 lg:py-8 overflow-y-auto">
            <div className="w-full">
              <div className="mb-4">
                <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-semibold">
                  Getting Started
                </h4>
                <div className="grid grid-flow-row auto-rows-max text-sm">
                  <Link
                    href="/docs/getting-started"
                    className="group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:underline text-muted-foreground"
                  >
                    Introduction
                  </Link>
                   <Link
                    href="/docs/installation"
                    className="group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:underline text-muted-foreground"
                  >
                    Installation
                  </Link>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-semibold">
                  Reference
                </h4>
                <div className="grid grid-flow-row auto-rows-max text-sm">
                  <Link
                    href="/docs/syntax"
                    className="group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:underline text-muted-foreground"
                  >
                    Syntax
                  </Link>
                  <Link
                    href="/docs/stdlib"
                    className="group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:underline text-muted-foreground"
                  >
                    Standard Library
                  </Link>
                </div>
              </div>

               <div className="mb-4">
                <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-semibold">
                  Guides
                </h4>
                <div className="grid grid-flow-row auto-rows-max text-sm">
                  <Link
                    href="/docs/examples"
                    className="group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:underline text-muted-foreground"
                  >
                    Examples
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </aside>
        <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
          <div className="mx-auto w-full min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
