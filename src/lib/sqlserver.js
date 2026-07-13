const sql = require('mssql');

const config = {
  server: process.env.SQLSERVER_HOST,
  port: parseInt(process.env.SQLSERVER_PORT || '1433', 10),
  user: process.env.SQLSERVER_USER,
  password: process.env.SQLSERVER_PASSWORD,
  // La conexion se abre contra la BD principal (SQLSERVER_DB_PRM); la BD de
  // padron (SQLSERVER_DB_PADRON) se referencia dentro de las queries con
  // nombre de 3 partes (cross-database query), igual que hace el sistema
  // de referencia comites2028.
  database: process.env.SQLSERVER_DB_PRM,
  options: {
    encrypt: process.env.SQLSERVER_ENCRYPT === 'true',
    trustServerCertificate: process.env.SQLSERVER_TRUST_SERVER_CERTIFICATE === 'true',
  },
};

let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect();
  }
  return poolPromise;
}

module.exports = { sql, getPool };
