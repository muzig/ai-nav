import express from 'express';
import cors from 'cors';
import bookmarksRouter from './routes/bookmarks.js';
import categoriesRouter from './routes/categories.js';
import aiRouter from './routes/ai.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/bookmarks', bookmarksRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/ai', aiRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Nav server running on http://localhost:${PORT}`);
});
