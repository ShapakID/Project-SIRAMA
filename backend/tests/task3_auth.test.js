const assert = require('assert');
const { loginUser } = require('../src/services/authService');

async function testAuth() {
  const result = await loginUser('F5212510018', 'password123');
  assert(result.user.nim === 'F5212510018', 'Should login PJ Shafairunizar');
  assert(result.user.role === 'PJ', 'User should have role PJ');
  assert(typeof result.token === 'string', 'Should return token');
  console.log('Task 3 Auth test passed.');
}

testAuth().catch(err => {
  console.error(err);
  process.exit(1);
});
