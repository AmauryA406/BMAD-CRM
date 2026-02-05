# Story 2.2: Filtrage automatique des prospects avec problèmes web

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'utilisateur commercial,
Je veux que le système filtre automatiquement les prospects en gardant uniquement ceux avec des problèmes de site web,
Pour que je me concentre exclusivement sur les prospects à qui je peux vendre des améliorations web.

## Acceptance Criteria

1. **Détection des sites inexistants/défaillants** : 404, erreurs serveur, domaines expirés → GARDER le prospect
2. **Identification des redirections sociales** : Sites qui redirigent vers Facebook/Instagram uniquement → GARDER le prospect
3. **Analyse de l'obsolescence** : Sites visuellement datés, technologies obsolètes → GARDER le prospect
4. **Évaluation responsive/mobile** : Sites non-adaptés mobile → GARDER le prospect
5. **Filtrage automatique** : Éliminer tous les prospects avec des sites corrects/récents/optimisés → SUPPRIMER le prospect
6. **Catégorisation des prospects retenus** : "404", "Redirection réseaux sociaux", "Site non-responsive", "Technologies obsolètes"
7. **Base prospects qualifiée** : Ne conserver que les prospects avec opportunités de vente réelles
8. **Fiabilité de 70-80%** du filtrage pour éviter de perdre de bonnes opportunités

## Tasks / Subtasks

- [x] **Architecture du filtrage binaire** (AC: 1,2,3,4,5,6) ✅ FAIT par Winston
  - [x] Schema Prisma simplifié avec `hasWebsiteIssue` et `websiteIssueReason`
  - [x] Service WebQualityFilter avec algorithmes de détection
  - [x] Pipeline de scraping intégré avec filtrage automatique
  - [x] Composants UI pour affichage des résultats

- [ ] **Intégration avec scraping Google Maps** (AC: 5,7)
  - [ ] Modifier le pipeline de scraping pour intégrer le filtrage binaire
  - [ ] Connecter WebQualityFilter au processus de scraping
  - [ ] Implémenter la logique de suppression automatique des sites corrects

- [ ] **Interface utilisateur pour visualisation filtrage** (AC: 6,8)
  - [ ] Dashboard de scraping avec statistiques temps réel
  - [ ] Indicateurs visuels des types de problèmes détectés
  - [ ] Rapport de filtrage (gardés vs supprimés)

- [ ] **Tests et validation qualité** (AC: 8)
  - [ ] Tests unitaires des algorithmes de détection
  - [ ] Tests d'intégration du pipeline complet
  - [ ] Validation de la fiabilité 70-80%

## Dev Notes

### Architecture Pattern - Filtrage Binaire

**Principe Core :**
- UN problème détecté = GARDER le prospect
- AUCUN problème = SUPPRIMER le prospect (pas d'opportunité commerciale)

**Services Techniques :**
- `WebQualityFilter` : Service principal de validation
- `ScrapingPipeline` : Pipeline intégré scraping + filtrage
- `ProspectCard` : UI pour affichage des problèmes détectés

### Database Schema Changes

**Nouveaux champs dans model Prospect :**
```prisma
hasWebsiteIssue      Boolean   @default(false)
websiteIssueReason   String?   // "404", "Redirection FB", "Non-responsive", etc.
lastWebsiteCheck     DateTime?
```

**SUPPRIMÉ :** Model QualityValidation complet, enum ProspectType, scoring pondéré

### Project Structure Notes

**Fichiers créés par l'architecte Winston :**
- `/schema.prisma` - Schema BDD simplifié
- `/lib/services/webQualityFilter.ts` - Service de filtrage binaire
- `/lib/services/scrapingPipeline.ts` - Pipeline intégré
- `/pages/api/scraping/validate.ts` - API validation scraping
- `/pages/api/prospects/[id]/validate.ts` - API re-validation individuelle
- `/components/ProspectCard.tsx` - UI prospect avec problèmes
- `/components/ScrapingDashboard.tsx` - Interface de scraping

**Architecture Next.js + TypeScript + Prisma :**
- API Routes pour validation endpoints
- Services dans `/lib/services/`
- Composants UI dans `/components/`
- Types TypeScript générés par Prisma

### Algorithmes de Détection Implémentés

**1. Sites Inexistants :**
```typescript
// Détection 404, 500, timeout
const hasError = response.status === 404 || response.status >= 500
```

**2. Redirections Sociales :**
```typescript
// Vérification URL finale et contenu
const isSocialRedirect = finalUrl.includes('facebook.com') || finalUrl.includes('instagram.com')
```

**3. Sites Non-Responsifs :**
```typescript
// Détection viewport meta + media queries
const isResponsive = hasViewportMeta && (hasMediaQueries || hasBootstrap || hasFlexbox)
```

**4. Technologies Obsolètes :**
```typescript
// Copyright ancien + technologies dépassées
const hasCopyrightIssue = lastCopyright < (currentYear - 3)
const hasFlash = htmlContent.includes('flash')
```

### Performance Requirements

- **Validation batch** : 10-20 URLs en parallèle maximum
- **Timeout** : 10s max par site web
- **Error handling** : Erreur de validation = problème = prospect gardé
- **Cible performance** : 50 prospects analysés en < 60s

### Testing Standards

**Tests Critiques à Implémenter :**
1. Détection 404 → `hasWebsiteIssue = true, reason = "404"`
2. Site moderne HTTPS responsive → `hasWebsiteIssue = false` (SUPPRIMÉ)
3. Redirection Facebook → `hasWebsiteIssue = true, reason = "Redirection réseaux sociaux"`
4. Site sans viewport meta → `hasWebsiteIssue = true, reason = "Site non-responsive"`

**Framework de test :** Jest + testing-library (selon starter boilerplate)

### References

- [Source: IMPLEMENTATION_FILTRAGE_BINAIRE.md#Principe du Filtrage Binaire] - Logique métier complète
- [Source: architecture.md#Architecture de Validation Qualité Web] - Spécifications techniques
- [Source: epics.md#Story 2.2] - Critères d'acceptation originaux
- [Source: schema.prisma] - Structure BDD simplifiée
- [Source: lib/services/webQualityFilter.ts] - Service principal implémenté

### Integration Notes

**APIs Externes :**
- Scraping Dog API pour récupération URLs (coût : ~0.00033€/requête)
- Validation web = requêtes HTTP directes (coût : 0€)

**Pipeline Flow :**
```
Scraping Google Maps → WebQualityFilter → Filtrage binaire → Import BDD
```

**Budget Impact :** 0€ supplémentaire (validation gratuite après scraping)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4 (claude-sonnet-4-20250514)

### Critical Requirements

🚨 **ARCHITECTURE CRITIQUE** : Utilisez EXACTEMENT les fichiers créés par Winston. Ne pas réinventer ou modifier les algorithmes de détection.

🎯 **BUSINESS LOGIC** :
- GARDER = prospect avec problème web (opportunité de vente)
- SUPPRIMER = prospect avec site moderne (pas d'opportunité)

🔧 **TECHNICAL STACK** :
- Next.js API Routes pour endpoints
- Prisma pour BDD (champs binaires simples)
- TypeScript strict
- Services dans `/lib/services/`

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Architecture de filtrage binaire fournie par Winston (architecte)
- Story créée en mode YOLO selon activation agent SM
- Tous les fichiers techniques déjà implémentés par l'architecte

### File List

**Fichiers Existants (créés par Winston) :**
- `schema.prisma`
- `lib/services/webQualityFilter.ts`
- `lib/services/scrapingPipeline.ts`
- `pages/api/scraping/validate.ts`
- `pages/api/prospects/[id]/validate.ts`
- `components/ProspectCard.tsx`
- `components/ScrapingDashboard.tsx`
- `IMPLEMENTATION_FILTRAGE_BINAIRE.md`

**Fichiers à Créer/Modifier :**
- Tests unitaires pour WebQualityFilter
- Tests d'intégration pour ScrapingPipeline
- Configuration Prisma migration
- Documentation API endpoints