
document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.getElementById("luxuryShowroomWrapper");
  if (!wrapper) return;

  const membershipUrl = wrapper.dataset.membershipUrl;
  const loggedIn = wrapper.dataset.customerLoggedIn === "true";
  const customerEmail = wrapper.dataset.customerEmail || "";

  const tierRanks = {
    silver: 1,
    gold: 2,
    platinum: 3,
    diamond: 4,
    emerald: 5,
    ruby: 6,
    infinite: 7,
  };

  // Move modals outside the wrapper to avoid clipping.
  ["luxuryEnquiryModal", "luxuryQuickViewModal"].forEach((id) => {
    const modal = document.getElementById(id);

    if (modal && modal.parentNode !== document.body) {
      document.body.appendChild(modal);
    }
  });

  // Lock or unlock one product card.
  function setLocked(card, locked) {
    card.classList.toggle("is-locked", locked);

    const overlay = card.querySelector(".luxury-lock-overlay");
    const unlockButton = card.querySelector(".locked-btn");
    const actionRow = card.querySelector(".luxury-action-row");

    if (overlay) overlay.hidden = !locked;
    if (unlockButton) unlockButton.hidden = !locked;
    if (actionRow) actionRow.hidden = locked;
  }

  // Apply the logged-in customer's membership tier.
  function applyMembershipTier(rawTier) {
    const tier = String(rawTier || "").trim().toLowerCase();
    const customerRank = tierRanks[tier];

    wrapper.querySelectorAll(".luxury-card").forEach((card) => {
      const requiredTier = String(
        card.dataset.requiredTier || ""
      ).trim().toLowerCase();

      const requiredRank = tierRanks[requiredTier];

      const locked =
        customerRank === undefined ||
        requiredRank === undefined ||
        customerRank < requiredRank;

      setLocked(card, locked);
    });

    wrapper.dataset.customerTier = tier;
    wrapper.dataset.membershipLoaded = "true";
  }

  // Start locked until membership has been checked.
  wrapper.querySelectorAll(".luxury-card").forEach((card) => {
    setLocked(card, true);
  });

  // Fetch the customer's membership from your backend.
  async function loadMembership() {
    if (!loggedIn || !customerEmail || !membershipUrl) {
      wrapper.dataset.membershipLoaded = "true";
      return;
    }

    try {
      const url = new URL(membershipUrl, window.location.origin);
      url.searchParams.set("email", customerEmail);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Membership request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.found || !data.tier) {
        throw new Error(
          data.error || "No membership tier was found for this customer."
        );
      }

      const tier = String(data.tier).trim().toLowerCase();

      if (!Object.prototype.hasOwnProperty.call(tierRanks, tier)) {
        throw new Error(`Unknown membership tier: ${data.tier}`);
      }

      applyMembershipTier(tier);

      console.log("[Tiered Grid] Membership loaded:", data.tier);
    } catch (error) {
      console.error("[Tiered Grid] Membership error:", error);
      // Fail closed: cards remain locked if membership cannot be verified.
      wrapper.dataset.membershipLoaded = "true";
    }
  }

  // Handle product actions and modal controls.
  wrapper.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button || !wrapper.contains(button)) return;

    const action = button.dataset.action;

    if (action === "locked") {
      handleLockedItemClick(button.dataset.requiredTier);
      return;
    }

    if (action === "quick-view") {
      openQuickViewModal(
        button.dataset.title,
        button.dataset.image,
        button.dataset.description
      );
      return;
    }

    if (action === "enquiry") {
      openEnquiryModal(
        button.dataset.productId,
        button.dataset.title,
        button.dataset.image,
        button.dataset.customerId,
        button.dataset.customerEmail
      );
    }
  });

  // Close modals by clicking close buttons or the backdrop.
  document.addEventListener("click", (event) => {
    const closeButton = event.target.closest("[data-close-modal]");

    if (closeButton) {
      closeModal(closeButton.dataset.closeModal);
    }
  });

  // Load membership and then update the cards.
  loadMembership();
});

// Find an element by ID safely.
function getElement(id) {
  return document.getElementById(id);
}

// Quick-view modal.
function openQuickViewModal(title, image, description) {
  const modal = getElement("luxuryQuickViewModal");
  if (!modal) return;

  // Support both the original IDs and the IDs in the supplied Liquid.
  const titleElement =
    getElement("qvProductTitle") ||
    getElement("luxuryQuickViewTitle");

  const imageElement =
    getElement("qvProductImage") ||
    getElement("luxuryQuickViewImage");

  const descriptionElement =
    getElement("qvProductDesc") ||
    getElement("luxuryQuickViewDescription");

  if (titleElement) titleElement.textContent = title || "Product";

  if (imageElement) {
    imageElement.src = image || "";
    imageElement.alt = title || "Product";
  }

  if (descriptionElement) {
    descriptionElement.textContent =
      description || "No description available.";
  }

  modal.hidden = false;
  modal.classList.add("is-active");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("luxury-modal-open");
}

// Product enquiry modal.
function openEnquiryModal(
  productId,
  title,
  image,
  customerId,
  customerEmail
) {
  const modal = getElement("luxuryEnquiryModal");
  if (!modal) return;

  const titleElement =
    getElement("modalProductTitle") ||
    getElement("luxuryEnquiryTitle");

  const imageElement = getElement("modalProductImage");

  const productIdInput =
    getElement("formProductId") ||
    getElement("luxuryEnquiryProductId");

  const customerIdInput =
    getElement("formCustomerId") ||
    getElement("luxuryEnquiryCustomerId");

  const emailInput =
    getElement("formCustomerEmail") ||
    getElement("luxuryEnquiryEmail");

  const form = getElement("luxuryEnquiryForm");
  const successMessage = getElement("formSuccessMessage");

  if (titleElement) titleElement.textContent = title || "Product Enquiry";

  if (imageElement) {
    imageElement.src = image || "";
    imageElement.alt = title || "Product";
  }

  if (productIdInput) productIdInput.value = productId || "";
  if (customerIdInput) customerIdInput.value = customerId || "";
  if (emailInput) emailInput.value = customerEmail || "";

  if (form) form.style.display = "block";
  if (successMessage) successMessage.style.display = "none";

  modal.hidden = false;
  modal.classList.add("is-active");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("luxury-modal-open");
}

// Close a modal.
function closeModal(id) {
  const modal = getElement(id);
  if (!modal) return;

  modal.classList.remove("is-active");
  modal.setAttribute("aria-hidden", "true");

  if (!document.querySelector(".luxury-modal.is-active")) {
    document.body.classList.remove("luxury-modal-open");
  }

  // Allow CSS transitions to finish before hiding.
  window.setTimeout(() => {
    if (!modal.classList.contains("is-active")) {
      modal.hidden = true;
    }
  }, 300);
}

// Basic enquiry form handling.
// Connect this to your enquiry API to actually save or send enquiries.
function handleEnquirySubmit(event) {
  event.preventDefault();

  const form = getElement("luxuryEnquiryForm");
  const successMessage = getElement("formSuccessMessage");

  if (!form) return;

  if (successMessage) {
    form.style.display = "none";
    successMessage.style.display = "block";
  } else {
    alert("The enquiry form needs to be connected to your enquiry backend.");
  }
}

// Locked product: redirect to your membership rewards page.
function handleLockedItemClick(requiredTier) {
  const target = `/pages/loyalty-rewards?required_tier=${encodeURIComponent(
    requiredTier || "silver"
  )}`;

  window.location.href = target;
}

// Keep functions accessible to inline form handlers.
window.openQuickViewModal = openQuickViewModal;
window.openEnquiryModal = openEnquiryModal;
window.closeModal = closeModal;
window.handleEnquirySubmit = handleEnquirySubmit;
window.handleLockedItemClick = handleLockedItemClick;
