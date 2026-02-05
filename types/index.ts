import { Prospect } from '@prisma/client'

export interface ProspectWithDetails extends Prospect {
    notes?: {
        id: string
        content: string
        createdAt: Date
        createdBy: string
    }[]
    commercialActivities?: any[]
}

export interface Stats {
    total: number
    withIssues: number
    premierAppel: number
    aRappeler: number
    rdvFait: number
    devisEnvoye: number
    signe: number
}

export interface ImportResult {
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

export interface ImportStatus {
    isImporting: boolean
    isExporting: boolean
    result: ImportResult | null
    error: string | null
}
