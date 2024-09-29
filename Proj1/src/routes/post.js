
import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// CRUD API for post
router.get('/', async (req, res) => {
const posts = await prisma.post.findMany();
res.json(posts);
});

router.post('/', async (req, res) => {
const post = await prisma.post.create({
  data: req.body,
});
res.json(post);
});

router.put('/:id', async (req, res) => {
const { id } = req.params;
const post = await prisma.post.update({
  where: { id: Number(id) },
  data: req.body,
});
res.json(post);
});

router.delete('/:id', async (req, res) => {
const { id } = req.params;
const post = await prisma.post.delete({
  where: { id: Number(id) },
});
res.json(post);
});

    export default router;
    