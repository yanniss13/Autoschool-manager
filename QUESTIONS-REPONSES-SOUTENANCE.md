# Soutenance — Questions / Réponses (AutoSchool Manager)

> Banque de questions qu'un jury peut poser, **de la plus basique à la plus pointue**, avec
> une réponse courte à dire à l'oral + parfois un « pour aller plus loin ».
> Conseil : lis-le en entier une fois, puis entraîne-toi à répondre **avec tes mots**. Le jury
> note surtout que tu **comprends** ton projet, pas que tu récites.

---

## 0. Le pitch (à connaître par cœur)

**« Présentez votre projet en 30 secondes. »**
> AutoSchool Manager est une application web interne de gestion d'auto-école. Le gérant crée un
> compte pour son auto-école, puis gère ses employés (moniteurs), ses véhicules, ses élèves, et
> un planning hebdomadaire de créneaux. Chaque auto-école ne voit que ses propres données.
> C'est une application Node.js / Express, rendue côté serveur avec Twig, avec une base SQLite
> via Prisma, et un planning interactif en FullCalendar.

**« Quel problème ça résout ? »**
> Centraliser au même endroit le personnel, les véhicules, les élèves et le planning d'une
> auto-école, avec des comptes séparés par établissement et un accès employé en lecture seule.

---

## 1. Questions « bêtes »/basiques (le jury teste les fondations)

**C'est quoi un serveur ?**
> Un programme qui tourne en continu, attend des demandes (requêtes) des navigateurs et renvoie
> des réponses (des pages HTML). Mon code Node.js EST ce serveur.

**C'est quoi Node.js ?**
> C'est ce qui permet d'exécuter du JavaScript en dehors du navigateur, côté serveur. Avant,
> JavaScript ne servait que dans la page web ; Node permet d'en faire un serveur.

**Différence entre front-end et back-end ?**
> Le front-end, c'est ce qui s'affiche dans le navigateur (HTML/CSS, et ici un peu de JS pour le
> calendrier). Le back-end, c'est le serveur : il traite les requêtes, parle à la base, fabrique
> les pages. Mon projet est surtout du back-end (rendu côté serveur).

**C'est quoi une base de données ? Pourquoi pas un fichier Excel ?**
> C'est un système pour stocker et retrouver des données de façon fiable et structurée. Excel ne
> gère pas plusieurs utilisateurs simultanés, les relations entre données, l'intégrité, ni les
> requêtes efficaces. Une base de données, si.

**C'est quoi HTML ? CSS ?**
> HTML décrit la structure d'une page (titres, formulaires, tableaux). CSS décrit son apparence
> (couleurs, espacements). Ici le HTML est généré par les templates Twig, le CSS est dans
> `public/css/style.css`.

**C'est quoi une requête GET / POST ?**
> GET sert à demander/afficher une page (ex. voir la liste des élèves). POST sert à envoyer des
> données qui modifient quelque chose (ex. créer un élève via un formulaire).

**Ça veut dire quoi « 404 », « 500 » ?**
> Ce sont des codes de statut HTTP. 200 = OK, 302 = redirection, 400 = données invalides,
> 401 = pas connecté, 403 = interdit, 404 = introuvable, 500 = erreur serveur.

**Le site est en ligne ?**
> Non, c'est une application qui tourne en local (sur ma machine), pensée pour un usage interne.
> Elle est prête à être déployée derrière un reverse-proxy HTTPS (j'ai prévu le `trust proxy` et
> le cookie `secure` en production).

---

## 2. Architecture & choix techniques

**Décrivez l'architecture de votre application.**
> Une architecture en couches : les **routes** associent une URL à une fonction ; des
> **middlewares** font les contrôles transverses (connecté ? jeton CSRF ?) ; les **contrôleurs**
> orchestrent ; les **validators** vérifient les données ; les **services** parlent à la base via
> Prisma ; les **vues** Twig fabriquent le HTML. Chaque couche a une seule responsabilité.

**Pourquoi ce découpage en couches ?**
> Pour que chaque fichier reste petit et compréhensible, et que les changements soient localisés.
> Si je change la façon de chercher en base, je touche seulement le service ; si je change une
> URL, seulement la route. Ça limite les effets de bord et facilite les tests.

**Pourquoi Express ?**
> C'est le framework web le plus standard de l'écosystème Node : léger, bien documenté, parfait
> pour router des URLs et enchaîner des middlewares.

**Pourquoi Twig (rendu serveur) plutôt que React ?**
> Mon appli est surtout des formulaires et des listes : le rendu côté serveur est plus simple,
> plus rapide à développer, meilleur pour la sécurité (moins de surface d'attaque) et sans étape
> de build front. React serait surdimensionné ici. J'ai gardé du JS navigateur uniquement là où
> c'était utile : le calendrier.

**Pourquoi Prisma ? C'est quoi un ORM ?**
> Un ORM (Object-Relational Mapping) me laisse parler à la base en JavaScript
> (`prisma.student.findMany()`) au lieu d'écrire du SQL à la main. Prisma apporte en plus la
> sécurité de typage et un système de migrations versionnées. Ça évite aussi les injections SQL.

**Pourquoi SQLite ?**
> C'est une base « dans un fichier », sans serveur à installer : idéale pour un projet/MVP et une
> démo. Grâce à Prisma, je pourrais passer à PostgreSQL plus tard en changeant surtout la config.

**C'est quoi un middleware ?**
> Une fonction qui s'exécute AVANT le contrôleur et peut laisser passer la requête, la rediriger,
> ou la bloquer. Exemples : `requireAuth` (vérifie la connexion), `csrf` (vérifie le jeton).
> **L'ordre** dans lequel je les branche dans `app.js` est important.

**Comment les URLs sont-elles gérées ?**
> Dans `src/routes/`. Un fichier central (`routes/index.js`) monte chaque groupe d'URLs derrière
> ses middlewares : ex. `/students` est protégé par `requireAuth` + `loadCompany`, puis délègue
> au routeur des élèves.

---

## 3. Base de données & modèle

**Combien de tables, lesquelles ?**
> Cinq : Company (auto-école), Employee (moniteur), Vehicle, Student (élève), ScheduleSlot
> (créneau de planning).

**Expliquez les relations.**
> Une entreprise a plusieurs employés, véhicules, élèves et créneaux. Un employé est référent
> d'au plus un véhicule (relation 1-1). Un créneau relie un employé ET un élève. Tout est rattaché
> à une entreprise via une colonne `companyId`.

**C'est quoi une clé étrangère ?**
> Une colonne qui pointe vers la ligne d'une autre table. Ex. `ScheduleSlot.studentId` pointe vers
> l'élève concerné. Ça matérialise les relations.

**Que se passe-t-il si on supprime un élève qui a des créneaux ?**
> Ses créneaux sont supprimés automatiquement : j'ai mis `onDelete: Cascade` sur la relation.
> Idem si on supprime une entreprise : tous ses employés, véhicules, élèves et créneaux suivent.

**Et si on supprime un véhicule affecté à un employé ?**
> Le véhicule est supprimé et l'employé est simplement « libéré » (la clé étrangère est portée par
> le véhicule). L'employé n'est pas supprimé.

**C'est quoi une migration ?**
> Un fichier qui décrit un changement de structure de la base (ajout de table/colonne). Prisma le
> génère et l'applique. C'est l'historique versionné du schéma : on peut recréer la base à
> l'identique.

**Pourquoi `studentId` est nullable en base mais obligatoire dans l'appli ?**
> Pour ne pas casser les créneaux existants au moment de la migration, j'ai gardé la colonne
> nullable côté base, mais mon validateur l'exige sur toute création/édition. Donc via
> l'interface, impossible de créer un créneau sans élève.

---

## 4. Authentification & sessions

**Comment marche la connexion ?**
> Le gérant envoie son SIRET + mot de passe. Je cherche l'entreprise par SIRET, je compare le mot
> de passe avec bcrypt. Si c'est bon, je régénère la session et j'y stocke son identifiant.

**C'est quoi une session ? Différence avec un cookie ?**
> HTTP n'a pas de mémoire entre deux requêtes. La session est une mémoire **côté serveur** de
> l'utilisateur connecté. Le **cookie** est juste l'identifiant (signé) envoyé au navigateur pour
> retrouver cette session à chaque requête. Le cookie ne contient pas les données sensibles.

**Vous avez deux types d'utilisateurs ?**
> Oui : le gérant (connexion par SIRET, accès complet) et l'employé (connexion par email, accès
> en lecture seule à son planning). Je stocke un `authRole` en session pour les distinguer, et des
> middlewares différents protègent chaque espace.

**Pourquoi « régénérer la session » à la connexion ?**
> Pour éviter la « fixation de session » : un attaquant pourrait poser un identifiant de session
> avant la connexion. En régénérant l'ID au moment où on s'authentifie, l'ancien devient inutile.

**Où est stocké le mot de passe ?**
> Jamais en clair. Je stocke un **hash bcrypt**. À la connexion, bcrypt compare sans jamais
> « déchiffrer » (c'est irréversible par conception).

**Que se passe-t-il à la déconnexion ?**
> Je détruis la session (`req.session.destroy()`) et je redirige vers la page de connexion.

---

## 5. Sécurité (le jury adore — sois solide ici)

**Quelles protections de sécurité avez-vous mises ?**
> Hachage bcrypt des mots de passe ; protection CSRF par jeton de session ; auto-échappement Twig
> contre le XSS ; en-têtes de sécurité via Helmet ; rate-limiting anti brute-force sur les
> connexions ; validation serveur systématique ; et le cloisonnement strict entre entreprises.

**C'est quoi une attaque CSRF ? Comment vous protégez ?**
> CSRF = faire exécuter une action à un utilisateur connecté à son insu, depuis un autre site. Je
> génère un jeton secret unique par session, présent dans chaque formulaire ; toute requête
> modifiante doit le présenter, sinon 403. Un site tiers ne connaît pas ce jeton.

**C'est quoi le XSS ? Comment vous protégez ?**
> XSS = injecter du code (script) qui s'exécute chez d'autres utilisateurs. Twig échappe
> automatiquement toute variable affichée : un `<script>` devient du texte inoffensif.

**C'est quoi l'injection SQL ? Êtes-vous protégé ?**
> C'est injecter du SQL malveillant via un champ. Comme je passe par Prisma (requêtes
> paramétrées) et jamais par de la concaténation de chaînes SQL, j'y suis protégé.

**Comment empêchez-vous une auto-école de voir les données d'une autre ?**
> Chaque requête en base est filtrée par le `companyId` issu de la **session**, jamais d'une
> valeur envoyée par l'utilisateur. Si l'entreprise B demande l'employé 5 de A, la requête
> `where { id:5, companyId: B }` ne trouve rien → je renvoie 404, sans révéler son existence.

**Et si quelqu'un modifie l'URL avec un autre id ?**
> Même réponse : tout est scopé `companyId`, donc un id d'une autre entreprise donne 404.

**Pourquoi limiter les tentatives de connexion ?**
> Pour freiner les attaques par force brute (essayer des milliers de mots de passe). Je limite à
> ~20 tentatives échouées par IP sur 15 minutes ; les connexions réussies ne comptent pas.

**Pourquoi un message « identifiants invalides » générique ?**
> Pour ne pas dire si c'est le SIRET ou le mot de passe qui est faux : ça donnerait une info utile
> à un attaquant (savoir qu'un compte existe).

**Pourquoi la CSP est désactivée ? (question piège)**
> La Content-Security-Policy stricte bloquerait le JavaScript « inline » que j'utilise encore
> (ex. `onchange` du sélecteur d'employé). Je l'ai notée comme amélioration : externaliser ce JS
> puis réactiver une CSP stricte. Helmet applique déjà les autres en-têtes de sécurité.

---

## 6. Le planning / FullCalendar

**Pourquoi FullCalendar ?**
> Pour une vraie vue agenda hebdomadaire avec glisser-déposer et redimensionnement des créneaux,
> clé en main, sans réécrire toute la logique de positionnement à la main.

**Comment les créneaux arrivent dans le calendrier ?**
> FullCalendar tourne dans le navigateur et demande les créneaux au serveur en JSON, via
> `GET /planning/events`. Le serveur renvoie les créneaux de l'employé sélectionné pour la semaine
> affichée. Quand on change de semaine, il redemande, sans recharger la page.

**Comment fonctionne le glisser-déposer ?**
> Quand on déplace ou redimensionne un créneau, FullCalendar envoie en arrière-plan une requête
> `POST /planning/:id/move` avec les nouvelles heures et le jeton CSRF. Le serveur valide
> (début < fin, créneau de mon entreprise) et met à jour. En cas d'échec, le créneau revient
> visuellement à sa place.

**Auriez-vous pu utiliser Google Agenda ? (question fréquente)**
> J'y ai pensé, mais non : les données partiraient chez Google, je perdrais le cloisonnement par
> entreprise et le lien avec mes employés/élèves/véhicules. FullCalendar me donne l'UI clé en main
> tout en gardant mes données chez moi.

**Le calendrier marche-t-il sans internet ?**
> Oui : j'ai « auto-hébergé » FullCalendar dans `public/vendor/`, donc aucune dépendance à un CDN
> externe au moment de l'exécution.

**Pourquoi le titre d'un créneau contient le nom de l'élève ?**
> Pour qu'un moniteur voie d'un coup d'œil avec quel élève il a cours : j'affiche
> « Cours de conduite — Dupont Marie ».

---

## 7. Qualité, tests, organisation

**Avez-vous des tests ?**
> Oui, un test de bout en bout (« smoke test », `npm test`). Il démarre un vrai serveur et rejoue
> tout le parcours : inscription, connexion, CRUD employés/véhicules/élèves, création et
> déplacement de créneaux, et surtout les contrôles de cloisonnement entre entreprises. Au total
> 79 vérifications, toutes au vert.

**Pourquoi un test de bout en bout plutôt que des tests unitaires ?**
> Pour un projet de cette taille, ça donne le meilleur rapport effort/confiance : il vérifie que
> tout fonctionne ensemble, comme un vrai utilisateur. Des tests unitaires (sur les validators par
> ex.) sont une évolution possible.

**Comment avez-vous organisé votre travail / votre code dans Git ?**
> Par fonctionnalité, sur des branches dédiées, avec des commits petits et descriptifs en anglais.
> J'ai même gardé en historique une ancienne version du planning (un tag de retour) avant de
> basculer sur FullCalendar.

**Comment garantissez-vous qu'une modif ne casse rien ?**
> Je relance `npm test` après chaque changement important. S'il passe de 79/79 à moins, je sais
> tout de suite où ça casse.

---

## 8. Questions pièges / limites / « et si… »

**Que se passe-t-il si deux personnes affectent le même véhicule en même temps ?**
> L'affectation se fait dans une **transaction** : je vérifie que le véhicule est libre ET que
> l'employé n'en a pas déjà, puis j'écris, le tout de façon atomique. Et une contrainte d'unicité
> en base sert de dernier filet.

**Votre appli tient combien d'utilisateurs ?**
> En l'état (SQLite, un seul process), c'est dimensionné pour un usage interne d'une petite
> structure. Pour monter en charge, je passerais à PostgreSQL et je déploierais plusieurs
> instances derrière un reverse-proxy — l'architecture en couches le permet sans tout réécrire.

**Et si la base de données grossit beaucoup ?**
> J'ai mis des index sur les colonnes les plus filtrées (ex. `companyId` + `startsAt` sur les
> créneaux) pour garder les recherches rapides.

**Que se passe-t-il si le serveur plante en plein milieu d'une écriture ?**
> Les opérations critiques (comme l'affectation) sont transactionnelles : soit tout est écrit,
> soit rien. Pas d'état incohérent.

**Gérez-vous le RGPD / les données personnelles ?**
> Je stocke des données personnelles (noms, emails, téléphones). Les mots de passe sont hachés,
> l'accès est cloisonné et authentifié. Pour une mise en production réelle, il faudrait ajouter
> une politique de conservation/suppression et de l'export — c'est une piste identifiée.

**Et si je laisse un formulaire ouvert longtemps puis je valide ?**
> Si la session a expiré, le jeton CSRF n'est plus valide : je renvoie une page claire
> « session expirée, reconnectez-vous » plutôt qu'une erreur brutale.

**Le mot de passe a une longueur max de 72 ? Pourquoi ?**
> C'est une limite technique de bcrypt (il ignore au-delà de 72 octets). Je la refuse
> explicitement pour éviter une troncature silencieuse trompeuse.

**Pourquoi l'email de l'employé est unique au niveau global et pas par entreprise ?**
> Parce que l'employé se connecte avec son email seul (sans SIRET) : il doit donc être unique pour
> identifier sans ambiguïté à quel compte il appartient.

**Que se passe-t-il si on tape une URL qui n'existe pas ?**
> Une page 404 propre. Et une URL d'objet d'une autre entreprise donne aussi 404 (cloisonnement).

---

## 9. Améliorations futures (montre que tu as du recul)

> - **CSP stricte** : externaliser le JS inline puis réactiver une Content-Security-Policy.
> - **Tests unitaires** sur les validators, en complément du smoke test.
> - **Pagination / recherche / tri** sur les listes quand le volume grandit.
> - **Espace élève** (aujourd'hui les élèves ne se connectent pas).
> - **Migration vers PostgreSQL** et déploiement multi-instances pour la montée en charge.
> - **Gestion fine RGPD** (conservation, export, suppression sur demande).
> - **Statut véhicule « en maintenance »**, avatars, notifications, etc.

---

## 10. Questions sur toi et ta démarche

**Qu'avez-vous trouvé le plus difficile ?**
> *(à personnaliser)* Par exemple : garantir le cloisonnement entre entreprises partout sans
> faille, ou intégrer proprement FullCalendar avec des endpoints JSON et le drag-and-drop sécurisé
> par CSRF.

**Qu'avez-vous appris ?**
> L'architecture en couches, la sécurité web concrète (CSRF, XSS, sessions, hachage), le travail
> avec un ORM et des migrations, et l'intérêt d'un test de bout en bout pour avancer sereinement.

**Si c'était à refaire ?**
> Je mettrais la CSP stricte dès le début et j'ajouterais des tests unitaires en parallèle du
> smoke test.

**Avez-vous utilisé des outils d'assistance / de l'IA ?** *(réponds honnêtement)*
> *(Sois transparent sur les outils que tu as utilisés. Le plus important pour le jury, c'est que
> tu **comprennes et saches expliquer** chaque partie de ton code — ce que ce document et le
> `GUIDE-DU-CODE.md` t'aident à maîtriser. Prépare-toi à expliquer n'importe quel fichier au
> tableau : c'est la meilleure preuve de maîtrise.)*

---

## 11. Démo live — checklist (si on te demande de montrer)

1. `npm run dev`, ouvrir la page d'accueil.
2. **S'inscrire** (créer une auto-école) → se connecter (SIRET + mot de passe).
3. Montrer le **tableau de bord** (compteurs).
4. Créer un **employé**, un **véhicule**, **affecter** l'un à l'autre.
5. Créer un **élève**.
6. Aller au **planning** : créer un créneau (employé + élève), le **déplacer** à la souris.
7. Se **déconnecter**, se connecter en **employé** (email + mot de passe) → montrer le planning en
>    lecture seule.
8. Bonus sécurité : montrer qu'une URL d'un autre id renvoie 404 ; lancer `npm test` (79/79).

> **Conseil final :** prépare 2-3 phrases sur CHAQUE thème (archi, base, sécurité, planning,
> tests). Si tu sais expliquer le **cycle d'une requête** (section 8 du GUIDE-DU-CODE) et le
> **cloisonnement `companyId`**, tu couvres déjà 70 % des questions.
