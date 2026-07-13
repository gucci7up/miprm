const ESTADOS_TEXTO = {
  REGISTRADO: 'Registro actualizado',
  PENDIENTE_VALIDACION: 'En proceso de validación',
  VALIDADO: 'Miembro validado',
};

document.getElementById('form-consultar').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  ocultarError('alerta-error');
  document.getElementById('alerta-info').classList.add('d-none');
  document.getElementById('resultado').classList.add('d-none');

  const { cedula, fechaNacimiento } = Object.fromEntries(new FormData(ev.target).entries());
  const btn = document.getElementById('btn-submit');
  btn.disabled = true;

  try {
    const data = await api(`/personas/consultar?cedula=${encodeURIComponent(cedula)}&fechaNacimiento=${encodeURIComponent(fechaNacimiento)}`);

    if (!data.existe) {
      const info = document.getElementById('alerta-info');
      info.innerHTML = 'No encontramos un registro con esos datos. <a href="/inscribete">Inscríbete aquí</a>.';
      info.classList.remove('d-none');
      return;
    }

    const m = data.militante;
    document.getElementById('resultado-nombre').textContent = `${m.nombres} ${m.apellidos}`;
    const badge = document.getElementById('resultado-estado');
    badge.textContent = ESTADOS_TEXTO[m.estado] || m.estado;
    badge.className = `badge estado-badge-${m.estado}`;
    document.getElementById('resultado-telefono').textContent = m.telefono || '—';
    document.getElementById('resultado-email').textContent = m.email || '—';
    document.getElementById('resultado-sector').textContent = m.sector || '—';
    document.getElementById('resultado').classList.remove('d-none');
  } catch (err) {
    mostrarError('alerta-error', err.message);
  } finally {
    btn.disabled = false;
  }
});
