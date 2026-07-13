const multer = require('multer');
const env = require('../config/env');

// Memoria, no disco: las fotos se guardan como BLOB en Postgres (ver schema.prisma).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten imagenes'));
    }
    cb(null, true);
  },
});

module.exports = upload;
