const { sql, getPool } = require('../../lib/sqlserver');

const DB_PADRON = process.env.SQLSERVER_DB_PADRON;
const DB_PRM = process.env.SQLSERVER_DB_PRM;

/**
 * Busca una persona en el padron existente por cedula + fecha de nacimiento
 * (verificacion de dos factores, como pide el flujo "Consultate").
 * Basado en la query de referencia de comites2028 (api/consulta.php), que
 * ya se sabe funcional contra este mismo servidor.
 *
 * Devuelve null si no hay match (cedula no existe, o fecha de nacimiento no coincide).
 */
async function buscarPorCedulaYFechaNacimiento(cedula, fechaNacimiento) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('cedula', sql.VarChar(20), cedula)
    .input('fechaNacimiento', sql.Date, fechaNacimiento)
    .query(`
      SELECT
        P.nombres,
        P.apellido1,
        P.apellido2,
        P.Cedula,
        P.FechaNacimiento,
        P.IdSexo,
        Mun.Descripcion AS Municipio,
        Prov.Descripcion AS Provincia,
        Cir.Descripcion AS Circunscripcion,
        Sex.Descripcion AS SexoDescripcion,
        EC.Descripcion AS EstadoCivil,
        Nac.Descripcion AS Nacionalidad
      FROM [${DB_PADRON}].[dbo].[Padron] P
      INNER JOIN [${DB_PADRON}].[dbo].[Municipio] Mun ON P.IdMunicipio = Mun.ID
      LEFT JOIN [${DB_PADRON}].[dbo].[Circunscripcion] Cir ON P.CodigoCircunscripcion = Cir.CodigoCircunscripcion
      LEFT JOIN [${DB_PADRON}].[dbo].[Sexo] Sex ON P.IdSexo = Sex.IdSexo
      LEFT JOIN [${DB_PADRON}].[dbo].[EstadoCivil] EC ON P.IdEstadoCivil = EC.Id
      LEFT JOIN [${DB_PADRON}].[dbo].[Nacionalidad] Nac ON P.IdNacionalidad = Nac.ID
      LEFT JOIN [${DB_PADRON}].[dbo].[Provincia] Prov ON P.IdProvincia = Prov.ID
      WHERE P.Cedula = @cedula
        AND CAST(P.FechaNacimiento AS DATE) = @fechaNacimiento
    `);

  return result.recordset[0] || null;
}

/**
 * Busca solo por cedula (para autocompletar en "Registro basico" / afiliacion asistida,
 * donde quien afilia ya esta validado y no necesita el segundo factor).
 */
async function buscarPorCedula(cedula) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('cedula', sql.VarChar(20), cedula)
    .query(`
      SELECT
        P.nombres,
        P.apellido1,
        P.apellido2,
        P.Cedula,
        P.FechaNacimiento,
        P.IdSexo,
        Mun.Descripcion AS Municipio,
        Prov.Descripcion AS Provincia
      FROM [${DB_PADRON}].[dbo].[Padron] P
      INNER JOIN [${DB_PADRON}].[dbo].[Municipio] Mun ON P.IdMunicipio = Mun.ID
      LEFT JOIN [${DB_PADRON}].[dbo].[Provincia] Prov ON P.IdProvincia = Prov.ID
      WHERE P.Cedula = @cedula
    `);

  return result.recordset[0] || null;
}

/** Catalogo de provincias, para el selector de creacion de comite. */
async function listarProvincias() {
  const pool = await getPool();
  const result = await pool
    .request()
    .query(`SELECT ID, Descripcion FROM [${DB_PADRON}].[dbo].[Provincia] ORDER BY Descripcion`);
  return result.recordset;
}

/**
 * Catalogo de municipios (y distritos municipales) de una provincia, para el
 * selector de creacion de comite. Se incluye DM e IDMunicipioPadre: si
 * IDMunicipioPadre === ID, la fila es un municipio cabecera; si apunta a
 * otro municipio y DM esta marcado, es un distrito municipal de ese municipio.
 */
async function listarMunicipiosPorProvincia(idProvincia) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('idProvincia', sql.Int, idProvincia)
    .query(`
      SELECT ID, Descripcion, IDMunicipioPadre, DM
      FROM [${DB_PADRON}].[dbo].[Municipio]
      WHERE IDProvincia = @idProvincia
      ORDER BY Descripcion
    `);
  return result.recordset;
}

module.exports = {
  buscarPorCedulaYFechaNacimiento,
  buscarPorCedula,
  listarProvincias,
  listarMunicipiosPorProvincia,
};
