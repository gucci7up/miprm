const ESTADO_INFO = {
  PENDIENTE: { clase: 'alert-warning', texto: 'Tu solicitud está pendiente de revisión (SLA estimado: 24-48h).' },
  APROBADA: { clase: 'alert-success', texto: 'Tu identidad ya fue validada.' },
  RECHAZADA: { clase: 'alert-danger', texto: 'Tu solicitud fue rechazada. Puedes volver a intentarlo.' },
};

['frente', 'dorso', 'selfie'].forEach((tipo) => {
  const inputName = tipo === 'frente' ? 'cedulaFrente' : tipo === 'dorso' ? 'cedulaDorso' : 'selfie';
  const input = document.querySelector(`input[name="${inputName}"]`);
  input.addEventListener('change', () => {
    const preview = document.getElementById(`preview-${tipo}`);
    if (input.files[0]) {
      preview.src = URL.createObjectURL(input.files[0]);
      preview.classList.remove('d-none');
    }
  });
});

async function init() {
  try {
    const { validacion } = await api('/personas/validacion');

    if (validacion && validacion.estado === 'PENDIENTE') {
      const info = document.getElementById('estado-actual');
      info.textContent = ESTADO_INFO.PENDIENTE.texto;
      info.className = `alert ${ESTADO_INFO.PENDIENTE.clase}`;
      info.classList.remove('d-none');
      return;
    }

    if (validacion && validacion.estado === 'APROBADA') {
      const info = document.getElementById('estado-actual');
      info.textContent = ESTADO_INFO.APROBADA.texto;
      info.className = `alert ${ESTADO_INFO.APROBADA.clase}`;
      info.classList.remove('d-none');
      return;
    }

    if (validacion && validacion.estado === 'RECHAZADA') {
      const info = document.getElementById('estado-actual');
      info.textContent = `${ESTADO_INFO.RECHAZADA.texto} ${validacion.comentario ? 'Motivo: ' + validacion.comentario : ''}`;
      info.className = `alert ${ESTADO_INFO.RECHAZADA.clase}`;
      info.classList.remove('d-none');
    }

    document.getElementById('form-validacion').classList.remove('d-none');
  } catch (err) {
    if (err.status === 401) {
      window.location.href = '/iniciar-sesion';
      return;
    }
    mostrarError('alerta-error', err.message);
  }
}

document.getElementById('form-validacion').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  ocultarError('alerta-error');
  const formData = new FormData(ev.target);
  const btn = document.getElementById('btn-submit');
  btn.disabled = true;

  try {
    const resultado = await api('/personas/validacion', { method: 'POST', body: formData });
    alert(resultado.message);
    init();
    ev.target.classList.add('d-none');
  } catch (err) {
    mostrarError('alerta-error', err.message);
  } finally {
    btn.disabled = false;
  }
});

init();
