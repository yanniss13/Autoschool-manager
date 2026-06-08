/**
 * Test de bout en bout ("smoke test") d'AutoSchool Manager.
 *
 * Rejoue automatiquement tout le parcours du MVP et affiche un ✅ / ❌ par étape.
 *
 * Lancement :
 *   npm test
 *   (ou : node test/smoke.cjs)
 *
 * Fonctionnement :
 *   - démarre un serveur dédié sur le port 3100 (n'interfère pas avec `npm run dev`) ;
 *   - effectue de vraies requêtes HTTP (inscription, login, CRUD, affectation, etc.) ;
 *   - vérifie certaines données directement en base via Prisma ;
 *   - supprime ses propres données de test à la fin (la base reste propre) ;
 *   - se termine avec le code 0 si tout passe, 1 sinon.
 */
require('dotenv').config({ quiet: true });

const { spawn } = require('child_process');
const path = require('path');

const app = require('../src/app'); // pour valider le rendu des pages d'erreur
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ROOT = path.join(__dirname, '..');
const PORT = 3100;
const BASE = `http://localhost:${PORT}`;

// Donnees uniques par execution (evite tout conflit d'unicite SIRET / MAC).
const stamp = Date.now();
const siretA = String(stamp).padStart(14, '0').slice(-14);
const siretB = String(stamp + 1).padStart(14, '0').slice(-14);

let pass = 0;
let fail = 0;
function check(name, condition, detail = '') {
  if (condition) {
    console.log('  ✅ ' + name);
    pass++;
  } else {
    console.log('  ❌ ' + name + (detail ? '  ->  ' + detail : ''));
    fail++;
  }
}
function section(title) {
  console.log('\n' + title);
}

// --- Client HTTP avec son propre cookie de session ---
function makeClient() {
  let cookie = '';
  return async function req(p, { method = 'GET', body } = {}) {
    const headers = {};
    if (cookie) headers.Cookie = cookie;
    let payload;
    if (body) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      payload = new URLSearchParams(body).toString();
    }
    const res = await fetch(BASE + p, { method, headers, body: payload, redirect: 'manual' });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    return { status: res.status, location: res.headers.get('location'), text: await res.text() };
  };
}

function macFrom(n) {
  const hex = n.toString(16).toUpperCase().padStart(12, '0').slice(-12);
  return hex.match(/.{2}/g).join(':');
}

function statValue(html, label) {
  const m = html.match(new RegExp('stat-value">(\\d+)</span>\\s*<span class="stat-label">' + label));
  return m ? Number(m[1]) : null;
}

function renderView(view, locals) {
  return new Promise((resolve, reject) => {
    app.render(view, locals, (err, html) => (err ? reject(err) : resolve(html)));
  });
}

async function regLogin(client, siret, businessName) {
  await client('/register', { method: 'POST', body: { businessName, siret, password: 'password123', passwordConfirm: 'password123' } });
  await client('/login', { method: 'POST', body: { siret, password: 'password123' } });
}
async function addEmployee(client, email) {
  await client('/employees', { method: 'POST', body: { firstName: 'Prenom', lastName: 'Nom', email, password: 'secret12' } });
}

// --- Demarrage / attente du serveur ---
function startServer() {
  return spawn(process.execPath, ['src/server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore',
  });
}
async function waitForServer(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(BASE + '/', { redirect: 'manual' });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  throw new Error("Le serveur de test n'a pas demarre sur " + BASE);
}

async function runTests() {
  const a = makeClient();

  section('AUTHENTIFICATION & SESSION');
  let r = await makeClient()('/dashboard');
  check('Dashboard protege sans session (-> /login)', r.status === 302 && r.location === '/login', `status=${r.status}`);
  r = await a('/');
  check('Page d\'accueil accessible aux invites', r.status === 200 && /Bienvenue/.test(r.text), `status=${r.status}`);
  r = await a('/register', { method: 'POST', body: { businessName: 'Auto-École de Test', siret: siretA, directorName: 'Marie Dupont', password: 'password123', passwordConfirm: 'password123' } });
  check('Inscription entreprise valide', r.status === 302 && r.location === '/login', `status=${r.status}`);
  r = await a('/register', { method: 'POST', body: { businessName: 'X', siret: siretA, password: 'password123', passwordConfirm: 'password123' } });
  check('Inscription refusee si SIRET deja pris', r.status === 400 && /déjà enregistré/i.test(r.text), `status=${r.status}`);
  r = await a('/login', { method: 'POST', body: { siret: siretA, password: 'mauvais' } });
  check('Connexion refusee si mauvais mot de passe', r.status === 401 && /Identifiants invalides/.test(r.text), `status=${r.status}`);
  r = await a('/login', { method: 'POST', body: { siret: siretA, password: 'password123' } });
  check('Connexion valide (-> /dashboard)', r.status === 302 && r.location === '/dashboard', `status=${r.status}`);
  r = await a('/');
  check('Gerant connecte redirige depuis / vers /dashboard', r.status === 302 && r.location === '/dashboard', `status=${r.status}`);
  r = await a('/login');
  check('Gerant connecte redirige depuis /login vers /dashboard', r.status === 302 && r.location === '/dashboard', `status=${r.status}`);
  r = await a('/dashboard');
  check('Dashboard accessible une fois connecte', r.status === 200 && /Auto-École de Test/.test(r.text), `status=${r.status}`);

  const companyA = await prisma.company.findUnique({ where: { siret: siretA } });

  section('CRUD EMPLOYÉS');
  await addEmployee(a, 'e1@test.com');
  await addEmployee(a, 'e2@test.com');
  const e1 = await prisma.employee.findFirst({ where: { companyId: companyA.id, email: 'e1@test.com' } });
  check('Mot de passe employe hache (bcrypt)', e1.passwordHash.startsWith('$2'), 'hash invalide');
  r = await a('/employees');
  check('Liste des employes affichee', r.status === 200 && /e1@test\.com/.test(r.text), `status=${r.status}`);
  r = await a('/employees', { method: 'POST', body: { firstName: 'A', lastName: 'B', email: 'pas-un-email', password: 'secret12' } });
  check('Creation refusee si email invalide', r.status === 400 && /valide/i.test(r.text), `status=${r.status}`);
  r = await a('/employees', { method: 'POST', body: { firstName: 'A', lastName: 'B', email: 'e1@test.com', password: 'secret12' } });
  check('Creation refusee si email deja utilise', r.status === 400 && /déjà utilisé/i.test(r.text), `status=${r.status}`);
  const hashBefore = e1.passwordHash;
  await a(`/employees/${e1.id}/update`, { method: 'POST', body: { firstName: 'Jean', lastName: 'Modifie', email: 'e1@test.com', password: '' } });
  let e1b = await prisma.employee.findUnique({ where: { id: e1.id } });
  check('Edition sans mot de passe : hash inchange', e1b.passwordHash === hashBefore && e1b.lastName === 'Modifie', 'hash modifie ?');
  await a(`/employees/${e1.id}/update`, { method: 'POST', body: { firstName: 'Jean', lastName: 'Modifie', email: 'e1@test.com', password: 'nouveau123' } });
  e1b = await prisma.employee.findUnique({ where: { id: e1.id } });
  check('Edition avec nouveau mot de passe : hash change', e1b.passwordHash !== hashBefore, 'hash non change');

  section('CRUD ORDINATEURS');
  const mac1 = macFrom(stamp + 100);
  const mac2 = macFrom(stamp + 101);
  r = await a('/computers', { method: 'POST', body: { macAddress: mac1.toLowerCase().replace(/:/g, '-') } });
  check('Creation ordinateur (MAC minuscule/tirets acceptee)', r.status === 302, `status=${r.status}`);
  let c1 = await prisma.computer.findFirst({ where: { companyId: companyA.id, macAddress: mac1 } });
  check('Adresse MAC normalisee en base (AA:BB:...)', !!c1, 'mac non normalisee');
  r = await a('/computers', { method: 'POST', body: { macAddress: 'zzz' } });
  check('Creation refusee si MAC invalide', r.status === 400 && /valide/i.test(r.text), `status=${r.status}`);
  r = await a('/computers', { method: 'POST', body: { macAddress: mac1.replace(/:/g, '').toLowerCase() } });
  check('Creation refusee si MAC deja utilisee', r.status === 400 && /déjà utilisée/i.test(r.text), `status=${r.status}`);
  await a('/computers', { method: 'POST', body: { macAddress: mac2 } });
  let c2 = await prisma.computer.findFirst({ where: { companyId: companyA.id, macAddress: mac2 } });

  section('AFFECTATION EMPLOYÉ <-> ORDINATEUR');
  await a(`/computers/${c1.id}/assign`, { method: 'POST', body: { employeeId: String(e1.id) } });
  c1 = await prisma.computer.findUnique({ where: { id: c1.id } });
  check('Affectation d\'un employe disponible', c1.employeeId === e1.id, `employeeId=${c1.employeeId}`);
  await a(`/computers/${c2.id}/assign`, { method: 'POST', body: { employeeId: String(e1.id) } });
  c2 = await prisma.computer.findUnique({ where: { id: c2.id } });
  check('Employe deja affecte non reaffectable ailleurs', c2.employeeId === null, `employeeId=${c2.employeeId}`);
  await a(`/computers/${c1.id}/unassign`, { method: 'POST' });
  c1 = await prisma.computer.findUnique({ where: { id: c1.id } });
  check('Desaffectation (employeeId remis a null)', c1.employeeId === null, `employeeId=${c1.employeeId}`);

  section('CLOISONNEMENT MULTI-ENTREPRISES');
  const b = makeClient();
  await regLogin(b, siretB, 'Auto-École Concurrente');
  await addEmployee(b, 'eb@test.com');
  const eb = await prisma.employee.findFirst({ where: { email: 'eb@test.com' } });
  r = await b(`/employees/${e1.id}/edit`);
  check('Entreprise B ne peut pas editer un employe de A (404)', r.status === 404, `status=${r.status}`);
  r = await b(`/employees/${e1.id}/delete`, { method: 'POST' });
  check('Entreprise B ne peut pas supprimer un employe de A (404)', r.status === 404, `status=${r.status}`);
  r = await b(`/computers/${c1.id}/edit`);
  check('Entreprise B ne peut pas editer un ordinateur de A (404)', r.status === 404, `status=${r.status}`);
  r = await b(`/computers/${c1.id}/assign`, { method: 'POST', body: { employeeId: String(eb.id) } });
  check('Entreprise B ne peut pas affecter un ordinateur de A (404)', r.status === 404, `status=${r.status}`);

  section('SUPPRESSIONS');
  await a(`/computers/${c1.id}/assign`, { method: 'POST', body: { employeeId: String(e1.id) } });
  await a(`/computers/${c1.id}/delete`, { method: 'POST' });
  const c1gone = await prisma.computer.findUnique({ where: { id: c1.id } });
  const e1free = await prisma.employee.findUnique({ where: { id: e1.id }, include: { computer: true } });
  check('Suppression d\'un poste affecte : poste supprime + employe libere', !c1gone && e1free && e1free.computer === null, 'incoherent');
  await a(`/employees/${e1.id}/delete`, { method: 'POST' });
  check('Suppression d\'un employe', !(await prisma.employee.findUnique({ where: { id: e1.id } })), 'encore present');

  section('COMPTEURS DU DASHBOARD');
  // Etat attendu pour A : employes = 1 (e2), ordinateurs = 1 (c2), affectes = 0.
  r = await a('/dashboard');
  check('Compteur employes = 1', statValue(r.text, 'Employés') === 1, `val=${statValue(r.text, 'Employés')}`);
  check('Compteur ordinateurs = 1', statValue(r.text, 'Ordinateurs') === 1, `val=${statValue(r.text, 'Ordinateurs')}`);
  check('Compteur postes affectes = 0', statValue(r.text, 'Postes affectés') === 0, `val=${statValue(r.text, 'Postes affectés')}`);
  check('Compteur postes disponibles = 1', statValue(r.text, 'Postes disponibles') === 1, `val=${statValue(r.text, 'Postes disponibles')}`);

  section('DÉCONNEXION & PAGES D\'ERREUR');
  r = await a('/logout', { method: 'POST' });
  check('Deconnexion (-> /login)', r.status === 302 && r.location === '/login', `status=${r.status}`);
  r = await a('/dashboard');
  check('Dashboard de nouveau protege apres deconnexion', r.status === 302 && r.location === '/login', `status=${r.status}`);
  r = await makeClient()('/page-qui-nexiste-pas');
  check('Page inconnue -> 404', r.status === 404 && /introuvable/i.test(r.text), `status=${r.status}`);
  const html404 = await renderView('errors/404', { title: 'Introuvable' });
  check('Vue 404 valide', /introuvable/i.test(html404), 'rendu 404 ko');
  const html500 = await renderView('errors/500', { title: 'Erreur' });
  check('Vue 500 valide', /Une erreur est survenue/i.test(html500), 'rendu 500 ko');
}

async function cleanup() {
  // Supprime les entreprises de test (cascade -> employes + ordinateurs).
  await prisma.company.deleteMany({ where: { siret: { in: [siretA, siretB] } } }).catch(() => {});
  await prisma.$disconnect().catch(() => {});
}

async function main() {
  console.log('AutoSchool Manager — test de bout en bout\n==========================================');
  const server = startServer();
  let crashed = null;
  try {
    await waitForServer();
    await runTests();
  } catch (err) {
    crashed = err;
  } finally {
    server.kill();
    await cleanup();
  }

  console.log('\n==========================================');
  if (crashed) {
    console.log('❌ Erreur pendant l\'execution :', crashed.message);
    process.exit(1);
  }
  console.log(`RÉSULTAT : ${pass} ✅  /  ${fail} ❌`);
  if (fail === 0) {
    console.log('Tout fonctionne. Projet prêt pour la soutenance. 🎉');
  } else {
    console.log('Des étapes ont échoué — voir les ❌ ci-dessus.');
  }
  process.exit(fail === 0 ? 0 : 1);
}

main();
