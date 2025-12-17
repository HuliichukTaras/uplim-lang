import { readFile } from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"
import ts from "typescript"

const projectRoot = new URL("../", import.meta.url)

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const filePath = path.join(projectRoot.pathname, specifier.slice(2))
    const candidate = filePath.endsWith(".ts") || filePath.endsWith(".tsx") ? filePath : `${filePath}.ts`
    return nextResolve(pathToFileURL(candidate).href, context)
  }

  if ((specifier.startsWith("./") || specifier.startsWith("../")) && !path.extname(specifier)) {
    const candidateUrl = new URL(`${specifier}.ts`, context.parentURL)
    return nextResolve(candidateUrl.href, context)
  }

  return nextResolve(specifier, context)
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".ts") || url.endsWith(".tsx")) {
    const source = await readFile(new URL(url))
    const transpiled = ts.transpileModule(source.toString(), {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.Preserve,
        esModuleInterop: true,
      },
      fileName: url,
    })

    return {
      format: "module",
      shortCircuit: true,
      source: transpiled.outputText,
    }
  }

  return nextLoad(url, context, nextLoad)
}
