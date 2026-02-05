import React from 'react'
import { ProspectWithDetails } from '../types'
import {
    PROSPECT_STATUSES,
    getWebsiteIssueDisplay,
    getTextColor,
    getStatusBadgeColor
} from '../utils/prospectUtils'

interface ProspectRowProps {
    prospect: ProspectWithDetails
    onAddNote?: (prospectId: string) => void
    onDeleteNote?: (prospectId: string) => void
    onUpdateStatus: (prospectId: string, newStatus: string) => void
    onDelete?: (prospectId: string) => void
}

const ProspectRow: React.FC<ProspectRowProps> = ({
    prospect,
    onAddNote,
    onDeleteNote,
    onUpdateStatus,
    onDelete
}) => {
    const websiteIssue = getWebsiteIssueDisplay(prospect)

    return (
        <tr className="hover:bg-gray-50 transition-colors group" style={{ borderBottom: '1px solid #d1d5db' }}>
            {/* 1. Société / Contact */}
            <td className="px-6 py-4 whitespace-nowrap" style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span className="text-sm font-medium text-gray-900">{prospect.companyName}</span>
                    {prospect.fullName && (
                        <span className="text-xs text-gray-500">{prospect.fullName}</span>
                    )}
                </div>
            </td>

            {/* 2. Ville */}
            <td className="px-6 py-4 whitespace-nowrap" style={{ textAlign: 'center' }}>
                {prospect.city ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} className="text-sm text-gray-600">
                        📍 {prospect.city}
                    </span>
                ) : (
                    <span className="text-gray-400 text-xs italic">-</span>
                )}
            </td>

            {/* 3. Contact */}
            <td className="px-6 py-4 whitespace-nowrap" style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }} className="text-sm text-gray-500">
                    {prospect.phone && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="font-medium text-gray-700">
                            📞 {prospect.phone}
                        </span>
                    )}
                    {prospect.email && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="hover:text-gray-700 cursor-pointer" title={prospect.email}>
                            ✉️ Email
                        </span>
                    )}
                    {!prospect.phone && !prospect.email && (
                        <span className="text-gray-400 text-xs italic">Aucun contact</span>
                    )}
                </div>
            </td>

            {/* 3. Analyse Web */}
            <td className="px-6 py-4" style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
                    <span className="text-xl" title={websiteIssue.label}>{websiteIssue.icon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <span className={`text-[10px] font-bold uppercase ${getTextColor(websiteIssue.color)}`}>{websiteIssue.label}</span>
                        {websiteIssue.description && (
                            <span className="text-[9px] text-gray-400 truncate max-w-[150px]" title={websiteIssue.description}>
                                {websiteIssue.description}
                            </span>
                        )}
                    </div>
                    {prospect.website && (
                        <a href={prospect.website || '#'} target="_blank" rel="noreferrer" className="text-gray-300 hover:text-blue-500">
                            🌐
                        </a>
                    )}
                </div>
            </td>

            {/* 4. Statut */}
            <td className="px-6 py-4 whitespace-nowrap" style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <select
                        value={prospect.status}
                        onChange={(e) => onUpdateStatus?.(prospect.id, e.target.value)}
                        className={`appearance-none px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide cursor-pointer outline-none transition-all ${getStatusBadgeColor(prospect.status)} border border-transparent hover:border-black/5 text-center`}
                    >
                        {Object.entries(PROSPECT_STATUSES).map(([key, label]) => (
                            <option key={key} value={key}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
            </td>

            {/* 5. Note */}
            <td className="px-6 py-4" style={{ textAlign: 'center', minWidth: '200px' }}>
                <div onClick={() => onAddNote?.(prospect.id)} style={{ display: 'flex', justifyContent: 'center' }} className="cursor-pointer group/note relative">
                    {prospect.notes && prospect.notes.length > 0 && prospect.notes[0] ? (
                        <div className="text-sm text-gray-600 bg-yellow-50/50 p-2 rounded border border-yellow-100/50 hover:bg-yellow-50 transition-colors relative group/delete" style={{ width: '100%', maxWidth: '180px' }}>
                            <p className="line-clamp-2 pr-4">{prospect.notes[0].content}</p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteNote?.(prospect.id)
                                }}
                                className="absolute top-1 right-1 text-gray-400 hover:text-red-500 opacity-0 group-hover/delete:opacity-100 transition-opacity"
                                title="Supprimer la note"
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <div className="text-xl text-gray-300 p-2 border border-dashed border-gray-200 rounded hover:bg-gray-50 hover:text-gray-500" style={{ width: '100%', maxWidth: '180px', textAlign: 'center' }} title="Ajouter une note">
                            📝
                        </div>
                    )}
                </div>
            </td>

            {/* 6. Utilitaire / Actions */}
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
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
}

export default ProspectRow
