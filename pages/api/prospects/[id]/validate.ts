/**
 * API Route: /api/prospects/[id]/validate
 *
 * Re-validation manuelle d'un prospect individuel
 * - Analyse à nouveau le site web du prospect
 * - Met à jour les champs hasWebsiteIssue et websiteIssueReason
 * - Permet de vérifier l'évolution d'un site web
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { WebQualityFilter } from '../../../../lib/services/webQualityFilter'
import { db } from '../../../../lib/database'
const webQualityFilter = new WebQualityFilter()

interface ApiResponse<T> {
  data: T | null
  success: boolean
  error: { message: string; code: string } | null
}

interface ValidationResult {
  prospectId: string
  previousIssue: {
    hasWebsiteIssue: boolean
    websiteIssueReason: string | null
  }
  newIssue: {
    hasWebsiteIssue: boolean
    websiteIssueReason: string
  }
  hasChanged: boolean
  shouldKeepProspect: boolean
  validatedAt: Date
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
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        data: null,
        success: false,
        error: { message: 'ID prospect invalide', code: 'INVALID_ID' }
      })
    }

    // 1. Récupérer le prospect existant
    const existingProspect = await db.prospect.findUnique({
      where: { id: id as string }
    })

    if (!existingProspect) {
      return res.status(404).json({
        data: null,
        success: false,
        error: { message: 'Prospect introuvable', code: 'PROSPECT_NOT_FOUND' }
      })
    }

    if (!existingProspect.website) {
      return res.status(400).json({
        data: null,
        success: false,
        error: { message: 'Pas de site web à valider', code: 'NO_WEBSITE' }
      })
    }

    // 2. Sauvegarder l'état précédent
    const previousIssue = {
      hasWebsiteIssue: existingProspect.hasWebsiteIssue,
      websiteIssueReason: existingProspect.websiteIssueReason
    }

    console.log(`🔍 Re-validation du site: ${existingProspect.website}`)

    // 3. Nouvelle validation du site web
    const validationResult = await webQualityFilter.validateWebsite(existingProspect.website)

    // 4. Vérifier si quelque chose a changé
    const hasChanged =
      previousIssue.hasWebsiteIssue !== validationResult.hasWebsiteIssue ||
      previousIssue.websiteIssueReason !== validationResult.websiteIssueReason

    console.log(`📊 Résultat validation:`, {
      previous: previousIssue,
      new: {
        hasWebsiteIssue: validationResult.hasWebsiteIssue,
        websiteIssueReason: validationResult.websiteIssueReason
      },
      hasChanged,
      shouldKeep: validationResult.shouldKeepProspect
    })

    // 5. Mettre à jour le prospect en base
    const updatedProspect = await db.prospect.update({
      where: { id: id as string },
      data: {
        hasWebsiteIssue: validationResult.hasWebsiteIssue,
        websiteIssueReason: validationResult.websiteIssueReason,
        lastWebsiteCheck: new Date(),
        updatedAt: new Date()
      }
    })

    // 6. Logger l'activité de validation
    await db.commercialActivity.create({
      data: {
        prospectId: id as string,
        action: 'WEBSITE_VALIDATED',
        notes: `Re-validation: ${validationResult.websiteIssueReason}`,
        userId: 'system' // TODO: Récupérer l'ID utilisateur de la session
      }
    })

    // 7. Si le prospect n'a plus de problème, proposer sa suppression
    if (!validationResult.shouldKeepProspect && hasChanged) {
      console.log(`⚠️ ATTENTION: Le prospect ${existingProspect.companyName} n'a plus de problèmes web. Considérer sa suppression.`)
    }

    // 8. Construire la réponse
    const result: ValidationResult = {
      prospectId: id as string,
      previousIssue,
      newIssue: {
        hasWebsiteIssue: validationResult.hasWebsiteIssue,
        websiteIssueReason: validationResult.websiteIssueReason
      },
      hasChanged,
      shouldKeepProspect: validationResult.shouldKeepProspect,
      validatedAt: new Date()
    }

    return res.status(200).json({
      data: result,
      success: true,
      error: null
    })

  } catch (error) {
    console.error('Erreur re-validation prospect:', error)

    return res.status(500).json({
      data: null,
      success: false,
      error: { message: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' }
    })
  }
}