# Contributing to Yu-Gi-Oh! Marketplace

Merci de votre intérêt pour contribuer à ce projet ! Toutes les contributions sont les bienvenues.

## Comment contribuer

### Signaler un bug

Si vous trouvez un bug, ouvrez une [issue](https://github.com/Guimove/ygo-seller/issues) en incluant :
- Description claire du problème
- Étapes pour reproduire
- Comportement attendu vs observé
- Screenshots si applicable
- Environnement (navigateur, OS)

### Proposer une fonctionnalité

Pour proposer une nouvelle fonctionnalité :
1. Ouvrez une issue pour en discuter d'abord
2. Attendez l'approbation avant de commencer le développement
3. Soumettez une pull request en référençant l'issue

### Soumettre une Pull Request

1. **Fork** le projet
2. **Créez une branche** : `git checkout -b feature/ma-fonctionnalite`
3. **Développez** votre fonctionnalité
4. **Testez** : `npm run build` doit réussir
5. **Commitez** : messages clairs et descriptifs
6. **Pushez** : `git push origin feature/ma-fonctionnalite`
7. **Ouvrez une PR** avec description détaillée

### Guidelines de code

- **TypeScript** : Typage strict, pas de `any`
- **React** : Function components avec hooks
- **Style** : Suivre le style existant (2 espaces, PascalCase pour composants)
- **Commits** : Messages en français ou anglais, descriptifs
- **Build** : `npm run build` doit passer sans erreurs

### Structure du projet

```
src/
├── components/     # Composants React
├── hooks/          # Custom hooks
├── utils/          # Fonctions utilitaires
└── types.ts        # Types TypeScript partagés
```

## Développement local

```bash
# Installer les dépendances
npm install

# Lancer le dev server
npm run dev

# Build production
npm run build

# Preview du build
npm run preview
```

Le site sera accessible sur `http://localhost:5173`

## Domaines de contribution

Contributions particulièrement appréciées :
- 🐛 Corrections de bugs
- 🎨 Améliorations UI/UX
- 📝 Documentation
- 🌍 Internationalisation (i18n)
- ⚡ Optimisations de performance
- 🧪 Tests unitaires/intégration
- 🎴 Support de nouvelles raretés

## Code of Conduct

Ce projet suit le [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). En participant, vous acceptez de respecter ses termes.

## Questions

Pour toute question, ouvrez une [issue](https://github.com/Guimove/ygo-seller/issues) ou contactez [@Guimove](https://github.com/Guimove).

---

Merci pour vos contributions ! 🎴
