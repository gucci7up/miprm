const { Pool } = require('pg');

// Pool dedicado para connect-pg-simple (session store). Prisma tiene su
// propia conexion separada (ver src/lib/prisma.js) para todo lo demas.
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pgPool;
