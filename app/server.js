import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fs from 'fs';
import { promisify } from 'util';

dotenv.config();

const app = express();
app.use(express.json());

// Access logs to stdout (picked by journald/filebeat)
app.use(morgan('combined'));

const SERVICE = process.env.SERVICE_NAME || 'porttrack-api';
const ENV = process.env.ENV || process.env.NODE_ENV || 'dev';
const PORT = process.env.PORT || 3000;

// In-memory "DB" (for demo)
let ships = [
  { id: 1, name: 'Andromeda', status: 'docked', cargo: 'containers', eta: null },
  { id: 2, name: 'Aurora', status: 'arriving', cargo: 'grain', eta: '2025-08-25T10:00:00Z' },
];

// Simple JSON logger helper
function jlog(level, msg, extra={}) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    service: SERVICE,
    env: ENV,
    msg,
    ...extra
  });
  console.log(line);
}

// Health endpoint used by CodeDeploy ValidateService hook
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Basic API
app.get('/ships', (req, res) => {
  jlog('info', 'list ships', { count: ships.length });
  res.json({ ships });
});

app.post('/ships', (req, res) => {
  const { name, status='docked', cargo=null, eta=null } = req.body||{};
  if (!name) return res.status(400).json({error:'name required'});
  const id = ships.length ? Math.max(...ships.map(s=>s.id))+1 : 1;
  const ship = { id, name, status, cargo, eta };
  ships.push(ship);
  jlog('info', 'ship created', { id, name });
  res.status(201).json(ship);
});

// Endpoint to simulate errors for alarms/tests
app.get('/error', (req, res) => {
  jlog('error', 'simulated error endpoint hit');
  res.status(500).json({ error: 'simulated failure' });
});

// Optional: read a secret from AWS Secrets Manager (if ARN provided)
async function maybeReadSecret() {
  const arn = process.env.DB_SECRET_ARN;
  if (!arn) {
    jlog('info', 'DB_SECRET_ARN not set, skipping Secrets Manager');
    return;
  }
  try {
    const AWS = await import('aws-sdk');
    const sm = new AWS.SecretsManager({ region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION });
    const data = await sm.getSecretValue({ SecretId: arn }).promise();
    const secretString = data.SecretString || (data.SecretBinary && Buffer.from(data.SecretBinary, 'base64').toString('utf-8')) || '{}';
    const secret = JSON.parse(secretString);
    // We only log keys (not values) to avoid leaking secrets
    jlog('info', 'Loaded secret from Secrets Manager', { keys: Object.keys(secret) });
  } catch (e) {
    jlog('error', 'Failed to load secret', { error: e.message || String(e) });
  }
}

app.get('/', (req, res) => res.json({ service: SERVICE, env: ENV }));

app.listen(PORT, async () => {
  await maybeReadSecret();
  jlog('info', `Server listening on ${PORT}`);
});
