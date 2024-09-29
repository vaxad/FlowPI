
import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.js';
const prisma = new PrismaClient();
const router = express.Router();

// CRUD API for User
router.get('/', authMiddleware, async (req, res) => {
const users = await prisma.user.findMany();
res.json(users);
});

router.post('/', authMiddleware, async (req, res) => {
const user = await prisma.user.create({
  data: req.body,
});
res.json(user);
});

router.put('/:id', authMiddleware, async (req, res) => {
const { id } = req.params;
const user = await prisma.user.update({
  where: { id: Number(id) },
  data: req.body,
});
res.json(user);
});

router.delete('/:id', authMiddleware, async (req, res) => {
const { id } = req.params;
const user = await prisma.user.delete({
  where: { id: Number(id) },
});
res.json(user);
});

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const COOKIE_NAME = 'token';

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      ...req.body,
      email,
      password: hashedPassword
    }
  });

  const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '1d' });

  res.cookie(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

  const { password: _, ...userWithoutPassword } = newUser;
  return res.status(201).json(userWithoutPassword);
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

  res.cookie(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

  const { password: _, ...userWithoutPassword } = user;
  return res.json(userWithoutPassword);
});

router.get('/getMe', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});
export default router;
