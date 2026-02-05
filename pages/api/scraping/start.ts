/**
 * API Route: POST /api/scraping/start
 *
 * Démarre un job de scraping avec filtrage qualité intégré
 * Pipeline: Google Maps → Validation WebQuality → Filtrage Binaire → Import BDD
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { ScrapingPipeline, ScrapingConfig } from '../../../lib/services/scrapingPipeline'
import { db } from '../../../lib/database'
import { z } from 'zod'

// Validation des données d'entrée
const ScrapingStartSchema = z.object({
  metier: z.string().min(1, "Le métier est obligatoire"),
  villes: z.array(z.string()).min(1, "Au moins une ville est requise"),
  maxProspects: z.number().min(1).max(200, "Maximum 200 prospects"),
  userId: z.string().min(1, "User ID obligatoire")
})

interface ApiResponse<T> {
  data: T | null
  success: boolean
  error: { message: string; code: string } | null
}

interface StartScrapingResponse {
  jobId: string
  status: string
  message: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<StartScrapingResponse>>
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
    const validationResult = ScrapingStartSchema.safeParse(req.body)

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return res.status(400).json({
        data: null,
        success: false,
        error: {
          message: firstError.message,
          code: 'VALIDATION_ERROR'
        }
      })
    }

    const config: ScrapingConfig = validationResult.data

    console.log(`🎯 Démarrage scraping: ${config.metier} dans ${config.villes.join(', ')}`)

    // 2. Vérifier/créer l'utilisateur de test
    let user = await db.user.findFirst({
      where: { id: config.userId }
    })

    if (!user) {
      // Créer l'utilisateur de test si il n'existe pas
      user = await db.user.create({
        data: {
          id: config.userId,
          email: 'test@bmad-crm.com',
          name: 'Utilisateur Test',
          password: 'test-hash',
          role: 'COMMERCIAL'
        }
      })
      console.log('👤 Utilisateur de test créé:', user.id)
    }

    // 3. Créer le job de scraping en BDD
    const scrapingJob = await db.scrapingJob.create({
      data: {
        status: 'PENDING',
        metier: config.metier,
        villes: config.villes,
        maxProspects: config.maxProspects,
        userId: config.userId,
        totalScraped: 0,
        withIssues: 0,
        imported: 0,
        rejectedCount: 0
      }
    })

    console.log(`📝 Job créé avec ID: ${scrapingJob.id}`)

    // 4. Lancer le pipeline de scraping en arrière-plan
    // Note: En production, on utiliserait une queue (Redis/Bull)
    // Ici on lance en arrière-plan avec Promise
    executePipelineAsync(scrapingJob.id, config).catch(console.error)

    // 5. Retourner immédiatement l'ID du job
    return res.status(200).json({
      data: {
        jobId: scrapingJob.id,
        status: 'STARTED',
        message: `Scraping démarré pour ${config.metier} dans ${config.villes.join(', ')}`
      },
      success: true,
      error: null
    })

  } catch (error) {
    console.error('Erreur démarrage scraping:', error)
    return res.status(500).json({
      data: null,
      success: false,
      error: { message: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' }
    })
  } finally {
    // Plus besoin de disconnect avec le singleton
  }
}

/**
 * Exécute le pipeline de scraping de manière asynchrone
 */
async function executePipelineAsync(jobId: string, config: ScrapingConfig) {
  const pipeline = new ScrapingPipeline()

  try {
    console.log(`🚀 Pipeline démarré pour job ${jobId}`)

    // Exécuter seulement la partie traitement, le job existe déjà
    const result = await pipeline.executeProcessingOnly(jobId, config)

    console.log(`✅ Pipeline terminé pour job ${jobId}:`, {
      totalScraped: result.totalScraped,
      prospectsWithIssues: result.prospectsWithIssues,
      imported: result.imported
    })

  } catch (error) {
    console.error(`❌ Erreur pipeline job ${jobId}:`, error)

    // Marquer le job comme échoué
    try {
      await db.scrapingJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Erreur inconnue',
          completedAt: new Date()
        }
      })
    } catch (updateError) {
      console.error('Erreur mise à jour job échoué:', updateError)
    }
  }
}