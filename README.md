# AutoSchool Manager

Application web interne de gestion d'une **auto-école** : personnel, véhicules,
élèves, planning, espace élève et entraînement au code de la route.

## Résumé fonctionnel

Une auto-école crée un compte (entreprise). Son **gérant** se connecte avec son
SIRET et son mot de passe, puis accède à un **tableau de bord protégé** depuis
lequel il administre **ses employés** (moniteurs, secrétaires, assistants
administratifs), **ses véhicules**, **ses élèves** et le **planning**. Le gérant peut
**affecter un véhicule à un employé référent**, à condition que cet employé ne
soit pas déjà référent d'un autre véhicule.

Les élèves disposent d'un accès dédié par **email + mot de passe** : ils voient
leur planning automatiquement, peuvent lancer des sessions d'entraînement au code
de la route et poser des questions à un assistant local.

Chaque auto-école est **totalement cloisonnée** : un gérant ne voit jamais les
données d'une autre entreprise.

> Périmètre volontairement ciblé : c'est un outil interne d'auto-école, pas un
> ERP complet (pas de facturation, examens officiels, livret d'apprentissage ou
> paiement en ligne).

## Stack technique

| Domaine | Choix |
|---|---|
| Runtime | **Node.js** (≥ 18) |
| Serveur HTTP | **Express 5** |
| Sessions | **express-session** (cookie signé) |
| Vues (rendu serveur) | **Twig** |
| ORM | **Prisma 6** |
| Base de données | **SQLite** |
| Hachage des mots de passe | **bcrypt** |
| Style | **CSS custom** (sans framework) |

## Fonctionnalités obligatoires réalisées

- [x] Inscription d'une auto-école (raison sociale, SIRET unique, mot de passe haché, directeur optionnel)
- [x] Connexion du gérant (SIRET + mot de passe) et déconnexion
- [x] Dashboard protégé par session
- [x] CRUD complet des employés
- [x] CRUD complet des véhicules
- [x] Affectation d'un véhicule à un employé **uniquement s'il n'est pas déjà référent d'un autre véhicule**
- [x] Désaffectation d'un véhicule
- [x] Planning simple : le gérant crée des créneaux pour ses employés
- [x] Connexion employé (email + mot de passe) et espace employé en lecture seule
- [x] Affichage automatique du véhicule affecté dans l'espace employé
- [x] Connexion élève (email + mot de passe) et espace élève en lecture seule
- [x] Planning élève automatique à partir des créneaux saisis par le gérant
- [x] Entraînement local au code de la route avec progression par thème
- [x] Assistant local pour les questions de code de la route
- [x] Compteurs du dashboard (employés, véhicules, véhicules affectés / disponibles)
- [x] CSS propre et homogène sur toutes les pages

## Choix techniques importants

- **Architecture en couches** : `routes → controllers → services`, avec
  `validators` et `middlewares` isolés. Lisible et facile à faire évoluer.
- **Cloisonnement multi-tenant** : toutes les requêtes Prisma sont filtrées par
  le `companyId` **issu de la session** (jamais d'un paramètre client). Toute
  ressource d'une autre entreprise renvoie **404**, sans fuite d'information.
- **Règle métier au niveau base** : la clé étrangère `employeeId` est portée par
  `Vehicle` et marquée `@unique` → un employé ne peut pas être référent de deux
  véhicules, garanti par la base elle-même, pas seulement par le code.
- **Affectation transactionnelle** : la vérification (véhicule libre + employé
  disponible + même entreprise) et l'écriture sont exécutées dans une
  **transaction Prisma** (tout réussit ensemble ou rien).
- **Sécurité** : mots de passe hachés avec bcrypt, jamais stockés ni affichés en
  clair ; validation **systématiquement refaite côté serveur** ; pattern
  **Post/Redirect/Get** après chaque écriture.
- **Planning simple** : les créneaux sont rattachés à un employé et à son
  entreprise ; le véhicule affiché vient de l'affectation actuelle de l'employé.
- **Espace élève** : l'élève est authentifié par email + mot de passe, puis ne lit
  que ses propres créneaux. Les sessions de code de la route sont enregistrées
  avec `studentId` et `companyId`.
- **Assistant code local** : première version sans API externe, basée sur des
  réponses guidées par mots-clés et une banque de questions locale.
- **GET / POST uniquement** : les formulaires HTML natifs ne gèrent que ces deux
  verbes, cohérent avec un rendu serveur sans JavaScript.

## Sécurité

Défense en profondeur adaptée à un rendu serveur :

- **Mots de passe** hachés avec **bcrypt** (jamais stockés ni affichés en clair) ;
  longueur min. 8 et max. 72 octets (limite bcrypt → pas de troncature silencieuse).
- **Protection CSRF** par jeton de session (*synchronizer token*) : champ caché
  `_csrf` dans chaque formulaire + balise meta, vérifié sur tout POST/PUT/PATCH/DELETE.
- **En-têtes HTTP** durcis via **Helmet** (X-Content-Type-Options, X-Frame-Options,
  Referrer-Policy, HSTS…).
- **Auto-échappement Twig** activé : toute `{{ variable }}` est échappée (anti-XSS
  stocké) ; aucune vue n'utilise `|raw`.
- **Cookie de session** `httpOnly`, `sameSite=lax`, et `secure` en production.
- **Régénération de session à la connexion** (anti *session-fixation*).
- **Limitation de débit** (rate-limiting) sur la connexion (anti brute-force) et
  l'inscription (anti création massive de comptes).
- **Validation systématiquement refaite côté serveur** ; identifiants d'URL validés
  (toute ressource inexistante ou d'une autre entreprise → **404**, sans fuite).
- **Fail-fast au démarrage** si `SESSION_SECRET` est absent (pas de repli silencieux
  sur un secret faible).

## Structure du projet

```
ProjetRH/
├── prisma/
│   ├── schema/                # Schéma Prisma découpé : base + un fichier par modèle
│   ├── migrations/            # Migrations versionnées
│   └── dev.db                 # Base SQLite (générée)
├── src/
│   ├── app.js                 # Configuration Express (vues, session, routes)
│   ├── server.js              # Point d'entrée HTTP
│   ├── config/prisma.js       # Client Prisma (singleton)
│   ├── middlewares/           # auth gérant/employé, contexte courant, flash
│   ├── controllers/           # auth, dashboard, CRUD, planning, espaces dédiés
│   ├── data/                  # banque locale de questions code de la route
│   ├── services/              # accès données (scopés par companyId)
│   ├── validators/            # validation serveur
│   ├── routes/                # routeurs + agrégation
│   └── utils/                 # hash / compare bcrypt, helpers HTTP et dates
├── views/                     # templates Twig (layout, partials, pages)
├── public/css/style.css       # feuille de style unique
├── test/smoke.cjs             # test de bout en bout (npm test)
├── .env.example
└── README.md
```

## Installation

> Prérequis : Node.js ≥ 18.

```bash
# 1. Installer les dépendances
npm install

# 2. Créer le fichier d'environnement à partir de l'exemple
#    Windows PowerShell :
Copy-Item .env.example .env
#    macOS / Linux :
cp .env.example .env

# 3. Créer la base SQLite et générer le client Prisma
npm run prisma:migrate
```

## Variables d'environnement

| Variable | Rôle | Exemple |
|---|---|---|
| `DATABASE_URL` | Emplacement de la base SQLite (relatif au dossier `prisma/schema/`) | `file:../dev.db` |
| `SESSION_SECRET` | Secret de signature des cookies de session (**obligatoire**) | une longue chaîne aléatoire |
| `PORT` | Port d'écoute du serveur | `3000` |
| `NODE_ENV` | `production` active les cookies `secure` (HTTPS) et `trust proxy` | `development` |

## Lancer le projet

```bash
# Mode développement (rechargement automatique)
npm run dev

# Mode standard
npm start
```

Application disponible sur **http://localhost:3000**

## Migrations Prisma

```bash
# Appliquer / créer une migration de développement
npm run prisma:migrate

# Régénérer uniquement le client Prisma
npm run prisma:generate

# Explorer la base dans le navigateur
npm run prisma:studio
```

> Attention en migrant une base existante : la migration
> `20260615104500_add_schedule_slots_employee_space` rend `Employee.email`
> unique globalement pour permettre la connexion employé par email. Vérifier
> l'absence de doublons d'email entre entreprises avant de l'appliquer.
>
> Sous Windows, arrêter `npm run dev` avant `prisma migrate` ou `prisma generate`
> si Prisma signale un verrou `EPERM` sur la DLL du client.

## Tests

Un test de bout en bout rejoue automatiquement tout le parcours du MVP et
affiche un ✅ / ❌ par étape :

```bash
npm test
```

Il démarre un serveur dédié (port 3100, sans gêner `npm run dev`), effectue de
vraies requêtes HTTP, vérifie certaines données en base via Prisma, puis
**supprime ses propres données de test** (la base reste propre).

Couverture (85 vérifications) :
- helpers date / durée et HTTP (`parseId` refuse les identifiants ambigus comme `1e3`) ;
- authentification & session (inscription, connexion, protection, déconnexion) ;
- CRUD employés (validation, unicité globale de l'email, hachage du mot de passe) ;
- CRUD véhicules (normalisation et unicité de l'immatriculation) ;
- CRUD élèves avec email obligatoire et mot de passe haché ;
- affectation / désaffectation et règle « un seul véhicule par employé » ;
- planning saisi par le gérant, espace employé et espace élève en lecture seule ;
- entraînement code de la route, progression élève et assistant local ;
- endpoints JSON FullCalendar (lecture, déplacement et rejet 400 des dates invalides) ;
- cloisonnement multi-entreprises (accès cross-tenant → 404) ;
- sécurité & validations (rejet d'un POST sans jeton CSRF, bornes d'âge et d'année) ;
- compteurs du dashboard et pages d'erreur 404 / 500.

> Prérequis : avoir lancé l'installation et la migration au moins une fois
> (`npm install` puis `npm run prisma:migrate`).

## Scénario de démonstration (2–3 minutes)

1. **Inscription** : ouvrir `/register`, créer une auto-école
   (ex. raison sociale « Auto-École du Centre », SIRET `12345678901234`,
   mot de passe `password123`).
2. **Connexion** : se connecter sur `/login` avec le SIRET et le mot de passe →
   arrivée sur le **dashboard** (compteurs à zéro).
3. **Employés** : aller dans **Employés**, créer deux employés (ex. un moniteur
   et une secrétaire). Montrer une erreur de validation (email déjà utilisé)
   puis corriger.
4. **Véhicules** : aller dans **Véhicules**, créer deux véhicules
   (ex. immatriculation `AB-123-CD`, marque Renault, modèle Clio). Montrer que la
   saisie `ab123cd` est **normalisée** automatiquement en `AB-123-CD`.
5. **Affectation** : affecter un véhicule à un employé. Le véhicule passe au
   statut **Affecté** ; l'employé disparaît de la liste des employés affectables.
6. **Règle métier** : tenter d'affecter le **même employé** à l'autre véhicule →
   refus avec message clair.
7. **Planning** : aller dans **Planning**, créer un créneau simple pour un employé
   (titre, début, fin, note optionnelle).
8. **Espace employé** : se connecter sur `/employee-login` avec l'email et le mot
   de passe de l'employé → vérifier que le créneau et le véhicule affecté
   s'affichent automatiquement.
9. **Espace élève** : créer un élève avec email + mot de passe, puis se connecter
   sur `/student-login` → vérifier le planning, lancer un entraînement et poser
   une question à l'assistant code.
10. **Dashboard** : revenir au tableau de bord → les compteurs reflètent l'état
   (employés, véhicules, véhicules affectés / disponibles).
11. **Cloisonnement** (optionnel) : ouvrir une seconde session (autre auto-école)
   et montrer qu'elle ne voit aucune donnée de la première.

## Notes pour la présentation orale (jury)

- **Pourquoi le thème auto-école ?** C'est un cas concret et parlant : une petite
  structure avec des moniteurs, une flotte de véhicules, des élèves et un planning
  à suivre. Le périmètre est assez riche pour illustrer de vrais CRUD, une
  relation métier et des espaces utilisateurs dédiés.
- **Cloisonnement par entreprise.** Chaque auto-école ne voit que ses propres
  données. Techniquement, l'identifiant de l'entreprise vient **de la session**,
  jamais du formulaire ; chaque requête est filtrée par cet identifiant, et toute
  tentative d'accès à une ressource d'une autre entreprise renvoie **404**.
- **La règle métier centrale.** « Un employé ne peut être référent que d'un seul
  véhicule, et un véhicule n'a qu'un seul employé référent. » C'est une relation
  **1-1 optionnelle**, garantie par une contrainte d'unicité dans la base, et
  vérifiée dans une transaction au moment de l'affectation.
- **Pourquoi SQLite pour le MVP ?** Zéro installation de serveur de base de
  données, fichier unique versionnable, parfait pour développer et démontrer
  rapidement. Grâce à Prisma, passer plus tard à PostgreSQL ne demanderait qu'un
  changement de configuration, pas de réécriture du code.

## Limites actuelles du MVP

- L'espace employé est volontairement en **lecture seule**.
- Pas de réinitialisation de mot de passe ni de gestion fine des permissions.
- Pas de lieux de départ/arrivée, examens officiels ou leçons détaillées.
- Assistant code volontairement local : pas encore branché à une API IA externe.
- Pas de détection automatique des chevauchements de créneaux.
- Pas de recherche, de tri avancé ni de pagination sur les listes.
- SQLite est adapté au développement / à la démonstration, pas à une forte charge
  concurrente en production.

## Bonus V2 non réalisés (hors périmètre)

- **Upload / modification d'avatar**.
- Statut **« en maintenance »** d'un véhicule (immobilisé) avec indicateur visuel
  sur le dashboard du gérant.
