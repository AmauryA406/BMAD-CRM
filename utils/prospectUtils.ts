import { ProspectWithDetails } from '../types'

export const PROSPECT_STATUSES = {
    'PREMIER_APPEL': 'Premier appel',
    'A_RAPPELER': 'À rappeler',
    'RDV_MAQUETTE_PRIS': 'RDV pris',
    'RDV_MAQUETTE_FAIT': 'RDV fait',
    'DEVIS_ENVOYE': 'Devis envoyé',
    'SIGNATURE_PROCHE': 'Signature proche',
    'SIGNE': 'Signé',
    'PERDU': 'Perdu'
}

export interface WebsiteIssue {
    color: string
    icon: string
    label: string
    description: string
}

export const getTextColor = (color: string): string => {
    const colorMap: Record<string, string> = {
        'red': 'text-red-800',
        'orange': 'text-orange-800',
        'blue': 'text-blue-800',
        'purple': 'text-purple-800',
        'amber': 'text-amber-800',
        'green': 'text-green-800',
        'gray': 'text-gray-800'
    }
    return colorMap[color] || 'text-gray-800'
}

export const getBorderColor = (color: string): string => {
    const colorMap: Record<string, string> = {
        'red': 'border-red-200 bg-red-50',
        'orange': 'border-orange-200 bg-orange-50',
        'blue': 'border-blue-200 bg-blue-50',
        'purple': 'border-purple-200 bg-purple-50',
        'amber': 'border-amber-200 bg-amber-50',
        'green': 'border-green-200 bg-green-50',
        'gray': 'border-gray-200 bg-gray-50'
    }
    return colorMap[color] || 'border-gray-200 bg-gray-50'
}

export const getWebsiteIssueDisplay = (prospect: ProspectWithDetails): WebsiteIssue => {
    if (!prospect.hasWebsiteIssue || !prospect.websiteIssueReason) {
        return {
            color: 'gray',
            icon: '❓',
            label: 'Non analysé',
            description: 'Site web non encore analysé'
        }
    }

    const reason = prospect.websiteIssueReason.toLowerCase()

    if (reason.includes('404')) {
        return {
            color: 'red',
            icon: '',
            label: 'Site introuvable',
            description: ''
        }
    }

    if (reason.includes('500') || reason.includes('timeout')) {
        return {
            color: 'orange',
            icon: '',
            label: 'Serveur en panne',
            description: ''
        }
    }

    if (reason.includes('facebook') || reason.includes('instagram') || reason.includes('réseaux sociaux')) {
        return {
            color: 'blue',
            icon: '',
            label: 'Réseaux sociaux',
            description: ''
        }
    }

    if (reason.includes('non-responsive')) {
        return {
            color: 'purple',
            icon: '',
            label: 'Non-responsive',
            description: ''
        }
    }

    if (reason.includes('obsolète')) {
        return {
            color: 'amber',
            icon: '',
            label: 'Obsolète',
            description: ''
        }
    }

    return {
        color: 'gray',
        icon: '',
        label: 'Pas de site web',
        description: ''
    }
}

export const getStatusColor = (status: string): string => {
    switch (status) {
        case 'SIGNE': return 'bg-green-50 border-l-4 border-green-500'
        case 'RDV_MAQUETTE_PRIS': return 'bg-yellow-50 border-l-4 border-yellow-500'
        case 'A_RAPPELER': return 'bg-red-50 border-l-4 border-red-500'
        default: return 'bg-white border-l-4 border-transparent hover:border-gray-300'
    }
}

export const getStatusBadgeColor = (status: string): string => {
    switch (status) {
        case 'A_RAPPELER': return 'bg-red-100 text-red-700'
        case 'PREMIER_APPEL': return 'bg-blue-100 text-blue-700'
        case 'RDV_MAQUETTE_PRIS': return 'bg-amber-100 text-amber-800'
        case 'RDV_MAQUETTE_FAIT': return 'bg-indigo-100 text-indigo-700'
        case 'DEVIS_ENVOYE': return 'bg-purple-100 text-purple-700'
        case 'SIGNE': return 'bg-emerald-100 text-emerald-800 shadow-emerald-100'
        default: return 'bg-gray-100 text-gray-600'
    }
}

export const formatStatus = (status: string): string => {
    // @ts-ignore
    return PROSPECT_STATUSES[status] || status
}
