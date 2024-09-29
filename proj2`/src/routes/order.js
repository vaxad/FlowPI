
import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.js';
const prisma = new PrismaClient();
const router = express.Router();

// CRUD API for order
router.get('/', authMiddleware, async (req, res) => {
const orders = await prisma.order.findMany();
res.json(orders);
});

router.post('/', authMiddleware, async (req, res) => {
const order = await prisma.order.create({
  data: req.body,
});
res.json(order);
});

router.put('/:id', authMiddleware, async (req, res) => {
const { id } = req.params;
const order = await prisma.order.update({
  where: { id: Number(id) },
  data: req.body,
});
res.json(order);
});

router.delete('/:id', authMiddleware, async (req, res) => {
const { id } = req.params;
const order = await prisma.order.delete({
  where: { id: Number(id) },
});
res.json(order);
});

    export default router;
    