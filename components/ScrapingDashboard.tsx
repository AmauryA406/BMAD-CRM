/**
 * Composant ScrapingDashboard - Interface de scraping avec filtrage binaire
 *
 * Fonctionnalités:
 * - Configuration du scraping (métier, villes)
 * - Lancement du scraping avec validation automatique
 * - Affichage temps réel du filtrage binaire
 * - Statistiques des prospects gardés vs rejetés
 */

import React, { useState, useEffect } from 'react'
import { ScrapingConfig, ScrapingResult } from '../lib/services/scrapingPipeline'

interface ScrapingDashboardProps {
  onScrapingComplete?: (result: ScrapingResult) => void
}

interface ScrapingStatus {
  isRunning: boolean
  currentStep: string
  progress: number
  stats?: {
    totalScraped: number
    prospectsWithIssues: number
    prospectsRejected: number
    rejectionReasons: Record<string, number>
  }
}

const ScrapingDashboard: React.FC<ScrapingDashboardProps> = ({ onScrapingComplete }) => {
  // Configuration du scraping
  const [config, setConfig] = useState<ScrapingConfig>({
    metier: '',
    villes: [],
    maxProspects: 50,
    userId: 'test-user-123' // User ID fixe pour les tests
  })

  // État du scraping
  const [scrapingStatus, setScrapingStatus] = useState<ScrapingStatus>({
    isRunning: false,
    currentStep: '',
    progress: 0
  })

  // Suggestions de métiers (optionnelles)
  const metiersExamples = [
    'Plombier',
    'Électricien',
    'Chauffagiste',
    'Maçon',
    'Menuisier',
    'Peintre en bâtiment',
    'Couvreur',
    'Serrurier',
    'Carreleur',
    'Architecte',
    'Paysagiste',
    'Climatiseur',
    'Vitrier',
    'Déménageur'
  ]

  // Gérer l'ajout de villes
  const [newVille, setNewVille] = useState('')

  const addVille = () => {
    if (newVille.trim() && !config.villes.includes(newVille.trim())) {
      setConfig(prev => ({
        ...prev,
        villes: [...prev.villes, newVille.trim()]
      }))
      setNewVille('')
    }
  }

  const removeVille = (ville: string) => {
    setConfig(prev => ({
      ...prev,
      villes: prev.villes.filter(v => v !== ville)
    }))
  }

  // Lancer le scraping
  const startScraping = async () => {
    if (!config.metier || config.villes.length === 0) {
      alert('Veuillez sélectionner un métier et au moins une ville')
      return
    }

    setScrapingStatus({
      isRunning: true,
      currentStep: 'Initialisation...',
      progress: 0
    })

    try {
      // Démarrer le scraping via API
      const response = await fetch('/api/scraping/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      const result = await response.json()
      console.log('Réponse API scraping/start:', result)

      if (!result.success || !result.data || !result.data.jobId) {
        throw new Error(result.error?.message || 'Réponse API invalide')
      }

      // Suivre le progrès du scraping
      await trackScrapingProgress(result.data.jobId)

    } catch (error) {
      console.error('Erreur scraping:', error)
      setScrapingStatus({
        isRunning: false,
        currentStep: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        progress: 0
      })

      // Afficher l'erreur à l'utilisateur
      alert(`Erreur lors du scraping: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  // Suivre le progrès du scraping
  const trackScrapingProgress = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/scraping/status/${jobId}`)

        if (!response.ok) {
          throw new Error(`Erreur API status: ${response.status}`)
        }

        const result = await response.json()
        console.log('Statut scraping:', result)

        if (!result.success || !result.data) {
          throw new Error(result.error?.message || 'Erreur récupération statut')
        }

        const job = result.data

        // Mettre à jour le statut
        setScrapingStatus(prev => ({
          ...prev,
          currentStep: getStepDescription(job.status),
          progress: calculateProgress(job.status),
          stats: job.status === 'COMPLETED' ? {
            totalScraped: job.totalScraped,
            prospectsWithIssues: job.withIssues,
            prospectsRejected: job.rejectedCount,
            rejectionReasons: job.rejectionReasons || {}
          } : prev.stats
        }))

        // Arrêter le suivi si terminé
        if (job.status === 'COMPLETED' || job.status === 'FAILED') {
          clearInterval(interval)
          setScrapingStatus(prev => ({
            ...prev,
            isRunning: false
          }))

          if (job.status === 'COMPLETED' && onScrapingComplete) {
            onScrapingComplete({
              scrapingJobId: jobId,
              totalScraped: job.totalScraped,
              prospectsWithIssues: job.withIssues,
              prospectsRejected: job.rejectedCount,
              imported: job.imported,
              rejectionReasons: job.rejectionReasons || {},
              duration: Date.now() - new Date(job.startedAt).getTime()
            })
          }
        }
      } catch (error) {
        console.error('Erreur suivi scraping:', error)
        clearInterval(interval)
      }
    }, 2000) // Check toutes les 2 secondes
  }

  const getStepDescription = (status: string) => {
    const steps: Record<string, string> = {
      'PENDING': 'En attente...',
      'SCRAPING': 'Scraping Google Maps en cours...',
      'VALIDATING': 'Validation qualité des sites web...',
      'FILTERING': 'Filtrage binaire (garder les problèmes)...',
      'IMPORTING': 'Import des prospects qualifiés...',
      'COMPLETED': 'Scraping terminé avec succès ✅',
      'FAILED': 'Erreur lors du scraping ❌'
    }
    return steps[status] || status
  }

  const calculateProgress = (status: string) => {
    const progressMap: Record<string, number> = {
      'PENDING': 10,
      'SCRAPING': 30,
      'VALIDATING': 60,
      'FILTERING': 80,
      'IMPORTING': 90,
      'COMPLETED': 100,
      'FAILED': 0
    }
    return progressMap[status] || 0
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        🔍 Scraping Prospects avec Filtrage Qualité
      </h2>

      {/* Configuration */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Saisie libre métier */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Métier à scraper
          </label>
          <input
            type="text"
            value={config.metier}
            onChange={(e) => setConfig(prev => ({ ...prev, metier: e.target.value }))}
            placeholder="Ex: plombier, électricien, paysagiste..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            disabled={scrapingStatus.isRunning}
          />
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">💡 Suggestions :</p>
            <div className="flex flex-wrap gap-1">
              {metiersExamples.slice(0, 6).map(metier => (
                <button
                  key={metier}
                  onClick={() => setConfig(prev => ({ ...prev, metier }))}
                  disabled={scrapingStatus.isRunning}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-blue-100 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {metier}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Nombre max de prospects */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre max de prospects
          </label>
          <input
            type="number"
            min="10"
            max="200"
            value={config.maxProspects}
            onChange={(e) => setConfig(prev => ({ ...prev, maxProspects: parseInt(e.target.value) }))}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            disabled={scrapingStatus.isRunning}
          />
        </div>
      </div>

      {/* Gestion des villes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Villes cibles
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Ajouter une ville..."
            value={newVille}
            onChange={(e) => setNewVille(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addVille()}
            className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            disabled={scrapingStatus.isRunning}
          />
          <button
            onClick={addVille}
            className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={scrapingStatus.isRunning}
          >
            Ajouter
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {config.villes.map(ville => (
            <span
              key={ville}
              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {ville}
              <button
                onClick={() => removeVille(ville)}
                className="ml-2 text-blue-600 hover:text-blue-800"
                disabled={scrapingStatus.isRunning}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Bouton de lancement */}
      <div className="mb-6">
        <button
          onClick={startScraping}
          disabled={scrapingStatus.isRunning || !config.metier || config.villes.length === 0}
          className="w-full bg-green-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {scrapingStatus.isRunning
            ? '⏳ Scraping en cours...'
            : '🚀 Lancer le Scraping avec Filtrage'
          }
        </button>
      </div>

      {/* Indicateur de progrès */}
      {scrapingStatus.isRunning && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {scrapingStatus.currentStep}
            </span>
            <span className="text-sm text-gray-500">
              {scrapingStatus.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${scrapingStatus.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Statistiques de filtrage */}
      {scrapingStatus.stats && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">📊 Résultats du Filtrage Binaire</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {scrapingStatus.stats.totalScraped}
              </div>
              <div className="text-sm text-gray-600">Total scrapés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {scrapingStatus.stats.prospectsWithIssues}
              </div>
              <div className="text-sm text-gray-600">Gardés (avec problèmes)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {scrapingStatus.stats.prospectsRejected}
              </div>
              <div className="text-sm text-gray-600">Rejetés (sites corrects)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((scrapingStatus.stats.prospectsWithIssues / scrapingStatus.stats.totalScraped) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Taux de filtrage</div>
            </div>
          </div>
        </div>
      )}

      {/* Explication du filtrage */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">🎯 Principe du Filtrage Binaire</h4>
        <p className="text-sm text-blue-800 mb-2">
          <strong>Prospects GARDÉS</strong> (opportunités commerciales) :
        </p>
        <ul className="text-sm text-blue-700 space-y-1 ml-4">
          <li>• Sites inexistants (404, erreurs serveur)</li>
          <li>• Redirections vers Facebook/Instagram uniquement</li>
          <li>• Sites non-responsifs (pas adaptés mobile)</li>
          <li>• Technologies obsolètes (Flash, copyright ancien)</li>
        </ul>
        <p className="text-sm text-blue-800 mt-2">
          <strong>Prospects SUPPRIMÉS</strong> : Sites modernes et fonctionnels (pas d'opportunité)
        </p>
      </div>
    </div>
  )
}

export default ScrapingDashboard