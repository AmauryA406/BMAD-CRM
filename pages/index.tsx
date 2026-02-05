import React from 'react'
import Head from 'next/head'

const HomePage: React.FC = () => {
  return (
    <>
      <Head>
        <title>BMAD CRM - Gestion Prospects</title>
        <meta name="description" content="CRM pour artisans avec scraping et filtrage qualité" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>🚀 BMAD CRM</h1>
        <p>Plateforme CRM avec scraping automatisé et filtrage qualité web</p>

        <div style={{ marginTop: '2rem' }}>
          <h2>Fonctionnalités disponibles :</h2>
          <ul>
            <li>✅ Scraping Google Maps avec validation qualité</li>
            <li>✅ Filtrage binaire des prospects (sites problématiques)</li>
            <li>✅ Workflow commercial 8-phases</li>
            <li>✅ Import/Export Excel intégré avec anti-doublons</li>
          </ul>
        </div>

        {/* Navigation vers les fonctionnalités */}
        <div style={{ marginTop: '2rem', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <a
            href="/scraping"
            style={{
              display: 'block',
              padding: '1.5rem',
              backgroundColor: '#10b981',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            🎯 Scraping Prospects
            <div style={{ fontSize: '14px', marginTop: '0.5rem', opacity: 0.9 }}>
              Interface complète de scraping avec filtrage binaire
            </div>
          </a>

          <a
            href="/prospects"
            style={{
              display: 'block',
              padding: '1.5rem',
              backgroundColor: '#8b5cf6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            🏢 Gestion Prospects
            <div style={{ fontSize: '14px', marginTop: '0.5rem', opacity: 0.9 }}>
              Visualisation et gestion des prospects filtrés
            </div>
          </a>

        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #22c55e' }}>
          <h3>✅ Statut Infrastructure</h3>
          <p><strong>✅ Next.js + TypeScript :</strong> Opérationnel</p>
          <p><strong>✅ PostgreSQL Docker :</strong> Configuré</p>
          <p><strong>✅ Prisma Client :</strong> Généré et fonctionnel</p>
          <p><strong>✅ Components React :</strong> Intégrés</p>
          <p><strong>🚀 Statut :</strong> Prêt pour le développement</p>
        </div>
      </main>
    </>
  )
}

export default HomePage