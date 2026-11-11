(() => {
  if (window.elcircleLookbookControls) return;
  window.elcircleLookbookControls = true;
  let opener;
  function close(modal) {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (opener?.isConnected) opener.focus();
  }
  document.addEventListener('click', event => {
    const open = event.target.closest('[data-open-rewards-modal]');
    if (open) {
      const modal = open.closest('[data-rewards-widget]')?.querySelector('[data-rewards-modal]');
      if (!modal) return;
      opener = open;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      modal.querySelector('button')?.focus();
    }
    const dismiss = event.target.closest('[data-close-rewards-modal]');
    if (dismiss) {
      const modal = dismiss.closest('[data-rewards-modal]');
      if (modal) close(modal);
    }
  });
  document.addEventListener('keydown', event => {
    const modal = document.querySelector('[data-rewards-modal].is-open');
    if (!modal) return;
    if (event.key === 'Escape') close(modal);
    if (event.key !== 'Tab') return;
    const controls = [...modal.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]')];
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
})();
