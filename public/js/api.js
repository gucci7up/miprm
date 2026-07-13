/** Helper compartido para llamar a la API JSON del backend. */
async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // respuesta sin cuerpo JSON (ej. 204, o CSV)
  }

  if (!res.ok) {
    const error = new Error((data && data.error) || `Error ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

function mostrarError(contenedorId, mensaje) {
  const el = document.getElementById(contenedorId);
  if (!el) return;
  el.textContent = mensaje;
  el.classList.remove('d-none');
}

function ocultarError(contenedorId) {
  const el = document.getElementById(contenedorId);
  if (!el) return;
  el.classList.add('d-none');
}
