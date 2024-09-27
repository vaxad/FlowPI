
import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// CRUD API for test1
router.get('/', async (req, res) => {
const test1s = await prisma.test1.findMany();
res.json(test1s);
});

router.post('/', async (req, res) => {
const test1 = await prisma.test1.create({
  data: req.body,
});
res.json(test1);
});

router.put('/:id', async (req, res) => {
const { id } = req.params;
const test1 = await prisma.test1.update({
  where: { id: Number(id) },
  data: req.body,
});
res.json(test1);
});

router.delete('/:id', async (req, res) => {
const { id } = req.params;
const test1 = await prisma.test1.delete({
  where: { id: Number(id) },
});
res.json(test1);
});

    export default router;
    