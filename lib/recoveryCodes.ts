import 'server-only';
import { createHash, randomBytes } from 'node:crypto';

// 32 unambiguous chars (no 0/O, 1/I)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function segment(length: number): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function generateRecoveryCode(): string {
  return `${segment(5)}-${segment(5)}`;
}

export function generateRecoveryCodes(count = 8): string[] {
  const set = new Set<string>();
  while (set.size < count) set.add(generateRecoveryCode());
  return Array.from(set);
}

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}

export function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(normalizeCode(code)).digest('hex');
}
