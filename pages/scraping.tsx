import React from 'react'
import Head from 'next/head'
import ScrapingDashboard from '../components/ScrapingDashboard'
import { ScrapingResult } from '../lib/services/scrapingPipeline'

const ScrapingPage: React.FC = () => {
  const handleScrapingComplete = (result: ScrapingResult) => {
    console.log('✅ Scraping terminé:', result)

    // Afficher une notification ou rediriger vers la liste des prospects
    alert(`Scraping terminé ! ${result.prospectsWithIssues} prospects avec problèmes importés.`)
  }

  return (
    <>
      <Head>
        <title>Scraping Prospects - BMAD CRM</title>
        <meta name="description" content="Interface de scraping automatisé avec filtrage qualité" />
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* En-tête */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '0.5rem'
            }}>
              🎯 BMAD CRM - Acquisition Prospects
            </h1>
            <p style={{
              fontSize: '1.2rem',
              color: '#64748b'
            }}>
              Scraping Google Maps avec filtrage binaire qualité web
            </p>
          </div>

          {/* Navigation rapide */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            <a
              href="/"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#e2e8f0',
                color: '#475569',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              🏠 Accueil
            </a>
            <a
              href="/prospects"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#e2e8f0',
                color: '#475569',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              👥 Gestion Prospects
            </a>
          </div>

          {/* Composant principal */}
          <ScrapingDashboard
            onScrapingComplete={handleScrapingComplete}
          />

          {/* Informations techniques */}
          <div style={{
            marginTop: '3rem',
            padding: '1.5rem',
            backgroundColor: '#f1f5f9',
            borderRadius: '8px',
            border: '1px solid #cbd5e1'
          }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              color: '#334155',
              fontSize: '1.2rem'
            }}>
              ℹ️ Fonctionnement du Filtrage Binaire
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              <div>
                <h4 style={{
                  color: '#059669',
                  margin: '0 0 0.5rem 0'
                }}>
                  ✅ Prospects GARDÉS (Opportunités)
                </h4>
                <ul style={{
                  fontSize: '14px',
                  color: '#475569',
                  lineHeight: 1.6
                }}>
                  <li>Sites inexistants (404, erreurs serveur)</li>
                  <li>Redirections vers Facebook/Instagram uniquement</li>
                  <li>Sites non-responsifs (pas adaptés mobile)</li>
                  <li>Technologies obsolètes (Flash, copyright ancien)</li>
                </ul>
              </div>

              <div>
                <h4 style={{
                  color: '#dc2626',
                  margin: '0 0 0.5rem 0'
                }}>
                  ❌ Prospects SUPPRIMÉS
                </h4>
                <ul style={{
                  fontSize: '14px',
                  color: '#475569',
                  lineHeight: 1.6
                }}>
                  <li>Sites modernes et fonctionnels</li>
                  <li>Design responsive et récent</li>
                  <li>Technologies à jour</li>
                  <li>Pas d'opportunité commerciale</li>
                </ul>
              </div>
            </div>

            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#dbeafe',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1d4ed8'
            }}>
              <strong>💡 Principe :</strong> On garde uniquement les prospects avec des problèmes web = opportunités de modernisation.
              <br />
              <strong>💰 Coût :</strong> Validation qualité = 0€ supplémentaire après scraping initial.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ScrapingPage