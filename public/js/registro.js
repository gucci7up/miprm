document.getElementById('form-registro').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  ocultarError('alerta-error');
  document.getElementById('alerta-exito').classList.add('d-none');

  const form = ev.target;
  const datos = Object.fromEntries(new FormData(form).entries());
  const btn = document.getElementById('btn-submit');
  btn.disabled = true;

  try {
    const resultado = await api('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
    const exito = document.getElementById('alerta-exito');
    exito.textContent = resultado.message;
    exito.classList.remove('d-none');
    form.reset();
    setTimeout(() => (window.location.href = '/iniciar-sesion'), 2500);
  } catch (err) {
    mostrarError('alerta-error', err.message);
  } finally {
    btn.disabled = false;
  }
});
