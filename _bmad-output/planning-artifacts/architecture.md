---
stepsCompleted: [1, 2, 3, 4, 5, 6]
lastUpdated: '2026-01-23'
corrections: 'Conflit Prisma résolu, spécifications techniques ajoutées, cohérence épics validée'
inputDocuments: ["/Users/amauryallemand/Documents/Projet perso/2026/B2Dev/CRM/BMAD CRM/_bmad-output/planning-artifacts/prd.md"]
workflowType: 'architecture'
project_name: 'BMAD CRM'
user_name: 'Amaury'
date: '2026-01-21'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Analyse du Contexte Projet

### Vue d'Ensemble des Exigences

**Exigences Fonctionnelles :**
Application CRM B2B avec 35+ exigences organisées en 7 domaines : acquisition automatisée de prospects via scraping Google Maps avec validation qualité, gestion complète du cycle commercial 8-phases, système anti-doublons robuste, import/export Excel, authentification multi-utilisateurs restreinte, et gestion d'erreurs avec basculement APIs.

**Exigences Non-Fonctionnelles :**
Performance critique (navigation < 3s, statut < 1s), sécurité HTTPS avec sessions timeout, fiabilité 70-80% validation données, intégration APIs avec backup automatique, backups quotidiens avec récupération < 24h.

**Échelle et Complexité :**
Projet de complexité faible-moyenne ciblant une équipe commerciale de 2 personnes, traitement 200-300 prospects/mois dans budget 10-20€/mois.

- Domaine primaire : Application Web Full-Stack
- Niveau de complexité : Faible-Moyenne
- Composants architecturaux estimés : 6-8 modules principaux

### Contraintes et Dépendances Techniques

- **Browser :** Chrome 120+ uniquement (environnement contrôlé)
- **Architecture :** SPA moderne (React/Vue recommandé)
- **APIs :** Scraping Dog API primaire + API backup requise
- **Budget :** Ultra-optimisé 10-20€/mois (contrainte majeure)
- **Utilisateurs :** Maximum 2 commerciaux (pas de scalabilité)
- **Performance :** Chargement initial < 3s, navigation < 500ms

### Préoccupations Transversales Identifiées

- **Sécurité :** Authentification, HTTPS, timeout sessions, accès restreint
- **Performance :** Navigation < 2s (épics), optimisation pour 300+ prospects, export rapide Excel
- **Fiabilité :** Robustesse BDD, backups automatiques, intégrité données
- **Intégration :** Gestion pannes API, basculement automatique, retry logic
- **Qualité Données :** Validation sites web, système anti-doublons, précision 70-80%

## Évaluation des Templates de Démarrage

### Domaine Technologique Principal

Application Web Full-Stack basée sur l'analyse des exigences du projet

### Options de Starters Considérées

**T3 Stack (create-t3-app) :** Type-safety complète, CLI simple, modulaire mais sans Docker pré-configuré

**nemanjam/nextjs-prisma-boilerplate :** Docker complet, tests inclus, documentation détaillée pour juniors, CI/CD pré-configuré

**Vercel Official Starter :** Simple et officiel mais moins complet pour l'apprentissage

### Starter Sélectionné : Create Next App + Configuration Manuelle

**Rationale de Sélection :**
Abandon du boilerplate Prisma conformément aux épics ("éviter Prisma selon retour d'expérience"). Configuration manuelle pour contrôle total avec Drizzle ORM moderne, type-safe et performant. Stack simplifiée mais robuste.

**Commande d'Initialisation :**

```bash
npx create-next-app@latest bmad-crm --typescript --tailwind --eslint --app
cd bmad-crm
npm install drizzle-orm drizzle-kit @neondatabase/serverless
npm install -D @types/node
```

**Décisions Architecturales Fournies par le Starter :**

**Langage et Runtime :**
TypeScript 4.7.4 avec configuration ESLint/Prettier, Node.js 16.13.1

**Solution de Styling :**
TailwindCSS 3 avec SCSS et méthodologie BEM pour responsive design

**Outils de Build :**
Next.js 12.2.0 avec optimisations production et configuration Docker multi-stage

**Framework de Tests :**
Jest (unit/integration) + Cypress (E2E) avec configuration MSW pour mocking APIs

**Organisation du Code :**
Architecture pages → layouts → views → components avec patterns React Query pour état serveur

**Expérience de Développement :**
Docker Compose pour dev/test/prod, hot reloading, debugging configuré, documentation complète

**Note :** L'initialisation du projet avec cette commande devrait être la première story d'implémentation.

## Décisions Architecturales Essentielles

### Analyse de Priorité des Décisions

**Décisions Critiques (Bloquent l'Implémentation) :**
Architecture données relationnelle, Authentification simple custom, API Routes REST, Gestion d'état React useState + React Query, Infrastructure Vercel + Neon + Scraping Dog

**Décisions Importantes (Façonnent l'Architecture) :**
Toutes les décisions ci-dessus façonnent directement l'architecture

**Décisions Reportées (Post-MVP) :**
Monitoring avancé, scaling horizontal, optimisations performance avancées

### Architecture Données

**Approche :** Relationnelle classique avec contraintes PostgreSQL
**ORM :** Drizzle ORM (moderne, type-safe, performant)
**Version BDD :** PostgreSQL 15+
**Rationale :** Évite Prisma selon épics, garantit intégrité anti-doublons, facilite requêtes de filtrage, excellent DX TypeScript

### Authentification & Sécurité

**Méthode :** Authentification simple custom (login/password + sessions cookies)
**Middleware :** Protection routes avec vérification session
**Rationale :** Contrôle total, simplicité pour équipe junior, adapté pour 2 utilisateurs internes

### Patterns API & Communication

**Style API :** REST classique avec API Routes Next.js
**Structure :** /api/prospects, /api/prospects/[id], /api/scraping, /api/auth/login
**Validation :** Zod schemas (configuration manuelle)
**Rationale :** Pattern familier, documentation Next.js excellente, facilite tests et debugging

### Architecture Frontend

**Gestion d'état serveur :** React Query (fourni par starter)
**Gestion d'état local :** React useState/useReducer natifs
**Formulaires :** React Hook Form + Zod (fourni par starter)
**Rationale :** Approche progressive, boilerplate configuré, évite sur-complexification

### Infrastructure & Déploiement

**Hébergement :** Vercel (gratuit pour traffic prévu)
**Base de données :** Neon PostgreSQL (0.5GB gratuit largement suffisant)
**API Scraping :** Scraping Dog (~0.00033€/requête)
**Budget total :** ~0.20€/mois (vs limite 10-20€/mois)
**Environnements :** Dev (Docker local), Staging/Prod (Vercel + Neon)

### Analyse d'Impact des Décisions

**Séquence d'Implémentation :**
1. Initialisation projet avec boilerplate
2. Configuration BDD Prisma + modèles
3. Auth simple + middleware protection
4. API Routes REST pour CRUD prospects
5. Interface React avec React Query
6. Intégration Scraping Dog API
7. **Validation qualité des sites web (coût 0€)**

**Dépendances Inter-Composants :**
Auth protège toutes les routes → API Routes dépendent des modèles Prisma → Frontend React Query consomme APIs → Scraping enrichit données prospects → **Validation qualité analyse sites sans coût supplémentaire**

### Architecture de Validation Qualité Web

**Contexte Business :**
La validation qualité des sites web est au cœur de la proposition de valeur : identifier les artisans/PME avec sites obsolètes pour proposer la modernisation. **L'objectif est de filtrer et garder uniquement les prospects avec problèmes web.**

**Principe Architectural - Filtrage Binaire :**
Une fois l'URL récupérée via Scraping Dog (seul coût), un système de filtrage binaire analyse chaque site :
- **Site avec problème** → GARDER le prospect (potentiel client)
- **Site correct** → SUPPRIMER le prospect (pas d'opportunité commerciale)

#### Composants de Validation

**1. Web Quality Filter Service**
```typescript
interface WebQualityFilter {
  validateSiteStatus(url: string): Promise<SiteStatusValidation>
  checkResponsiveDesign(url: string): Promise<ResponsiveValidation>
  detectObsoleteContent(url: string): Promise<ObsoleteContentValidation>
  detectSocialRedirect(url: string): Promise<SocialRedirectValidation>
  determineWebsiteIssue(validations: AllValidations): WebsiteIssueResult
}
```

**2. Validation Pipeline Architecture**
```
URL (depuis scraping) → HTTP Request Direct → Analyse HTML/CSS → Filtrage Binaire
                                        ↓
                        Problème détecté ? → GARDER | Pas de problème → SUPPRIMER
```

#### Algorithmes de Détection des Problèmes

**Détection Sites Inexistants**
```typescript
async function validateSiteStatus(url: string): Promise<SiteStatusValidation> {
  try {
    const response = await fetch(url, {timeout: 10000})
    return {
      hasError: response.status === 404 || response.status >= 500,
      errorType: response.status === 404 ? '404' : response.status >= 500 ? '500' : null,
      isTimeout: false,
      hasSSL: url.startsWith('https://')
    }
  } catch (error) {
    return {
      hasError: true,
      errorType: 'timeout',
      isTimeout: true,
      hasSSL: false
    }
  }
}
```

**Détection Redirections Réseaux Sociaux**
```typescript
async function detectSocialRedirect(url: string): Promise<SocialRedirectValidation> {
  try {
    const response = await fetch(url, {redirect: 'manual'})

    // Vérifier redirections vers réseaux sociaux
    const redirectLocation = response.headers.get('location') || ''
    const isSocialRedirect =
      redirectLocation.includes('facebook.com') ||
      redirectLocation.includes('instagram.com') ||
      redirectLocation.includes('fb.me')

    // Vérifier contenu principal = réseaux sociaux uniquement
    const htmlContent = await response.text()
    const onlySocialContent =
      htmlContent.includes('facebook.com/embed') ||
      htmlContent.includes('instagram.com/embed') ||
      (htmlContent.includes('facebook') && !htmlContent.includes('<nav') && !htmlContent.includes('menu'))

    return {
      redirectsToSocial: isSocialRedirect,
      onlySocialContent: onlySocialContent,
      hasIssue: isSocialRedirect || onlySocialContent
    }
  } catch {
    return { redirectsToSocial: false, onlySocialContent: false, hasIssue: false }
  }
}
```

**Détection Sites Non-Responsifs**
```typescript
async function checkResponsiveDesign(htmlContent: string): Promise<ResponsiveValidation> {
  const hasViewportMeta = htmlContent.includes('<meta name="viewport"')
  const hasMediaQueries = htmlContent.includes('@media')
  const hasFlexbox = htmlContent.includes('flex') || htmlContent.includes('grid')
  const hasBootstrap = htmlContent.includes('bootstrap') || htmlContent.includes('responsive')

  const isResponsive = hasViewportMeta && (hasMediaQueries || hasBootstrap || hasFlexbox)

  return {
    hasViewport: hasViewportMeta,
    hasMediaQueries: hasMediaQueries,
    hasModernCSS: hasFlexbox,
    hasFramework: hasBootstrap,
    isNonResponsive: !isResponsive,  // PROBLÈME si non-responsive
    hasIssue: !isResponsive
  }
}
```

**Détection Technologies Obsolètes**
```typescript
async function detectObsoleteContent(htmlContent: string): Promise<ObsoleteContentValidation> {
  const currentYear = new Date().getFullYear()

  // Détection copyright ancien (> 3 ans)
  const copyrightMatches = htmlContent.match(/copyright.*(\d{4})/gi)
  const lastCopyright = Math.max(...copyrightMatches?.map(m => parseInt(m)) || [currentYear])
  const hasCopyrightIssue = lastCopyright < (currentYear - 3)

  // Technologies obsolètes
  const hasFlash = htmlContent.includes('flash') || htmlContent.includes('.swf')
  const hasTableLayout = htmlContent.includes('<table') && htmlContent.includes('cellpadding')
  const hasFrames = htmlContent.includes('<frame') || htmlContent.includes('<frameset')
  const noHTTPS = !htmlContent.includes('https:')

  const obsoleteTech = [
    hasFlash && 'Flash',
    hasTableLayout && 'Table Layout',
    hasFrames && 'Frames',
    noHTTPS && 'HTTP seulement'
  ].filter(Boolean)

  const hasObsoleteTech = obsoleteTech.length > 0

  return {
    lastCopyrightYear: lastCopyright,
    hasOldCopyright: hasCopyrightIssue,
    hasObsoleteTech: hasObsoleteTech,
    obsoleteTechnologies: obsoleteTech,
    hasIssue: hasCopyrightIssue || hasObsoleteTech
  }
}
```

#### Système de Filtrage Binaire

**Algorithme de Décision Binaire**
```typescript
function determineWebsiteIssue(validations: AllValidations): WebsiteIssueResult {
  // GARDER le prospect si UN problème détecté

  // 1. Site inexistant/inaccessible
  if (validations.status.hasError) {
    return {
      hasWebsiteIssue: true,
      websiteIssueReason: validations.status.errorType, // "404", "500", "timeout"
      shouldKeepProspect: true
    }
  }

  // 2. Redirection vers réseaux sociaux uniquement
  if (validations.social.hasIssue) {
    return {
      hasWebsiteIssue: true,
      websiteIssueReason: 'Redirection réseaux sociaux',
      shouldKeepProspect: true
    }
  }

  // 3. Site non-responsive
  if (validations.responsive.hasIssue) {
    return {
      hasWebsiteIssue: true,
      websiteIssueReason: 'Site non-responsive',
      shouldKeepProspect: true
    }
  }

  // 4. Technologies obsolètes
  if (validations.obsolete.hasIssue) {
    return {
      hasWebsiteIssue: true,
      websiteIssueReason: `Technologies obsolètes: ${validations.obsolete.obsoleteTechnologies.join(', ')}`,
      shouldKeepProspect: true
    }
  }

  // Site moderne et correct → SUPPRIMER le prospect
  return {
    hasWebsiteIssue: false,
    websiteIssueReason: 'Site moderne et fonctionnel',
    shouldKeepProspect: false
  }
}
```

#### Intégration avec l'Architecture Existante

**API Routes Simplifiées**
```
/api/scraping/validate        → Validation lors du scraping avec filtrage
/api/prospects/[id]/validate  → Re-validation manuelle d'un prospect
```

**Database Schema Simplifié (Prisma)**
```prisma
model Prospect {
  // ... existing fields

  // Champs de validation binaire
  hasWebsiteIssue      Boolean   @default(false)
  websiteIssueReason   String?   // "404", "Redirection FB", "Non-responsive", etc.
  lastWebsiteCheck     DateTime?

  // Supprimé : qualityScore, classification GOLD/PLATINUM
}

// Supprimé : model QualityValidation entier
// Supprimé : enum ProspectType
```

**Pipeline de Scraping Modifié**
```typescript
async function executeScrapingPipeline(config: ScrapingConfig) {
  // 1. Scraping Google Maps via Scraping Dog API
  const rawProspects = await scrapeGoogleMaps(config)

  // 2. Validation binaire des sites (coût 0€)
  const validatedProspects = await Promise.all(
    rawProspects.map(async prospect => {
      const websiteIssue = await validateWebsiteIssue(prospect.website)
      return {
        ...prospect,
        hasWebsiteIssue: websiteIssue.hasWebsiteIssue,
        websiteIssueReason: websiteIssue.websiteIssueReason,
        shouldKeep: websiteIssue.shouldKeepProspect
      }
    })
  )

  // 3. FILTRAGE : garder seulement les prospects avec problèmes
  const filteredProspects = validatedProspects.filter(prospect => prospect.shouldKeep)

  // 4. Import en BDD uniquement les prospects avec problèmes
  const importResult = await importFilteredProspects(filteredProspects)

  return {
    totalScraped: rawProspects.length,
    withIssues: filteredProspects.length,
    imported: importResult.importedCount,
    rejectedReasons: generateRejectionStats(validatedProspects)
  }
}
```

**Performance et Optimisation**
- **Validation Batch** : Traiter 10-20 URLs en parallèle
- **Filtrage Précoce** : Arrêter validation dès premier problème détecté
- **Timeout** : 10s max par site pour éviter les blocages
- **Statistiques** : Tracker le taux de filtrage pour ajuster les critères

Cette architecture de filtrage binaire simplifie drastiquement la logique métier, améliore la pertinence des prospects gardés, et élimine la complexité du système de scoring tout en gardant un coût de 0€ supplémentaire.

## Architecture des Pipelines Métier

**Vue d'Ensemble des 3 Pipelines Critiques :**
L'application CRM est structurée autour de 3 flux métier principaux qui correspondent aux besoins opérationnels de l'équipe commerciale de 2 personnes.

### Pipeline 1 : Import Excel

**Contexte Business :**
Permet d'importer des listes de prospects existantes (ex: fichiers clients, listes partenaires) tout en préservant les états commerciaux et notes existantes.

**Flux Utilisateur :**
```
Bouton "Importer Excel" → Finder OS → Sélection fichier → Upload →
Traitement ligne par ligne → Détection doublons → Merge données →
Conservation états → Import BDD
```

**Architecture Technique :**

**Frontend (React + Next.js)**
```typescript
// Component d'import
const ExcelImportPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState<ImportProgress>()

  const handleFileSelect = () => {
    // Ouvre le file picker natif du browser
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls,.csv'
    input.click()
  }

  const {mutate: importExcel, isLoading} = useImportExcel()

  return (
    <div>
      <button onClick={handleFileSelect}>Importer un fichier Excel</button>
      {selectedFile && <ExcelPreview file={selectedFile} />}
      {importProgress && <ImportProgressBar progress={importProgress} />}
    </div>
  )
}
```

**API Backend (Next.js API Routes)**
```typescript
// /api/import/excel
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('excel') as File

  // 1. Parsing Excel avec library
  const excelData = await parseExcel(file)

  // 2. Validation et nettoyage
  const validatedProspects = await validateExcelData(excelData)

  // 3. Détection doublons avec existing prospects
  const deduplicatedProspects = await detectAndMergeDuplicates(validatedProspects)

  // 4. Import en BDD avec préservation états
  const importResult = await importProspectsToDatabase(deduplicatedProspects)

  return NextResponse.json({
    data: importResult,
    success: true,
    duplicatesFound: deduplicatedProspects.duplicates.length,
    imported: importResult.importedCount
  })
}
```

**Services Métier**
```typescript
interface ExcelImportService {
  parseExcel(file: File): Promise<ExcelRow[]>
  validateExcelData(rows: ExcelRow[]): Promise<ValidatedProspect[]>
  detectAndMergeDuplicates(prospects: ValidatedProspect[]): Promise<DeduplicationResult>
  importProspectsToDatabase(prospects: ValidatedProspect[]): Promise<ImportResult>
}

// Algorithme de détection doublons
async function detectAndMergeDuplicates(newProspects: ValidatedProspect[]) {
  const existingProspects = await prisma.prospect.findMany()

  const duplicates = newProspects.filter(newProspect =>
    existingProspects.some(existing =>
      // Match par email (prioritaire)
      existing.email === newProspect.email ||
      // Match par entreprise + téléphone
      (existing.company === newProspect.company && existing.phone === newProspect.phone) ||
      // Match par nom complet + ville
      (existing.fullName === newProspect.fullName && existing.city === newProspect.city)
    )
  )

  // Merge strategy : préserver état existant, enrichir avec nouvelles données
  const mergedData = duplicates.map(dup => ({
    ...existingData,
    ...newData,
    // Préserver état commercial existant
    status: existingData.status,
    notes: combineNotes(existingData.notes, newData.notes),
    updatedAt: new Date()
  }))

  return { duplicates, merged: mergedData, unique: newProspects.filter(not duplicate) }
}
```

### Pipeline 2 : Scraping Automatisé

**Contexte Business :**
Pipeline principale d'acquisition prospects : scraping Google Maps par métier/ville + validation qualité sites + import prospects qualifiés uniquement.

**Flux Utilisateur :**
```
Interface Scraping → Saisie métier + villes → Lancement scraping →
Google Maps API → Validation qualité sites → Filtrage prospects pourris →
Import BDD → Notification fin de traitement
```

**Architecture Technique :**

**Frontend - Interface de Scraping**
```typescript
const ScrapingPage: React.FC = () => {
  const [scrapingConfig, setScrapingConfig] = useState<ScrapingConfig>({
    metier: '',
    villes: [],
    maxProspects: 100
  })

  const {mutate: startScraping, isLoading} = useStartScraping()

  const handleStartScraping = () => {
    startScraping(scrapingConfig)
  }

  return (
    <div>
      <MetierSelector value={scrapingConfig.metier} onChange={setMetier} />
      <VillesSelector value={scrapingConfig.villes} onChange={setVilles} />
      <button onClick={handleStartScraping} disabled={isLoading}>
        {isLoading ? 'Scraping en cours...' : 'Lancer le scraping'}
      </button>
      <ScrapingProgress />
    </div>
  )
}
```

**API Routes - Orchestration Scraping**
```typescript
// /api/scraping/start
export async function POST(request: NextRequest) {
  const {metier, villes, maxProspects} = await request.json()

  // Démarrage asynchrone du scraping
  const scrapingJobId = await startScrapingJob({
    metier,
    villes,
    maxProspects,
    userId: session.user.id
  })

  return NextResponse.json({
    data: {jobId: scrapingJobId, status: 'STARTED'},
    success: true
  })
}

// /api/scraping/status/[jobId]
export async function GET(request: NextRequest, {params}: {params: {jobId: string}}) {
  const job = await getScrapingJobStatus(params.jobId)
  return NextResponse.json({data: job, success: true})
}
```

**Services - Pipeline Scraping**
```typescript
interface ScrapingPipeline {
  scrapeGoogleMaps(config: ScrapingConfig): Promise<RawProspect[]>
  validateWebsiteQuality(prospects: RawProspect[]): Promise<ValidatedProspect[]>
  filterQualifiedProspects(prospects: ValidatedProspect[]): Promise<QualifiedProspect[]>
  importToDatabase(prospects: QualifiedProspect[]): Promise<ImportResult>
}

// Pipeline complète
async function executeScrapingPipeline(config: ScrapingConfig) {
  // 1. Scraping Google Maps via Scraping Dog API
  const rawProspects = await scrapeGoogleMaps(config)

  // 2. Validation qualité sites (coût 0€)
  const validatedProspects = await Promise.all(
    rawProspects.map(async prospect => ({
      ...prospect,
      qualityValidation: await validateWebsiteQuality(prospect.website)
    }))
  )

  // 3. Filtrage : garder seulement les sites "pourris"
  const qualifiedProspects = validatedProspects.filter(prospect =>
    prospect.qualityValidation.classification === 'GOLD' ||
    prospect.qualityValidation.classification === 'PLATINUM' ||
    prospect.qualityValidation.siteStatus === 'ERROR_404' ||
    prospect.qualityValidation.isObsolete ||
    !prospect.qualityValidation.isResponsive
  )

  // 4. Import en BDD avec dédoublonnage
  const importResult = await importQualifiedProspects(qualifiedProspects)

  return {
    totalScraped: rawProspects.length,
    qualified: qualifiedProspects.length,
    imported: importResult.importedCount,
    rejectionReasons: generateRejectionStats(validatedProspects)
  }
}
```

### Pipeline 3 : Workflow Commercial

**Contexte Business :**
Interface quotidienne du commercial pour gérer son pipeline 8-phases : rappels → nouveaux appels → suivi maquette → signature → paiement.

**Flux Utilisateur :**
```
Dashboard Commercial → Filtrage "À rappeler" → Appels rappels →
Filtrage "Premier appel" → Nouveaux appels →
Suivi post-RDV maquette → Gestion signature/paiement
```

**Architecture Technique :**

**Frontend - Dashboard Commercial**
```typescript
const CommercialDashboard: React.FC = () => {
  // États de filtrage dynamique
  const [currentFilter, setCurrentFilter] = useState<ProspectFilter>('A_RAPPELER')

  // Queries pour chaque type de prospects
  const {data: aRappeler} = useProspects({status: 'A_RAPPELER'})
  const {data: premierAppel} = useProspects({status: 'PREMIER_APPEL'})
  const {data: postMaquette} = useProspects({
    status: ['RDV_MAQUETTE_FAIT', 'DEVIS_ENVOYE', 'SIGNATURE_PROCHE']
  })

  return (
    <div className="commercial-dashboard">
      {/* Priorisation des tâches */}
      <TaskPriority
        rappels={aRappeler?.length || 0}
        nouveaux={premierAppel?.length || 0}
        suivi={postMaquette?.length || 0}
      />

      {/* Interface de filtrage */}
      <ProspectFilters
        current={currentFilter}
        onChange={setCurrentFilter}
      />

      {/* Liste de prospects avec actions contextuelles */}
      <ProspectList
        prospects={getFilteredProspects(currentFilter)}
        onCall={handleCall}
        onUpdateStatus={handleStatusUpdate}
        onAddNote={handleAddNote}
      />
    </div>
  )
}

// Ordre de priorité commercial
const WORKFLOW_PRIORITY = [
  'A_RAPPELER',           // 1. Priorité absolue
  'PREMIER_APPEL',        // 2. Acquisition nouveaux
  'RDV_MAQUETTE_FAIT',    // 3. Chauds post-RDV
  'DEVIS_ENVOYE',         // 4. Négociation
  'SIGNATURE_PROCHE'      // 5. Closing
]
```

**API Routes - Gestion États Commerciaux**
```typescript
// /api/prospects/[id]/update-status
export async function PATCH(request: NextRequest, {params}: {params: {id: string}}) {
  const {newStatus, notes, nextCallDate} = await request.json()

  const updatedProspect = await prisma.prospect.update({
    where: {id: params.id},
    data: {
      status: newStatus,
      notes: notes ? {create: {content: notes, createdBy: session.user.id}} : undefined,
      nextCallDate: nextCallDate,
      lastContactDate: new Date(),
      updatedAt: new Date()
    },
    include: {notes: true, qualityValidation: true}
  })

  // Log activité commerciale
  await logCommercialActivity({
    prospectId: params.id,
    action: 'STATUS_UPDATE',
    fromStatus: prospect.status,
    toStatus: newStatus,
    userId: session.user.id
  })

  return NextResponse.json({data: updatedProspect, success: true})
}

// /api/commercial/dashboard
export async function GET(request: NextRequest) {
  const userId = session.user.id

  // Agrégation pour dashboard commercial
  const dashboard = {
    aRappeler: await getProspectsCount('A_RAPPELER', userId),
    premierAppel: await getProspectsCount('PREMIER_APPEL', userId),
    postMaquette: await getProspectsCount(['RDV_MAQUETTE_FAIT', 'DEVIS_ENVOYE'], userId),
    pipeline: await getPipelineStats(userId),
    performance: await getCommercialPerformance(userId)
  }

  return NextResponse.json({data: dashboard, success: true})
}
```

**Services - Workflow Management**
```typescript
interface CommercialWorkflowService {
  getPrioritizedTasks(userId: string): Promise<PrioritizedTasks>
  updateProspectStatus(prospectId: string, status: ProspectStatus): Promise<Prospect>
  getFilteredProspects(filter: ProspectFilter, userId: string): Promise<Prospect[]>
  logCommercialActivity(activity: CommercialActivity): Promise<void>
}

// Système de priorisation intelligent
async function getPrioritizedTasks(userId: string): PrioritizedTasks {
  return {
    urgent: await getProspects({
      status: 'A_RAPPELER',
      nextCallDate: {lte: new Date()},
      assignedTo: userId
    }),

    nouveaux: await getProspects({
      status: 'PREMIER_APPEL',
      createdAt: {gte: subDays(new Date(), 3)}, // Prospects récents
      assignedTo: userId
    }),

    suivi: await getProspects({
      status: ['RDV_MAQUETTE_FAIT', 'DEVIS_ENVOYE', 'SIGNATURE_PROCHE'],
      lastContactDate: {lte: subDays(new Date(), 2)}, // Sans contact 48h+
      assignedTo: userId
    })
  }
}
```

### Intégration des Pipelines

**Orchestration Globale**
```typescript
// Services inter-pipeline
interface PipelineOrchestrator {
  // Import Excel → enrichit prospects existants
  handleExcelImport(file: File): Promise<ImportResult>

  // Scraping → alimente pipeline commercial
  handleScrapingComplete(scrapingJobId: string): Promise<void>

  // Commercial → déclenche actions automatiques
  handleStatusUpdate(prospectId: string, newStatus: ProspectStatus): Promise<void>
}

// Notifications entre pipelines
const pipelineEventBus = {
  // Excel import terminé → notifie commercial
  onImportComplete: (importResult: ImportResult) => {
    sendNotification('Nouveau prospects importés disponibles')
  },

  // Scraping terminé → notifie commercial
  onScrapingComplete: (scrapingResult: ScrapingResult) => {
    sendNotification(`${scrapingResult.qualified} nouveaux prospects qualifiés`)
  },

  // Prospect devient GOLD → priorité haute
  onQualificationUpgrade: (prospectId: string) => {
    updateProspectPriority(prospectId, 'HIGH')
  }
}
```

**Database Schema pour Pipelines**
```prisma
model ScrapingJob {
  id          String   @id @default(cuid())
  status      ScrapingStatus
  metier      String
  villes      String[]
  progress    Int      @default(0)
  totalFound  Int      @default(0)
  qualified   Int      @default(0)
  imported    Int      @default(0)
  startedAt   DateTime @default(now())
  completedAt DateTime?
  userId      String

  @@map("scraping_jobs")
}

model ImportJob {
  id           String     @id @default(cuid())
  filename     String
  status       ImportStatus
  totalRows    Int
  imported     Int        @default(0)
  duplicates   Int        @default(0)
  errors       String[]   @default([])
  startedAt    DateTime   @default(now())
  completedAt  DateTime?
  userId       String

  @@map("import_jobs")
}

model CommercialActivity {
  id           String   @id @default(cuid())
  prospectId   String
  prospect     Prospect @relation(fields: [prospectId], references: [id])
  action       CommercialAction
  fromStatus   ProspectStatus?
  toStatus     ProspectStatus?
  notes        String?
  duration     Int? // en minutes pour appels
  createdAt    DateTime @default(now())
  userId       String

  @@map("commercial_activities")
}

enum ScrapingStatus {
  PENDING
  IN_PROGRESS
  VALIDATING
  COMPLETED
  FAILED
}

enum ImportStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

enum CommercialAction {
  CALL_MADE
  STATUS_UPDATE
  NOTE_ADDED
  EMAIL_SENT
  RDV_SCHEDULED
}
```

Ces 3 pipelines forment l'architecture opérationnelle complète du CRM, depuis l'acquisition jusqu'à la signature, en passant par la qualification automatique.

## Spécifications Techniques Complètes

### Configuration TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{"name": "next"}],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Structure de Dossiers Détaillée

```
bmad-crm/
├── src/
│   ├── app/                     # App Router Next.js 14+
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── prospects/
│   │   │   ├── scraping/
│   │   │   └── layout.tsx
│   │   ├── api/                 # API Routes
│   │   │   ├── auth/
│   │   │   ├── prospects/
│   │   │   ├── scraping/
│   │   │   └── import/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/              # Composants UI réutilisables
│   │   ├── ui/                  # Composants de base
│   │   ├── forms/               # Composants formulaires
│   │   ├── layout/              # Composants layout
│   │   └── prospects/           # Composants métier prospects
│   ├── lib/                     # Utilitaires et configurations
│   │   ├── db/                  # Configuration BDD Drizzle
│   │   ├── auth/                # Configuration authentification
│   │   ├── validation/          # Schémas Zod
│   │   └── utils.ts
│   ├── types/                   # Définitions TypeScript
│   │   ├── database.ts
│   │   ├── api.ts
│   │   └── prospects.ts
│   └── hooks/                   # Custom React hooks
├── drizzle/                     # Migrations Drizzle
│   ├── migrations/
│   └── schema.ts
├── docker-compose.yml           # Configuration Docker
├── Dockerfile
├── drizzle.config.ts
└── package.json
```

### Configuration Docker

**docker-compose.yml :**
```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/bmadcrm
      - NEXTAUTH_SECRET=your-secret-here
      - NEXTAUTH_URL=http://localhost:3000
    depends_on:
      - postgres
    volumes:
      - .:/app
      - /app/node_modules

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: bmadcrm
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Configuration Drizzle (drizzle.config.ts) :**
```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config
```

## Patterns d'Implémentation & Règles de Cohérence

### Catégories de Patterns Définies

**Points de Conflit Critiques Identifiés :** 5 catégories principales où les agents IA pourraient faire des choix différents

### Patterns de Nommage

**Conventions de Nommage Database :**
- Tables/colonnes : snake_case (`user_prospects`, `created_at`)
- Relations : snake_case avec suffixes (`prospect_id`, `user_fk`)
- Index : préfixe `idx_` (`idx_prospects_email`)
- Conversion automatique via Prisma vers camelCase TypeScript

**Conventions de Nommage API :**
- Endpoints : pluriels REST (`/api/prospects`, `/api/prospects/[id]`)
- Paramètres routes : format Next.js (`[id]`, `[slug]`)
- Query params : camelCase (`?statusFilter=premier-appel`)
- Headers : format standard HTTP (`Content-Type`, `Authorization`)

**Conventions de Nommage Code :**
- Composants/fichiers : PascalCase (`ProspectCard.tsx`)
- Fonctions/variables : camelCase (`getUserData`, `prospectId`)
- Constants : UPPER_SNAKE_CASE (`API_BASE_URL`, `STATUSES`)
- Types : PascalCase (`Prospect`, `ProspectStatus`)

### Patterns de Structure

**Organisation Projet :**
- `/pages/api/` : API routes REST
- `/components/` : Composants UI réutilisables
- `/views/` : Vues/pages spécifiques métier
- `/hooks/` : Custom hooks React
- `/utils/` : Fonctions utilitaires
- `/types/` : Définitions TypeScript
- `/constants/` : Constantes application

**Patterns de Fichiers :**
- Tests : co-localisés `*.test.ts` avec fichiers source
- Config : racine projet (`.env.local`, `next.config.js`)
- Documentation : `/docs/` pour guides spécifiques

### Patterns de Format

**Formats de Réponse API :**
```typescript
// Succès uniforme
{data: T, success: true, error: null}
// Erreur uniforme
{data: null, success: false, error: {message: string, code: string}}
```

**Formats d'Échange de Données :**
- JSON : camelCase pour champs (`prospectId`, `createdAt`)
- Dates : ISO strings (`2026-01-21T10:30:00Z`)
- Booléens : true/false (pas 1/0)
- Nulls : explicites null (pas undefined en JSON)

### Patterns de Communication

**Patterns de Gestion d'État :**
- Loading states : `isLoading` (boolean)
- Error states : `error` (objet ou null)
- Data states : noms descriptifs (`prospects`, `prospect`)
- États multiples : préfixes (`isLoadingProspects`, `prospectsError`)

### Patterns de Processus

**Patterns de Gestion d'Erreurs :**
- Global : ErrorBoundary React pour crashes
- API : wrapper uniforme avec codes erreur
- User-facing : messages français explicites
- Logging : séparé des messages utilisateur

**Patterns d'États de Chargement :**
- React Query : états serveur (prospects, scraping)
- useState : états UI locaux (formulaires, modals)
- Global : toast notifications pour feedback
- Persistence : localStorage pour préférences UI

### Directives d'Application

**Tous les Agents IA DOIVENT :**
- Respecter les conventions de nommage strictement
- Utiliser le wrapper API uniforme pour toutes les réponses
- Organiser les fichiers selon la structure définie
- Implémenter la gestion d'erreurs avec les patterns établis
- Utiliser les patterns d'état React Query + useState

**Application des Patterns :**
- Vérification : ESLint/Prettier pour format code
- Documentation : Chaque violation documentée dans PR
- Évolution : Patterns mis à jour par consensus équipe

### Exemples de Patterns

**Exemples Corrects :**
```typescript
// API route
export async function GET(request: NextRequest) {
  try {
    const prospects = await prisma.prospect.findMany()
    return NextResponse.json({
      data: prospects,
      success: true,
      error: null
    })
  } catch (error) {
    return NextResponse.json({
      data: null,
      success: false,
      error: {message: "Erreur lors du chargement", code: "LOAD_ERROR"}
    })
  }
}

// Component
const ProspectCard: React.FC<{prospectId: string}> = ({prospectId}) => {
  const {data: prospect, isLoading, error} = useProspect(prospectId)
  // ...
}
```

**Anti-Patterns à Éviter :**
- Mélanger snake_case et camelCase dans même contexte
- API responses sans wrapper uniforme
- Composants sans gestion d'erreurs
- États de loading inconsistants