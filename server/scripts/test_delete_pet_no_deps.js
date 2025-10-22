// Test delete without external deps. Usage: node scripts/test_delete_pet_no_deps.js <petId>
const https = require('https');
const http = require('http');
const url = require('url');
const querystring = require('querystring');
const dotenv = require('dotenv');
dotenv.config();

const API_BASE = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}/api`;
const EMAIL = process.env.TEST_USER_EMAIL || 'admin@petshare.com';
const PASSWORD = process.env.TEST_USER_PASSWORD || 'admin123';

function request(options, body) {
  return new Promise((resolve, reject) => {
    const parsed = url.parse(options.url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request({
      method: options.method || 'GET',
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.path,
      headers: options.headers || {},
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        let json = null;
        try { json = JSON.parse(text); } catch (e) { json = text; }
        resolve({ status: res.statusCode, body: json });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  const petId = process.argv[2];
  if (!petId) { console.error('Usage: node scripts/test_delete_pet_no_deps.js <petId>'); process.exit(1); }

  // Login
  const loginUrl = `${API_BASE}/auth/login`;
  const loginBody = JSON.stringify({ email: EMAIL, password: PASSWORD });
  const loginRes = await request({ url: loginUrl, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) } }, loginBody);
  if (loginRes.status !== 200) { console.error('Login failed', loginRes); process.exit(1); }
  const token = loginRes.body.token;
  console.log('Logged in; token length', token.length);

  const delUrl = `${API_BASE}/pets/${petId}`;
  const delRes = await request({ url: delUrl, method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
  console.log('Delete result:', delRes.status, delRes.body);
}

main().catch(err => { console.error('Test failed', err && err.message ? err.message : err); process.exit(1); });
