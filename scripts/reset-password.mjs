// Sets a new temporary password for a staff account (for when the admin forgets theirs).
// The password is asked for on the terminal, hidden while typing, and never written to disk (only its hash is).
// The account is re-activated, signed out everywhere, its failed-login block is cleared,
// and it must choose a new password at next login.
//
//   node scripts/reset-password.mjs --env production --phone 56607020
//   (--env dev | preview | production)
//
import { ENVS, parseArgs, kuwaitPhone, q, sql, askHidden, hashPassword, fail } from './lib-d1.mjs';

const args = parseArgs(process.argv.slice(2));
const env = args.env || 'dev';
const phone = kuwaitPhone(args.phone);
if (!ENVS[env] || !phone) fail('Usage: node scripts/reset-password.mjs --env dev|preview|production --phone 5xxxxxxx');

const [found] = sql(env, `SELECT id, role FROM users WHERE phone = ${q(phone)}`);
if (!found.length) fail(`No account with the number ${phone} on ${env}. Create one with:\n  node scripts/create-user.mjs --env ${env} --phone ${phone.slice(3)} --role admin`);
const user = found[0];

const devPassword = args.password && env === 'dev';
const password = devPassword ? args.password : await askHidden('New temporary password (8+ characters): ');
if (password.length < 8) fail('Password too short (8+ characters).');
if (!devPassword && (await askHidden('Type it again: ')) !== password) fail('The two passwords do not match.');

const h = await hashPassword(password);
sql(env, [
  `UPDATE users SET pass_hash = ${q(h.hash)}, pass_salt = ${q(h.salt)}, must_change_pass = 1, active = 1 WHERE id = ${user.id}`,
  `DELETE FROM sessions WHERE user_id = ${user.id}`,
  `DELETE FROM login_attempts WHERE key = ${q('staff:' + phone)}`,
].join('; '));
const [after] = sql(env, `SELECT pass_hash FROM users WHERE id = ${user.id}`);
if (after[0]?.pass_hash !== h.hash) fail('Something went wrong: the password was not saved. Try again.');
console.log(`Password reset for the ${user.role} account ${phone} on ${env}. Log in with the number and the new password; you will be asked to choose your own.`);
