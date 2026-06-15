# Instructions agents - ProjetRH

Ce depot concerne uniquement **ProjetRH**. Ne pas modifier ni melanger avec d'autres projets.

Avant toute modification, lire **`CONTEXTE.md`** en entier, puis se referer a **`README.md`** si un detail fonctionnel ou technique manque.

Regles de collaboration :
- Ne jamais `push`, modifier un remote ou publier quoi que ce soit sans accord explicite.
- Les commits locaux ne se font que si demandes ; messages en anglais imperatif, selon les conventions du projet.
- Ne pas committer `.env`, secrets, donnees locales, ni `.vscode/`.

Conventions code et securite :
- Respecter l'architecture existante `routes -> controllers -> services`, avec `validators`, `middlewares` et `utils` dedies.
- Garder les commentaires en francais et rester coherent avec le style existant.
- Maintenir le cloisonnement multi-entreprises : toute donnee metier doit rester scopee par `companyId` de session.
- Preserver les protections de securite en place : validation serveur, CSRF, sessions durcies, en-tetes de securite, echappement des vues.
- Apres toute modification importante, mettre a jour **`CONTEXTE.md`** avec l'etat utile pour la prochaine reprise.
