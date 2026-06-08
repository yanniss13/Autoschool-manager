# AutoSchool Manager

Application web interne de gestion du **personnel** et du **parc informatique
administratif** d'une auto-école.

## Résumé fonctionnel

Une auto-école crée un compte (entreprise). Son **gérant** se connecte avec son
SIRET et son mot de passe, puis accède à un **tableau de bord protégé** depuis
lequel il administre **ses employés** (moniteurs, secrétaires, assistants
administratifs) et **ses postes informatiques** (poste d'accueil, secrétariat,
direction). Le gérant peut **affecter un employé à un poste**, à condition que
cet employé n'occupe pas déjà un autre poste.

Chaque auto-école est **totalement cloisonnée** : un gérant ne voit jamais les
données d'une autre entreprise.

> Périmètre volontairement étroit : c'est un outil **RH + parc informatique**,
> **pas** un logiciel métier complet d'auto-école (ni élèves, ni leçons, ni
> véhicules).

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
- [x] CRUD complet des ordinateurs
- [x] Affectation d'un employé à un ordinateur **uniquement s'il n'a pas déjà de poste**
- [x] Désaffectation d'un poste
- [x] Compteurs du dashboard (employés, ordinateurs, postes affectés / disponibles)
- [x] CSS propre et homogène sur toutes les pages

## Choix techniques importants

- **Architecture en couches** : `routes → controllers → services`, avec
  `validators` et `middlewares` isolés. Lisible et facile à faire évoluer.
- **Cloisonnement multi-tenant** : toutes les requêtes Prisma sont filtrées par
  le `companyId` **issu de la session** (jamais d'un paramètre client). Toute
  ressource d'une autre entreprise renvoie **404**, sans fuite d'information.
- **Règle métier centrale au niveau base** : la clé étrangère `employeeId` est
  portée par `Computer` et marquée `@unique` → un employé ne peut pas occuper
  deux postes, garanti par la base elle-même, pas seulement par le code.
- **Affectation transactionnelle** : la vérification (poste libre + employé
  disponible + même entreprise) et l'écriture sont exécutées dans une
  **transaction Prisma** (tout réussit ensemble ou rien).
- **Sécurité** : mots de passe hachés avec bcrypt, jamais stockés ni affichés en
  clair ; validation **systématiquement refaite côté serveur** ; pattern
  **Post/Redirect/Get** après chaque écriture.
- **GET / POST uniquement** : les formulaires HTML natifs ne gèrent que ces deux
  verbes, cohérent avec un rendu serveur sans JavaScript.

## Structure du projet

```
ProjetRH/
├── prisma/
│   ├── schema.prisma          # Modèle Company / Employee / Computer
│   ├── migrations/            # Migrations versionnées
│   └── dev.db                 # Base SQLite (générée)
├── src/
│   ├── app.js                 # Configuration Express (vues, session, routes)
│   ├── server.js              # Point d'entrée HTTP
│   ├── config/prisma.js       # Client Prisma (singleton)
│   ├── middlewares/           # requireAuth, loadCompany, redirectIfAuth, flash
│   ├── controllers/           # auth, dashboard, employee, computer
│   ├── services/              # accès données (scopés par companyId)
│   ├── validators/            # validation serveur
│   ├── routes/                # routeurs + agrégation
│   └── utils/password.js      # hash / compare bcrypt
├── views/                     # templates Twig (layout, partials, pages)
├── public/css/style.css       # feuille de style unique
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
| `DATABASE_URL` | Emplacement de la base SQLite (relatif au dossier `prisma/`) | `file:./dev.db` |
| `SESSION_SECRET` | Secret de signature des cookies de session | une longue chaîne aléatoire |
| `PORT` | Port d'écoute du serveur | `3000` |

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

## Scénario de démonstration (2–3 minutes)

1. **Inscription** : ouvrir `/register`, créer une auto-école
   (ex. raison sociale « Auto-École du Centre », SIRET `12345678901234`,
   mot de passe `password123`).
2. **Connexion** : se connecter sur `/login` avec le SIRET et le mot de passe →
   arrivée sur le **dashboard** (compteurs à zéro).
3. **Employés** : aller dans **Employés**, créer deux employés (ex. un moniteur
   et une secrétaire). Montrer une erreur de validation (email déjà utilisé)
   puis corriger.
4. **Ordinateurs** : aller dans **Ordinateurs**, créer deux postes
   (ex. `AA:BB:CC:DD:EE:01` et `AA:BB:CC:DD:EE:02`). Montrer que la saisie
   `aa-bb-cc-dd-ee-01` est **normalisée** automatiquement.
5. **Affectation** : affecter un employé à un poste. Le poste passe au statut
   **Affecté** ; l'employé disparaît de la liste des employés affectables.
6. **Règle métier** : tenter d'affecter le **même employé** à l'autre poste →
   refus avec message clair.
7. **Dashboard** : revenir au tableau de bord → les compteurs reflètent l'état
   (employés, ordinateurs, postes affectés / disponibles).
8. **Cloisonnement** (optionnel) : ouvrir une seconde session (autre auto-école)
   et montrer qu'elle ne voit aucune donnée de la première.

## Notes pour la présentation orale (jury)

- **Pourquoi le thème auto-école ?** C'est un cas concret et parlant : une petite
  structure avec quelques employés (moniteurs, secrétaires) et quelques postes
  informatiques administratifs à suivre. Le périmètre est assez riche pour
  illustrer un vrai CRUD et une relation métier, sans se disperser dans un
  logiciel de gestion d'élèves.
- **Cloisonnement par entreprise.** Chaque auto-école ne voit que ses propres
  données. Techniquement, l'identifiant de l'entreprise vient **de la session**,
  jamais du formulaire ; chaque requête est filtrée par cet identifiant, et toute
  tentative d'accès à une ressource d'une autre entreprise renvoie **404**.
- **La règle métier centrale.** « Un employé ne peut avoir qu'un seul poste, et un
  poste ne peut avoir qu'un seul employé. » C'est une relation **1-1 optionnelle**,
  garantie par une contrainte d'unicité dans la base, et vérifiée dans une
  transaction au moment de l'affectation.
- **Pourquoi SQLite pour le MVP ?** Zéro installation de serveur de base de
  données, fichier unique versionnable, parfait pour développer et démontrer
  rapidement. Grâce à Prisma, passer plus tard à PostgreSQL ne demanderait qu'un
  changement de configuration, pas de réécriture du code.

## Limites actuelles du MVP

- Un seul rôle : le **gérant**. Les employés n'ont pas d'accès à l'application.
- Pas de réinitialisation de mot de passe ni de gestion fine des permissions.
- Pas de recherche, de tri avancé ni de pagination sur les listes.
- SQLite est adapté au développement / à la démonstration, pas à une forte charge
  concurrente en production.

## Bonus V2 non réalisés (hors périmètre)

- Connexion **employé** (email + mot de passe) et page profil personnelle.
- Affichage de l'adresse MAC du poste associé à l'employé.
- **Upload / modification d'avatar**.
- **Déclaration de panne** d'un ordinateur (`isBroken`, `brokenAt`).
- **Pastille rouge + heure de panne** sur le dashboard du gérant.
