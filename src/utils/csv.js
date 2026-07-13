function escaparCampoCsv(valor) {
  if (valor === null || valor === undefined) return '';
  const texto = String(valor);
  if (/[",\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

/** Convierte un arreglo de objetos planos a texto CSV (con encabezados). */
function aCsv(filas, columnas) {
  const encabezado = columnas.map((c) => escaparCampoCsv(c.titulo)).join(',');
  const lineas = filas.map((fila) => columnas.map((c) => escaparCampoCsv(c.valor(fila))).join(','));
  return [encabezado, ...lineas].join('\n');
}

module.exports = { aCsv };
