// Creates a staff account directly in the database (use it for the first admin).
// The password is asked for on the terminal, hidden while typing, and never written to disk (only its hash is).
//
//   node scripts/create-user.mjs --env dev|preview|production --name "Name" --phone 5xxxxxxx --role admin
//
import { webcrypto as crypto } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import readline from 'node:readline';
import { writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
const env = args.env || 'dev';
const role = args.role || 'admin';
const name = args.name;
let phone = String(args.phone || '').replace(/\D/g, '');
if (/^\d{8}$/.test(phone)) phone = '965' + phone;
if (!name || !/^965\d{8}$/.test(phone) || !['admin', 'manager', 'cs', 'tech'].includes(role)) {
  console.error('Usage: node scripts/create-user.mjs --env dev|preview|production --name "Name" --phone 5xxxxxxx --role admin|manager|cs|tech');
  process.exit(1);
}

async function ask(q) {
  if (args.password) return args.password; // for automated local test setups only
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  // Hide what is typed: echo * instead of the characters.
  rl._writeToOutput = (s) => { rl.output.write(s.includes(q) ? q : s.replace(/[^\r\n]/g, '*')); };
  return new Promise((res) => rl.question(q, (a) => { rl.close(); process.stdout.write('\n'); res(a); }));
}

const password = await ask('Temporary password (8+ characters, they will change it on first login): ');
if (password.length < 8) { console.error('Password too short.'); process.exit(1); }

const iterations = 100_000;
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
const b64 = (b) => Buffer.from(b).toString('base64');
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const sql = `INSERT INTO users (name, phone, role, pass_hash, pass_salt, must_change_pass) VALUES (${q(name)}, ${q(phone)}, ${q(role)}, ${q(`${iterations}$${b64(bits)}`)}, ${q(b64(salt))}, 1);`;

const dbArgs = env === 'production'
  ? ['wrangler', 'd1', 'execute', 'shalalbeirut-ops', '--remote']
  : env === 'preview'
    ? ['wrangler', 'd1', 'execute', 'shalalbeirut-ops-preview', '--remote', '--env', 'preview']
    : ['wrangler', 'd1', 'execute', 'shalalbeirut-ops-dev', '--local', '--env', 'dev'];
// Pass the SQL as a file: shell quoting on Windows would split a --command argument.
const dir = mkdtempSync(join(tmpdir(), 'sb-user-'));
const file = join(dir, 'user.sql');
writeFileSync(file, sql);
try {
  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', [...dbArgs, '--file', file, '--yes'], { stdio: 'inherit', shell: process.platform === 'win32' });
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log(`Created ${role} ${name} (${phone}) on ${env}.`);
