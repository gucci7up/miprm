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
    else mostrarError('alerta-error', err.message);
  }
}

selectProvincia.addEventListener('change', async () => {
  const provinciaId = selectProvincia.value;
  selectMunicipio.innerHTML = '<option value="">Cargando...</option>';
  selectMunicipio.disabled = true;
  if (!provinciaId) return;

  try {
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
  } catch (err) {
    mostrarError('alerta-error', err.message);
  }
});

document.getElementById('form-crear-comite').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  ocultarError('alerta-error');

  const municipioId = selectMunicipio.value;
  const municipioNombre = selectMunicipio.options[selectMunicipio.selectedIndex]?.text;
  const provinciaNombre = selectProvincia.options[selectProvincia.selectedIndex]?.text;

  if (!municipioId) {
    mostrarError('alerta-error', 'Selecciona un municipio');
    return;
  }

  const form = ev.target;
  const formData = new FormData();
  formData.append('nombre', form.nombre.value);
  formData.append('municipioId', municipioId);
  formData.append('municipioNombre', municipioNombre);
  formData.append('provinciaNombre', provinciaNombre);
  if (form.logo.files[0]) formData.append('logo', form.logo.files[0]);

  const btn = document.getElementById('btn-submit');
  btn.disabled = true;

  try {
    const { comite } = await api('/comites', { method: 'POST', body: formData });
    window.location.href = `/comites-editar/${comite.id}`;
  } catch (err) {
    mostrarError('alerta-error', err.message);
    btn.disabled = false;
  }
});

cargarProvincias();
