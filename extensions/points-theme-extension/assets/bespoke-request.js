
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-bespoke-request]").forEach((widget) => {
    const modal = widget.querySelector("[data-bespoke-modal]");
    const openButton = widget.querySelector("[data-bespoke-open]");
    const form = widget.querySelector("[data-bespoke-form]");
    const formView = widget.querySelector("[data-bespoke-form-view]");
    const successView = widget.querySelector("[data-bespoke-success]");

    if (!modal || !openButton || !form || !formView || !successView) {
      return;
    }

    let previousFocus = null;

    function openModal() {
      previousFocus = document.activeElement;

      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";

      const firstInput = modal.querySelector("input:not([type='hidden'])");
      if (firstInput) firstInput.focus();
    }

    function closeModal() {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";

      if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus();
      }
    }

    openButton.addEventListener("click", openModal);

    modal.querySelectorAll("[data-bespoke-close]").forEach((button) => {
      button.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) {
        closeModal();
      }
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      // Static demo only: no request is sent or stored.
      formView.hidden = true;
      successView.hidden = false;

      const heading = successView.querySelector("h2");
      if (heading) heading.focus();
    });

    // Allow the confirmation heading to receive focus accessibly.
    const successHeading = successView.querySelector("h2");
    if (successHeading) successHeading.setAttribute("tabindex", "-1");
  });
});
