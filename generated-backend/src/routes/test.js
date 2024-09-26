
import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// CRUD API for Test
router.get('/', async (req, res) => {
const tests = await prisma.test.findMany();
res.json(tests);
});

router.post('/', async (req, res) => {
const test = await prisma.test.create({
  data: req.body,
});
res.json(test);
});

router.put('/:id', async (req, res) => {
const { id } = req.params;
const test = await prisma.test.update({
  where: { id: Number(id) },
  data: req.body,
});
res.json(test);
});

router.delete('/:id', async (req, res) => {
const { id } = req.params;
const test = await prisma.test.delete({
  where: { id: Number(id) },
});
res.json(test);
});

export default router;
