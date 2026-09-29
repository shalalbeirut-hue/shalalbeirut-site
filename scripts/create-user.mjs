// Creates a staff account directly in the database (use it for the first admin).
// The password is asked for on the terminal, hidden while typing, and never written to disk (only its hash is).
//
//   node scripts/create-user.mjs --env production --phone 56607020 --role admin      (name defaults to "Admin")
//   node scripts/create-user.mjs --env dev|preview|production --name "Name" --phone 5xxxxxxx --role admin|manager|cs|tech
//   Forgot a password? node scripts/reset-password.mjs --env production --phone 56607020
//
import { ENVS, parseArgs, kuwaitPhone, q, sql, askHidden, hashPassword, fail } from './lib-d1.mjs';

const args = parseArgs(process.argv.slice(2));
const env = args.env || 'dev';
const role = args.role || 'admin';
const name = args.name || (role === 'admin' ? 'Admin' : undefined);
const phone = kuwaitPhone(args.phone);
if (!ENVS[env] || !name || !phone || !['admin', 'manager', 'cs', 'tech'].includes(role)) {
  fail('Usage: node scripts/create-user.mjs --env dev|preview|production --phone 5xxxxxxx --role admin [--name "Name"]');
}

const [existing] = sql(env, `SELECT id, role, active FROM users WHERE phone = ${q(phone)}`);
if (existing.length) {
  fail(`The number ${phone} already has an account on ${env} (${existing[0].role}).\nTo set a new password run:\n  node scripts/reset-password.mjs --env ${env} --phone ${phone.slice(3)}`);
}

const devPassword = args.password && env === 'dev';
const password = devPassword ? args.password : await askHidden('Temporary password (8+ characters, you will change it on first login): ');
if (password.length < 8) fail('Password too short (8+ characters).');
if (!devPassword && (await askHidden('Type it again: ')) !== password) fail('The two passwords do not match.');

const h = await hashPassword(password);
sql(env, `INSERT INTO users (name, phone, role, pass_hash, pass_salt, must_change_pass) VALUES (${q(name)}, ${q(phone)}, ${q(role)}, ${q(h.hash)}, ${q(h.salt)}, 1)`);
const [check] = sql(env, `SELECT id FROM users WHERE phone = ${q(phone)}`);
if (!check.length) fail('Something went wrong: the account was not saved. Try again.');
console.log(`Created ${role} account for ${phone} on ${env}. Log in with the number and this password; you will be asked to choose a new one.`);
