import express from 'express';
import v1Router from './routes/v1.route';
import { closeDatabase, initDatabase } from './db/database';
import { pool } from './db/pool';
import { initSchema } from './db/schema';
import { apiOptions } from './middleware/cors';
import { corsHeaders } from './middleware/cors';

const PORT = process.env.PORT || 3000;


async function bootstrap() {
  await initDatabase();
  await pool.init();
  await initSchema();

  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(corsHeaders);
  app.options('/*', apiOptions);
  app.use('/v1', v1Router);

  app.listen(PORT, () => {
    console.log(`Server running on  http://localhost:${PORT}`);
  });
}

async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down...`);
  await pool.close();
  await closeDatabase();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));


bootstrap().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
