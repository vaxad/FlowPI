
import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// CRUD API for Test2
router.get('/', async (req, res) => {
const test2s = await prisma.test2.findMany();
res.json(test2s);
});

router.post('/', async (req, res) => {
const test2 = await prisma.test2.create({
  data: req.body,
});
res.json(test2);
});

router.put('/:id', async (req, res) => {
const { id } = req.params;
const test2 = await prisma.test2.update({
  where: { id: Number(id) },
  data: req.body,
});
res.json(test2);
});

router.delete('/:id', async (req, res) => {
const { id } = req.params;
const test2 = await prisma.test2.delete({
  where: { id: Number(id) },
});
res.json(test2);
});

export default router;
