import { PrismaClient } from '@prisma/client'

// Instance globale Prisma pour éviter les reconnexions multiples
declare global {
  var __prisma: PrismaClient | undefined
}

// Configuration de la base de données
const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  // Fallback pour développement local
  return "postgresql://user:password@localhost:5432/bmadcrm?schema=public"
}

// Créer l'instance Prisma
const createPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl()
      }
    }
  })
}

// Singleton pattern pour éviter les reconnexions multiples en dev
export const db = globalThis.__prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = db
}