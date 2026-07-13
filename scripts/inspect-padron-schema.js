/**
 * Script de diagnostico: inspecciona el esquema real de la BD de padron
 * (columnas de Padron + tablas de division territorial + relaciones).
 * No modifica datos, solo lee metadatos.
 *
 * Uso: correr donde haya red hacia el SQL Server (ej. terminal de Dokploy,
 * o cualquier entorno con las variables SQLSERVER_* configuradas en .env):
 *
 *   node scripts/inspect-padron-schema.js
 *
 * Pega la salida completa para continuar con el diseno de tablas nuevas.
 */
require('dotenv').config();
const { sql, getPool } = require('../src/lib/sqlserver');

const DB_PADRON = process.env.SQLSERVER_DB_PADRON;

async function main() {
  const pool = await getPool();

  console.log('\n=== 1) Columnas de Padron ===');
  const padronCols = await pool.request().query(`
    USE [${DB_PADRON}];
    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, ORDINAL_POSITION
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Padron'
    ORDER BY ORDINAL_POSITION;
  `);
  console.table(padronCols.recordset);

  console.log('\n=== 2) Columnas de tablas de division territorial / catalogos ===');
  const catalogCols = await pool.request().query(`
    USE [${DB_PADRON}];
    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, ORDINAL_POSITION
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME IN ('Sexo','EstadoCivil','Nacionalidad','Ocupacion','Provincia','Recinto',
                          'Zona','CiudadSeccion','Circunscripcion','Municipio','Colegio',
                          'DistritoMunicipal','Distrito_Municipal')
    ORDER BY TABLE_NAME, ORDINAL_POSITION;
  `);
  console.table(catalogCols.recordset);

  console.log('\n=== 3) Foreign keys definidas desde Padron ===');
  const fks = await pool.request().query(`
    USE [${DB_PADRON}];
    SELECT fk.name AS ForeignKey, tp.name AS TablaOrigen, cp.name AS ColumnaOrigen,
           tr.name AS TablaReferenciada, cr.name AS ColumnaReferenciada
    FROM sys.foreign_keys fk
    INNER JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
    INNER JOIN sys.tables tp ON tp.object_id = fkc.parent_object_id
    INNER JOIN sys.columns cp ON cp.object_id = tp.object_id AND cp.column_id = fkc.parent_column_id
    INNER JOIN sys.tables tr ON tr.object_id = fkc.referenced_object_id
    INNER JOIN sys.columns cr ON cr.object_id = tr.object_id AND cr.column_id = fkc.referenced_column_id
    WHERE tp.name = 'Padron'
    ORDER BY tr.name;
  `);
  console.table(fks.recordset);

  console.log('\n=== 4) Muestra de Municipio (para ver si distingue distrito municipal) ===');
  const municipioSample = await pool.request().query(`
    USE [${DB_PADRON}];
    SELECT TOP 5 * FROM Municipio;
  `);
  console.table(municipioSample.recordset);

  console.log('\n=== 5) Conteo total de registros en Padron ===');
  const count = await pool.request().query(`
    USE [${DB_PADRON}];
    SELECT COUNT(*) AS TotalPadron FROM Padron;
  `);
  console.table(count.recordset);

  await sql.close();
}

main().catch((err) => {
  console.error('Error al inspeccionar el esquema:', err.message);
  process.exit(1);
});
