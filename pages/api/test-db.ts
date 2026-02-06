/**
 * API Route de Test Infrastructure
 *
 * Tests:
 * - Connexion PostgreSQL
 * - Client Prisma fonctionnel
 * - Création/lecture données
 * - Types TypeScript
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../lib/database'

interface TestResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

interface TestSummary {
  infrastructure: TestResult[]
  globalSuccess: boolean
  timestamp: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestSummary>
) {
  const tests: TestResult[] = []

  try {
    // Test 1: Connexion PostgreSQL
    try {
      await db.$connect()
      tests.push({
        success: true,
        message: "✅ Connexion PostgreSQL établie"
      })
    } catch (error) {
      tests.push({
        success: false,
        message: "❌ Erreur connexion PostgreSQL",
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    }

    // Test 2: Lecture tables existantes
    try {
      const userCount = await db.user.count()
      const prospectCount = await db.prospect.count()
      const scrapingJobCount = await db.scrapingJob.count()

      tests.push({
        success: true,
        message: "✅ Tables accessibles",
        data: {
          users: userCount,
          prospects: prospectCount,
          scrapingJobs: scrapingJobCount
        }
      })
    } catch (error) {
      tests.push({
        success: false,
        message: "❌ Erreur lecture tables",
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    }

    // Test 3: Création utilisateur de test
    try {
      const testUser = await db.user.create({
        data: {
          email: `test-${Date.now()}@bmad.com`,
          name: 'Utilisateur Test',
          password: 'test-hash',
          role: 'COMMERCIAL'
        }
      })

      tests.push({
        success: true,
        message: "✅ Création utilisateur réussie",
        data: { userId: testUser.id, email: testUser.email }
      })
    } catch (error) {
      tests.push({
        success: false,
        message: "❌ Erreur création utilisateur",
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    }

    // Test 4: Création prospect de test
    try {
      const testProspect = await db.prospect.create({
        data: {
          companyName: `Entreprise Test ${Date.now()}`,
          fullName: 'Contact Test',
          email: `prospect-${Date.now()}@example.com`,
          phone: '0123456789',
          city: 'Paris',
          website: 'https://test-site.com',
          status: 'PREMIER_APPEL',
          hasWebsiteIssue: true,
          websiteIssueReason: 'Site de test avec problème fictif'
        }
      })

      tests.push({
        success: true,
        message: "✅ Création prospect réussie",
        data: {
          prospectId: testProspect.id,
          company: testProspect.companyName,
          hasWebsiteIssue: testProspect.hasWebsiteIssue
        }
      })
    } catch (error) {
      tests.push({
        success: false,
        message: "❌ Erreur création prospect",
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    }

    // Test 5: Requête avec relations
    try {
      const prospectsWithNotes = await db.prospect.findMany({
        include: {
          notes: true,
          commercialActivities: true
        },
        take: 3
      })

      tests.push({
        success: true,
        message: "✅ Requêtes avec relations fonctionnelles",
        data: {
          prospectsFound: prospectsWithNotes.length,
          withRelations: true
        }
      })
    } catch (error) {
      tests.push({
        success: false,
        message: "❌ Erreur requêtes avec relations",
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    }

  } catch (globalError) {
    tests.push({
      success: false,
      message: "❌ Erreur globale de test",
      error: globalError instanceof Error ? globalError.message : 'Erreur inconnue'
    })
  } finally {
    await db.$disconnect()
  }

  // Calculer le succès global
  const globalSuccess = tests.every(test => test.success)

  const summary: TestSummary = {
    infrastructure: tests,
    globalSuccess,
    timestamp: new Date().toISOString()
  }

  // Statut HTTP selon résultat
  const statusCode = globalSuccess ? 200 : 500

  return res.status(statusCode).json(summary)
}