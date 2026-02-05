/**
 * API Route: POST /api/import/excel
 *
 * Import d'un fichier Excel de prospects avec détection de doublons
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import * as XLSX from 'xlsx'
import { z } from 'zod'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://user:password@localhost:5432/bmadcrm?schema=public"
    }
  }
})

// Configuration multer pour upload de fichiers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Format de fichier non supporté. Utilisez .xlsx ou .xls'))
    }
  }
})

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
    // Parse le fichier uploadé avec multer
    const fileData = await parseMultipartForm(req)

    if (!fileData || !fileData.buffer) {
      return res.status(400).json({
        data: null,
        success: false,
        error: { message: 'Fichier Excel manquant', code: 'NO_FILE' }
      })
    }

    // Lire le fichier Excel
    const workbook = XLSX.read(fileData.buffer)
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]

    // Convertir en JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

    console.log(`📊 Import Excel: ${rawData.length} lignes trouvées`)

    // S'assurer que l'utilisateur de test existe avant l'import
    await ensureTestUserExists()

    // Traiter l'import
    const result = await processExcelImport(rawData)

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
    await prisma.$disconnect()
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
      await prisma.prospect.create({
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
    const byCompanyCity = await prisma.prospect.findFirst({
      where: {
        companyName: prospectData.companyName,
        city: prospectData.city
      }
    })
    if (byCompanyCity) return byCompanyCity
  }

  // Recherche par téléphone
  if (prospectData.phone && prospectData.phone.length > 8) {
    const byPhone = await prisma.prospect.findFirst({
      where: { phone: prospectData.phone }
    })
    if (byPhone) return byPhone
  }

  // Recherche par site web
  if (prospectData.website && prospectData.website.trim() !== '') {
    const byWebsite = await prisma.prospect.findFirst({
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
  const existingUser = await prisma.user.findFirst({
    where: { id: 'test-user-123' }
  })

  if (!existingUser) {
    await prisma.user.create({
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
 * Parse le formulaire multipart avec multer
 */
function parseMultipartForm(req: NextApiRequest): Promise<any> {
  return new Promise((resolve, reject) => {
    const uploadMiddleware = upload.single('excelFile')

    uploadMiddleware(req as any, {} as any, (error) => {
      if (error) {
        reject(error)
      } else {
        resolve((req as any).file)
      }
    })
  })
}

// Désactiver le parser body par défaut pour multer
export const config = {
  api: {
    bodyParser: false
  }
}