const crypto = require('crypto');
const prisma = require('../db');
const { parseNimMetadata } = require('../utils/timeUtils');

const JWT_SECRET = process.env.JWT_SECRET || 'sirama-secret-salt-untad-2026-siga';

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

function generateToken(user, classMeta) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    id: user.id,
    nim: user.nim,
    name: user.name,
    role: user.role,
    className: classMeta?.className || null,
    iat: now,
    exp: now + (24 * 3600) // 24 hours
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length === 3) {
    const [headerB64, payloadB64, signatureB64] = parts;
    const data = `${headerB64}.${payloadB64}`;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(data)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signatureB64.length !== expectedSig.length) {
      return null;
    }
    if (!crypto.timingSafeEqual(Buffer.from(signatureB64), Buffer.from(expectedSig))) {
      return null;
    }

    try {
      const payload = JSON.parse(base64UrlDecode(payloadB64));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  return null;
}

async function loginUser(nim, password) {
  if (!nim) {
    throw new Error('NIM or username is required');
  }

  const user = await prisma.user.findUnique({
    where: { nim }
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!password || user.password !== password) {
    throw new Error('Invalid credentials');
  }

  const classMeta = user.role === 'PJ' ? parseNimMetadata(user.nim) : null;
  const token = generateToken(user, classMeta);

  return {
    token,
    user: {
      id: user.id,
      nim: user.nim,
      name: user.name,
      role: user.role,
      classMeta
    }
  };
}

async function getUserFromToken(token) {
  if (!token) return null;

  // 1. Try verify standard HMAC-SHA256 JWT
  const payload = verifyToken(token);
  if (payload) {
    const classMeta = payload.role === 'PJ' ? parseNimMetadata(payload.nim) : null;
    return {
      id: payload.id,
      nim: payload.nim,
      name: payload.name,
      role: payload.role,
      classMeta
    };
  }

  // 2. Legacy token fallback during transition (token_<id>_<role>)
  const parts = token.split('_');
  if (parts.length >= 2) {
    const userId = parts[1];
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (user) {
      const classMeta = user.role === 'PJ' ? parseNimMetadata(user.nim) : null;
      return {
        id: user.id,
        nim: user.nim,
        name: user.name,
        role: user.role,
        classMeta
      };
    }
  }

  return null;
}

module.exports = {
  loginUser,
  getUserFromToken,
  generateToken,
  verifyToken
};
