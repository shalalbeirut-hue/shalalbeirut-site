// Sets a new temporary password for a staff account (for when the admin forgets theirs).
// The password is asked for on the terminal, hidden while typing, and never written to disk (only its hash is).
// The account is re-activated, signed out everywhere, and must choose a new password at next login.
//
//   node scripts/reset-password.mjs --env production --phone 56607020
//   (--env dev | preview | production)
//
import { webcrypto as crypto } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import readline from 'node:readline';
import { writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
const env = args.env || 'dev';
let phone = String(args.phone || '').replace(/\D/g, '');
if (/^\d{8}$/.test(phone)) phone = '965' + phone;
if (!/^965\d{8}$/.test(phone) || !['dev', 'preview', 'production'].includes(env)) {
  console.error('Usage: node scripts/reset-password.mjs --env dev|preview|production --phone 5xxxxxxx');
  process.exit(1);
}

async function ask(q) {
  if (args.password && env === 'dev') return args.password; // automated local tests only
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl._writeToOutput = (s) => { rl.output.write(s.includes(q) ? q : s.replace(/[^\r\n]/g, '*')); };
  return new Promise((res) => rl.question(q, (a) => { rl.close(); process.stdout.write('\n'); res(a); }));
}

const password = await ask('New temporary password (8+ characters): ');
if (password.length < 8) { console.error('Password too short (8+ characters).'); process.exit(1); }
const again = await ask('Type it again: ');
if (again !== password) { console.error('The two passwords do not match.'); process.exit(1); }

const iterations = 100_000;
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
const b64 = (b) => Buffer.from(b).toString('base64');
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const sql = [
  `UPDATE users SET pass_hash = ${q(`${iterations}$${b64(bits)}`)}, pass_salt = ${q(b64(salt))}, must_change_pass = 1, active = 1 WHERE phone = ${q(phone)};`,
  `DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE phone = ${q(phone)});`,
  `DELETE FROM login_attempts WHERE key = ${q('staff:' + phone)};`,
  `SELECT name, role, CASE WHEN id IS NULL THEN 'not found' ELSE 'updated' END AS result FROM users WHERE phone = ${q(phone)};`,
].join('\n');

const dbArgs = env === 'production'
  ? ['wrangler', 'd1', 'execute', 'shalalbeirut-ops', '--remote']
  : env === 'preview'
    ? ['wrangler', 'd1', 'execute', 'shalalbeirut-ops-preview', '--remote', '--env', 'preview']
    : ['wrangler', 'd1', 'execute', 'shalalbeirut-ops-dev', '--local', '--env', 'dev'];
const dir = mkdtempSync(join(tmpdir(), 'sb-reset-'));
const file = join(dir, 'reset.sql');
writeFileSync(file, sql);
let out = '';
try {
  out = execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', [...dbArgs, '--file', file, '--yes', '--json'], { encoding: 'utf8', shell: process.platform === 'win32', stdio: ['ignore', 'pipe', 'inherit'] });
} finally {
  rmSync(dir, { recursive: true, force: true });
}
const results = JSON.parse(out.slice(out.indexOf('['))).flatMap((r) => r.results ?? []);
const user = results.find((r) => r && r.result);
// Windows shells can garble non-English text in the output, so show the name only when it is plain ASCII (e.g. "Admin").
const label = (n) => (/^[ -~]+$/.test(n ?? '') ? n + ' ' : '');
if (!user) {
  console.error(`No account with the number ${phone} on ${env}. Create one with scripts/create-user.mjs.`);
  process.exit(1);
}
console.log(`Password reset for ${label(user.name)}(${user.role}, ${phone}) on ${env}. They will be asked to choose a new one at next login.`);
