// Test script: logs in as a user (email and password read from env or defaults) and attempts to delete a pet id (from env or CLI arg)
// Usage: node scripts/test_delete_pet.js <petId>

const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const API = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}/api`;
const EMAIL = process.env.TEST_USER_EMAIL || 'admin@petshare.com';
const PASSWORD = process.env.TEST_USER_PASSWORD || 'admin123';

async function main() {
  const petId = process.argv[2];
  if (!petId) { console.error('Usage: node scripts/test_delete_pet.js <petId>'); process.exit(1); }

  try {
    const loginRes = await axios.post(`${API}/auth/login`, { email: EMAIL, password: PASSWORD });
    const token = loginRes.data.token;
    console.log('Logged in, token length:', token.length);

    const delRes = await axios.delete(`${API}/pets/${petId}`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Delete response:', delRes.status, delRes.data);
  } catch (err) {
    if (err.response) {
      console.error('Request failed:', err.response.status, err.response.data);
    } else {
      console.error('Request error:', err.message);
    }
    process.exit(1);
  }
}

main();
