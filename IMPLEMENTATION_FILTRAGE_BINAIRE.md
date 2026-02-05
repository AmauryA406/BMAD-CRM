# Implémentation du Filtrage Binaire Web Quality

**Date**: 2026-01-23
**Architecte**: Winston (Claude Code)
**Objectif**: Remplacer le système de scoring complexe par un filtrage binaire simple et efficace

## 🎯 Principe du Filtrage Binaire

### Ancien Système (SUPPRIMÉ)
- ❌ QualityScore de 0 à 100
- ❌ Thresholds OBSOLETE, NEEDS_MODERNIZATION, ACCEPTABLE
- ❌ Classification GOLD, PLATINUM, QUALIFIED, NOT_QUALIFIED
- ❌ Modèle QualityValidation complexe

### Nouveau Système (IMPLÉMENTÉ)
- ✅ **Site avec problème** → **GARDER** le prospect (potentiel client)
- ✅ **Site correct** → **SUPPRIMER** le prospect (pas d'opportunité)
- ✅ Deux champs simples : `hasWebsiteIssue` + `websiteIssueReason`

## 📂 Fichiers Créés/Modifiés

### 1. Schema Prisma (`schema.prisma`)
```prisma
model Prospect {
  // Champs de filtrage binaire
  hasWebsiteIssue      Boolean   @default(false)
  websiteIssueReason   String?   // "404", "Redirection FB", etc.
  lastWebsiteCheck     DateTime?

  // SUPPRIMÉ: qualityScore, classification, QualityValidation
}
```

### 2. Service WebQualityFilter (`lib/services/webQualityFilter.ts`)
**Fonctionnalités:**
- Détection sites inexistants (404, 500, timeout)
- Détection redirections réseaux sociaux uniquement
- Détection sites non-responsifs (pas viewport, media queries)
- Détection technologies obsolètes (Flash, copyright > 3 ans)
- **Filtrage binaire**: UN problème = GARDER, sinon SUPPRIMER

**API Publique:**
```typescript
class WebQualityFilter {
  async validateWebsite(url: string): Promise<WebsiteIssueResult>
  async validateBatch(urls: string[], maxConcurrency = 10): Promise<WebsiteIssueResult[]>
}
```

### 3. API Routes
#### `/pages/api/scraping/validate.ts`
- Validation lors du scraping avec filtrage automatique
- Import uniquement des prospects avec problèmes web
- Statistiques de rejet (sites corrects supprimés)

#### `/pages/api/prospects/[id]/validate.ts`
- Re-validation manuelle d'un prospect individuel
- Mise à jour des champs de filtrage
- Logging des changements de statut

### 4. Service Pipeline (`lib/services/scrapingPipeline.ts`)
**Pipeline intégré:**
1. Scraping Google Maps → données brutes
2. Validation qualité web → filtrage binaire
3. Import BDD → uniquement les prospects avec opportunités
4. Statistiques détaillées de filtrage

### 5. Composants UI
#### `components/ProspectCard.tsx`
- Affichage visuel du type de problème web détecté
- Indicateurs colorés selon la raison du filtrage
- Actions rapides (appel, re-validation, notes)

#### `components/ScrapingDashboard.tsx`
- Interface de configuration du scraping
- Suivi temps réel du filtrage binaire
- Statistiques: gardés vs rejetés avec taux de filtrage

## 🔍 Critères de Filtrage

### Prospects GARDÉS (hasWebsiteIssue = true)
1. **Site inexistant**: 404, 500, timeout
2. **Redirection réseaux sociaux**: Facebook/Instagram uniquement
3. **Site non-responsive**: Pas de viewport meta, pas de media queries
4. **Technologies obsolètes**: Flash, copyright > 3 ans, HTTP seulement

### Prospects SUPPRIMÉS (hasWebsiteIssue = false)
- Site moderne avec HTTPS
- Design responsive fonctionnel
- Technologies récentes
- Copyright récent (< 2 ans)

## 📊 Bénéfices de l'Architecture

### Simplicité
- **Logique claire**: 1 problème = 1 décision
- **Code maintenable**: Algorithmes simples et testables
- **Performance optimisée**: Arrêt dès premier problème détecté

### Pertinence Business
- **Focus commercial**: Garder seulement les vraies opportunités
- **ROI amélioré**: Pas de temps perdu sur prospects sans potentiel
- **Taux de conversion**: Meilleure qualification des leads

### Scalabilité
- **Validation batch**: Traitement parallèle de 10-20 URLs
- **Timeout intelligent**: 10s max par site
- **Error handling**: Erreur = problème = prospect gardé

## 🚀 Utilisation

### Démarrage Scraping avec Filtrage
```typescript
const pipeline = new ScrapingPipeline()

const result = await pipeline.executePipeline({
  metier: 'plombier',
  villes: ['Paris', 'Lyon'],
  maxProspects: 100,
  userId: 'user-id'
})

console.log(`${result.prospectsWithIssues} prospects gardés sur ${result.totalScraped}`)
```

### Validation Individuelle
```typescript
const filter = new WebQualityFilter()

const result = await filter.validateWebsite('https://artisan-site.com')

if (result.shouldKeepProspect) {
  console.log(`Prospect gardé: ${result.websiteIssueReason}`)
} else {
  console.log('Prospect rejeté: site moderne')
}
```

## 📈 Métriques de Succès

### Attendues (objectif 70-80% de précision)
- **Taux de filtrage**: 40-60% des prospects gardés
- **Faux positifs**: < 20% (sites corrects marqués problème)
- **Faux négatifs**: < 10% (sites problème marqués corrects)

### Surveillance
- Statistiques de rejet par type (404, non-responsive, etc.)
- Feedback commercial sur la qualité des leads
- Performance technique (temps de validation, timeouts)

## 🔧 Migration depuis l'Ancien Système

### Base de Données
```sql
-- Suppression ancienne structure
DROP TABLE IF EXISTS quality_validation;

-- Nouveaux champs ajoutés automatiquement par Prisma
ALTER TABLE prospects
ADD COLUMN has_website_issue BOOLEAN DEFAULT FALSE,
ADD COLUMN website_issue_reason TEXT,
ADD COLUMN last_website_check TIMESTAMP;
```

### Code Legacy
- Supprimer références à `QualityScore`, `ProspectType`
- Remplacer appels à l'ancien service de scoring
- Adapter filtres UI pour nouveaux champs

## ✅ Validation de l'Implémentation

### Tests Critiques
1. **Détection 404**: Site inexistant → `hasWebsiteIssue = true`
2. **Détection redirection sociale**: Site → Facebook → `hasWebsiteIssue = true`
3. **Détection non-responsive**: Pas de viewport → `hasWebsiteIssue = true`
4. **Site moderne**: HTTPS + responsive → `hasWebsiteIssue = false` (SUPPRIMÉ)

### Performance
- Validation batch de 50 URLs en < 60s
- Timeout individual de 10s respecté
- Gestion d'erreurs robuste (erreur = problème = garder)

---

**🎯 Cette refonte simplifie drastiquement l'architecture tout en améliorant la pertinence commerciale des prospects. Le filtrage binaire élimine la complexité du scoring et focus sur l'essentiel : identifier les vraies opportunités de vente web.**