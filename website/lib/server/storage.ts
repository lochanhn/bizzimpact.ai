// Small JSON storage for runtime data (AI spend ledger, owner check-ins, live-discovery finds).
// Production containers may have a read-only or root-owned app directory, so:
//  - DATA_DIR sets the location (default: ./data/runtime locally);
//  - if that is not writable, we fall back to the OS temp directory;
//  - a failed write never crashes the request; it is logged and reported to the caller.
// In the 16-week product this moves to Postgres (Supabase is already configured).
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const primary = () => process.env.DATA_DIR || path.join(process.cwd(), 'data', 'runtime');
const fallback = () => path.join(os.tmpdir(), 'bizzimpact');
const resolve = (dir: string, name: string) => (path.isAbsolute(name) ? name : path.join(dir, name));

/** Read JSON from the primary directory, then the fallback; returns `empty` if neither exists. */
export async function readJson<T>(name: string, empty: T): Promise<T> {
  for (const dir of [primary(), fallback()]) {
    try { return JSON.parse(await fs.readFile(/*turbopackIgnore: true*/ resolve(dir, name), 'utf8')) as T; } catch { /* try next */ }
  }
  return empty;
}

/** Write JSON; returns false (never throws) if no location is writable. */
export async function writeJson(name: string, value: unknown): Promise<boolean> {
  const body = JSON.stringify(value, null, 2);
  for (const dir of [primary(), fallback()]) {
    const file = resolve(dir, name);
    try {
      await fs.mkdir(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
      await fs.writeFile(/*turbopackIgnore: true*/ file, body);
      return true;
    } catch { /* try next */ }
  }
  if (process.env.NODE_ENV !== 'test') console.warn(JSON.stringify({ event: 'storage_write_failed', name: path.basename(name) }));
  return false;
}
