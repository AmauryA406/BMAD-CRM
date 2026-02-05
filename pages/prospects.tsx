import React, { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import ProspectRow from '../components/ProspectRow'
import { ProspectWithDetails, Stats, ImportResult, ImportStatus } from '../types'

interface ProspectsPageState {
  prospects: ProspectWithDetails[]
  loading: boolean
  error: string | null
  filter: string
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  stats: Stats
}

const ProspectsPage: React.FC = () => {
  const [state, setState] = useState<ProspectsPageState>({
    prospects: [],
    loading: true,
    error: null,
    filter: 'ALL',
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    stats: {
      total: 0,
      withIssues: 0,
      premierAppel: 0,
      aRappeler: 0,
      rdvFait: 0,
      devisEnvoye: 0,
      signe: 0
    }
  })

  const [importStatus, setImportStatus] = useState<ImportStatus>({
    isImporting: false,
    isExporting: false,
    result: null,
    error: null
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Charger les prospects au démarrage et lors des changements de page/filtre
  useEffect(() => {
    loadProspects()
  }, [state.currentPage, state.filter])

  const loadProspects = async (page = state.currentPage) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const limit = 20 // Prospects par page
      const offset = (page - 1) * limit

      // Construire les paramètres de filtre
      const filterParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      })

      // Ajouter les filtres spécifiques
      if (state.filter === 'WITH_ISSUES') {
        filterParams.append('hasWebsiteIssue', 'true')
      } else if (state.filter !== 'ALL') {
        // Pour les statuts (PREMIER_APPEL, A_RAPPELER, etc.)
        filterParams.append('status', state.filter)
      }

      const response = await fetch(`/api/prospects?${filterParams}`)
      const result = await response.json()

      if (result.success) {
        setState(prev => ({
          ...prev,
          prospects: result.data.prospects || [],
          totalCount: result.data.totalCount || 0,
          currentPage: result.data.currentPage || 1,
          totalPages: result.data.totalPages || 1,
          hasNextPage: result.data.hasNextPage || false,
          hasPreviousPage: result.data.hasPreviousPage || false,
          stats: result.data.stats || prev.stats, // Mise à jour des stats globales
          loading: false
        }))
      } else {
        setState(prev => ({
          ...prev,
          error: result.error?.message || 'Erreur lors du chargement',
          loading: false
        }))
      }
    } catch (error) {
      console.error('Erreur chargement prospects:', error)
      setState(prev => ({
        ...prev,
        error: 'Erreur de connexion',
        loading: false
      }))
    }
  }

  // Les prospects sont déjà filtrés côté serveur
  const filteredProspects = state.prospects

  // Navigation pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= state.totalPages) {
      setState(prev => ({ ...prev, currentPage: newPage }))
    }
  }

  const handleFilterChange = (newFilter: string) => {
    setState(prev => ({
      ...prev,
      filter: newFilter,
      currentPage: 1 // Reset à la page 1 lors du changement de filtre
    }))
  }

  // Actions sur les prospects


  const handleDelete = async (prospectId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce prospect définitivement ? Cette action est irréversible.')) {
      return
    }

    try {
      const response = await fetch(`/api/prospects/${prospectId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la suppression')
      }

      // Recharger les prospects
      loadProspects(state.currentPage)
    } catch (error) {
      console.error('Erreur delete prospect:', error)
      alert("Impossible de supprimer le prospect")
    }
  }



  const handleAddNote = async (prospectId: string) => {
    const note = prompt('Ajouter une note :')
    if (!note || !note.trim()) return

    try {
      const response = await fetch(`/api/prospects/${prospectId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: note })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Erreur lors de l\'ajout de la note')
      }

      loadProspects(state.currentPage)

    } catch (error) {
      console.error('Erreur add note:', error)
      alert('Impossible d\'ajouter la note')
    }
  }

  const handleDeleteNote = async (prospectId: string) => {
    if (!confirm("Supprimer cette note ?")) return;

    try {
      const response = await fetch(`/api/prospects/${prospectId}/notes`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la suppression de la note')
      }

      loadProspects(state.currentPage)

    } catch (error) {
      console.error('Erreur delete note:', error)
      alert('Impossible de supprimer la note')
    }
  }

  const handleUpdateStatus = async (prospectId: string, newStatus: string) => {
    // Optimistic update
    setState(prev => ({
      ...prev,
      prospects: prev.prospects.map(p =>
        p.id === prospectId ? { ...p, status: newStatus as any } : p
      )
    }))

    try {
      const response = await fetch(`/api/prospects/${prospectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Erreur lors de la mise à jour')
      }

      // Recharger pour être sûr d'avoir les données fraîches (ex: activités créées)
      // On le fait silencieusement
      loadProspects(state.currentPage)

    } catch (error) {
      console.error('Erreur update status:', error)
      alert('Erreur lors de la mise à jour du statut')
      // Revert optimistic update en cas d'erreur
      loadProspects(state.currentPage)
    }
  }

  // Gérer l'import Excel
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    // Vérifier le format de fichier
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]

    if (!validTypes.includes(file.type)) {
      setImportStatus({
        ...importStatus,
        error: 'Format de fichier invalide. Utilisez un fichier .xlsx ou .xls'
      })
      return
    }

    setImportStatus({
      isImporting: true,
      isExporting: false,
      result: null,
      error: null
    })

    try {
      const formData = new FormData()
      formData.append('excelFile', file)

      const response = await fetch('/api/import/excel', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Erreur lors de l\'import')
      }

      setImportStatus({
        isImporting: false,
        isExporting: false,
        result: result.data,
        error: null
      })

      // Recharger les prospects
      loadProspects()

      // Reset du input file
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      setImportStatus({
        isImporting: false,
        isExporting: false,
        result: null,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    }
  }

  // Gérer l'export Excel
  const handleExport = async () => {
    setImportStatus({
      ...importStatus,
      isExporting: true,
      error: null
    })

    try {
      const response = await fetch('/api/export/excel')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Erreur lors de l\'export')
      }

      // Télécharger le fichier
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url

      // Extraire le nom de fichier du header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'prospects_export.xlsx'

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) filename = match[1]
      }

      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setImportStatus({
        ...importStatus,
        isExporting: false
      })

    } catch (error) {
      setImportStatus({
        ...importStatus,
        isExporting: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    }
  }

  // Statistiques globales venant du serveur
  const stats = state.stats

  if (state.loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#64748b'
      }}>
        ⏳ Chargement des prospects...
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Prospects - BMAD CRM</title>
        <meta name="description" content="Liste des prospects avec filtrage qualité web" />
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '100%',
          margin: '0 auto',
          width: '100%'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '0.5rem'
            }}>
              🏢 Prospects CRM
            </h1>
            <p style={{
              fontSize: '1.2rem',
              color: '#64748b'
            }}>
              Prospects filtrés avec problèmes web détectés
            </p>
          </div>

          {/* Navigation */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            <a href="/" style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#e2e8f0',
              color: '#475569',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500'
            }}>🏠 Accueil</a>
            <a href="/scraping" style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#e2e8f0',
              color: '#475569',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500'
            }}>🎯 Scraping</a>
          </div>

          {/* Actions Import/Export */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <label style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#10b981',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                📥 Importer Excel
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  disabled={importStatus.isImporting}
                  style={{ display: 'none' }}
                />
              </label>
              {importStatus.isImporting && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#10b981',
                  fontSize: '14px'
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #10b981',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '0.5rem'
                  }}></div>
                  Import...
                </div>
              )}
            </div>

            <button
              onClick={handleExport}
              disabled={importStatus.isExporting || state.prospects.length === 0}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: state.prospects.length > 0 ? '#3b82f6' : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: state.prospects.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {importStatus.isExporting ? (
                <>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Export...
                </>
              ) : (
                <>📤 Exporter Excel</>
              )}
            </button>
          </div>

          {/* Statistiques */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {stats.total}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Total prospects</div>
            </div>
            <div style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                {stats.withIssues}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Avec problèmes web</div>
            </div>
            <div style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {stats.premierAppel}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>Premier appel</div>
            </div>
            <div style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
                {stats.aRappeler}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>À rappeler</div>
            </div>
          </div>

          {/* Filtres */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            {[
              { key: 'ALL', label: 'Tous', count: stats.total },
              { key: 'WITH_ISSUES', label: 'Avec problèmes', count: stats.withIssues },
              { key: 'PREMIER_APPEL', label: 'Premier appel', count: stats.premierAppel },
              { key: 'A_RAPPELER', label: 'À rappeler', count: stats.aRappeler },
              { key: 'RDV_MAQUETTE_FAIT', label: 'RDV fait', count: stats.rdvFait },
              { key: 'DEVIS_ENVOYE', label: 'Devis envoyé', count: stats.devisEnvoye },
              { key: 'SIGNE', label: 'Signé', count: stats.signe }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => handleFilterChange(filter.key)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: state.filter === filter.key ? '#3b82f6' : 'white',
                  color: state.filter === filter.key ? 'white' : '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>

          {/* Message d'erreur */}
          {state.error && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              borderRadius: '8px',
              marginBottom: '2rem',
              border: '1px solid #fecaca'
            }}>
              ❌ {state.error}
              <button
                onClick={() => loadProspects()}
                style={{
                  marginLeft: '1rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Liste des prospects */}
          {filteredProspects.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
              <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>
                Aucun prospect trouvé
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                {state.filter === 'ALL'
                  ? 'Lancez un scraping pour commencer à collecter des prospects'
                  : `Aucun prospect dans la catégorie sélectionnée`
                }
              </p>
              <a
                href="/scraping"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '500'
                }}
              >
                🎯 Lancer un scraping
              </a>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full" style={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '22%' }}>
                        Société & Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '12%' }}>
                        Ville
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '18%' }}>
                        Numéro
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '16%' }}>
                        Analyse Web
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '14%' }}>
                        Statut
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '25%' }}>
                        Note
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '8%' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredProspects.map(prospect => (
                      <ProspectRow
                        key={prospect.id}
                        prospect={prospect}
                        onAddNote={handleAddNote}
                        onDeleteNote={handleDeleteNote}
                        onUpdateStatus={handleUpdateStatus}
                        onDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {state.totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {/* Bouton Précédent */}
              <button
                onClick={() => handlePageChange(state.currentPage - 1)}
                disabled={!state.hasPreviousPage}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: state.hasPreviousPage ? '#3b82f6' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: state.hasPreviousPage ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                ← Précédent
              </button>

              {/* Numéros de pages */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center'
              }}>
                {(() => {
                  const pages = []
                  const totalPages = state.totalPages
                  const currentPage = state.currentPage

                  if (totalPages <= 7) {
                    // Si moins de 7 pages, afficher toutes
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i)
                    }
                  } else {
                    // Plus de 7 pages, logique intelligente
                    if (currentPage <= 4) {
                      // Au début : 1 2 3 4 5 ... lastPage
                      pages.push(1, 2, 3, 4, 5)
                      if (totalPages > 6) {
                        pages.push('...', totalPages)
                      } else {
                        pages.push(6)
                      }
                    } else if (currentPage >= totalPages - 3) {
                      // À la fin : 1 ... (n-4) (n-3) (n-2) (n-1) n
                      pages.push(1, '...')
                      for (let i = totalPages - 4; i <= totalPages; i++) {
                        pages.push(i)
                      }
                    } else {
                      // Au milieu : 1 ... (current-1) current (current+1) ... last
                      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
                    }
                  }

                  return pages.map((page, index) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${index}`} style={{ color: '#6b7280', padding: '0.5rem' }}>
                          ...
                        </span>
                      )
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page as number)}
                        style={{
                          padding: '0.5rem',
                          minWidth: '36px',
                          backgroundColor: page === currentPage ? '#3b82f6' : 'white',
                          color: page === currentPage ? 'white' : '#374151',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: page === currentPage ? 'bold' : 'normal'
                        }}
                      >
                        {page}
                      </button>
                    )
                  })
                })()}
              </div>

              {/* Bouton Suivant */}
              <button
                onClick={() => handlePageChange(state.currentPage + 1)}
                disabled={!state.hasNextPage}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: state.hasNextPage ? '#3b82f6' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: state.hasNextPage ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Suivant →
              </button>

              {/* Info pagination */}
              <div style={{
                marginLeft: '1rem',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Page {state.currentPage} sur {state.totalPages} ({state.totalCount} prospects)
              </div>
            </div>
          )}

          {/* Résultats d'import */}
          {importStatus.result && (
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                ✅ Résultats de l'import Excel
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                    {importStatus.result.totalRows}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>Total lignes</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                    {importStatus.result.imported}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>Importés</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                    {importStatus.result.duplicates}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>Doublons</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
                    {importStatus.result.errors}
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>Erreurs</div>
                </div>
              </div>

              <button
                onClick={() => setImportStatus(prev => ({ ...prev, result: null }))}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Masquer
              </button>
            </div>
          )}

          {/* Messages d'erreur */}
          {importStatus.error && (
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              borderRadius: '8px',
              border: '1px solid #fecaca'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ marginRight: '0.75rem' }}>❌</div>
                <div>{importStatus.error}</div>
                <button
                  onClick={() => setImportStatus(prev => ({ ...prev, error: null }))}
                  style={{
                    marginLeft: 'auto',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ajout du CSS pour les animations */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  )
}

export default ProspectsPage