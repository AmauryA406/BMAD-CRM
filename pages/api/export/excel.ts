/**
 * API Route: GET /api/export/excel
 *
 * Export de tous les prospects en fichier Excel
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../../lib/database'
import * as XLSX from 'xlsx'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: { message: 'Méthode non autorisée', code: 'METHOD_NOT_ALLOWED' }
    })
  }

  try {
    // Récupérer tous les prospects
    const prospects = await db.prospect.findMany({
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    console.log(`📊 Export Excel: ${prospects.length} prospects à exporter`)

    if (prospects.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Aucun prospect à exporter', code: 'NO_PROSPECTS' }
      })
    }

    // Préparer les données pour Excel
    const excelData = prospects.map(prospect => ({
      'Nom': prospect.companyName,
      'Nom Complet': prospect.fullName || '',
      'Email': prospect.email || '',
      'Téléphone': prospect.phone || '',
      'Adresse': prospect.address || '',
      'Ville': prospect.city || '',
      'Site Web': prospect.website || '',
      'Problème Site': prospect.hasWebsiteIssue ? 'Oui' : 'Non',
      'Motif Sélection': prospect.websiteIssueReason || '',
      'Statut': getStatusLabel(prospect.status),
      'Assigné à': prospect.assignedTo || '',
      'Dernière Vérification': prospect.lastWebsiteCheck
        ? prospect.lastWebsiteCheck.toLocaleDateString('fr-FR')
        : '',
      'Créé le': prospect.createdAt.toLocaleDateString('fr-FR'),
      'Modifié le': prospect.updatedAt.toLocaleDateString('fr-FR')
    }))

    // Créer le workbook Excel
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Ajuster la largeur des colonnes
    const columnWidths = [
      { wch: 30 }, // Nom
      { wch: 20 }, // Nom Complet
      { wch: 25 }, // Email
      { wch: 15 }, // Téléphone
      { wch: 40 }, // Adresse
      { wch: 15 }, // Ville
      { wch: 30 }, // Site Web
      { wch: 15 }, // Problème Site
      { wch: 35 }, // Motif Sélection
      { wch: 15 }, // Statut
      { wch: 15 }, // Assigné à
      { wch: 18 }, // Dernière Vérification
      { wch: 12 }, // Créé le
      { wch: 12 }  // Modifié le
    ]

    worksheet['!cols'] = columnWidths

    // Ajouter la feuille au workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Prospects BMAD CRM')

    // Générer le fichier Excel en buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Préparer le nom du fichier avec date
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-').replace('T', '_')
    const filename = `prospects_bmad_crm_${timestamp}.xlsx`

    // Définir les headers pour le téléchargement
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', excelBuffer.length)

    // Envoyer le fichier
    res.status(200).end(excelBuffer)

    console.log(`✅ Export Excel terminé: ${filename}`)

  } catch (error) {
    console.error('Erreur export Excel:', error)
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Erreur lors de l\'export Excel',
        code: 'EXPORT_ERROR'
      }
    })
  } finally {
    await db.$disconnect()
  }
}

/**
 * Convertit le statut en libellé lisible
 */
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    'PREMIER_APPEL': '📞 Premier Appel',
    'RDVPOS': '📅 RDV Posé',
    'RDVFAIT': '✅ RDV Fait',
    'DEVIS': '📝 Devis',
    'RELANCE': '🔔 Relance',
    'NEGOCE': '💰 Négoce',
    'SIGNE': '✍️ Signé',
    'CLIENT': '🎉 Client',
    'PERDU': '❌ Perdu',
    'SAV': '🔧 SAV'
  }

  return statusMap[status] || status
}