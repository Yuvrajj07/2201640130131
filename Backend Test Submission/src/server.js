import express from 'express';
import dotenv from 'dotenv';
import router from './routes.js';
import { attachLogger } from './logger.js';
import { errorHandler } from './errors.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '25kb' }));

app.use(attachLogger);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/', router);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOSTNAME || 'http://localhost';

app.listen(PORT, () => {
  const logDir = path.resolve(process.cwd(), 'logs');
  const logFile = path.join(logDir, 'application.log');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  const initLog = JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    msg: 'server_started',
    host: `${HOST}:${PORT}`
  });

  fs.appendFileSync(logFile, initLog + '\n');
});
