const CEDULA_REGEX = /^\d{11}$/;

function normalizarCedula(cedula) {
  return String(cedula || '').replace(/\D/g, '');
}

function esCedulaValida(cedula) {
  return CEDULA_REGEX.test(normalizarCedula(cedula));
}

module.exports = { normalizarCedula, esCedulaValida };
