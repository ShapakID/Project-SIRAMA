const prisma = require('../db');

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

  return {
    token,
    user: {
      id: user.id,
      nim: user.nim,
      name: user.name,
      role: user.role
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
      return {
        id: user.id,
        nim: user.nim,
        name: user.name,
        role: user.role
      };
    }
  }
  return null;
}

module.exports = {
  loginUser,
  getUserFromToken
};
