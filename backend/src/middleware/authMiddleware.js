const { getUserFromToken } = require('../services/authService');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Autentikasi dibutuhkan. Harap sertakan Bearer token.' });
    }
    const token = authHeader.slice(7).trim();
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Sesi kedaluwarsa atau token tidak valid.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Gagal memverifikasi autentikasi.' });
  }
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autentikasi dibutuhkan.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Akses ditolak: role ${req.user.role} tidak memiliki izin untuk tindakan ini.`
      });
    }
    next();
  };
}

function requireClassAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Autentikasi dibutuhkan.' });
  }

  // Petugas has universal access
  if (req.user.role === 'PETUGAS') {
    return next();
  }

  // If user is PJ, ensure target course / class belongs to their class
  if (req.user.role === 'PJ') {
    const userClass = req.user.classMeta?.className;
    const courseName = req.body?.courseName || '';
    const targetClass = req.body?.className || '';

    if (userClass) {
      const matchInCourse = courseName.toLowerCase().includes(userClass.toLowerCase());
      const matchInClass = targetClass && targetClass.toLowerCase().includes(userClass.toLowerCase());
      if (!matchInCourse && !matchInClass) {
        return res.status(403).json({
          error: `Wewenang ditolak: Anda hanya berhak memodifikasi jadwal kelas ${userClass}.`
        });
      }
    }
    return next();
  }

  return res.status(403).json({ error: 'Akses ditolak.' });
}

module.exports = {
  requireAuth,
  requireRole,
  requireClassAccess
};
