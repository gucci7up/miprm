// --- Registrar militante ---
document.getElementById('btn-buscar-padron').addEventListener('click', async () => {
  const cedula = document.getElementById('reg-cedula').value;
  if (!cedula) return;
  ocultarError('alerta-error');
  try {
    const persona = await api(`/personas/padron/${cedula}`);
    document.getElementById('reg-nombres').value = persona.nombres || '';
    document.getElementById('reg-apellidos').value = persona.apellidos || '';
    if (persona.fechaNacimiento) {
      document.getElementById('reg-fechaNacimiento').value = new Date(persona.fechaNacimiento).toISOString().slice(0, 10);
    }
  } catch (err) {
    mostrarError('alerta-error', err.status === 404 ? 'No se encontro esa cedula en el padron. Completa los datos manualmente.' : err.message);
  }
});

document.getElementById('form-registrar').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  ocultarError('alerta-error');
  document.getElementById('alerta-exito').classList.add('d-none');

  const datos = Object.fromEntries(new FormData(ev.target).entries());
  const btn = document.getElementById('btn-submit-registrar');
  btn.disabled = true;

  try {
    const resultado = await api('/personas/afiliar', { method: 'POST', body: JSON.stringify(datos) });
    const exito = document.getElementById('alerta-exito');
    exito.textContent = resultado.message;
    exito.classList.remove('d-none');
    ev.target.reset();
  } catch (err) {
    mostrarError('alerta-error', err.message);
  } finally {
    btn.disabled = false;
  }
});

// --- Crear comite ---
const selectProvincia = document.getElementById('select-provincia');
const selectMunicipio = document.getElementById('select-municipio');

async function cargarProvincias() {
  try {
    const { provincias } = await api('/personas/catalogos/provincias');
    selectProvincia.innerHTML =
      '<option value="">Selecciona...</option>' +
      provincias.map((p) => `<option value="${p.ID}">${p.Descripcion}</option>`).join('');
  } catch (err) {
    if (err.status === 401) window.location.href = '/iniciar-sesion';
    else if (err.status === 403) mostrarError('alerta-error', 'No tienes permisos de digitador/admin.');
    else mostrarError('alerta-error', err.message);
  }
}

selectProvincia.addEventListener('change', async () => {
  const provinciaId = selectProvincia.value;
  selectMunicipio.innerHTML = '<option value="">Cargando...</option>';
  selectMunicipio.disabled = true;
  if (!provinciaId) return;

  const { municipios } = await api(`/personas/catalogos/municipios?provinciaId=${provinciaId}`);
  selectMunicipio.innerHTML =
    '<option value="">Selecciona...</option>' +
    municipios
      .map((m) => {
        const esDistrito = m.IDMunicipioPadre && m.IDMunicipioPadre !== m.ID;
        const etiqueta = esDistrito ? `— ${m.Descripcion} (D.M.)` : m.Descripcion;
        return `<option value="${m.ID}">${etiqueta}</option>`;
      })
      .join('');
  selectMunicipio.disabled = false;
});

document.getElementById('form-crear-comite').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  ocultarError('alerta-error');
  document.getElementById('alerta-exito').classList.add('d-none');

  const municipioId = selectMunicipio.value;
  if (!municipioId) {
    mostrarError('alerta-error', 'Selecciona un municipio');
    return;
  }
  const municipioNombre = selectMunicipio.options[selectMunicipio.selectedIndex]?.text;
  const provinciaNombre = selectProvincia.options[selectProvincia.selectedIndex]?.text;

  const form = ev.target;
  const formData = new FormData(form);
  formData.append('municipioId', municipioId);
  formData.append('municipioNombre', municipioNombre);
  formData.append('provinciaNombre', provinciaNombre);

  const btn = document.getElementById('btn-submit-comite');
  btn.disabled = true;

  try {
    const { comite } = await api('/comites', { method: 'POST', body: formData });
    const exito = document.getElementById('alerta-exito');
    exito.innerHTML = `Comité "${comite.nombre}" creado. <a href="/comites-editar/${comite.id}">Ver / gestionar</a>`;
    exito.classList.remove('d-none');
    form.reset();
    selectMunicipio.innerHTML = '<option value="">Primero selecciona provincia</option>';
    selectMunicipio.disabled = true;
  } catch (err) {
    mostrarError('alerta-error', err.message);
  } finally {
    btn.disabled = false;
  }
});

cargarProvincias();
