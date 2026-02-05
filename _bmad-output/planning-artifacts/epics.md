# Épiques et User Stories - BMAD CRM

**Projet :** BMAD CRM
**Auteur :** Amaury
**Date :** 2026-01-22
**Statut :** Phase 4 - Implémentation

---

## Epic 1 : Configuration et Infrastructure de Base

**Objectif :** Établir la fondation technique et l'architecture de base du CRM.

**Valeur Business :** Infrastructure solide et évolutive pour supporter toutes les fonctionnalités futures.

### Story 1.1 : Configuration du projet et structure de base

**En tant que** développeur,
**Je veux** une structure de projet claire et organisée,
**Pour que** je puisse développer efficacement et maintenir le code.

**Critères d'acceptation :**
- Structure de projet initialisée (Next.js/React)
- Configuration TypeScript opérationnelle
- Configuration ESLint/Prettier
- Base de données configurée (éviter Prisma selon retour d'expérience)
- Variables d'environnement sécurisées
- Scripts de développement fonctionnels

### Story 1.2 : Authentification et sécurité de base

**En tant qu'** utilisateur commercial,
**Je veux** un système d'authentification sécurisé,
**Pour que** seule notre équipe puisse accéder aux données prospects.

**Critères d'acceptation :**
- Système de login/logout fonctionnel
- Session persistante sécurisée
- Protection des routes privées
- Gestion des tokens d'accès
- Interface de login simple et efficace

### Story 1.3 : Interface utilisateur de base et navigation

**En tant qu'** utilisateur commercial,
**Je veux** une interface claire et intuitive,
**Pour que** je puisse naviguer facilement entre les fonctionnalités.

**Critères d'acceptation :**
- Layout principal responsive
- Menu de navigation principal
- Sidebar avec accès rapide aux sections
- Design minimaliste et fonctionnel (MVP prioritaire)
- Navigation cohérente entre les pages

---

## Epic 2 : Système de Prospection et Acquisition de Données

**Objectif :** Automatiser l'acquisition de prospects via scraping Google Maps avec validation qualité.

**Valeur Business :** Génération automatique de leads qualifiés pour réduire la recherche manuelle.

### Story 2.1 : Module de scraping Google Maps

**En tant qu'** utilisateur commercial,
**Je veux** pouvoir lancer un scraping automatisé sur Google Maps,
**Pour que** j'obtienne des listes de prospects artisans/PME ciblés.

**Critères d'acceptation :**
- Interface de configuration du scraping (zone géo, mots-clés)
- Intégration API Google Maps ou alternative
- Extraction des informations de base (nom, adresse, téléphone, site web)
- Gestion des erreurs et timeouts
- Logging des opérations de scraping

### Story 2.2 : Filtrage automatique des prospects avec problèmes web

**En tant qu'** utilisateur commercial,
**Je veux** que le système filtre automatiquement les prospects en gardant uniquement ceux avec des problèmes de site web,
**Pour que** je me concentre exclusivement sur les prospects à qui je peux vendre des améliorations web.

**Critères d'acceptation :**
- **Détection des sites inexistants/défaillants** : 404, erreurs serveur, domaines expirés → GARDER
- **Identification des redirections sociales** : Sites qui redirigent vers Facebook/Instagram → GARDER
- **Analyse de l'obsolescence** : Sites visuellement datés, technologies obsolètes → GARDER
- **Évaluation responsive/mobile** : Sites non-adaptés mobile → GARDER
- **Audit SEO défaillant** : Pages non-indexées, balises manquantes, problèmes techniques → GARDER
- **Filtrage automatique** : Éliminer tous les prospects avec des sites corrects/récents/optimisés
- **Catégorisation des prospects retenus** : "Pas de site", "Facebook/Instagram uniquement", "Site obsolète", "Problèmes SEO", "Non-responsive"
- **Base prospects qualifiée** : Ne conserver que les prospects avec opportunités de vente réelles
- **Fiabilité de 70-80%** du filtrage pour éviter de perdre de bonnes opportunités

### Story 2.3 : Système anti-doublons robuste

**En tant qu'** utilisateur commercial,
**Je veux** éviter les doublons dans ma base prospects,
**Pour que** je ne contacte pas plusieurs fois la même entreprise.

**Critères d'acceptation :**
- Détection automatique des doublons (nom, adresse, téléphone)
- Algorithme de fuzzy matching pour variations
- Interface de résolution des conflits
- Merge automatique ou manuel des données
- Historique des fusions effectuées

---

## Epic 3 : Gestion des Prospects et CRM Core

**Objectif :** Interface complète de gestion des prospects avec workflow commercial 8-phases.

**Valeur Business :** Suivi organisé et efficace des opportunités commerciales.

### Story 3.1 : Base de données prospects et interface de consultation

**En tant qu'** utilisateur commercial,
**Je veux** consulter et organiser mes prospects,
**Pour que** j'aie une vue d'ensemble de mon pipeline.

**Critères d'acceptation :**
- Liste paginée des prospects avec filtres
- Vue détaille prospect individuel
- Informations complètes (contact, site, statut qualité)
- Recherche rapide et filtres avancés
- Export des listes (CSV/Excel)

### Story 3.2 : Workflow commercial 8-phases

**En tant qu'** utilisateur commercial,
**Je veux** suivre chaque prospect dans un workflow structuré,
**Pour que** je ne perde aucune opportunité et optimise ma conversion.

**Critères d'acceptation :**
- Définition des 8 phases du workflow
- Interface drag & drop ou boutons de progression
- Suivi automatique des échéances par phase
- Notifications et rappels automatiques
- Historique complet des interactions

### Story 3.3 : Gestion des échéances et suivi temporel

**En tant qu'** utilisateur commercial,
**Je veux** être alerté des actions à effectuer,
**Pour que** je respecte mes engagements et maintienne un rythme commercial.

**Critères d'acceptation :**
- Calendrier intégré avec échéances prospects
- Alertes automatiques (email, notifications)
- Vue agenda quotidienne/hebdomadaire
- Reporting de performance temporelle
- Snooze et reprogrammation des actions

---

## Epic 4 : Optimisation et Monitoring

**Objectif :** Assurer la fiabilité, performance et monitoring du système.

**Valeur Business :** ROI positif avec budget 10-20€/mois et fiabilité opérationnelle.

### Story 4.1 : Monitoring et métriques de performance

**En tant qu'** administrateur du système,
**Je veux** monitorer les performances et la santé du CRM,
**Pour que** je détecte et corrige rapidement les problèmes.

**Critères d'acceptation :**
- Dashboard de métriques système
- Monitoring uptime et performance
- Alertes en cas de dysfonctionnement
- Logs centralisés et analysables
- Métriques business (conversion, utilisation)

### Story 4.2 : Plan de continuité et backup

**En tant qu'** utilisateur commercial,
**Je veux** que mes données soient protégées et accessibles,
**Pour que** je ne perde jamais mon travail commercial.

**Critères d'acceptation :**
- Système de backup automatique
- Plan B en cas de panne API externe
- Procédure de restauration testée
- Redondance des données critiques
- Documentation des procédures d'urgence

---

## Informations Techniques

### Architecture Target
- **Frontend :** Next.js 14+ avec TypeScript
- **Backend :** API Routes Next.js ou Node.js
- **Base de données :** PostgreSQL ou MySQL (éviter Prisma)
- **Déploiement :** Vercel ou solution équivalente
- **Budget :** 10-20€/mois maximum

### Contraintes Techniques
- Éviter Prisma (retour d'expérience négatif)
- Prioriser la stabilité sur les fonctionnalités avancées
- Design MVP : fonctionnel avant esthétique
- Performance : réponse < 2s pour actions courantes

### Définition de "Done"
- Tests fonctionnels passants
- Code review effectué
- Documentation mise à jour
- Déploiement en production réussi
- Validation utilisateur obtenue