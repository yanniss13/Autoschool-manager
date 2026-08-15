// Configuration de l'application Express : moteur de vues, middlewares globaux,
// session, et routes. Le demarrage du serveur est dans server.js.
const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');

const flash = require('./middlewares/flash');
const csrf = require('./middlewares/csrf');
const cspNonce = require('./middlewares/cspNonce');
const routes = require('./routes');

const app = express();

// En production, l'app tourne derriere un reverse-proxy (HTTPS termine par Nginx,
// etc.). "trust proxy" permet a Express de lire X-Forwarded-* : cookie `secure`
// correct et rate-limiter base sur la vraie IP client (sinon tout serait compte
// sous l'IP du proxy, rendant la limite contournable).
const isProd = process.env.NODE_ENV === 'production';
if (isProd) app.set('trust proxy', 1);

// --- Securite : en-tetes HTTP (Helmet) ---
// Ajoute X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS, etc.
// CSP stricte : pas de 'unsafe-inline' pour les scripts (les handlers inline ont ete
// externalises) ; le seul script inline restant (anti-flash du theme) passe par un nonce
// par requete. 'unsafe-inline' reste sur les styles (FullCalendar et variables CSS inline).
app.use(cspNonce);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
        scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
        // 'unsafe-inline' reste requis pour les styles (FullCalendar + variables CSS inline).
        // Police auto-hebergee -> plus besoin d'autoriser Google Fonts.
        styleSrc: ["'self'", "'unsafe-inline'"],
        // 'data:' requis pour la police d'icones embarquee de FullCalendar (chevrons de
        // navigation) injectee en data: URI ; sans ca le navigateur la bloque (CSP) et
        // les fleches du calendrier disparaissent.
        fontSrc: ["'self'", 'data:'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        // En dev (HTTP local), on NE force PAS https sur les sous-ressources, sinon
        // le navigateur tenterait de charger CSS/JS en https et casserait la page.
        upgradeInsecureRequests: isProd ? [] : null,
      },
    },
  })
);

// --- Moteur de vues (Twig) ---
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'twig');
// IMPORTANT : twig.js (Node) n'echappe PAS le HTML par defaut. On active
// l'auto-echappement pour neutraliser le XSS stocke : toute {{ variable }} est
// echappee (ex. <script> -> &lt;script&gt;). Aucune vue n'utilise |raw.
app.set('twig options', { autoescape: true });

// --- Middlewares globaux ---
// Compression gzip/brotli des reponses (HTML, CSS, JS). Gros gain de poids reseau
// sur les bundles vendor (FullCalendar, ApexCharts) servis en clair sinon.
app.use(compression());
app.use(express.urlencoded({ extended: false })); // parse les formulaires HTML
// Assets statiques avec cache navigateur en production. maxAge 0 en dev pour voir
// les changements immediatement. Pas d'`immutable` : les noms de fichiers ne sont
// pas versionnes (hash), donc le navigateur doit revalider apres expiration.
app.use(
  express.static(path.join(__dirname, '..', 'public'), {
    maxAge: isProd ? '7d' : 0,
  })
); // CSS et assets

// --- Session ---
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // cookie non lisible en JS (anti-vol par XSS)
      sameSite: 'lax', // pas envoye en cross-site (couche anti-CSRF supplementaire)
      secure: isProd, // cookie transmis uniquement en HTTPS (production)
      maxAge: 1000 * 60 * 60 * 2, // 2 heures
    },
  })
);

// Messages flash disponibles dans toutes les vues.
app.use(flash);

// Protection CSRF : jeton de session verifie sur les POST/PUT/PATCH/DELETE.
app.use(csrf);

// --- Routes ---
// Page d'accueil publique. Un gerant deja connecte est envoye au dashboard.
app.get('/', (req, res) => {
  if (req.session && req.session.authRole === 'employee' && req.session.employeeId) {
    return res.redirect('/employee-space');
  }
  if (req.session && req.session.authRole === 'student' && req.session.studentId) {
    return res.redirect('/student-space');
  }
  if (req.session && req.session.companyId) return res.redirect('/dashboard');
  res.render('index', { title: 'Accueil' });
});

// Modules applicatifs (auth, dashboard, ...).
app.use(routes);

// --- 404 ---
app.use((req, res) => {
  res.status(404).render('errors/404', { title: 'Page introuvable' });
});

// --- Gestion des erreurs ---
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('errors/500', { title: 'Erreur' });
});

module.exports = app;
