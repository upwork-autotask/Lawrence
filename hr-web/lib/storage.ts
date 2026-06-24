import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';

/**
 * Local-disk file storage for uploads. The on-disk key is a server-generated
 * UUID (never the client filename) so there is no path-traversal surface; the
 * original filename + metadata live in the `attachments` table.
 *
 * Set UPLOAD_DIR for production (a persistent volume / mounted disk). Defaults
 * to `.uploads` under the project root for local dev.
 */
const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR || join(process.cwd(), '.uploads'));

export async function saveUpload(key: string, data: Buffer): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(join(UPLOAD_DIR, key), data);
}

export async function readUpload(key: string): Promise<Buffer> {
  return readFile(join(UPLOAD_DIR, key));
}

export async function deleteUpload(key: string): Promise<void> {
  try {
    await unlink(join(UPLOAD_DIR, key));
  } catch {
    /* already gone — ignore */
  }
}
