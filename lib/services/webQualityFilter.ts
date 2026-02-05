/**
 * Service de Filtrage Binaire de Qualité Web
 *
 * Architecture: Filtrage binaire simple
 * - Site avec problème → GARDER le prospect (potentiel client)
 * - Site correct → SUPPRIMER le prospect (pas d'opportunité)
 *
 * Coût: 0€ supplémentaire (après URL récupérée via Scraping Dog)
 */

export interface SiteStatusValidation {
  hasError: boolean
  errorType: '404' | '500' | 'timeout' | null
  isTimeout: boolean
  hasSSL: boolean
}

export interface SocialRedirectValidation {
  redirectsToSocial: boolean
  onlySocialContent: boolean
  hasIssue: boolean
}

export interface ResponsiveValidation {
  hasViewport: boolean
  hasMediaQueries: boolean
  hasModernCSS: boolean
  hasFramework: boolean
  isNonResponsive: boolean
  hasIssue: boolean
}

export interface ObsoleteContentValidation {
  lastCopyrightYear: number
  hasOldCopyright: boolean
  hasObsoleteTech: boolean
  obsoleteTechnologies: string[]
  hasIssue: boolean
}

export interface AllValidations {
  status: SiteStatusValidation
  social: SocialRedirectValidation
  responsive: ResponsiveValidation
  obsolete: ObsoleteContentValidation
}

export interface WebsiteIssueResult {
  hasWebsiteIssue: boolean
  websiteIssueReason: string
  shouldKeepProspect: boolean
}

export class WebQualityFilter {
  private readonly REQUEST_TIMEOUT = 10000 // 10 secondes
  private readonly USER_AGENT = 'Mozilla/5.0 (compatible; WebQualityBot/1.0)'

  /**
   * Point d'entrée principal : validation complète d'un site web
   */
  async validateWebsite(url: string): Promise<WebsiteIssueResult> {
    try {
      // 1. Normaliser l'URL
      const normalizedUrl = this.normalizeUrl(url)

      // 2. Exécuter toutes les validations
      const validations = await this.executeAllValidations(normalizedUrl)

      // 3. Déterminer si on garde le prospect (filtrage binaire)
      return this.determineWebsiteIssue(validations)
    } catch (error) {
      // Erreur de validation = considérer comme problème → GARDER
      console.error('Erreur validation site:', error)
      return {
        hasWebsiteIssue: true,
        websiteIssueReason: 'Erreur de validation technique',
        shouldKeepProspect: true
      }
    }
  }

  /**
   * Exécute toutes les validations en parallèle pour optimiser les performances
   */
  private async executeAllValidations(url: string): Promise<AllValidations> {
    try {
      // Récupérer le contenu HTML une seule fois
      const { htmlContent, response } = await this.fetchWebsiteContent(url)

      // Exécuter validations en parallèle
      const [statusValidation, socialValidation, responsiveValidation, obsoleteValidation] = await Promise.all([
        this.validateSiteStatus(url, response),
        this.detectSocialRedirect(url, response, htmlContent),
        this.checkResponsiveDesign(htmlContent),
        this.detectObsoleteContent(htmlContent)
      ])

      return {
        status: statusValidation,
        social: socialValidation,
        responsive: responsiveValidation,
        obsolete: obsoleteValidation
      }
    } catch (error) {
      // En cas d'erreur, marquer comme problème de statut
      return {
        status: { hasError: true, errorType: 'timeout', isTimeout: true, hasSSL: false },
        social: { redirectsToSocial: false, onlySocialContent: false, hasIssue: false },
        responsive: { hasViewport: false, hasMediaQueries: false, hasModernCSS: false, hasFramework: false, isNonResponsive: true, hasIssue: true },
        obsolete: { lastCopyrightYear: 2020, hasOldCopyright: true, hasObsoleteTech: false, obsoleteTechnologies: [], hasIssue: true }
      }
    }
  }

  /**
   * Récupère le contenu du site web avec gestion des timeouts et redirections
   */
  private async fetchWebsiteContent(url: string): Promise<{ htmlContent: string; response: Response }> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': this.USER_AGENT },
        redirect: 'follow', // Suivre les redirections automatiquement
      })

      const htmlContent = await response.text()

      return { htmlContent, response }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('timeout')
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Détection des sites inexistants ou en erreur
   */
  private async validateSiteStatus(url: string, response: Response): Promise<SiteStatusValidation & { isProtected: boolean }> {
    try {
      return {
        hasError: response.status === 404 || response.status >= 500,
        errorType: response.status === 404 ? '404' : response.status >= 500 ? '500' : null,
        isTimeout: false,
        hasSSL: url.startsWith('https://'),
        isProtected: response.status === 403 || response.status === 401 // Sites protégés = Modernes
      }
    } catch (error) {
      return {
        hasError: true,
        errorType: 'timeout',
        isTimeout: true,
        hasSSL: false,
        isProtected: false
      }
    }
  }

  /**
   * Détection des redirections vers réseaux sociaux uniquement
   */
  private async detectSocialRedirect(url: string, response: Response, htmlContent: string): Promise<SocialRedirectValidation> {
    try {
      // Vérifier l'URL finale après redirections
      const finalUrl = response.url.toLowerCase()
      const isSocialRedirect =
        finalUrl.includes('facebook.com') ||
        finalUrl.includes('instagram.com') ||
        finalUrl.includes('fb.me') ||
        finalUrl.includes('fb.com')

      // Vérifier si le contenu principal = réseaux sociaux uniquement
      const contentLower = htmlContent.toLowerCase()
      const onlySocialContent =
        contentLower.includes('facebook.com/embed') ||
        contentLower.includes('instagram.com/embed') ||
        (contentLower.includes('facebook') &&
          !contentLower.includes('<nav') &&
          !contentLower.includes('menu') &&
          !contentLower.includes('services') &&
          !contentLower.includes('contact'))

      return {
        redirectsToSocial: isSocialRedirect,
        onlySocialContent: onlySocialContent,
        hasIssue: isSocialRedirect || onlySocialContent
      }
    } catch {
      return { redirectsToSocial: false, onlySocialContent: false, hasIssue: false }
    }
  }

  /**
   * Détection des sites non-responsifs
   */
  private checkResponsiveDesign(htmlContent: string): ResponsiveValidation {
    const contentLower = htmlContent.toLowerCase()

    // Regex plus robuste pour le viewport (accepte attributs dans n'importe quel ordre, quotes simples/doubles)
    const viewportRegex = /<meta\s+[^>]*name=["']viewport["'][^>]*>/i
    const hasViewport = viewportRegex.test(htmlContent)

    const hasMediaQueries = contentLower.includes('@media')
    const hasFlexbox = contentLower.includes('flex') || contentLower.includes('grid')
    const hasBootstrap = contentLower.includes('bootstrap') || contentLower.includes('responsive')
    const hasTailwind = contentLower.includes('tailwind')

    // Un site est considéré responsive s'il a viewport + (media queries OU framework moderne)
    const isResponsive = hasViewport && (hasMediaQueries || hasBootstrap || hasFlexbox || hasTailwind)

    return {
      hasViewport,
      hasMediaQueries,
      hasModernCSS: hasFlexbox,
      hasFramework: hasBootstrap || hasTailwind,
      isNonResponsive: !isResponsive,
      hasIssue: !isResponsive // PROBLÈME si non-responsive
    }
  }

  /**
   * Détection des technologies obsolètes et contenu ancien
   */
  private detectObsoleteContent(htmlContent: string): ObsoleteContentValidation {
    const currentYear = new Date().getFullYear()
    const contentLower = htmlContent.toLowerCase()

    // 1. Check simple si l'année en cours est présente (méthode la plus fiable)
    if (contentLower.includes(currentYear.toString())) {
      return {
        lastCopyrightYear: currentYear,
        hasOldCopyright: false,
        hasObsoleteTech: false, // On assume qu'un site mis à jour cette année n'est pas "obsolète" au sens critique
        obsoleteTechnologies: [],
        hasIssue: false
      }
    }

    // 2. Détection copyright plus précise (incluant © et ranges)
    // Ex: "© 2010-2025" ou "Copyright 2020"
    const copyrightMatches = htmlContent.match(/(?:copyright|©|\(c\)).{0,20}(\d{4})/gi) || []

    let maxYear = 0

    // Pour chaque match, on regarde si on trouve une plage d'années
    copyrightMatches.forEach(match => {
      // Chercher toutes les années dans la chaîne de copyright
      const years = match.match(/(\d{4})/g)
      if (years) {
        const validYears = years.map(y => parseInt(y)).filter(y => y <= currentYear + 1) // +1 pour marge erreur
        if (validYears.length > 0) {
          maxYear = Math.max(maxYear, ...validYears)
        }
      }
    })

    const lastCopyright = maxYear > 0 ? maxYear : currentYear
    const hasCopyrightIssue = maxYear > 0 && lastCopyright < (currentYear - 3) // Seulement si on a trouvé une année et qu'elle est vieille

    // Technologies obsolètes (Détection plus stricte pour éviter faux positifs sur le texte)

    // Flash: Chercher <embed ... .swf> ou <object ... classid=...>
    const hasFlash = /<embed[^>]+src=["'][^"']+\.swf["']/i.test(htmlContent) ||
      /<object[^>]+classid=["']clsid:D27CDB6E-AE6D-11cf-96B8-444553540000["']/i.test(htmlContent)

    // Layout Tableaux: <table avec cellpadding/cellspacing (souvent utilisé pour layout)
    // Mais on évite de flagger juste <table cellpadding="0"> si c'est pour un email
    const hasTableLayout = /<table[^>]+cellpadding=["'][^0]["']/.test(htmlContent) // cellpadding non-zero

    // Frames: <frameset> (obsolète HTML4) - <iframe est OK
    const hasFrames = /<frameset/i.test(htmlContent) || /<frame\s/i.test(htmlContent)

    // RETIRÉ: noHTTPS check basé sur le contenu ("http:" trouvé) est trop imprécis.
    // L'absence de SSL est déjà gérée par le protocole de l'URL si besoin, 
    // mais pour le contenu on évite de flagger juste parce qu'il y a un lien http.

    const obsoleteTech = [
      hasFlash ? 'Flash' : null,
      hasTableLayout ? 'Table Layout' : null,
      hasFrames ? 'Frames' : null
    ].filter(Boolean) as string[]

    const hasObsoleteTech = obsoleteTech.length > 0

    return {
      lastCopyrightYear: lastCopyright,
      hasOldCopyright: hasCopyrightIssue,
      hasObsoleteTech: hasObsoleteTech,
      obsoleteTechnologies: obsoleteTech,
      hasIssue: hasCopyrightIssue || hasObsoleteTech
    }
  }

  /**
   * Algorithme de décision binaire : GARDER ou SUPPRIMER le prospect
   */
  private determineWebsiteIssue(validations: AllValidations & { status: { isProtected?: boolean } }): WebsiteIssueResult {
    // PRIORITÉ 0: Site protégé (403/401) → SUPPRIMER (Considéré comme moderne/sécurisé)
    if (validations.status.isProtected) {
      return {
        hasWebsiteIssue: false,
        websiteIssueReason: 'Site protégé (WAF/Cloudflare)',
        shouldKeepProspect: false
      }
    }

    // PRIORITÉ 1: Site inexistant/inaccessible → GARDER
    if (validations.status.hasError) {
      return {
        hasWebsiteIssue: true,
        websiteIssueReason: validations.status.errorType || 'Erreur site',
        shouldKeepProspect: true
      }
    }

    // PRIORITÉ 2: Redirection vers réseaux sociaux uniquement → GARDER
    if (validations.social.hasIssue) {
      const reason = validations.social.redirectsToSocial
        ? 'Redirection réseaux sociaux'
        : 'Présence réseaux sociaux uniquement'

      return {
        hasWebsiteIssue: true,
        websiteIssueReason: reason,
        shouldKeepProspect: true
      }
    }

    // PRIORITÉ 3: Site non-responsive → GARDER
    if (validations.responsive.hasIssue) {
      return {
        hasWebsiteIssue: true,
        websiteIssueReason: 'Site non-responsive',
        shouldKeepProspect: true
      }
    }

    // PRIORITÉ 4: Technologies obsolètes → GARDER
    if (validations.obsolete.hasIssue) {
      const techDetails = validations.obsolete.obsoleteTechnologies.length > 0
        ? `: ${validations.obsolete.obsoleteTechnologies.join(', ')}`
        : ''

      return {
        hasWebsiteIssue: true,
        websiteIssueReason: `Technologies obsolètes${techDetails}`,
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

  /**
   * Normalise l'URL pour éviter les erreurs de format
   */
  private normalizeUrl(url: string): string {
    if (!url) throw new Error('URL vide')

    // Ajouter https:// si pas de protocole
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }

    // Nettoyer l'URL
    return url.trim().toLowerCase()
  }

  /**
   * Méthode utilitaire pour valider un batch d'URLs
   */
  async validateBatch(urls: string[], maxConcurrency: number = 10): Promise<WebsiteIssueResult[]> {
    const results: WebsiteIssueResult[] = []

    for (let i = 0; i < urls.length; i += maxConcurrency) {
      const batch = urls.slice(i, i + maxConcurrency)
      const batchResults = await Promise.all(
        batch.map(url => this.validateWebsite(url))
      )
      results.push(...batchResults)
    }

    return results
  }
}