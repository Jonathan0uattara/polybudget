# PolyBudget v2

Suivi des dépenses et revenus, installable sur téléphone et ordinateur, synchronisé en temps réel et utilisable hors ligne.

## Stack

| Couche | Outil |
|---|---|
| Framework | **Next.js 14.2.35** (App Router, export statique) |
| UI | **React 18** + **TypeScript** |
| Styles | **styled-components**, avec des design tokens `--pb-*` |
| Animations | **Framer Motion** (transitions, feuilles glissantes, compteurs, coche de succès) |
| Icônes | **lucide-react** |
| Base de données | **Firebase Firestore**, avec cache hors ligne |
| Connexion | **Firebase Authentication** (Google) |
| Hébergement | **GitHub Pages**, déployé automatiquement par GitHub Actions |
| App installable | PWA : manifest + service worker |

Principes de design (inspirés de la grammaire visuelle de Revolut) :
- interface monochrome et plate, sans aucune ombre ;
- boutons en forme de pilule ;
- titres en graisse 500 (Manrope) et texte en Inter ;
- le vert PolyBudget comme seule couleur d’accent, et l’or pour les moments positifs.

## Fonctionnalités

- Tableau de bord : solde animé, dépenses du mois, graphique sur 6 mois, répartition par catégorie
- Ajout rapide avec pavé numérique, feuille glissante et animation de succès
- Historique avec recherche et filtres (type, mois, catégorie)
- Budgets : global, par catégorie, objectif d’épargne
- **Profil** : prénom, nom, date de naissance, ville, situation, école ou entreprise
- **Rapport mensuel** personnalisé, téléchargeable en PDF
- Catégories personnalisables, export CSV/JSON, import JSON
- Thème clair ou sombre, mode hors ligne, installable (PWA), mode démo

## Lancer en local

Prérequis : **Node.js 20 LTS** (https://nodejs.org).

```bash
npm install      # une seule fois
npm run dev      # puis ouvre http://localhost:3000
```

Pour tester sans toucher à tes vraies données, utilise le **mode démo** : crée un fichier `.env.local` contenant `NEXT_PUBLIC_DEMO=1`, puis relance `npm run dev`. Supprime ce fichier pour revenir à tes vraies données.

## Mettre en ligne (GitHub Pages)

1. Envoie le projet sur un dépôt GitHub nommé `polybudget`, sans `node_modules`, `.next` ni `out`.
2. Dans le dépôt, va dans Settings > Pages > Source et choisis **GitHub Actions**.
3. Chaque envoi sur `main` construit et publie automatiquement l’app sur `https://<pseudo>.github.io/polybudget/`. Tu peux suivre la progression dans l’onglet Actions.
4. Dans Firebase, va dans Authentification > Paramètres > Domaines autorisés et ajoute `<pseudo>.github.io`.

## Structure

```
app/                 layout et page Next.js
components/
  App.tsx            navigation, transitions, feuilles
  ui.tsx             design system (boutons, cartes, montant animé…)
  overlays.tsx       feuille glissante, pavé numérique, toast, succès
  TxSheet.tsx        ajout et modification d’une transaction
  screens/           Accueil, Historique, Budgets, Réglages, Connexion
lib/
  firebase.ts        configuration Firebase
  store.tsx          authentification, synchronisation temps réel, actions
  format.ts          types, catégories, formats
styles/GlobalStyle.ts  design tokens (clair et sombre)
public/              manifest, service worker, icônes
firestore.rules      règles de sécurité (à coller dans la console Firebase)
```

## Données

Les données sont compatibles avec la v1, donc tu retrouves toutes tes transactions :
- `users/{uid}` contient les réglages, les catégories et les budgets ;
- `users/{uid}/tx/{id}` contient les transactions, avec les montants en centimes.

## Sécurité

- **Accès réservé** : les règles Firestore (`firestore.rules`) n’autorisent que les UID listés dans `allowed()`. Tout autre compte Google voit l’écran « Accès réservé ».
- **Isolation** : chaque compte ne peut lire et écrire que `users/{son uid}`.
- **Validation côté serveur** : types, formats et tailles maximales sont vérifiés pour chaque écriture, et tout le reste est refusé par défaut.
- **Aucun secret dans le code** : la configuration Firebase est publique par conception, et la protection vient des règles. `.env.local` est exclu de Git.
- **Clé API** : à restreindre dans Google Cloud Console aux domaines `localhost` et `<pseudo>.github.io`.
- **Comptes** : active la double authentification sur ton compte Google et sur GitHub.

## Inviter des testeurs

1. Firebase > Authentification > Méthode de connexion : activer **Adresse e-mail/Mot de passe**.
2. Firestore > Données : créer la collection `invites`, avec un document dont l'**ID est le code** (en majuscules, par exemple `POLY-TEST-7K2X`) et un champ `remaining` (number) égal au nombre de places.
3. Les testeurs créent leur compte avec ce code (par e-mail ou avec Google). Chaque inscription retire une place.
4. Pour retirer l'accès à quelqu'un : supprimer son document dans la collection `members`.
