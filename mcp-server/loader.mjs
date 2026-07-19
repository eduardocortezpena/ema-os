// Resolve hook para correr el cliente Prisma generado (imports TS sin
// extensión, pensados para bundler) en Node puro — sin tsx ni bundler.
// ponytail: hook mínimo. Solo agrega .ts a specifiers relativos sin extensión
// o con extensión .js/.mjs; los bare packages y builtins pasan directos a Node.
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { existsSync } from 'node:fs';

export async function resolve(specier, context, nextResolve) {
  const specifier = specier;
  if (!specifier.startsWith('.') && !specifier.startsWith('file://')) {
    return nextResolve(specifier, context);
  }
  try {
    return await nextResolve(specifier, context);
  } catch {
    // falla (ERR_MODULE_NOT_FOUND) → probar variantes con extensión .ts
  }
  const base = context.parentURL ? new URL(context.parentURL) : new URL('file://./');
  const url = new URL(specifier, base);
  const filePath = fileURLToPath(url);
  const ext = path.extname(filePath);
  const candidates = [];
  if (ext === '') {
    for (const e of ['.ts', '.tsx', '.mts']) candidates.push(filePath + e);
    candidates.push(path.join(filePath, 'index.ts'));
  } else if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
    candidates.push(filePath.slice(0, -ext.length) + '.ts');
  }
  for (const c of candidates) {
    if (existsSync(c)) {
      // Delegar a Node: que infiera el formato por la extensión .ts y aplique
      // type-stripping. NO forzar format (rompería el strip → `as const` falla).
      return nextResolve(pathToFileURL(c).href, context);
    }
  }
  return nextResolve(specifier, context);
}
