import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import { requireAuth } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Cloud Run's proxy for correct req.protocol (https)
app.set('trust proxy', true);

app.use(cors());
app.use(express.json());

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client')));
}

// Health check (no auth required)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (no auth required — handles login/callback/logout)
app.use('/api', authRoutes);

// Dashboard API routes (protected by auth)
app.use('/api', requireAuth, dashboardRoutes);

// Serve React app for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../client/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`GA4 Dashboard server running on port ${PORT}`);
});

export default app;
