---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish"]
inputDocuments: ["/_bmad-output/analysis/brainstorming-session-2026-01-13.md"]
workflowType: 'prd'
briefCount: 0
researchCount: 0
brainstormingCount: 1
projectDocsCount: 0
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
---

# Product Requirements Document - BMAD CRM

**Author:** Amaury
**Date:** 2026-01-13

## Executive Summary

CRM web app interne pour équipe commerciale 2 personnes ciblant artisans/PME avec sites obsolètes. Acquisition automatisée via Google Maps scraping, workflow commercial 8-phases, budget 10-20€/mois. MVP fonctionnel prioritaire sur esthétique.

**Product Differentiator:** Validation qualité automatique + coût ultra-optimisé + anti-doublons robuste pour prospection artisans spécialisée.

**Target Users:** Commerciaux B2B (vous + associé)

## Success Criteria

### User Success

- **Qualité prospects :** "Site non-responsif" marqué = vraiment non-responsif (70-80% fiabilité)
- **Efficacité opérationnelle :** Lancer scraping → Café → Prospects organisés et prêts
- **Organisation claire :** Tout visible, suivi échéances, zéro doublons
- **Gain de temps :** Moins de recherche/vérification manuelle

### Business Success

- **6 clients signés/mois** = succès à 12 mois
- ROI positif avec budget 10-20€/mois
- Conversion efficace prospects scrapés → clients payants

### Technical Success

- **Fiabilité données :** 70-80% précision (60% acceptable)
- **Robustesse :** Plan B si API tombe
- **Stabilité :** Éviter problèmes BDD (leçon Prisma)

### Measurable Outcomes

- 200-300 prospects qualifiés/mois dans budget
- Taux validation qualité 70-80%
- Zéro doublons dans la base

## User Journeys

### Parcours 1: "Lundi Productif" - Commercial en Action

**Actions :**
1. **Vérification suivis post-signature** + dates prochains RDV programmés
2. **Priorisation rappels** avec notes contextuelles
3. **Session appels ciblés** avec mise à jour statuts
4. **Traitement nouveaux prospects** avec ajout notes

**Climax :** Prospects basculent vers "Maquette" - pipeline qui se concrétise

### Parcours 2: "Gestion de Crise" - Récupération Technique

**Crises :** BDD inaccessible, panne API, doublons massifs
**Récupération :** Diagnostic → Solution immédiate → Debug → Plan long terme

## Product Scope

### MVP - Experience MVP

**Must-Have Capabilities :**
- Scraping Google Maps + validation qualité automatique
- Système anti-doublons robuste
- Import/Export Excel
- Workflow 8-phases avec recherche/filtres
- Interface liste + formulaire (fonctionnel > joli)
- Authentification 2 utilisateurs

### Phase 2 (Growth)

- Interface dual-panel sophistiquée
- Dates rappel automatiques
- Dashboard métriques visuelles

### Phase 3 (Vision)

- APIs premium qualité données
- Enrichissement automatique clients

### Risk Mitigation

**Qualité Données + BDD (RISQUES #1) :** Tests 50 prospects + stack simple + backups automatiques
**Technical/Resource :** Plan B API + MVP minimal

## Functional Requirements

### Gestion des Prospects

- **FR1:** Système crée automatiquement prospects depuis scraping (nom, téléphone, lien, raison)
- **FR2:** Commerciaux peuvent modifier informations prospect
- **FR3:** Commerciaux peuvent supprimer prospect
- **FR4:** Commerciaux peuvent rechercher par nom entreprise
- **FR5:** Commerciaux peuvent filtrer par statut 8-phases
- **FR6:** Commerciaux peuvent voir liste complète avec infos essentielles
- **FR7:** Commerciaux peuvent consulter détails complets prospect
- **FR8:** Commerciaux peuvent ajouter/modifier notes contextuelles

### Acquisition de Données

- **FR9:** Système scrape Google Maps via Scraping Dog API
- **FR10:** Système valide automatiquement qualité sites (404, responsive, dates)
- **FR11:** Système classifie automatiquement raison scraping
- **FR12:** Commerciaux peuvent lancer scraping manuel ville(s) spécifique(s)
- **FR13:** Système traite 200-300 prospects/mois dans limites budgétaires
- **FR36:** Système assigne automatiquement statut "À contacter" aux prospects scrapés

### Organisation Commerciale

- **FR14:** Commerciaux assignent statut workflow 8-phases (Premier appel → Maquette → Décision → Contractualisation → GitHub → Développement → Passation → Paiement)
- **FR15:** Commerciaux peuvent changer statut prospect dans workflow
- **FR16:** Commerciaux identifient prospects "À rappeler" avec priorité
- **FR17:** Commerciaux consultent dates prochains RDV programmés
- **FR18:** Système affiche prospects par priorité (À rappeler > À contacter)
- **FR19:** Commerciaux programment/suivent échéances par société

### Gestion des Doublons

- **FR20:** Système détecte automatiquement doublons (nom + téléphone)
- **FR21:** Système empêche création doublons lors scraping/import Excel
- **FR22:** Système empêche import doublons lors scraping
- **FR23:** Commerciaux résolvent manuellement conflits doublons

### Import/Export de Données

- **FR24:** Commerciaux exportent liste complète prospects Excel
- **FR25:** Commerciaux exportent prospects filtrés Excel
- **FR26:** Commerciaux importent liste prospects depuis Excel
- **FR27:** Système valide structure données lors import Excel

### Sécurité & Accès

- **FR28:** Utilisateurs connectent avec login/password
- **FR29:** Système maintient sessions sécurisées avec timeout
- **FR30:** Système restreint accès aux 2 commerciaux uniquement
- **FR31:** Commerciaux se déconnectent manuellement

### Gestion d'Erreurs & Récupération

- **FR32:** Système diagnostique pannes BDD et API
- **FR33:** Commerciaux relancent manuellement connexions en cas de panne
- **FR34:** Système bascule vers API backup si Scraping Dog indisponible
- **FR35:** Système maintient intégrité données en cas corruption

## Non-Functional Requirements

### Performance

- **NFR1:** Navigation liste prospects < 3 secondes (300+ prospects)
- **NFR2:** Changement statut prospect < 1 seconde
- **NFR3:** Recherche/filtres < 2 secondes
- **NFR4:** Scraping 200 prospects jusqu'à 1 heure sans timeout
- **NFR5:** Export Excel < 10 secondes (300 prospects)

### Security

- **NFR6:** Données chiffrées en transit (HTTPS)
- **NFR7:** Sessions sécurisées avec timeout inactivité
- **NFR8:** Accès restreint 2 commerciaux uniquement
- **NFR9:** Mots de passe hash sécurisé

### Integration

- **NFR10:** Basculement API backup < 30 secondes si Scraping Dog indisponible
- **NFR11:** Import Excel traite 1000 lignes sans erreur
- **NFR12:** APIs externes gèrent échecs avec retry automatique

### Reliability

- **NFR13:** BDD maintient intégrité en cas panne système
- **NFR14:** Backups quotidiens automatiques, récupération < 24h
- **NFR15:** Système détecte/signale pannes API/BDD immédiatement

## Technical Architecture

### Web App Specifications

- **Architecture :** SPA moderne (React/Vue recommandé)
- **Browser :** Chrome 120+ uniquement
- **Performance :** Chargement initial < 3 secondes, navigation < 500ms
- **Data Sync :** Refresh manuel acceptable (évite WebSockets)
- **Security :** HTTPS + authentification simple + session timeout
- **SEO :** Aucun (application interne)