import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../lib/database'

interface ApiResponse<T> {
  data: T | null
  success: boolean
  error: { message: string; code: string } | null
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  try {
    switch (req.method) {
      case 'GET':
        return await getProspects(req, res)
      case 'POST':
        return await createProspect(req, res)
      default:
        return res.status(405).json({
          data: null,
          success: false,
          error: { message: 'Méthode non autorisée', code: 'METHOD_NOT_ALLOWED' }
        })
    }
  } catch (error) {
    console.error('Erreur API prospects:', error)
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
 * GET /api/prospects - Récupérer la liste des prospects
 */
async function getProspects(req: NextApiRequest, res: NextApiResponse<ApiResponse<any>>) {
  try {
    const {
      status,
      hasWebsiteIssue,
      limit = 50,
      offset = 0
    } = req.query

    // Construire les filtres
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (hasWebsiteIssue !== undefined) {
      where.hasWebsiteIssue = hasWebsiteIssue === 'true'
    }

    // Exécuter les requêtes en parallèle :
    // 1. Compter le total filtré (pour la pagination)
    // 2. Récupérer les prospects (filtrés et paginés)
    // 3. Calculer les statistiques globales (pour les onglets)
    const [totalCount, prospects, stats] = await Promise.all([
      db.prospect.count({ where }),
      db.prospect.findMany({
        where,
        include: {
          notes: { take: 3, orderBy: { createdAt: 'desc' } },
          commercialActivities: { take: 5, orderBy: { createdAt: 'desc' } }
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      }),
      // Calculer les stats globales (indépendantes du filtre actuel)
      db.$transaction([
        db.prospect.count(), // Total global
        db.prospect.count({ where: { hasWebsiteIssue: true } }), // Avec problèmes
        db.prospect.groupBy({ // Par statut
          by: ['status'],
          _count: { status: true },
          orderBy: { status: 'asc' }
        })
      ])
    ])

    // Mapper les counts par statut
    const statusCounts = (stats[2] as any[]).reduce((acc: any, curr: any) => {
      acc[curr.status] = curr._count.status
      return acc
    }, {})

    return res.status(200).json({
      data: {
        prospects,
        totalCount, // Total filtré pour la pagination
        stats: {
          total: stats[0], // Total global
          withIssues: stats[1],
          premierAppel: statusCounts['PREMIER_APPEL'] || 0,
          aRappeler: statusCounts['A_RAPPELER'] || 0,
          rdvFait: statusCounts['RDV_MAQUETTE_FAIT'] || 0,
          devisEnvoye: statusCounts['DEVIS_ENVOYE'] || 0,
          signe: statusCounts['SIGNE'] || 0
        },
        currentPage: Math.floor(parseInt(offset as string) / parseInt(limit as string)) + 1,
        totalPages: Math.ceil(totalCount / parseInt(limit as string)),
        hasNextPage: parseInt(offset as string) + parseInt(limit as string) < totalCount,
        hasPreviousPage: parseInt(offset as string) > 0
      },
      success: true,
      error: null
    })

  } catch (error) {
    console.error('Erreur récupération prospects:', error)
    return res.status(500).json({
      data: null,
      success: false,
      error: { message: 'Erreur lors de la récupération des prospects', code: 'FETCH_ERROR' }
    })
  }
}

/**
 * POST /api/prospects - Créer un nouveau prospect
 */
async function createProspect(req: NextApiRequest, res: NextApiResponse<ApiResponse<any>>) {
  try {
    const {
      companyName,
      fullName,
      email,
      phone,
      address,
      city,
      postalCode,
      website,
      hasWebsiteIssue = false,
      websiteIssueReason,
      assignedTo
    } = req.body

    // Validation des champs obligatoires
    if (!companyName) {
      return res.status(400).json({
        data: null,
        success: false,
        error: { message: 'Le nom de l\'entreprise est obligatoire', code: 'MISSING_COMPANY_NAME' }
      })
    }

    // Vérifier les doublons
    const existingProspect = await findDuplicate({
      companyName,
      email,
      phone,
      city
    })

    if (existingProspect) {
      return res.status(409).json({
        data: null,
        success: false,
        error: { message: 'Un prospect similaire existe déjà', code: 'DUPLICATE_PROSPECT' }
      })
    }

    // Créer le nouveau prospect
    const newProspect = await db.prospect.create({
      data: {
        companyName,
        fullName,
        email,
        phone,
        address,
        city,
        postalCode,
        website,
        status: 'PREMIER_APPEL',
        hasWebsiteIssue,
        websiteIssueReason,
        lastWebsiteCheck: hasWebsiteIssue ? new Date() : null,
        assignedTo
      },
      include: {
        notes: true,
        commercialActivities: true
      }
    })

    return res.status(201).json({
      data: newProspect,
      success: true,
      error: null
    })

  } catch (error) {
    console.error('Erreur création prospect:', error)
    return res.status(500).json({
      data: null,
      success: false,
      error: { message: 'Erreur lors de la création du prospect', code: 'CREATE_ERROR' }
    })
  }
}

/**
 * Fonction utilitaire pour détecter les doublons
 */
async function findDuplicate(data: {
  companyName: string
  email?: string
  phone?: string
  city?: string
}) {
  // Recherche par email (prioritaire)
  if (data.email) {
    const byEmail = await db.prospect.findFirst({
      where: { email: data.email }
    })
    if (byEmail) return byEmail
  }

  // Recherche par nom d'entreprise + ville
  if (data.companyName && data.city) {
    const byCompanyCity = await db.prospect.findFirst({
      where: {
        companyName: data.companyName,
        city: data.city
      }
    })
    if (byCompanyCity) return byCompanyCity
  }

  // Recherche par téléphone
  if (data.phone) {
    const byPhone = await db.prospect.findFirst({
      where: { phone: data.phone }
    })
    if (byPhone) return byPhone
  }

  return null
}