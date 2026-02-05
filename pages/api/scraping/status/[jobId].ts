/**
 * API Route: GET /api/scraping/status/[jobId]
 *
 * Récupère le statut d'un job de scraping en cours
 * Utilisé pour le suivi temps réel dans l'interface
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../../../lib/database'

interface ApiResponse<T> {
  data: T | null
  success: boolean
  error: { message: string; code: string } | null
}

interface ScrapingJobStatus {
  id: string
  status: 'PENDING' | 'SCRAPING' | 'VALIDATING' | 'FILTERING' | 'IMPORTING' | 'COMPLETED' | 'FAILED'
  metier: string
  villes: string[]
  maxProspects: number

  // Progrès et résultats
  totalScraped: number
  withIssues: number
  imported: number
  rejectedCount: number

  // Timestamps
  startedAt: string
  completedAt: string | null

  // Erreur si échec
  errorMessage: string | null

  // Informations calculées
  progress: number
  duration: number | null
  rejectionReasons?: Record<string, number>
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ScrapingJobStatus>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      data: null,
      success: false,
      error: { message: 'Méthode non autorisée', code: 'METHOD_NOT_ALLOWED' }
    })
  }

  try {
    const { jobId } = req.query

    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({
        data: null,
        success: false,
        error: { message: 'Job ID manquant ou invalide', code: 'INVALID_JOB_ID' }
      })
    }

    // Récupérer le job de scraping
    const job = await db.scrapingJob.findUnique({
      where: { id: jobId }
    })

    if (!job) {
      return res.status(404).json({
        data: null,
        success: false,
        error: { message: 'Job de scraping introuvable', code: 'JOB_NOT_FOUND' }
      })
    }

    // Calculer le progrès basé sur le statut
    const progress = calculateProgress(job.status)

    // Calculer la durée si terminé
    const duration = job.completedAt
      ? new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
      : null

    // Calculer les raisons de rejet (simulé pour l'instant)
    const rejectionReasons = job.status === 'COMPLETED' ? {
      'Sites modernes': Math.floor(job.rejectedCount * 0.7),
      'Erreurs validation': Math.floor(job.rejectedCount * 0.2),
      'Pas de site web': Math.floor(job.rejectedCount * 0.1)
    } : undefined

    const jobStatus: ScrapingJobStatus = {
      id: job.id,
      status: job.status,
      metier: job.metier,
      villes: job.villes,
      maxProspects: job.maxProspects,
      totalScraped: job.totalScraped,
      withIssues: job.withIssues,
      imported: job.imported,
      rejectedCount: job.rejectedCount,
      startedAt: job.startedAt.toISOString(),
      completedAt: job.completedAt?.toISOString() || null,
      errorMessage: job.errorMessage,
      progress,
      duration,
      rejectionReasons
    }

    return res.status(200).json({
      data: jobStatus,
      success: true,
      error: null
    })

  } catch (error) {
    console.error('Erreur récupération statut scraping:', error)
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
 * Calcule le pourcentage de progression basé sur le statut
 */
function calculateProgress(status: string): number {
  const progressMap: Record<string, number> = {
    'PENDING': 5,
    'SCRAPING': 25,
    'VALIDATING': 50,
    'FILTERING': 75,
    'IMPORTING': 90,
    'COMPLETED': 100,
    'FAILED': 0
  }

  return progressMap[status] || 0
}