const ROL_TEXTO = { PRESIDENTE: 'Presidente', SECRETARIO: 'Secretario', MIEMBRO: 'Miembro' };

function tarjetaMiComite(membresia) {
  const c = membresia.comite;
  return `
    <div class="col-md-4">
      <div class="card p-3 h-100">
        <div class="d-flex justify-content-between align-items-start">
          <h6 class="mb-1">${c.nombre}</h6>
          <span class="badge bg-primary">${ROL_TEXTO[membresia.rol] || membresia.rol}</span>
        </div>
        <p class="text-muted small mb-2">${c.municipioNombre}${c.provinciaNombre ? ', ' + c.provinciaNombre : ''}</p>
        <a href="/comites-editar/${c.id}" class="btn btn-outline-primary btn-sm mt-auto">Ver / Gestionar</a>
      </div>
    </div>`;
}

function tarjetaDisponible(comite) {
  return `
    <div class="col-md-4">
      <div class="card p-3 h-100">
        <h6 class="mb-1">${comite.nombre}</h6>
        <p class="text-muted small mb-2">${comite.municipioNombre}${comite.provinciaNombre ? ', ' + comite.provinciaNombre : ''}</p>
        <p class="small mb-3">${comite._count ? comite._count.miembros : 0} miembros · Presidente: ${comite.presidente.nombres} ${comite.presidente.apellidos}</p>
        <button class="btn btn-outline-success btn-sm mt-auto" data-afiliarme="${comite.id}">Afiliarme a este comité</button>
      </div>
    </div>`;
}

async function cargarTablero() {
  try {
    const [{ membresias }, { comites }] = await Promise.all([api('/comites/mis-comites'), api('/comites')]);

    document.getElementById('mis-comites').innerHTML =
      membresias.map(tarjetaMiComite).join('') || '<p class="text-muted">Aún no perteneces a ningún comité.</p>';

    const idsPropios = new Set(membresias.map((m) => m.comiteId));
    const disponibles = comites.filter((c) => !idsPropios.has(c.id));

    document.getElementById('comites-disponibles').innerHTML =
      disponibles.map(tarjetaDisponible).join('') || '<p class="text-muted">No hay más comités disponibles por ahora.</p>';

    document.querySelectorAll('[data-afiliarme]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await api(`/comites/${btn.dataset.afiliarme}/afiliarme`, { method: 'POST' });
          cargarTablero();
        } catch (err) {
          mostrarError('alerta-error', err.message);
          btn.disabled = false;
        }
      });
    });
  } catch (err) {
    if (err.status === 401) {
      window.location.href = '/iniciar-sesion';
      return;
    }
    mostrarError('alerta-error', err.message);
  }
}

cargarTablero();
