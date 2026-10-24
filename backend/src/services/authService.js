const prisma = require('../db');
const { parseNimMetadata } = require('../utils/timeUtils');

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

  const token = `token_${user.id}_${user.role}`;
  const classMeta = user.role === 'PJ' ? parseNimMetadata(user.nim) : null;

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
  getUserFromToken
};
