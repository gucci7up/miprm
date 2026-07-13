/** Ajusta la barra de navegacion segun si hay sesion activa (llama a GET /auth/sesion). */
(async function inicializarNav() {
  const navInvitado = document.getElementById('nav-invitado');
  const navSesion = document.getElementById('nav-sesion');
  const navAdmin = document.getElementById('nav-admin');
  const navDigitador = document.getElementById('nav-digitador');
  const logoutBtn = document.getElementById('btn-logout');

  try {
    const sesion = await api('/auth/sesion');
    if (navInvitado) navInvitado.classList.add('d-none');
    if (navSesion) navSesion.classList.remove('d-none');
    if (navAdmin && sesion.rolGlobal === 'ADMIN') navAdmin.classList.remove('d-none');
    if (navDigitador && ['DIGITADOR', 'ADMIN'].includes(sesion.rolGlobal)) navDigitador.classList.remove('d-none');
  } catch (e) {
    if (navInvitado) navInvitado.classList.remove('d-none');
    if (navSesion) navSesion.classList.add('d-none');
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      try {
        await api('/auth/logout', { method: 'POST' });
      } finally {
        window.location.href = '/';
      }
    });
  }
})();
