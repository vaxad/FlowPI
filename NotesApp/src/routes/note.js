
import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.js';
const prisma = new PrismaClient();
const router = express.Router();

// CRUD API for note
router.get('/', async (req, res) => {
const notes = await prisma.note.findMany();
res.json(notes);
});

router.post('/', async (req, res) => {
const note = await prisma.note.create({
  data: req.body,
});
res.json(note);
});

router.put('/:id', async (req, res) => {
const { id } = req.params;
const note = await prisma.note.update({
  where: { id: Number(id) },
  data: req.body,
});
res.json(note);
});

router.delete('/:id', async (req, res) => {
const { id } = req.params;
const note = await prisma.note.delete({
  where: { id: Number(id) },
});
res.json(note);
});

    export default router;
    