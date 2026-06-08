// Configuration de l'application Express : moteur de vues, middlewares globaux,
// session, et routes. Le demarrage du serveur est dans server.js.
const path = require('path');
const express = require('express');
const session = require('express-session');

const flash = require('./middlewares/flash');
const routes = require('./routes');

const app = express();

// --- Moteur de vues (Twig) ---
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'twig');

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
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 2, // 2 heures
    },
  })
);

// Messages flash disponibles dans toutes les vues.
app.use(flash);

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
