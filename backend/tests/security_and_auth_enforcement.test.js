const assert = require('assert');
const { generateToken, verifyToken } = require('../src/services/authService');
const { requireAuth, requireRole, requireClassAccess } = require('../src/middleware/authMiddleware');

async function runSecurityTests() {
  console.log('Testing Security & RBAC Enforcement...');

  // 1. Token Signature and Anti-Forgery Verification
  const userPJ = {
    id: 'user-pj-123',
    nim: 'F5212510018',
    name: 'Shafairunizar',
    role: 'PJ'
  };
  const classMeta = { className: 'SI-A 2025', semester: 3 };
  const validToken = generateToken(userPJ, classMeta);

  assert.ok(validToken.split('.').length === 3, 'Token must follow standard 3-part header.payload.sig format');

  const decoded = verifyToken(validToken);
  assert.ok(decoded, 'Valid signed token must verify successfully');
  assert.strictEqual(decoded.nim, 'F5212510018');
  assert.strictEqual(decoded.role, 'PJ');
  assert.strictEqual(decoded.className, 'SI-A 2025');

  // Tampering attack: modify role in payload
  const parts = validToken.split('.');
  const fakePayload = Buffer.from(JSON.stringify({ ...decoded, role: 'PETUGAS' })).toString('base64url');
  const tamperedToken = `${parts[0]}.${fakePayload}.${parts[2]}`;
  const tamperedResult = verifyToken(tamperedToken);
  assert.strictEqual(tamperedResult, null, 'Tampered token must be rejected with null');

  // Pseudo-token rejection: old deterministic unsigned string
  const legacyPseudo = 'token_user-pj-123_PETUGAS';
  const pseudoResult = verifyToken(legacyPseudo);
  assert.strictEqual(pseudoResult, null, 'Unsigned pseudo token must fail cryptographic verification');

  // 2. Middleware requireAuth
  let unauthStatus = null;
  let unauthBody = null;
  const mockResUnauth = {
    status(code) { unauthStatus = code; return this; },
    json(body) { unauthBody = body; return this; }
  };
  const mockReqNoAuth = { headers: {} };
  await requireAuth(mockReqNoAuth, mockResUnauth, () => {});
  assert.strictEqual(unauthStatus, 401, 'Request without Authorization header must return 401');

  // 3. Middleware requireRole
  let forbiddenStatus = null;
  const mockResForbidden = {
    status(code) { forbiddenStatus = code; return this; },
    json(body) { return this; }
  };
  const mockReqPJ = { user: { role: 'PJ', nim: 'F5212510018' } };
  const petugasOnlyGuard = requireRole(['PETUGAS']);
  petugasOnlyGuard(mockReqPJ, mockResForbidden, () => {});
  assert.strictEqual(forbiddenStatus, 403, 'PJ accessing Petugas-only route must return 403');

  // 4. Server-Side IDOR & Class Access Control (requireClassAccess)
  let classDeniedStatus = null;
  const mockResClassDenied = {
    status(code) { classDeniedStatus = code; return this; },
    json(body) { return this; }
  };
  const mockReqSpoofedPJ = {
    user: {
      role: 'PJ',
      nim: 'F5212510018',
      classMeta: { className: 'SI-A 2025' }
    },
    body: {
      courseName: 'Basis Data Lanjut (SI-B 2025)'
    }
  };
  requireClassAccess(mockReqSpoofedPJ, mockResClassDenied, () => {});
  assert.strictEqual(classDeniedStatus, 403, 'PJ SI-A modifying SI-B class must be rejected with 403');

  // PJ modifying own class must succeed
  let ownClassAllowed = false;
  const mockReqOwnPJ = {
    user: {
      role: 'PJ',
      nim: 'F5212510018',
      classMeta: { className: 'SI-A 2025' }
    },
    body: {
      courseName: 'Kecerdasan Artifisial (SI-A 2025)'
    }
  };
  requireClassAccess(mockReqOwnPJ, mockResClassDenied, () => { ownClassAllowed = true; });
  assert.strictEqual(ownClassAllowed, true, 'PJ modifying their own registered class must be allowed');

  console.log('All Security & RBAC Enforcement tests PASSED successfully!');
}

runSecurityTests().catch(err => {
  console.error('Security test failed:', err);
  process.exit(1);
});
