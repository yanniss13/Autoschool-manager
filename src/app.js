// Configuration de l'application Express : moteur de vues, middlewares globaux,
// session, et routes. Le demarrage du serveur est dans server.js.
const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');

const flash = require('./middlewares/flash');
const csrf = require('./middlewares/csrf');
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
// CSP desactivee volontairement pour ne pas casser le dev local (HTTP) ni les
// petits handlers onsubmit de confirmation. Une CSP stricte est une evolution V2.
app.use(helmet({ contentSecurityPolicy: false }));

// --- Moteur de vues (Twig) ---
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'twig');
// IMPORTANT : twig.js (Node) n'echappe PAS le HTML par defaut. On active
// l'auto-echappement pour neutraliser le XSS stocke : toute {{ variable }} est
// echappee (ex. <script> -> &lt;script&gt;). Aucune vue n'utilise |raw.
app.set('twig options', { autoescape: true });

// --- Middlewares globaux ---
app.use(express.urlencoded({ extended: false })); // parse les formulaires HTML
app.use(express.static(path.join(__dirname, '..', 'public'))); // CSS et assets

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
