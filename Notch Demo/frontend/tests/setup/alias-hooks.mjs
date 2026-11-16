import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";

const root = resolvePath(fileURLToPath(new URL("../../", import.meta.url)));

function withExtension(path) {
  for (const candidate of [path, `${path}.ts`, `${path}.tsx`, `${path}/index.ts`]) {
    if (existsSync(candidate) && !candidate.endsWith("/") && (candidate.endsWith(".ts") || candidate.endsWith(".tsx") || candidate.endsWith(".mjs") || candidate.endsWith(".js"))) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@advisor/")) {
    const file = withExtension(resolvePath(root, "../Advisor-Mahmoud", specifier.slice(9)));
    if (file) return next(pathToFileURL(file).href, context);
  }
  if (specifier.startsWith("@/")) {
    const file = withExtension(resolvePath(root, specifier.slice(2)));
    if (file) return next(pathToFileURL(file).href, context);
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    const file = withExtension(resolvePath(fileURLToPath(new URL(".", context.parentURL)), specifier));
    if (file) return next(pathToFileURL(file).href, context);
  }
  return next(specifier, context);
}
