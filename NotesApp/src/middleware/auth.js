
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const COOKIE_NAME = 'token';

// Middleware to check authentication based on JWT token in cookies
const authMiddleware = async (req, res, next) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user data to request object
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export default authMiddleware;
    