/**
 * Composant ProspectCard - Affichage d'un prospect avec filtrage binaire
 *
 * Affiche:
 * - Informations de base du prospect
 * - Indicateur visuel du problème web détecté (raison du filtrage)
 * - Actions rapides (appel, validation, notes)
 */

import React from 'react'
import { Prospect } from '@prisma/client'

// Définition locale de l'interface complète (avec relations)
// Idéalement, cela devrait être dans un fichier commun de types
interface ProspectWithDetails extends Prospect {
  notes?: {
    id: string
    content: string
    createdAt: Date
    createdBy: string
  }[]
  commercialActivities?: any[]
}

interface ProspectCardProps {
  prospect: ProspectWithDetails
  onAddNote?: (prospectId: string) => void
  onUpdateStatus: (prospectId: string, newStatus: string) => void
  onDelete?: (prospectId: string) => void
}

const PROSPECT_STATUSES = {
  'PREMIER_APPEL': 'Premier appel',
  'A_RAPPELER': 'À rappeler',
  'RDV_MAQUETTE_PRIS': 'RDV pris',
  'RDV_MAQUETTE_FAIT': 'RDV fait',
  'DEVIS_ENVOYE': 'Devis envoyé',
  'SIGNATURE_PROCHE': 'Signature proche',
  'SIGNE': 'Signé',
  'PERDU': 'Perdu'
}

const ProspectCard: React.FC<ProspectCardProps> = ({
  prospect,
  onAddNote,
  onUpdateStatus,
  onDelete
}) => {
  // Déterminer l'indicateur visuel selon le type de problème web
  const getWebsiteIssueDisplay = () => {
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
        icon: '🚫',
        label: 'Site inexistant',
        description: 'Site web introuvable (404)'
      }
    }

    if (reason.includes('500') || reason.includes('timeout')) {
      return {
        color: 'orange',
        icon: '⚠️',
        label: 'Site en panne',
        description: 'Serveur en erreur ou timeout'
      }
    }

    if (reason.includes('facebook') || reason.includes('instagram') || reason.includes('réseaux sociaux')) {
      return {
        color: 'blue',
        icon: '📱',
        label: 'Réseaux sociaux seulement',
        description: 'Pas de site, seulement Facebook/Instagram'
      }
    }

    if (reason.includes('non-responsive')) {
      return {
        color: 'purple',
        icon: '📱',
        label: 'Non-responsive',
        description: 'Site non adapté mobile'
      }
    }

    if (reason.includes('obsolète')) {
      return {
        color: 'amber',
        icon: '⏰',
        label: 'Technologies obsolètes',
        description: reason
      }
    }

    return {
      color: 'green',
      icon: '🔍',
      label: 'Problème détecté',
      description: reason
    }
  }

  const websiteIssue = getWebsiteIssueDisplay()



  const getStatusColor = () => {
    switch (prospect.status) {
      case 'SIGNE': return 'bg-green-50 border-l-4 border-green-500'
      case 'RDV_MAQUETTE_PRIS': return 'bg-yellow-50 border-l-4 border-yellow-500'
      case 'A_RAPPELER': return 'bg-red-50 border-l-4 border-red-500'
      default: return 'bg-white border-l-4 border-transparent hover:border-gray-300'
    }
  }

  return (

    <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100 group">
      {/* 1. Société / Contact */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{prospect.companyName}</span>
          {prospect.fullName && (
            <span className="text-xs text-gray-500">{prospect.fullName}</span>
          )}
        </div>
      </td>

      {/* 2. Coordonnées */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col text-sm text-gray-500 space-y-1">
          {prospect.city && (
            <span className="flex items-center gap-1">� {prospect.city}</span>
          )}
          {prospect.phone && (
            <span className="flex items-center gap-1">📞 {prospect.phone}</span>
          )}
          {prospect.email && (
            <span className="flex items-center gap-1 hover:text-gray-700 cursor-pointer" title={prospect.email}>✉️ Email</span>
          )}
        </div>
      </td>

      {/* 3. Statut */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <select
            value={prospect.status}
            onChange={(e) => onUpdateStatus?.(prospect.id, e.target.value)}
            className={`appearance-none px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide cursor-pointer outline-none transition-all ${getStatusBadgeColor()} border border-transparent hover:border-black/5 text-center`}
          >
            {Object.entries(PROSPECT_STATUSES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

        </div>
      </td>

      {/* 4. Problème Web */}
      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center gap-2 w-full">
          <span className="text-xl" title={websiteIssue.label}>{websiteIssue.icon}</span>
          <div className="flex flex-col leading-tight items-center text-center">
            <span className={`text-[10px] font-bold uppercase ${getTextColor(websiteIssue.color)}`}>{websiteIssue.label}</span>
            {websiteIssue.description && (
              <span className="text-[9px] text-gray-400 truncate max-w-[150px]" title={websiteIssue.description}>
                {websiteIssue.description}
              </span>
            )}
          </div>
          {prospect.website && (
            <a href={prospect.website || '#'} target="_blank" rel="noreferrer" className="ml-2 text-gray-300 hover:text-blue-500">
              🌐
            </a>
          )}
        </div>
      </td>

      {/* 5. Note */}
      <td className="px-6 py-4 min-w-[200px]">
        <div onClick={() => onAddNote?.(prospect.id)} className="cursor-pointer group/note relative">
          {prospect.notes && prospect.notes.length > 0 && prospect.notes[0] ? (
            <div className="text-sm text-gray-600 bg-yellow-50/50 p-2 rounded border border-yellow-100/50 hover:bg-yellow-50 transition-colors">
              <p className="line-clamp-2">{prospect.notes[0].content}</p>
            </div>
          ) : (
            <div className="text-xs text-gray-300 italic p-2 border border-dashed border-gray-200 rounded hover:bg-gray-50 text-center">
              + Note
            </div>
          )}
        </div>
      </td>

      {/* 6. Utilitaire / Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end gap-2">

          <button
            onClick={() => onDelete?.(prospect.id)}
            className="text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 p-2 rounded-lg transition-colors"
            title="Supprimer"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  )

  function getStatusBadgeColor() {
    switch (prospect.status) {
      case 'A_RAPPELER': return 'bg-red-100 text-red-700'
      case 'PREMIER_APPEL': return 'bg-blue-100 text-blue-700'
      case 'RDV_MAQUETTE_PRIS': return 'bg-amber-100 text-amber-800'
      case 'RDV_MAQUETTE_FAIT': return 'bg-indigo-100 text-indigo-700'
      case 'DEVIS_ENVOYE': return 'bg-purple-100 text-purple-700'
      case 'SIGNE': return 'bg-emerald-100 text-emerald-800 shadow-emerald-100'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  function formatStatus(status: string) {
    const statusMap: Record<string, string> = {
      'PREMIER_APPEL': 'Premier appel',
      'A_RAPPELER': 'À rappeler',
      'RDV_MAQUETTE_PRIS': 'RDV pris',
      'RDV_MAQUETTE_FAIT': 'RDV fait',
      'DEVIS_ENVOYE': 'Devis envoyé',
      'SIGNATURE_PROCHE': 'Signature proche',
      'SIGNE': 'Signé',
      'PERDU': 'Perdu'
    }
    return statusMap[status] || status
  }

  function getBorderColor(color: string) {
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

  function getTextColor(color: string) {
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
}

export default ProspectCard