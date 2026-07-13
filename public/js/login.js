document.getElementById('form-login').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  ocultarError('alerta-error');

  const datos = Object.fromEntries(new FormData(ev.target).entries());
  const btn = document.getElementById('btn-submit');
  btn.disabled = true;

  try {
    await api('/auth/login', { method: 'POST', body: JSON.stringify(datos) });
    window.location.href = '/tablero';
  } catch (err) {
    mostrarError('alerta-error', err.message);
  } finally {
    btn.disabled = false;
  }
});

document.getElementById('link-reset').addEventListener('click', async (ev) => {
  ev.preventDefault();
  const cedula = document.querySelector('input[name="cedula"]').value;
  if (!cedula) {
    mostrarError('alerta-error', 'Escribe tu cedula arriba y vuelve a dar clic en "Olvidaste tu contrasena"');
    return;
  }
  try {
    const resultado = await api('/auth/reset-password', { method: 'POST', body: JSON.stringify({ cedula }) });
    alert(resultado.message);
  } catch (err) {
    mostrarError('alerta-error', err.message);
  }
});
