
import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.js';
const prisma = new PrismaClient();
const router = express.Router();

// CRUD API for comments
router.get('/', authMiddleware, async (req, res) => {
const commentss = await prisma.comments.findMany();
res.json(commentss);
});

router.post('/', authMiddleware, async (req, res) => {
const comments = await prisma.comments.create({
  data: req.body,
});
res.json(comments);
});

router.put('/:id', authMiddleware, async (req, res) => {
const { id } = req.params;
const comments = await prisma.comments.update({
  where: { id: Number(id) },
  data: req.body,
});
res.json(comments);
});

router.delete('/:id', authMiddleware, async (req, res) => {
const { id } = req.params;
const comments = await prisma.comments.delete({
  where: { id: Number(id) },
});
res.json(comments);
});

    export default router;
    