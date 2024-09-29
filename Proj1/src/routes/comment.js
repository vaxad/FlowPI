
import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// CRUD API for comment
router.get('/', async (req, res) => {
const comments = await prisma.comment.findMany();
res.json(comments);
});

router.post('/', async (req, res) => {
const comment = await prisma.comment.create({
  data: req.body,
});
res.json(comment);
});

router.put('/:id', async (req, res) => {
const { id } = req.params;
const comment = await prisma.comment.update({
  where: { id: Number(id) },
  data: req.body,
});
res.json(comment);
});

router.delete('/:id', async (req, res) => {
const { id } = req.params;
const comment = await prisma.comment.delete({
  where: { id: Number(id) },
});
res.json(comment);
});

    export default router;
    