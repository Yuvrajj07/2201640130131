import { customAlphabet } from 'nanoid';
import { HttpException } from './errors.js';

const CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nano = customAlphabet(CHARS, 7);

export function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function assertValidShortcode(code) {
  if (typeof code !== 'string') {
    throw new HttpException('Shortcode must be string', 400, 'INVALID_INPUT');
  }
  if (!/^[\w-]{4,30}$/.test(code)) {
    throw new HttpException('Shortcode must be 4-30 characters long and alphanumeric', 400, 'INVALID_FORMAT');
  }
}

export function generateCode() {
  return nano();
}

export function getExpiry(minutes) {
  const duration = Number.isFinite(+minutes) && +minutes > 0 ? +minutes : 30;
  return new Date(Date.now() + duration * 60 * 1000);
}
