/**
 * API Route: /api/scraping/validate
 *
 * Validation binaire lors du scraping avec filtrage automatique
 * - Analyse chaque site web scrapé
 * - Garde seulement les prospects avec problèmes web
 * - Rejette les sites corrects/modernes
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { WebQualityFilter, WebsiteIssueResult } from '../../../lib/services/webQualityFilter'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()
const webQualityFilter = new WebQualityFilter()

// Validation des données d'entrée
const ScrapingValidationSchema = z.object({
  prospects: z.array(z.object({
    companyName: z.string(),
    fullName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    website: z.string().url()
  })),
  scrapingJobId: z.string().cuid()
})

type ScrapingValidationRequest = z.infer<typeof ScrapingValidationSchema>

interface ApiResponse<T> {
  data: T | null
  success: boolean
  error: { message: string; code: string } | null
}

interface ValidationResult {
  totalProspects: number
  prospectsWithIssues: number
  prospectsRejected: number
  importedProspects: number
  rejectionStats: {
    modernSites: number
    validationErrors: number
  }
  scrapingJobId: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ValidationResult>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      data: null,
      success: false,
      error: { message: 'Méthode non autorisée', code: 'METHOD_NOT_ALLOWED' }
    })
  }

  try {
    // 1. Validation des données d'entrée
    const validationResult = ScrapingValidationSchema.safeParse(req.body)

    if (!validationResult.success) {
      return res.status(400).json({
        data: null,
        success: false,
        error: { message: 'Données invalides', code: 'INVALID_DATA' }
      })
    }

    const { prospects, scrapingJobId } = validationResult.data

    // 2. Mettre à jour le statut du job de scraping
    await prisma.scrapingJob.update({
      where: { id: scrapingJobId },
      data: {
        status: 'VALIDATING',
        totalScraped: prospects.length
      }
    })

    // 3. Validation binaire de tous les sites web en batch
    console.log(`🔍 Validation de ${prospects.length} sites web...`)

    const websiteUrls = prospects.map(p => p.website)
    const validationResults = await webQualityFilter.validateBatch(websiteUrls, 10)

    // 4. Filtrage binaire : garder seulement les prospects avec problèmes
    const prospectsWithValidation = prospects.map((prospect, index) => ({
      ...prospect,
      validation: validationResults[index]
    }))

    const prospectsToKeep = prospectsWithValidation.filter(p => p.validation.shouldKeepProspect)
    const prospectsRejected = prospectsWithValidation.filter(p => !p.validation.shouldKeepProspect)

    console.log(`✅ ${prospectsToKeep.length} prospects gardés (avec problèmes)`)
    console.log(`❌ ${prospectsRejected.length} prospects rejetés (sites corrects)`)

    // 5. Import en BDD uniquement des prospects avec problèmes
    await prisma.scrapingJob.update({
      where: { id: scrapingJobId },
      data: { status: 'IMPORTING' }
    })

    const importedProspects = await Promise.all(
      prospectsToKeep.map(async (prospect) => {
        return await prisma.prospect.create({
          data: {
            companyName: prospect.companyName,
            fullName: prospect.fullName,
            email: prospect.email,
            phone: prospect.phone,
            address: prospect.address,
            city: prospect.city,
            website: prospect.website,
            hasWebsiteIssue: prospect.validation.hasWebsiteIssue,
            websiteIssueReason: prospect.validation.websiteIssueReason,
            lastWebsiteCheck: new Date(),
            status: 'PREMIER_APPEL'
          }
        })
      })
    )

    // 6. Calculer les statistiques de rejet
    const rejectionStats = {
      modernSites: prospectsRejected.filter(p => p.validation.websiteIssueReason === 'Site moderne et fonctionnel').length,
      validationErrors: prospectsRejected.filter(p => p.validation.websiteIssueReason === 'Erreur de validation technique').length
    }

    // 7. Finaliser le job de scraping
    await prisma.scrapingJob.update({
      where: { id: scrapingJobId },
      data: {
        status: 'COMPLETED',
        withIssues: prospectsToKeep.length,
        imported: importedProspects.length,
        rejectedCount: prospectsRejected.length,
        completedAt: new Date()
      }
    })

    // 8. Retourner les résultats
    const result: ValidationResult = {
      totalProspects: prospects.length,
      prospectsWithIssues: prospectsToKeep.length,
      prospectsRejected: prospectsRejected.length,
      importedProspects: importedProspects.length,
      rejectionStats,
      scrapingJobId
    }

    console.log('🎯 Filtrage binaire terminé:', result)

    return res.status(200).json({
      data: result,
      success: true,
      error: null
    })

  } catch (error) {
    console.error('Erreur validation scraping:', error)

    // Marquer le job comme échoué
    try {
      const { scrapingJobId } = req.body
      if (scrapingJobId) {
        await prisma.scrapingJob.update({
          where: { id: scrapingJobId },
          data: {
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Erreur inconnue'
          }
        })
      }
    } catch (updateError) {
      console.error('Erreur mise à jour job:', updateError)
    }

    return res.status(500).json({
      data: null,
      success: false,
      error: { message: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' }
    })
  }
}