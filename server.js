const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const auth = require('basic-auth');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 4000;

// Security: Basic Auth (Protect the CRM if hosted publicly)
const USER = process.env.BASIC_AUTH_USER;
const PASS = process.env.BASIC_AUTH_PASS;

if (USER && PASS) {
  app.use((req, res, next) => {
    // Allow webhooks to bypass auth so Meta/WeChat can reach them
    if (req.path.startsWith('/webhooks/')) return next();

    const user = auth(req);
    if (!user || user.name !== USER || user.pass !== PASS) {
      res.set('WWW-Authenticate', 'Basic realm="GlobalReach CRM"');
      return res.status(401).send('Access denied.');
    }
    next();
  });
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for simplicity with inline scripts/styles in dev
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Assets
app.use(express.static(path.join(__dirname, 'build')));

// --- WEBHOOKS (Production) ---
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || 'globalreach_secret_token';

// 1. WhatsApp Verification
app.get('/webhooks/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === WEBHOOK_TOKEN) {
      console.log('WhatsApp Webhook Verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// 2. WhatsApp Incoming
app.post('/webhooks/whatsapp', (req, res) => {
  console.log('WhatsApp Payload Received');
  // In a real hosted app with a DB, you would save this message to the database here.
  // Since this is a static-file backed React app, real-time updates via Webhook 
  // require WebSockets (Socket.io) which adds complexity.
  // For now, we log it.
  res.sendStatus(200);
});

// 3. WeChat Verification
app.get('/webhooks/wechat', (req, res) => {
  const signature = req.query.signature;
  const timestamp = req.query.timestamp;
  const nonce = req.query.nonce;
  const echostr = req.query.echostr;

  if (!signature || !timestamp || !nonce) return res.sendStatus(400);

  const tmpStr = [WEBHOOK_TOKEN, timestamp, nonce].sort().join('');
  const sha1 = crypto.createHash('sha1').update(tmpStr).digest('hex');

  if (sha1 === signature) {
    console.log('WeChat Webhook Verified');
    res.send(echostr);
  } else {
    res.sendStatus(403);
  }
});

// 4. WeChat Incoming
app.post('/webhooks/wechat', (req, res) => {
  console.log('WeChat Payload Received');
  res.sendStatus(200);
});

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
});