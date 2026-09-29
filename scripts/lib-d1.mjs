// Small helpers shared by the account scripts: password hashing and running SQL on D1 through Wrangler.
// Wrangler is started with Node directly (no shell), so SQL and Arabic text pass through unchanged on Windows.
import { webcrypto as crypto } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const WRANGLER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
if (!existsSync(WRANGLER)) {
  console.error('Wrangler is missing. Run npm install in the project folder first.');
  process.exit(1);
}

export const ENVS = {
  dev: ['shalalbeirut-ops-dev', '--local', '--env', 'dev'],
  preview: ['shalalbeirut-ops-preview', '--remote', '--env', 'preview'],
  production: ['shalalbeirut-ops', '--remote'],
};

export function parseArgs(argv) {
  return Object.fromEntries(argv.reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
}

export function kuwaitPhone(v) {
  let p = String(v || '').replace(/\D/g, '');
  if (/^\d{8}$/.test(p)) p = '965' + p;
  return /^965\d{8}$/.test(p) ? p : null;
}

export const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

/** Runs SQL (one or more statements separated by ;) and returns the rows of every statement. */
export function sql(env, statements) {
  const out = execFileSync(process.execPath, [WRANGLER, 'd1', 'execute', ...ENVS[env], '--json', '--yes', '--command', statements], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(out.slice(out.indexOf('['))).map((r) => r.results ?? []);
}

/** Asks for a password on the terminal, showing * instead of the characters. */
export function askHidden(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl._writeToOutput = (s) => { rl.output.write(s.includes(question) ? question : s.replace(/[^\r\n]/g, '*')); };
  return new Promise((res) => rl.question(question, (a) => { rl.close(); process.stdout.write('\n'); res(a); }));
}

export async function hashPassword(password) {
  const iterations = 100_000;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  const b64 = (b) => Buffer.from(b).toString('base64');
  return { hash: `${iterations}$${b64(bits)}`, salt: b64(salt) };
}

export function fail(message) {
  console.error(message);
  process.exit(1);
}
