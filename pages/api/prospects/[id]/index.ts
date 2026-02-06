import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../../../lib/database'

interface ApiResponse<T> {
    data: T | null
    success: boolean
    error: { message: string; code: string } | null
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse<any>>
) {
    const { id } = req.query as { id: string }

    if (!id) {
        return res.status(400).json({
            data: null,
            success: false,
            error: { message: 'ID prospect manquant', code: 'MISSING_ID' }
        })
    }

    try {
        switch (req.method) {
            case 'GET':
                return await getProspect(req, res, id)
            case 'PATCH':
                return await updateProspect(req, res, id)
            case 'DELETE':
                return await deleteProspect(req, res, id)
            default:
                return res.status(405).json({
                    data: null,
                    success: false,
                    error: { message: 'Méthode non autorisée', code: 'METHOD_NOT_ALLOWED' }
                })
        }
    } catch (error) {
        console.error(`Erreur API prospect [${id}]:`, error)
        return res.status(500).json({
            data: null,
            success: false,
            error: { message: 'Erreur interne du serveur', code: 'INTERNAL_ERROR' }
        })
    } finally {
        // Database connection handled by centralized db instance
    }
}

async function getProspect(req: NextApiRequest, res: NextApiResponse, id: string) {
    const prospect = await db.prospect.findUnique({
        where: { id },
        include: {
            notes: { orderBy: { createdAt: 'desc' } },
            commercialActivities: { orderBy: { createdAt: 'desc' } }
        }
    })

    if (!prospect) {
        return res.status(404).json({
            data: null,
            success: false,
            error: { message: 'Prospect non trouvé', code: 'NOT_FOUND' }
        })
    }

    return res.status(200).json({
        data: prospect,
        success: true,
        error: null
    })
}

async function updateProspect(req: NextApiRequest, res: NextApiResponse, id: string) {
    const { status, hasWebsiteIssue, websiteIssueReason, notes, ...otherUpdates } = req.body

    // Vérification de l'existence
    const existing = await db.prospect.findUnique({ where: { id } })
    if (!existing) {
        return res.status(404).json({
            data: null,
            success: false,
            error: { message: 'Prospect non trouvé', code: 'NOT_FOUND' }
        })
    }

    // Préparer les données de mise à jour
    const updateData: any = { ...otherUpdates }

    // Gestion des champs spécifiques
    if (status) updateData.status = status
    if (typeof hasWebsiteIssue === 'boolean') updateData.hasWebsiteIssue = hasWebsiteIssue
    if (websiteIssueReason !== undefined) updateData.websiteIssueReason = websiteIssueReason

    // Récupérer un ID utilisateur valide pour l'activité
    // TODO: Utiliser l'ID de la session quand l'auth sera là
    const systemUserId = await ensureSystemUser()

    // Transaction pour l'historique d'activité si changement de statut
    const result = await db.$transaction(async (tx) => {
        // 1. Mise à jour du prospect
        const updatedProspect = await tx.prospect.update({
            where: { id },
            data: updateData
        })

        // 2. Création d'activité si changement de statut
        if (status && status !== existing.status) {
            await tx.commercialActivity.create({
                data: {
                    prospectId: id,
                    action: 'STATUS_UPDATE',
                    fromStatus: existing.status,
                    toStatus: status,
                    userId: systemUserId,
                    notes: `Statut modifié de ${existing.status} à ${status}`
                }
            })
        }

        return updatedProspect
    })

    return res.status(200).json({
        data: result,
        success: true,
        error: null
    })
}

/**
 * Helper pour garantir qu'on a un utilisateur valide pour les logs système
 */
async function ensureSystemUser(): Promise<string> {
    // 1. Chercher l'utilisateur système dédié
    const systemUser = await db.user.findUnique({
        where: { email: 'system@bmad.crm' }
    })
    if (systemUser) return systemUser.id

    // 2. Sinon, prendre le premier utilisateur admin ou commercial dispo
    const anyUser = await db.user.findFirst()
    if (anyUser) return anyUser.id

    // 3. Sinon, créer un utilisateur système par défaut
    const newUser = await db.user.create({
        data: {
            email: 'system@bmad.crm',
            name: 'System User',
            password: 'system_password_hash', // Dummy hash
            role: 'ADMIN'
        }
    })
    return newUser.id
}

async function deleteProspect(req: NextApiRequest, res: NextApiResponse, id: string) {
    await db.prospect.delete({
        where: { id }
    })

    return res.status(200).json({
        data: { id, deleted: true },
        success: true,
        error: null
    })
}
