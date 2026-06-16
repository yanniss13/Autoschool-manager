# Portail eleve code de la route - Design

## Objectif

Ajouter un espace eleve complet a ProjetRH : l'eleve se connecte avec email + mot de passe, voit son planning, s'entraine au code de la route, consulte sa progression et discute avec un assistant dedie aux questions de code de la route.

## Perimetre V1 valide

- Le gerant renseigne l'email et le mot de passe de l'eleve depuis les formulaires eleves.
- L'eleve se connecte via `/student-login` et accede a `/student-space`.
- Le planning eleve est en lecture seule et affiche les creneaux `ScheduleSlot` lies a son `studentId`.
- L'entrainement utilise une banque locale de questions de code de la route, organisee par themes.
- Une session d'entrainement enregistre le score, le total, le theme et la date.
- La progression affiche les dernieres sessions, le taux de reussite global et les themes a retravailler.
- L'assistant V1 est local : il repond a partir de regles et de contenus internes simples. Une integration IA externe pourra etre ajoutee ensuite derriere une cle API, mais ne bloque pas la demonstration.

## Hors perimetre V1

- Paiement, messagerie avec le gerant, notifications.
- Correction officielle exhaustive du code de la route.
- Examens blancs reglementaires complets avec medias.
- Appel obligatoire a une API IA externe.

## Architecture

Le projet garde l'architecture existante `routes -> controllers -> services -> validators`.

- Prisma : enrichir `Student` avec `passwordHash`, ajouter `RoadCodeTrainingSession` pour les scores.
- Auth : ajouter session role `student`, middleware `requireStudentAuth` et `loadStudent`.
- Routes publiques : `/student-login` et `/student-logout`.
- Routes protegees : `/student-space`, `/student-space/events`, `/student-space/training`, `/student-space/assistant`.
- Donnees locales : `src/data/roadCodeQuestions.js` pour la banque de questions et `src/services/roadCodeAssistantService.js` pour les reponses locales.

## Interface

L'espace eleve reprend le design system actuel. La signature visuelle est un tableau de bord d'apprentissage en trois zones :

1. "Mes prochaines lecons" avec FullCalendar en lecture seule.
2. "Entrainement code" avec themes, QCM et correction immediate.
3. "Assistant code" avec fil de conversation simple et reponses courtes.

Sur mobile, les zones passent en pile verticale. Le planning reste lisible et les formulaires gardent des boutons explicites.

## Securite

- Email eleve unique globalement pour permettre une connexion simple.
- Mot de passe hache avec bcrypt, limite 72 octets comme les autres comptes.
- Toutes les donnees eleve restent scopees par `studentId` et `companyId`.
- L'eleve ne peut pas acceder aux routes gerant ni employe.
- Les POST d'entrainement et assistant gardent la protection CSRF.

## Tests attendus

Le smoke test doit couvrir :

- Creation d'un eleve avec email + mot de passe.
- Connexion eleve et acces a `/student-space`.
- Refus d'acces de l'eleve aux routes gerant.
- Planning JSON eleve qui contient ses creneaux.
- Creation d'une session d'entrainement avec score persiste.
- Assistant local qui repond a une question de code de la route.
