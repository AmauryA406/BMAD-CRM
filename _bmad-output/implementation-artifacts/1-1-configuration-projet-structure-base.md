# Story 1.1: Configuration du projet et structure de base

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que développeur,
Je veux une structure de projet claire et organisée,
Pour que je puisse développer efficacement et maintenir le code.

## Acceptance Criteria

1. **Structure de projet initialisée (Next.js/React)** - Le projet doit être initialisé avec le starter `nemanjam/nextjs-prisma-boilerplate`
2. **Configuration TypeScript opérationnelle** - TypeScript 4.7.4+ doit être configuré avec strict mode activé
3. **Configuration ESLint/Prettier** - Linting et formatage automatique configurés et fonctionnels
4. **Base de données configurée** - PostgreSQL configuré via Docker Compose avec migrations fonctionnelles
5. **Variables d'environnement sécurisées** - Fichiers .env configurés pour dev/staging/prod
6. **Scripts de développement fonctionnels** - `yarn dev`, `yarn build`, `yarn docker:dev` opérationnels

## Tasks / Subtasks

- [ ] **Initialisation du starter boilerplate** (AC: 1)
  - [ ] Cloner le repository `nemanjam/nextjs-prisma-boilerplate`
  - [ ] Renommer le projet en `bmad-crm`
  - [ ] Installer les dépendances avec `yarn install`
- [ ] **Configuration de l'environnement Docker** (AC: 6)
  - [ ] Vérifier Docker Compose configuration
  - [ ] Lancer `yarn docker:dev` et valider le fonctionnement
  - [ ] Tester hot-reloading et debugging
- [ ] **Validation de la configuration TypeScript** (AC: 2)
  - [ ] Vérifier tsconfig.json avec mode strict activé
  - [ ] Tester compilation TypeScript sans erreurs
  - [ ] Valider IntelliSense et auto-complétion
- [ ] **Validation ESLint/Prettier** (AC: 3)
  - [ ] Exécuter ESLint sur le projet et corriger les erreurs
  - [ ] Valider Prettier formatting automatique
  - [ ] Configurer les hooks pre-commit si nécessaires
- [ ] **Configuration base de données PostgreSQL** (AC: 4, 5)
  - [ ] Valider connexion PostgreSQL via Docker
  - [ ] Configurer variables d'environnement (.env.local, .env.example)
  - [ ] Exécuter migrations initiales et valider structure BDD

## Dev Notes

### Architecture Requirements

- **Starter obligatoire :** `nemanjam/nextjs-prisma-boilerplate` (selon architecture.md)
- **Stack technique :** Next.js 12.2.0 + TypeScript 4.7.4 + TailwindCSS 3
- **Infrastructure :** Docker Compose pour dev/test/prod
- **Database :** PostgreSQL (CONFLIT : épiques mentionnent "éviter Prisma", mais architecture impose Prisma via starter)
- **Testing :** Jest + Cypress + MSW préconfigurés

### Project Structure Notes

- **Organisation code :** Architecture pages → layouts → views → components
- **State management :** React Query patterns pour état serveur
- **Styling :** TailwindCSS 3 avec SCSS et méthodologie BEM
- **Build tools :** Next.js avec optimisations production et Docker multi-stage

### Performance Constraints

- **Budget :** 10-20€/mois maximum (ultra-optimisé)
- **Performance targets :** < 3s chargement initial, < 500ms navigation
- **Browser support :** Chrome 120+ uniquement (environnement contrôlé)
- **Scale :** Maximum 2 utilisateurs commerciaux

### References

- [Source: architecture.md#Starter Sélectionné] - Rationale détaillée du choix du starter
- [Source: architecture.md#Décisions Architecturales] - Stack technique complet
- [Source: epics.md#Story 1.1] - Critères d'acceptation originaux

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4 (claude-sonnet-4-20250514)

### Critical Conflicts to Resolve

⚠️ **CONFLIT MAJEUR DÉTECTÉ :**
- **Épiques** demandent d'éviter Prisma (retour d'expérience négatif)
- **Architecture** impose starter avec Prisma préconfigué
- **Recommandation :** Suivre l'architecture (plus récente) mais documenter le risque

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Conflict Prisma documenté mais architecture respectée selon priorité chronologique

### File List