#!/usr/bin/env node

const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const os = require('os');

const ROOT = path.resolve(__dirname);
const AUTH_FILE = path.join(ROOT, 'deepseek-auth.json');
const KEY_FILE = path.join(ROOT, 'proxy-api-key.txt');
const PORT = process.env.PORT || 9655;
const HOST = process.env.HOST || '127.0.0.1';

function genKey() {
  return crypto.randomBytes(32).toString('hex');
}

function readKey() {
  try { return fs.readFileSync(KEY_FILE, 'utf8').trim(); } catch { return null; }
}

function ensureKey() {
  let key = readKey();
  if (!key) { key = genKey(); fs.writeFileSync(KEY_FILE, key + '\n'); }
  return key;
}

function hasAuth() {
  try {
    const data = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
    return !!(data.token && data.cookie);
  } catch { return false; }
}

function runAuth() {
  const script = path.join(__dirname, 'scripts', 'deepseek_chrome_auth.js');
  if (!fs.existsSync(script)) {
    console.error('[launcher] Auth script not found:', script);
    process.exit(1);
  }
  const result = cp.spawnSync(process.execPath, [script], { stdio: 'inherit', env: process.env });
  if (result.status !== 0) {
    console.error('[launcher] Auth failed (exit code ' + result.status + ')');
    process.exit(result.status || 1);
  }
}

function waitForHealth(timeoutMs, intervalMs) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const req = http.get('http://' + HOST + ':' + PORT + '/health', (res) => {
        res.resume();
        if (res.statusCode === 200) resolve();
        else retry();
      });
      req.on('error', retry);
      req.setTimeout(2000, () => { req.destroy(); retry(); });
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) reject(new Error('Health check timeout'));
      else setTimeout(check, intervalMs);
    };
    check();
  });
}

function fetchModels() {
  return new Promise((resolve) => {
    const req = http.get('http://' + HOST + ':' + PORT + '/v1/models', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(3000, () => { req.destroy(); resolve(null); });
  });
}

function startServer(key) {
  const env = {
    ...process.env,
    PROXY_API_KEY: key,
    HOST: HOST,
    PORT: String(PORT),
    NON_INTERACTIVE: '1',
    DEEPSEEK_AUTH_PATH: AUTH_FILE,
  };
  const child = cp.spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: env,
    stdio: 'inherit',
    detached: true,
  });
  child.unref();
  return child;
}

function printSummary(key) {
  const base = 'http://' + HOST + ':' + PORT;
  const red = (s) => s;
  console.log('\n' + '='.repeat(60));
  console.log('  FreeDeepseekAPI — READY');
  console.log('='.repeat(60));
  console.log('  Base URL:        ' + base);
  console.log('  Proxy API Key:   ' + key);
  console.log('  Auth file:       ' + AUTH_FILE);
  console.log('  Models:          ' + base + '/v1/models');
  console.log('  Chat completions: ' + base + '/v1/chat/completions');
  console.log('  Anthropic shim:   ' + base + '/v1/messages');
  console.log('  Responses shim:   ' + base + '/v1/responses');
  console.log('  Sessions:         ' + base + '/v1/sessions');
  console.log('='.repeat(60));
  console.log('\nCURL EXAMPLE:');
  console.log('  curl ' + base + '/v1/chat/completions \\');
  console.log('    -H "Authorization: Bearer ' + key + '" \\');
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"model":"deepseek-chat","messages":[{"role":"user","content":"Hello"}]}\'');
  console.log('\nOPENAI SDK (Python):');
  console.log('  from openai import OpenAI');
  console.log('  client = OpenAI(base_url="' + base + '/v1", api_key="' + key + '")');
  console.log('  resp = client.chat.completions.create(');
  console.log('    model="deepseek-chat",');
  console.log('    messages=[{"role":"user","content":"Hello"}]');
  console.log('  )');
  console.log('\nOPENAI SDK (Node.js):');
  console.log('  import OpenAI from "openai";');
  console.log('  const client = new OpenAI({ baseURL: "' + base + '/v1", apiKey: "' + key + '" });');
  console.log('  const resp = await client.chat.completions.create({');
  console.log('    model: "deepseek-chat",');
  console.log('    messages: [{ role: "user", content: "Hello" }]');
  console.log('  });');
  console.log('\nOPCODE / AGENTS (opencode.json):');
  console.log('  {');
  console.log('    "baseUrl": "' + base + '",');
  console.log('    "apiKey": "' + key + '",');
  console.log('    "models": ["deepseek-chat", "deepseek-reasoner"]');
  console.log('  }');
  console.log('\nDASHBOARD: ' + base + '/dashboard.html');
  console.log('='.repeat(60) + '\n');
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'full';

  if (cmd === 'help' || cmd === '-h' || cmd === '--help') {
    console.log('Usage: node launcher.js [command]');
    console.log('  auth     - Open Chrome and capture DeepSeek auth (deepseek-auth.json)');
    console.log('  start    - Start the API server (uses existing auth & key)');
    console.log('  full     - auth + start + print summary (default)');
    console.log('  key      - Generate or show proxy API key');
    console.log('  status   - Show current auth/key status');
    process.exit(0);
  }

  if (cmd === 'key') {
    const key = ensureKey();
    console.log('Proxy API Key:', key);
    console.log('Saved to:', KEY_FILE);
    process.exit(0);
  }

  if (cmd === 'status') {
    console.log('Auth file:', AUTH_FILE, hasAuth() ? '[OK]' : '[MISSING]');
    console.log('Key file:', KEY_FILE, readKey() ? '[OK]' : '[MISSING]');
    process.exit(0);
  }

  if (cmd === 'auth') {
    runAuth();
    process.exit(0);
  }

  if (cmd === 'start') {
    const key = ensureKey();
    if (!hasAuth()) {
      console.error('[launcher] No valid auth found. Run: node launcher.js auth');
      process.exit(1);
    }
    console.log('[launcher] Starting server...');
    startServer(key);
    console.log('[launcher] Waiting for /health...');
    try {
      await waitForHealth(30000, 500);
      printSummary(key);
    } catch (e) {
      console.error('[launcher] Server not ready:', e.message);
      process.exit(1);
    }
    process.exit(0);
  }

  if (cmd === 'full') {
    if (!hasAuth()) {
      console.log('[launcher] No auth found. Running auth flow...');
      runAuth();
      if (!hasAuth()) {
        console.error('[launcher] Auth failed. Check browser login.');
        process.exit(1);
      }
    } else {
      console.log('[launcher] Auth already present.');
    }
    const key = ensureKey();
    console.log('[launcher] Starting server...');
    startServer(key);
    console.log('[launcher] Waiting for /health...');
    try {
      await waitForHealth(30000, 500);
      const models = await fetchModels();
      printSummary(key);
    } catch (e) {
      console.error('[launcher] Server not ready:', e.message);
      process.exit(1);
    }
    process.exit(0);
  }

  console.error('[launcher] Unknown command:', cmd);
  console.error('Use: auth | start | full | key | status | help');
  process.exit(1);
}

main().catch(e => {
  console.error('[launcher]', e);
  process.exit(1);
});
