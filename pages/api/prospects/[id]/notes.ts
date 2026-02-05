import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, error: { message: 'ID missing' } })
    }

    if (req.method === 'POST') {
        try {
            const { content } = req.body

            if (!content) {
                return res.status(400).json({ success: false, error: { message: 'Content is required' } })
            }

            // TODO: Get real user ID from session
            const systemUser = await prisma.user.findUnique({ where: { email: 'system@bmad.crm' } })
            const userId = systemUser?.id || (await prisma.user.findFirst())?.id

            if (!userId) {
                return res.status(500).json({ success: false, error: { message: 'No system user found' } })
            }

            // Singleton: Check if note exists
            const existingNote = await prisma.note.findFirst({
                where: { prospectId: id }
            })

            let note;
            if (existingNote) {
                // Update
                note = await prisma.note.update({
                    where: { id: existingNote.id },
                    data: { content }
                })
            } else {
                // Create
                note = await prisma.note.create({
                    data: {
                        content,
                        prospectId: id,
                        createdBy: userId
                    }
                })
            }

            // Log activity
            await prisma.commercialActivity.create({
                data: {
                    prospectId: id,
                    action: 'NOTE_ADDED',
                    notes: `${existingNote ? 'Note modifiée' : 'Note ajoutée'}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                    userId: userId
                }
            })

            return res.status(200).json({ success: true, data: note })
        } catch (error) {
            console.error('Error creating note:', error)
            return res.status(500).json({ success: false, error: { message: 'Internal Server Error' } })
        }
    }

    if (req.method === 'DELETE') {
        try {
            // Singleton: Check if note exists
            const existingNote = await prisma.note.findFirst({
                where: { prospectId: id }
            })

            if (!existingNote) {
                return res.status(404).json({ success: false, error: { message: 'Note not found' } })
            }

            await prisma.note.delete({
                where: { id: existingNote.id }
            })

            return res.status(200).json({ success: true, data: { deleted: true } })

        } catch (error) {
            console.error('Error deleting note:', error)
            return res.status(500).json({ success: false, error: { message: 'Failed to delete note' } })
        }
    }

    return res.status(405).json({ success: false, error: { message: 'Method not allowed' } })
}
