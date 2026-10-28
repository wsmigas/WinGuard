import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { agentRouter } from './server/routes/agent.ts';
import { dashboardRouter } from './server/routes/dashboard.ts';
import { downloadsRouter } from './server/routes/downloads.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS headers for local network Windows clients
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Mount API routers
  app.use('/api/agent', agentRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/download', downloadsRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'WinGuard Parental Control Server',
      environment: isProd ? 'production' : 'development',
      time: new Date().toISOString()
    });
  });

  if (!isProd) {
    // In development, mount Vite dev server as middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve built frontend
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[WinGuard Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[WinGuard Server] Failed to start:', err);
  process.exit(1);
});
