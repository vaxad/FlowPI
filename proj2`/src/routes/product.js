
import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.js';
const prisma = new PrismaClient();
const router = express.Router();

// CRUD API for product
router.get('/', authMiddleware, async (req, res) => {
const products = await prisma.product.findMany();
res.json(products);
});

router.post('/', authMiddleware, async (req, res) => {
const product = await prisma.product.create({
  data: req.body,
});
res.json(product);
});

router.put('/:id', authMiddleware, async (req, res) => {
const { id } = req.params;
const product = await prisma.product.update({
  where: { id: Number(id) },
  data: req.body,
});
res.json(product);
});

router.delete('/:id', authMiddleware, async (req, res) => {
const { id } = req.params;
const product = await prisma.product.delete({
  where: { id: Number(id) },
});
res.json(product);
});

    export default router;
    