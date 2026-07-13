const comiteId = document.querySelector('[data-comite-id]').dataset.comiteId;
const ROL_TEXTO = { COORDINADOR: 'Coordinador', ENLACE: 'Enlace', MIEMBRO: 'Miembro' };

let miMilitanteId = null;
let esCoordinador = false;
let esGestor = false;
let esDigitadorOAdmin = false;
let ultimoComite = null;
let ultimosMiembros = [];

function formatearFecha(iso) {
  return iso ? new Date(iso).toISOString().slice(0, 10) : '';
}

async function cargarProvinciasYMunicipios(provinciaNombreActual, municipioIdActual) {
  const selectProvincia = document.getElementById('select-provincia');
  const selectMunicipio = document.getElementById('select-municipio');

  const { provincias } = await api('/personas/catalogos/provincias');
  selectProvincia.innerHTML = provincias.map((p) => `<option value="${p.ID}" data-nombre="${p.Descripcion}">${p.Descripcion}</option>`).join('');

  const provinciaMatch = provincias.find((p) => p.Descripcion === provinciaNombreActual);
  if (provinciaMatch) selectProvincia.value = provinciaMatch.ID;

  async function cargarMunicipios() {
    const provinciaId = selectProvincia.value;
    if (!provinciaId) {
      selectMunicipio.innerHTML = '';
      return;
    }
    const { municipios } = await api(`/personas/catalogos/municipios?provinciaId=${provinciaId}`);
    selectMunicipio.innerHTML = municipios
      .map((m) => {
        const esDistrito = m.IDMunicipioPadre && m.IDMunicipioPadre !== m.ID;
        const etiqueta = esDistrito ? `— ${m.Descripcion} (D.M.)` : m.Descripcion;
        return `<option value="${m.ID}" data-nombre="${m.Descripcion}">${etiqueta}</option>`;
      })
      .join('');
    if (municipioIdActual) selectMunicipio.value = municipioIdActual;
  }

  await cargarMunicipios();
  selectProvincia.addEventListener('change', cargarMunicipios);
}

async function cargarZonas(zonaIdActual) {
  const selectZona = document.getElementById('select-zona');
  if (!selectZona) return;
  const { zonas } = await api('/personas/catalogos/zonas');
  selectZona.innerHTML =
    '<option value="">Sin especificar</option>' +
    zonas.map((z) => `<option value="${z.ID}" data-nombre="${z.Descripcion}">${z.Descripcion}</option>`).join('');
  if (zonaIdActual) selectZona.value = zonaIdActual;
}

function aplicarPermisos() {
  if (!esCoordinador) {
    document.getElementById('form-info-general').querySelectorAll('input, select, button').forEach((el) => (el.disabled = true));
  }
  if (esGestor) {
    document.getElementById('form-actividad-wrap').classList.remove('d-none');
    document.getElementById('form-miembro-wrap').classList.remove('d-none');
  }
}

function renderActividades(actividades) {
  const cont = document.getElementById('lista-actividades');
  if (!actividades.length) {
    cont.innerHTML = '<p class="text-muted">Aún no hay actividades registradas.</p>';
    return;
  }
  cont.innerHTML = actividades
    .map(
      (a) => `
    <div class="col-md-4">
      <div class="card h-100">
        ${a.imagenMimeType ? `<img src="/comites/${comiteId}/actividades/${a.id}/imagen" class="card-img-top" style="height:140px;object-fit:cover;">` : ''}
        <div class="card-body">
          <h6 class="card-title">${a.nombre}</h6>
          <p class="card-text small text-muted">${formatearFecha(a.fechaInicio)} → ${formatearFecha(a.fechaFin)}</p>
          <p class="card-text small">${a.descripcion || ''}</p>
        </div>
      </div>
    </div>`
    )
    .join('');
}

function renderMiembros(miembros) {
  const tbody = document.getElementById('tabla-miembros');
  tbody.innerHTML = miembros
    .map(
      (m) => `
    <tr>
      <td>${m.militante.nombres} ${m.militante.apellidos}</td>
      <td>${m.militante.cedula}</td>
      <td><span class="badge bg-secondary">${ROL_TEXTO[m.rol] || m.rol}</span></td>
      <td>
        ${esCoordinador && m.rol !== 'COORDINADOR' ? `<button class="btn btn-sm btn-outline-danger" data-eliminar="${m.id}">Eliminar</button>` : ''}
      </td>
    </tr>`
    )
    .join('');

  tbody.querySelectorAll('[data-eliminar]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar a este miembro del comité?')) return;
      try {
        await api(`/comites/${comiteId}/miembros/${btn.dataset.eliminar}`, { method: 'DELETE' });
        cargarMiembros();
      } catch (err) {
        mostrarError('alerta-error', err.message);
      }
    });
  });
}

async function cargarMiembros() {
  const { miembros } = await api(`/comites/${comiteId}/miembros`);
  renderMiembros(miembros);
}

async function cargarActividades() {
  const { actividades } = await api(`/comites/${comiteId}/actividades`);
  renderActividades(actividades);
}

async function init() {
  try {
    const sesion = await api('/auth/sesion');
    miMilitanteId = sesion.militanteId;
    esDigitadorOAdmin = ['DIGITADOR', 'ADMIN'].includes(sesion.rolGlobal);

    const { comite } = await api(`/comites/${comiteId}`);
    ultimoComite = comite;
    esCoordinador = comite.coordinadorId === miMilitanteId;

    const { miembros } = await api(`/comites/${comiteId}/miembros`);
    ultimosMiembros = miembros;
    const miMembresia = miembros.find((m) => m.militanteId === miMilitanteId);
    esGestor = esCoordinador || (miMembresia && miMembresia.rol === 'ENLACE');

    document.getElementById('titulo-comite').textContent = comite.nombre;
    const badge = document.getElementById('badge-activo');
    badge.textContent = comite.activo ? 'Activo' : 'Inactivo';
    badge.className = `badge ${comite.activo ? 'bg-success' : 'bg-secondary'}`;

    document.getElementById('coordinador-nombre').textContent = comite.coordinador
      ? `${comite.coordinador.nombres} ${comite.coordinador.apellidos} (${comite.coordinador.cedula})`
      : 'Sin asignar';
    if (esDigitadorOAdmin) {
      document.getElementById('btn-cambiar-coordinador').classList.remove('d-none');
    }

    document.getElementById('input-nombre').value = comite.nombre;
    document.getElementById('input-activo').checked = comite.activo;
    if (comite.logoMimeType) {
      const img = document.getElementById('logo-actual');
      img.src = `/comites/${comiteId}/logo`;
      img.classList.remove('d-none');
    }

    await cargarProvinciasYMunicipios(comite.provinciaNombre, comite.municipioId);
    await cargarZonas(comite.zonaId);
    aplicarPermisos();
    renderMiembros(miembros);
    await cargarActividades();
  } catch (err) {
    if (err.status === 401) {
      window.location.href = '/iniciar-sesion';
      return;
    }
    mostrarError('alerta-error', err.message);
  }
}

document.getElementById('form-info-general').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  ocultarError('alerta-error');

  const selectProvincia = document.getElementById('select-provincia');
  const selectMunicipio = document.getElementById('select-municipio');
  const selectZona = document.getElementById('select-zona');
  const formData = new FormData();
  formData.append('nombre', document.getElementById('input-nombre').value);
  formData.append('municipioId', selectMunicipio.value);
  formData.append('municipioNombre', selectMunicipio.options[selectMunicipio.selectedIndex]?.dataset.nombre || '');
  formData.append('provinciaNombre', selectProvincia.options[selectProvincia.selectedIndex]?.dataset.nombre || '');
  if (selectZona.value) {
    formData.append('zonaId', selectZona.value);
    formData.append('zonaNombre', selectZona.options[selectZona.selectedIndex]?.dataset.nombre || '');
  }
  formData.append('activo', document.getElementById('input-activo').checked);
  const logoInput = ev.target.querySelector('input[name="logo"]');
  if (logoInput.files[0]) formData.append('logo', logoInput.files[0]);

  try {
    await api(`/comites/${comiteId}`, { method: 'PUT', body: formData });
    init();
  } catch (err) {
    mostrarError('alerta-error', err.message);
  }
});

document.getElementById('form-actividad').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  ocultarError('alerta-error');
  const formData = new FormData(ev.target);
  try {
    await api(`/comites/${comiteId}/actividades`, { method: 'POST', body: formData });
    ev.target.reset();
    cargarActividades();
  } catch (err) {
    mostrarError('alerta-error', err.message);
  }
});

document.getElementById('form-miembro').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  ocultarError('alerta-error');
  const datos = Object.fromEntries(new FormData(ev.target).entries());
  try {
    await api(`/comites/${comiteId}/miembros`, { method: 'POST', body: JSON.stringify(datos) });
    ev.target.reset();
    cargarMiembros();
  } catch (err) {
    mostrarError('alerta-error', err.message);
  }
});

document.getElementById('form-coordinador').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  ocultarError('alerta-error');
  const datos = Object.fromEntries(new FormData(ev.target).entries());
  try {
    await api(`/comites/${comiteId}/coordinador`, { method: 'PUT', body: JSON.stringify(datos) });
    bootstrap.Modal.getInstance(document.getElementById('modalCoordinador'))?.hide();
    ev.target.reset();
    init();
  } catch (err) {
    mostrarError('alerta-error', err.message);
  }
});

document.getElementById('btn-imprimir').addEventListener('click', async () => {
  const btn = document.getElementById('btn-imprimir');
  btn.disabled = true;
  try {
    const { comite, miembros } = await api(`/comites/${comiteId}/imprimir-datos`);

    document.getElementById('print-nombre').textContent = comite.nombre;
    document.getElementById('print-provincia').textContent = comite.provinciaNombre || '—';
    document.getElementById('print-municipio').textContent = comite.municipioNombre || '—';
    document.getElementById('print-zona').textContent = comite.zonaNombre || '—';
    document.getElementById('print-fecha').textContent = formatearFecha(comite.createdAt);

    document.getElementById('print-miembros').innerHTML = miembros
      .map(
        (m) => `
      <div class="print-card">
        <div class="print-card-rol">${ROL_TEXTO[m.rol] || m.rol}</div>
        <div class="print-card-body">
          <img class="print-card-foto" src="${m.fotoBase64 ? 'data:image/jpeg;base64,' + m.fotoBase64 : ''}" onerror="this.style.visibility='hidden'" />
          <div>
            <div class="print-card-cedula">${m.cedula}${m.codigoColegio ? ' — Colegio ' + m.codigoColegio : ''}</div>
            <div class="print-card-nombre">${m.nombres} ${m.apellidos}</div>
            <div class="print-card-detalle">${m.telefono || ''}</div>
            <div class="print-card-detalle">${m.recinto ? 'Recinto ' + m.recinto : ''}${m.circunscripcion ? ', ' + m.circunscripcion + ' Circunscripcion' : ''}${m.municipio ? ', ' + m.municipio : ''}</div>
          </div>
        </div>
      </div>`
      )
      .join('');

    const original = document.body.innerHTML;
    document.body.innerHTML = `<div style="padding:20px;">${document.getElementById('seccion-imprimir').innerHTML}</div>`;
    window.print();
    document.body.innerHTML = original;
    window.location.reload();
  } catch (err) {
    mostrarError('alerta-error', err.message);
    btn.disabled = false;
  }
});

init();
