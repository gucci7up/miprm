async function cargarStats() {
  const stats = await api('/admin/estadisticas');
  const cont = document.getElementById('stats-cards');
  cont.innerHTML = `
    <div class="col-md-3">
      <div class="card p-3 text-center"><h3 class="mb-0">${stats.totalMilitantes}</h3><small class="text-muted">Militantes</small></div>
    </div>
    <div class="col-md-3">
      <div class="card p-3 text-center"><h3 class="mb-0">${stats.totalComites}</h3><small class="text-muted">Comités</small></div>
    </div>
    <div class="col-md-6">
      <div class="card p-3">
        <small class="text-muted d-block mb-1">Comités por provincia</small>
        ${stats.comitesPorProvincia.map((r) => `<div class="d-flex justify-content-between"><span>${r.provincia}</span><strong>${r.total}</strong></div>`).join('') || '<span class="text-muted">Sin datos</span>'}
      </div>
    </div>`;
}

function tarjetaValidacion(v) {
  return `
    <div class="col-md-6">
      <div class="card p-3">
        <h6 class="mb-1">${v.militante.nombres} ${v.militante.apellidos}</h6>
        <p class="small text-muted mb-2">Cédula: ${v.militante.cedula} · Tel: ${v.militante.telefono}</p>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-secondary" data-ver-fotos="${v.id}">Ver fotos</button>
          <button class="btn btn-sm btn-success" data-aprobar="${v.id}">Aprobar</button>
          <button class="btn btn-sm btn-danger" data-rechazar="${v.id}">Rechazar</button>
        </div>
      </div>
    </div>`;
}

async function cargarValidaciones() {
  const { validaciones } = await api('/admin/validaciones/pendientes');
  const cont = document.getElementById('lista-validaciones');
  cont.innerHTML = validaciones.map(tarjetaValidacion).join('') || '<p class="text-muted">No hay validaciones pendientes.</p>';

  cont.querySelectorAll('[data-ver-fotos]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.verFotos;
      document.getElementById('modal-fotos-body').innerHTML = ['frente', 'dorso', 'selfie']
        .map(
          (tipo) => `
        <div class="col-md-4 text-center">
          <img src="/admin/validaciones/${id}/foto/${tipo}" class="img-fluid rounded border" />
          <div class="small text-muted mt-1">${tipo}</div>
        </div>`
        )
        .join('');
      new bootstrap.Modal(document.getElementById('modalFotos')).show();
    });
  });

  cont.querySelectorAll('[data-aprobar]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await api(`/admin/validaciones/${btn.dataset.aprobar}/aprobar`, { method: 'POST' });
        cargarValidaciones();
        cargarStats();
      } catch (err) {
        mostrarError('alerta-error', err.message);
      }
    });
  });

  cont.querySelectorAll('[data-rechazar]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const comentario = prompt('Motivo del rechazo (opcional):') || '';
      try {
        await api(`/admin/validaciones/${btn.dataset.rechazar}/rechazar`, {
          method: 'POST',
          body: JSON.stringify({ comentario }),
        });
        cargarValidaciones();
      } catch (err) {
        mostrarError('alerta-error', err.message);
      }
    });
  });
}

async function cargarComitesAdmin() {
  const { comites } = await api('/admin/comites');
  const cont = document.getElementById('lista-comites-admin');
  cont.innerHTML =
    comites
      .map(
        (c) => `
    <div class="col-md-4">
      <div class="card p-3">
        <div class="d-flex justify-content-between">
          <h6 class="mb-1">${c.nombre}</h6>
          <span class="badge ${c.activo ? 'bg-success' : 'bg-secondary'}">${c.activo ? 'Activo' : 'Inactivo'}</span>
        </div>
        <p class="small text-muted mb-1">${c.municipioNombre}${c.provinciaNombre ? ', ' + c.provinciaNombre : ''}</p>
        <p class="small mb-0">Presidente: ${c.presidente.nombres} ${c.presidente.apellidos} · ${c._count.miembros} miembros</p>
      </div>
    </div>`
      )
      .join('') || '<p class="text-muted">No hay comités registrados.</p>';
}

async function init() {
  try {
    await Promise.all([cargarStats(), cargarValidaciones(), cargarComitesAdmin()]);
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      window.location.href = '/iniciar-sesion';
      return;
    }
    mostrarError('alerta-error', err.message);
  }
}

init();
