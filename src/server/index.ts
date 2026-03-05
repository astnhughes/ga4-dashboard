import express from 'express';
import cors from 'cors';
import path from 'path';
import dashboardRoutes from './routes/dashboard';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client')));
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dashboard API routes
app.use('/api', dashboardRoutes);

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
