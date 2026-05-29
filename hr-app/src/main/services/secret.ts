import { app, safeStorage } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const SECRET_FILE = 'jwt-secret.enc';

/**
 * Loads or creates the JWT signing secret. Stored encrypted with the OS keychain
 * (safeStorage) under userData. The plaintext never touches disk.
 */
export function getOrInitJwtSecret(): string {
  const file = path.join(app.getPath('userData'), SECRET_FILE);

  if (fs.existsSync(file)) {
    try {
      const buf = fs.readFileSync(file);
      if (safeStorage.isEncryptionAvailable()) {
        return safeStorage.decryptString(buf);
      }
      // Fallback: file holds plaintext base64 if encryption isn't available.
      return buf.toString('utf8');
    } catch {
      // If decryption fails (corrupted, key changed), regenerate below.
    }
  }

  const raw = crypto.randomBytes(48).toString('base64');
  if (safeStorage.isEncryptionAvailable()) {
    fs.writeFileSync(file, safeStorage.encryptString(raw));
  } else {
    fs.writeFileSync(file, raw, 'utf8');
  }
  return raw;
}
