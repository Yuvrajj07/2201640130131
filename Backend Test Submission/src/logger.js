import fs from 'fs';
import path from 'path';

const DIRECTORY = path.join(process.cwd(), 'logs');
const FILE = path.join(DIRECTORY, 'application.log');

function prepareLogFile() {
  if (!fs.existsSync(DIRECTORY)) fs.mkdirSync(DIRECTORY, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '');
}

function writeLog(line) {
  prepareLogFile();
  fs.appendFile(FILE, `${line}\n`, () => {});
}

function formatLog(data) {
  return JSON.stringify({ timestamp: new Date().toISOString(), ...data });
}

export function attachLogger(req, res, next) {
  const startTime = Date.now();

  req.log = {
    info: (msg, meta = {}) => writeLog(formatLog({ level: 'INFO', msg, ...meta })),
    warn: (msg, meta = {}) => writeLog(formatLog({ level: 'WARN', msg, ...meta })),
    error: (msg, meta = {}) => writeLog(formatLog({ level: 'ERROR', msg, ...meta })),
  };

  req.log.info('request_received', {
    method: req.method,
    path: req.originalUrl,
    clientIp: req.ip
  });

  res.on('finish', () => {
    req.log.info('response_sent', {
      status: res.statusCode,
      duration: Date.now() - startTime
    });
  });

  next();
}
