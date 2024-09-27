
import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// CRUD API for test3
router.get('/', async (req, res) => {
const test3s = await prisma.test3.findMany();
res.json(test3s);
});

router.post('/', async (req, res) => {
const test3 = await prisma.test3.create({
  data: req.body,
});
res.json(test3);
});

router.put('/:id', async (req, res) => {
const { id } = req.params;
const test3 = await prisma.test3.update({
  where: { id: Number(id) },
  data: req.body,
});
res.json(test3);
});

router.delete('/:id', async (req, res) => {
const { id } = req.params;
const test3 = await prisma.test3.delete({
  where: { id: Number(id) },
});
res.json(test3);
});

    export default router;
    