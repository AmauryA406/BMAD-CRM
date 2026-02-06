/**
 * API Route: POST /api/import/excel
 *
 * Import d'un fichier Excel de prospects avec détection de doublons
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../../lib/database'
import * as XLSX from 'xlsx'
import formidable from 'formidable'
import fs from 'fs'

interface ApiResponse<T> {
  data: T | null
  success: boolean
  error: { message: string; code: string } | null
}

interface ImportResult {
  totalRows: number
  imported: number
  duplicates: number
  errors: number
  duplicateDetails: Array<{
    name: string
    reason: string
  }>
  errorDetails: Array<{
    row: number
    name: string
    error: string
  }>
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ImportResult>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      data: null,
      success: false,
      error: { message: 'Méthode non autorisée', code: 'METHOD_NOT_ALLOWED' }
    })
  }

  try {
    // Parse le fichier uploadé avec formidable
    const fileData = await parseFormData(req)

    if (!fileData || !fileData.filepath) {
      return res.status(400).json({
        data: null,
        success: false,
        error: { message: 'Fichier Excel manquant', code: 'NO_FILE' }
      })
    }

    // Lire le fichier Excel depuis le disque
    const workbook = XLSX.readFile(fileData.filepath)
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]

    // Convertir en JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

    console.log(`📊 Import Excel: ${rawData.length} lignes trouvées`)

    // S'assurer que l'utilisateur de test existe avant l'import
    await ensureTestUserExists()

    // Traiter l'import
    const result = await processExcelImport(rawData)

    // Nettoyer le fichier temporaire
    fs.unlinkSync(fileData.filepath)

    return res.status(200).json({
      data: result,
      success: true,
      error: null
    })

  } catch (error) {
    console.error('Erreur import Excel:', error)
    return res.status(500).json({
      data: null,
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Erreur lors de l\'import Excel',
        code: 'IMPORT_ERROR'
      }
    })
  } finally {
    await db.$disconnect()
  }
}

/**
 * Traite l'import des données Excel avec détection de doublons
 */
async function processExcelImport(rawData: any[]): Promise<ImportResult> {
  const result: ImportResult = {
    totalRows: rawData.length,
    imported: 0,
    duplicates: 0,
    errors: 0,
    duplicateDetails: [],
    errorDetails: []
  }

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i]

    try {
      // Mapper les colonnes Excel vers notre modèle
      const prospectData = mapExcelRowToProspect(row)

      // Vérifier les doublons
      const duplicate = await findDuplicate(prospectData)

      if (duplicate) {
        result.duplicates++
        result.duplicateDetails.push({
          name: prospectData.companyName,
          reason: 'Entreprise déjà présente en base'
        })
        continue
      }

      // Créer le prospect
      await db.prospect.create({
        data: {
          companyName: prospectData.companyName,
          fullName: prospectData.fullName,
          email: prospectData.email,
          phone: prospectData.phone,
          address: prospectData.address,
          city: prospectData.city,
          website: prospectData.website,
          hasWebsiteIssue: prospectData.hasWebsiteIssue,
          websiteIssueReason: prospectData.websiteIssueReason,
          status: prospectData.status,
          assignedTo: 'test-user-123',
          lastWebsiteCheck: new Date()
        }
      })

      result.imported++

    } catch (error) {
      result.errors++
      result.errorDetails.push({
        row: i + 1,
        name: row.Nom || 'Ligne sans nom',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    }
  }

  console.log(`✅ Import terminé: ${result.imported} créés, ${result.duplicates} doublons, ${result.errors} erreurs`)

  return result
}

/**
 * Mappe une ligne Excel vers notre modèle Prospect
 */
function mapExcelRowToProspect(row: any) {
  // Déterminer le statut basé sur les données Excel
  let status = 'PREMIER_APPEL'
  if (row.Statut) {
    if (row.Statut.includes('❌') || row.Statut.toLowerCase().includes('perdu')) {
      status = 'PERDU'
    } else if (row.Statut.includes('✅') || row.Statut.toLowerCase().includes('gagné')) {
      status = 'CLIENT'
    }
  }

  // Déterminer s'il y a un problème de site web
  const hasWebsiteIssue = !row['Site Web'] || row['Site Web'].trim() === '' ||
                          (row['Motif Sélection'] && row['Motif Sélection'].trim() !== '')

  return {
    companyName: row.Nom || 'Entreprise sans nom',
    fullName: '', // Pas dans l'Excel
    email: '', // Pas dans l'Excel
    phone: row.Téléphone || '',
    address: row.Adresse || '',
    city: row.Ville || '',
    website: row['Site Web'] || '',
    hasWebsiteIssue,
    websiteIssueReason: row['Motif Sélection'] || null,
    status
  }
}

/**
 * Trouve les doublons existants
 */
async function findDuplicate(prospectData: any) {
  // Recherche par nom d'entreprise + ville (prioritaire)
  if (prospectData.companyName && prospectData.city) {
    const byCompanyCity = await db.prospect.findFirst({
      where: {
        companyName: prospectData.companyName,
        city: prospectData.city
      }
    })
    if (byCompanyCity) return byCompanyCity
  }

  // Recherche par téléphone
  if (prospectData.phone && prospectData.phone.length > 8) {
    const byPhone = await db.prospect.findFirst({
      where: { phone: prospectData.phone }
    })
    if (byPhone) return byPhone
  }

  // Recherche par site web
  if (prospectData.website && prospectData.website.trim() !== '') {
    const byWebsite = await db.prospect.findFirst({
      where: { website: prospectData.website }
    })
    if (byWebsite) return byWebsite
  }

  return null
}

/**
 * S'assure que l'utilisateur de test existe
 */
async function ensureTestUserExists() {
  const existingUser = await db.user.findFirst({
    where: { id: 'test-user-123' }
  })

  if (!existingUser) {
    await db.user.create({
      data: {
        id: 'test-user-123',
        email: 'test@bmad-crm.com',
        name: 'Utilisateur Test',
        password: 'test-hash',
        role: 'COMMERCIAL'
      }
    })
    console.log('👤 Utilisateur de test créé pour import Excel')
  }
}

/**
 * Parse le formulaire avec formidable
 */
function parseFormData(req: NextApiRequest): Promise<formidable.File | null> {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB max
    })

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err)
        return
      }

      const file = files.excelFile
      if (Array.isArray(file)) {
        resolve(file[0] || null)
      } else {
        resolve(file || null)
      }
    })
  })
}

// Désactiver le parser body par défaut pour formidable
export const config = {
  api: {
    bodyParser: false
  }
}

