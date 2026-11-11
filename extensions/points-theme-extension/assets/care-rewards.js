document.addEventListener("DOMContentLoaded", initCareRewards);

function initCareRewards() {
  const root = document.getElementById("care-rewards-root");
  if (!root || root.dataset.initialized === "true") return;
  root.dataset.initialized = "true";

  const config = window.CareRewardsConfig || {};

  const state = {
    open: false,
    panel: "home",
    advisor: "No preference",
    date: "",
    time: "",
    firstName: config.customerFirstName || "",
    lastName: config.customerLastName || "",
    email: config.customerEmail || "",
    phone: "",
    purpose: "Shopping",
    notes: "",
    newsletter: true,
    points: 0,
    storeCredit: null,
    lifetimeSpend: 0,
    tier: "Loading...",
    history: [],
    loyaltyLoading: true,
    loyaltyError: "",
  };

  // DEMO ONLY: payment is not processed yet.
  // TODO: deduct the appointment fee from Shopify store credit
  // using a trusted backend when payment integration is implemented.
  const APPOINTMENT_FEE = 50;
  const CURRENCY = "AED";

  // const API_BASE_URL = "/apps/elcircle-membership/"

  const API_BASE_URL = String(
    config.apiBaseUrl ||
    "/apps/elcircle-membership"
  ).replace(/\/+$/, "");


  const advisors = [
    { name: "No preference", initial: "✧", description: "First available advisor" },
    { name: "maaz", initial: "J", description: "Personal styling" },
    { name: "maaz", initial: "T", description: "Dress styling and fit" },
    { name: "maaz", initial: "L", description: "Personal shopping" },
    { name: "Ola", initial: "O", description: "Occasion styling" },
  ];

  const times = [
    "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00",
  ];

  const tiers = [
    { name: "Pearl", min: 0 },
    { name: "Silver", min: 5000 },
    { name: "Gold", min: 20000 },
    { name: "Platinum", min: 40000 },
    { name: "Diamond", min: 80000 },
    { name: "Emerald", min: 100000 },
    { name: "Ruby", min: 200000 },
  ];

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;",
    })[char]);

  const money = (value) =>
    new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: CURRENCY,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  // Load live membership data through JSONP to avoid the storefront CORS block.
  // The API route must support ?callback=... (your Remix route already does).
  // async function loadLoyaltyData() {
  //   const apiBaseUrl = String(API_BASE_URL || "").replace(/\/+$/, "");
  //   const email = String(config.customerEmail || state.email || "")
  //     .trim()
  //     .toLowerCase();

  //   if (!apiBaseUrl) {
  //     state.loyaltyLoading = false;
  //     state.loyaltyError = "The loyalty API URL is not configured.";
  //     render();
  //     return;
  //   }

  //   if (!email) {
  //     state.loyaltyLoading = false;
  //     state.loyaltyError =
  //       "Customer email is unavailable. Please check CareRewardsConfig.customerEmail.";
  //     render();
  //     return;
  //   }

  //   state.loyaltyLoading = true;
  //   state.loyaltyError = "";
  //   render();
  //   if (state.open) openDrawer();

  //   let script;

  //   try {
  //     const data = await new Promise((resolve, reject) => {
  //       const callbackName =
  //         "__careRewardsCallback_" +
  //         Date.now() +
  //         "_" +
  //         Math.random().toString(36).slice(2);

  //       let finished = false;

  //       const cleanup = () => {
  //         if (script && script.parentNode) script.parentNode.removeChild(script);
  //         try {
  //           delete window[callbackName];
  //         } catch {
  //           window[callbackName] = undefined;
  //         }
  //         clearTimeout(timeoutId);
  //       };

  //       const finish = (callback, value) => {
  //         if (finished) return;
  //         finished = true;
  //         cleanup();
  //         callback(value);
  //       };

  //       const timeoutId = setTimeout(() => {
  //         finish(reject, new Error("The loyalty API request timed out."));
  //       }, 15000);

  //       window[callbackName] = (payload) => {
  //         finish(resolve, payload);
  //       };

  //       script = document.createElement("script");
  //       script.async = true;
  //       script.src =
  //         `${apiBaseUrl}/api/loyalty/points` +
  //         `?email=${encodeURIComponent(email)}` +
  //         `&callback=${encodeURIComponent(callbackName)}`;

  //       script.onerror = () => {
  //         finish(
  //           reject,
  //           new Error(
  //             "Could not load the loyalty API. Check that the server is running and the API URL is correct."
  //           )
  //         );
  //       };

  //       document.head.appendChild(script);
  //     });

  //     if (!data || data.success === false) {
  //       throw new Error(data?.error || "Unable to load loyalty information.");
  //     }

  //     state.points = Number(
  //       data.points ?? data.totalpoints ?? data.totalPoints ?? 0
  //     );
  //     state.tier = data.tier || data.membershipTier || "Not assigned";
  //     state.lifetimeSpend = Number(
  //       data.lifetimeSpend ?? data.totalSpend ?? data.qualifyingSpend ?? 0
  //     );

  //     const credit = data.storeCredit;

  //     if (credit == null) {
  //       state.storeCredit = null;
  //     } else if (typeof credit === "object") {
  //       const amount = credit.available ?? credit.balance ?? credit.amount;
  //       state.storeCredit = amount == null ? null : Number(amount);
  //     } else {
  //       state.storeCredit = Number(credit);
  //     }

  //     const activity = data.transactions ?? data.activity ?? data.history ?? [];

  //     if (Array.isArray(activity)) {
  //       state.history = activity;
  //     } else if (typeof activity === "string") {
  //       state.history = activity
  //         .split(/\\r?\\n/)
  //         .map((description, index) => ({
  //           id: `history-${index}`,
  //           description: description.trim(),
  //         }))
  //         .filter((item) => item.description);
  //     } else {
  //       state.history = [];
  //     }

  //     console.log("[Care Rewards] Loyalty data loaded:", {
  //       points: state.points,
  //       tier: state.tier,
  //       lifetimeSpend: state.lifetimeSpend,
  //       storeCredit: state.storeCredit,
  //     });
  //   } catch (error) {
  //     console.error("[Care Rewards] Loyalty data error:", error);
  //     state.loyaltyError = error.message || "Unable to load loyalty data.";
  //   } finally {
  //     state.loyaltyLoading = false;
  //     render();
  //     if (state.open) openDrawer();
  //   }
  // }






async function loadLoyaltyData() {
  const apiBaseUrl = String(API_BASE_URL || "").replace(/\/+$/, "");

  const email = String(config.customerEmail || state.email || "")
    .trim()
    .toLowerCase();

  if (!apiBaseUrl) {
    state.loyaltyLoading = false;
    state.loyaltyError = "The loyalty API URL is not configured.";
    render();
    return;
  }

  if (!email) {
    state.loyaltyLoading = false;
    state.loyaltyError =
      "Customer email is unavailable. Please check CareRewardsConfig.customerEmail.";
    render();
    return;
  }

  state.loyaltyLoading = true;
  state.loyaltyError = "";
  render();

  if (state.open) openDrawer();

  let script;

  try {
    const response = await fetch(`${apiBaseUrl}/loyalty/points`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(response.status === 401
        ? "Please sign in to view your rewards."
        : "Unable to load your rewards. Please try again.");
    }
    const data = await response.json();
    if (!data || data.success === false) {
      throw new Error(
        data?.error || "Unable to load loyalty information."
      );
    }

    state.points = Number(
      data.points ?? data.totalpoints ?? data.totalPoints ?? 0
    );

    state.tier =
      data.tier || data.membershipTier || "Not assigned";

    state.lifetimeSpend = Number(
      data.lifetimeSpend ??
      data.totalSpend ??
      data.qualifyingSpend ??
      0
    );

    const credit = data.storeCredit;

    if (credit == null) {
      state.storeCredit = null;
    } else if (typeof credit === "object") {
      const amount =
        credit.available ?? credit.balance ?? credit.amount;

      state.storeCredit =
        amount == null ? null : Number(amount);
    } else {
      state.storeCredit = Number(credit);
    }

    const activity =
      data.transactions ?? data.activity ?? data.history ?? [];

    if (Array.isArray(activity)) {
      state.history = activity;
    } else if (typeof activity === "string") {
      state.history = activity
        .split(/\r?\n/)
        .map((description, index) => ({
          id: `history-${index}`,
          description: description.trim(),
        }))
        .filter((item) => item.description);
    } else {
      state.history = [];
    }

    console.log("[Care Rewards] Loyalty data loaded:", {
      points: state.points,
      tier: state.tier,
      lifetimeSpend: state.lifetimeSpend,
      storeCredit: state.storeCredit,
      history: state.history,
    });
  } catch (error) {
    console.error("[Care Rewards] Loyalty data error:", error);

    state.loyaltyError =
      error.message || "Unable to load loyalty data.";
  } finally {
    state.loyaltyLoading = false;
    render();

    if (state.open) openDrawer();
  }
}




  function historyScreen() {
    const history = state.history || [];

    return `
      <button class="care-back" data-action="home">← Back to overview</button>
      <div class="care-eyebrow">ELCIRCLE 88</div>
      <h2 class="care-title">Activity history</h2>
      <p class="care-description">Your recent loyalty activity and transactions.</p>
      ${state.loyaltyLoading ? `
        <p class="care-muted">Loading your activity…</p>
      ` : state.loyaltyError ? `
        <div class="care-note">${esc(state.loyaltyError)}</div>
        <button class="care-primary" data-action="refresh-loyalty">Try again</button>
      ` : history.length ? `
        <div class="care-summary">
          ${history.map((item) => {
            const description = typeof item === "string"
              ? item
              : item.description || item.name || item.title || item.message ||
                item.type || "Loyalty activity";

            const date = item && typeof item === "object"
              ? (item.date || item.createdAt || item.timestamp || "")
              : "";

            const delta = item && typeof item === "object"
              ? (item.pointsDelta ?? item.points ?? item.amount ?? null)
              : null;

            return `
              <div class="care-summary-row" style="align-items:flex-start">
                <span style="max-width:70%">
                  <strong style="display:block;text-align:left">${esc(description)}</strong>
                  ${date ? `<small class="care-muted">${esc(date)}</small>` : ""}
                </span>
                <strong>${delta == null ? "" : esc(delta)}</strong>
              </div>
            `;
          }).join("")}
        </div>
      ` : `
        <div class="care-note">No loyalty activity was returned for this account.</div>
      `}
      <button class="care-secondary" data-action="refresh-loyalty">Refresh loyalty data</button>
    `;
  }

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const today = new Date();
  const dates = Array.from({ length: 21 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    return {
      value: formatDate(date),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      day: date.toLocaleDateString("en-US", { day: "numeric" }),
      weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    };
  });

  state.date = dates[0].value;

  const style = document.createElement("style");
  style.textContent = `
    #care-rewards-root .care-overlay {
      position: fixed !important;
      inset: 0 !important;
      z-index: 100000 !important;
      background: rgba(18,17,15,.55) !important;
      opacity: 0 !important;
      visibility: hidden !important;
      transition: opacity .3s ease, visibility .3s ease !important;
    }

    #care-rewards-root .care-overlay.show {
      opacity: 1 !important;
      visibility: visible !important;
    }

    #care-rewards-root .care-drawer {
      position: fixed !important;
      top: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      z-index: 100001 !important;
      width: min(700px, 100vw) !important;
      height: 100vh !important;
      height: 100dvh !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      background: #f8f6f1 !important;
      transform: translateX(105%) !important;
      visibility: hidden !important;
      transition: transform .38s cubic-bezier(.2,.75,.25,1),
                  visibility .38s !important;
      box-shadow: -15px 0 50px rgba(0,0,0,.12) !important;
    }

    #care-rewards-root .care-drawer.open {
      transform: translateX(0) !important;
      visibility: visible !important;
    }

    #care-rewards-root .care-head {
      flex: 0 0 auto !important;
      background: #25231f !important;
      color: #fff !important;
      padding: 25px !important;
    }

    #care-rewards-root .care-head-top {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 12px !important;
    }

    #care-rewards-root .care-brand {
      color: #e5cf9e !important;
      font-size: 12px !important;
      letter-spacing: 2px !important;
    }

    #care-rewards-root .care-close {
      width: 42px !important;
      height: 42px !important;
      flex: 0 0 42px !important;
      border: 1px solid #777 !important;
      border-radius: 50% !important;
      background: transparent !important;
      color: #fff !important;
      font-size: 24px !important;
      cursor: pointer !important;
      transition: background .2s, transform .2s !important;
    }

    #care-rewards-root .care-close:hover {
      background: #444039 !important;
      transform: rotate(90deg) !important;
    }

    #care-rewards-root .care-kicker {
      margin-top: 22px !important;
      color: #c9c1b5 !important;
      font-size: 11px !important;
      letter-spacing: 2px !important;
    }

    #care-rewards-root .care-tier-line {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 15px !important;
      margin-top: 15px !important;
    }

    #care-rewards-root .care-points {
      font-family: 'Cormorant Garamond', Georgia, serif !important;
      font-size: clamp(38px, 7vw, 58px) !important;
      color: #fff !important;
      line-height: 1.1 !important;
    }

    #care-rewards-root .care-tier-badge {
      min-width: 110px !important;
      padding: 13px !important;
      text-align: center !important;
      border: 1px solid #c8a45d !important;
      border-radius: 12px !important;
    }

    #care-rewards-root .care-tier-name {
      font-family: 'Cormorant Garamond', Georgia, serif !important;
      color: #e5cf9e !important;
      font-size: 23px !important;
      margin: 5px 0 !important;
    }

    #care-rewards-root .care-body {
      position: relative !important;
      flex: 1 1 auto !important;
      min-height: 0 !important;
      overflow-y: auto !important;
      overscroll-behavior: contain !important;
      padding: 24px !important;
      background: #f8f6f1 !important;
      -webkit-overflow-scrolling: touch !important;
    }

    /* Full-height booking mode: remove the large black points header. */
    #care-rewards-root .care-drawer.booking-mode .care-head {
      display: none !important;
    }

    #care-rewards-root .care-drawer.booking-mode .care-body {
      padding: 0 !important;
      overflow-x: hidden !important;
    }

    #care-rewards-root .care-booking {
      position: relative !important;
      min-height: 100% !important;
      padding: 25px 30px 35px !important;
      background: #f8f6f1 !important;
      color: #302e29 !important;
      font-family: 'Plus Jakarta Sans', sans-serif !important;
      animation: careFadeIn .28s ease both !important;
    }
          #care-rewards-root .care-booking * {
      box-sizing: border-box !important;
    }

    #care-rewards-root .care-booking button,
    #care-rewards-root .care-booking input,
    #care-rewards-root .care-booking select,
    #care-rewards-root .care-booking textarea {
      font: inherit;
    }

    #care-rewards-root .care-booking-top {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      margin-bottom: 30px !important;
    }

    #care-rewards-root .care-booking-top button {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 42px !important;
      height: 42px !important;
      border-radius: 50% !important;
      border: 1px solid #ded8cd !important;
      background: #fff !important;
      color: #302e29 !important;
      font-size: 22px !important;
      transition: background .2s, transform .2s !important;
    }

    #care-rewards-root .care-booking-top button:hover {
      background: #eee7db !important;
      transform: scale(1.04) !important;
    }

    #care-rewards-root .care-booking-top-label {
      color: #a1834b !important;
      font-size: 10px !important;
      letter-spacing: 1.8px !important;
    }

    #care-rewards-root .care-eyebrow {
      color: #a1834b !important;
      font-size: 10px !important;
      letter-spacing: 2px !important;
      line-height: 1.7 !important;
      margin-bottom: 10px !important;
    }

    #care-rewards-root .care-title {
      font-family: 'Cormorant Garamond', Georgia, serif !important;
      font-weight: 400 !important;
      font-size: clamp(34px, 5vw, 47px) !important;
      line-height: 1.08 !important;
      margin: 0 0 15px !important;
      color: #292720 !important;
    }

    #care-rewards-root .care-description {
      color: #817b71 !important;
      font-size: 13px !important;
      line-height: 1.8 !important;
      margin: 0 0 25px !important;
    }

    #care-rewards-root .care-stepbar {
      display: flex !important;
      gap: 6px !important;
      margin-bottom: 28px !important;
    }

    #care-rewards-root .care-stepbar span {
      flex: 1 !important;
      height: 3px !important;
      background: #e6dfd2 !important;
      border-radius: 10px !important;
      transition: background .3s !important;
    }

    #care-rewards-root .care-stepbar span.active {
      background: #b08a48 !important;
    }

    #care-rewards-root .care-advisor {
      width: 100% !important;
      display: flex !important;
      align-items: center !important;
      gap: 15px !important;
      padding: 16px 12px !important;
      margin: 0 !important;
      background: transparent !important;
      color: #302e29 !important;
      border: 1px solid transparent !important;
      border-bottom-color: #dedbd4 !important;
      text-align: left !important;
      transition: background .22s, border .22s, transform .22s !important;
    }

    #care-rewards-root .care-advisor:hover {
      background: #fff !important;
      transform: translateX(3px) !important;
    }

    #care-rewards-root .care-advisor.selected {
      background: #fff !important;
      border-color: #b08a48 !important;
      border-radius: 10px !important;
    }

    #care-rewards-root .care-avatar {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex: 0 0 52px !important;
      height: 52px !important;
      border-radius: 50% !important;
      background: #eee9df !important;
      color: #81683e !important;
      font-family: 'Cormorant Garamond', Georgia, serif !important;
      font-size: 24px !important;
    }

    #care-rewards-root .care-advisor-name {
      display: block !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      margin-bottom: 6px !important;
    }

    #care-rewards-root .care-advisor-sub {
      display: block !important;
      color: #62823e !important;
      font-size: 11px !important;
    }

    #care-rewards-root .care-chevron {
      margin-left: auto !important;
      font-size: 22px !important;
      color: #8e887f !important;
    }

    #care-rewards-root .care-store {
      text-align: center !important;
      padding: 22px 12px !important;
      margin: 20px 0 !important;
      border: 1px solid #e4ddcf !important;
      border-radius: 12px !important;
      background: #f0ece4 !important;
    }

    #care-rewards-root .care-store-symbol {
      font-size: 25px !important;
      color: #a1834b !important;
      margin-bottom: 7px !important;
    }

    #care-rewards-root .care-store-name {
      font-family: 'Cormorant Garamond', Georgia, serif !important;
      font-size: 26px !important;
    }

    #care-rewards-root .care-muted {
      color: #817b71 !important;
      font-size: 12px !important;
      line-height: 1.7 !important;
    }

    #care-rewards-root .care-dates {
      display: flex !important;
      gap: 9px !important;
      overflow-x: auto !important;
      padding: 4px 1px 13px !important;
      scrollbar-width: thin !important;
    }

    #care-rewards-root .care-date {
      flex: 0 0 83px !important;
      min-height: 100px !important;
      border: 1px solid #dedbd4 !important;
      border-radius: 9px !important;
      background: #fff !important;
      color: #302e29 !important;
      transition: background .2s, border .2s, transform .2s !important;
    }

    #care-rewards-root .care-date:hover {
      transform: translateY(-2px) !important;
    }

    #care-rewards-root .care-date.selected {
      border: 1.5px solid #302e29 !important;
      background: #f0e8da !important;
    }

    #care-rewards-root .care-date-month {
      font-size: 12px !important;
      font-weight: 600 !important;
    }

    #care-rewards-root .care-date-day {
      font-size: 23px !important;
      margin: 5px 0 !important;
    }

    #care-rewards-root .care-date-weekday {
      font-size: 11px !important;
      color: #817b71 !important;
    }

    #care-rewards-root .care-field {
      display: grid !important;
      gap: 7px !important;
      margin-bottom: 16px !important;
    }

    #care-rewards-root .care-field label {
      font-size: 12px !important;
      color: #716b61 !important;
      font-weight: 600 !important;
    }

    #care-rewards-root .care-field input,
    #care-rewards-root .care-field select,
    #care-rewards-root .care-field textarea {
      display: block !important;
      width: 100% !important;
      min-width: 0 !important;
      padding: 13px !important;
      border: 1px solid #dcd8d0 !important;
      border-radius: 7px !important;
      background: #fff !important;
      color: #302e29 !important;
      font-size: 14px !important;
    }

    #care-rewards-root .care-field input,
    #care-rewards-root .care-field select {
      min-height: 48px !important;
    }

    #care-rewards-root .care-field textarea {
      min-height: 100px !important;
      resize: vertical !important;
    }

    #care-rewards-root .care-field input:focus,
    #care-rewards-root .care-field select:focus,
    #care-rewards-root .care-field textarea:focus {
      outline: 2px solid #b08a48 !important;
      outline-offset: 1px !important;
    }

    #care-rewards-root .care-times {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 9px !important;
    }

    #care-rewards-root .care-time {
      min-height: 44px !important;
      border: 1px solid #dedbd4 !important;
      border-radius: 7px !important;
      background: #fff !important;
      color: #302e29 !important;
      font-size: 12px !important;
      transition: background .2s, color .2s, transform .2s !important;
    }

    #care-rewards-root .care-time:hover {
      transform: translateY(-2px) !important;
    }

    #care-rewards-root .care-time.selected {
      border-color: #302e29 !important;
      background: #302e29 !important;
      color: #fff !important;
    }

    #care-rewards-root .care-primary {
      display: block !important;
      width: 100% !important;
      min-height: 51px !important;
      padding: 14px 18px !important;
      border: 0 !important;
      border-radius: 7px !important;
      background: #302e29 !important;
      color: #f3dfb5 !important;
      font-size: 13px !important;
      cursor: pointer !important;
      transition: background .2s, transform .2s, box-shadow .2s !important;
    }

    #care-rewards-root .care-primary:hover {
      background: #474238 !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 5px 14px rgba(0,0,0,.1) !important;
    }

    #care-rewards-root .care-secondary {
      display: block !important;
      width: 100% !important;
      min-height: 48px !important;
      margin-top: 10px !important;
      border: 1px solid #dedbd4 !important;
      border-radius: 7px !important;
      background: transparent !important;
      color: #302e29 !important;
    }

    #care-rewards-root .care-back {
      padding: 0 !important;
      margin: 0 0 23px !important;
      border: 0 !important;
      background: transparent !important;
      color: #92713b !important;
      font-size: 13px !important;
    }

    #care-rewards-root .care-summary {
      padding: 17px !important;
      margin: 20px 0 !important;
      border: 1px solid #e7e0d4 !important;
      border-radius: 11px !important;
      background: #fff !important;
    }

    #care-rewards-root .care-summary-row {
      display: flex !important;
      justify-content: space-between !important;
      gap: 15px !important;
      padding: 9px 0 !important;
      font-size: 12px !important;
    }

    #care-rewards-root .care-summary-row span {
      color: #817b71 !important;
    }

    #care-rewards-root .care-summary-row strong {
      text-align: right !important;
      overflow-wrap: anywhere !important;
    }

    #care-rewards-root .care-fee {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 15px !important;
      padding-top: 15px !important;
      margin-top: 8px !important;
      border-top: 1px solid #e7e0d4 !important;
    }

    #care-rewards-root .care-fee-amount {
      font-family: 'Cormorant Garamond', Georgia, serif !important;
      font-size: 28px !important;
    }

    #care-rewards-root .care-note {
      padding: 13px !important;
      margin: 15px 0 !important;
      border-radius: 7px !important;
      background: #f0ece4 !important;
      color: #776b55 !important;
      font-size: 11px !important;
      line-height: 1.7 !important;
    }

    #care-rewards-root .care-check {
      display: flex !important;
      align-items: flex-start !important;
      gap: 10px !important;
      margin: 18px 0 !important;
      font-size: 12px !important;
      line-height: 1.6 !important;
    }

    #care-rewards-root .care-check input {
      margin-top: 4px !important;
      accent-color: #302e29 !important;
    }

    #care-rewards-root .care-error {
      color: #a32929 !important;
      font-size: 12px !important;
      margin: 12px 0 !important;
    }

    #care-rewards-root .care-success {
      text-align: center !important;
      padding: 55px 10px 35px !important;
    }

    #care-rewards-root .care-success-icon {
      width: 65px !important;
      height: 65px !important;
      margin: 0 auto 24px !important;
      border: 1px solid #b08a48 !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      color: #9b7941 !important;
      font-size: 28px !important;
      animation: carePop .45s cubic-bezier(.2,.8,.2,1) both !important;
    }

    #care-rewards-root .care-stat-grid {
      display: flex !important;
      gap: 12px !important;
      margin: 20px 0 !important;
    }

    #care-rewards-root .care-stat {
      flex: 1 !important;
      min-width: 0 !important;
      padding: 16px !important;
      background: #fff !important;
      border: 1px solid #ebe6dc !important;
      border-radius: 13px !important;
    }

    #care-rewards-root .care-stat-label {
      color: #817b71 !important;
      font-size: 12px !important;
    }

    #care-rewards-root .care-stat-value {
      font-family: 'Cormorant Garamond', Georgia, serif !important;
      font-size: 28px !important;
      margin: 8px 0 !important;
    }

    #care-rewards-root .care-milestone {
      padding: 19px !important;
      background: #fff !important;
      border: 1px solid #ebe6dc !important;
      border-radius: 13px !important;
      margin-bottom: 15px !important;
    }

    #care-rewards-root .care-action-grid {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 12px !important;
    }

    #care-rewards-root .care-action {
      width: calc(50% - 6px) !important;
      min-height: 125px !important;
      padding: 16px !important;
      background: #fff !important;
      border: 1px solid #e9e2d5 !important;
      border-radius: 13px !important;
      text-align: left !important;
      color: #292720 !important;
      transition: transform .22s, box-shadow .22s, border-color .22s !important;
    }

    #care-rewards-root .care-action:hover {
      transform: translateY(-3px) !important;
      box-shadow: 0 8px 20px rgba(40,35,25,.06) !important;
      border-color: #c8a45d !important;
    }

    #care-rewards-root .care-action strong {
      display: block !important;
      font-family: 'Cormorant Garamond', Georgia, serif !important;
      font-size: 21px !important;
      font-weight: 400 !important;
      margin: 12px 0 7px !important;
    }

    #care-rewards-root .care-action span {
      color: #817b71 !important;
      font-size: 12px !important;
      line-height: 1.6 !important;
    }

    @keyframes careFadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes carePop {
      0% { opacity: 0; transform: scale(.65); }
      70% { transform: scale(1.08); }
      100% { opacity: 1; transform: scale(1); }
    }

    @media(max-width: 480px) {
      #care-rewards-root .care-head { padding: 19px !important; }
      #care-rewards-root .care-body { padding: 17px !important; }
      #care-rewards-root .care-booking { padding: 18px 17px 28px !important; }
      #care-rewards-root .care-title { font-size: 35px !important; }
      #care-rewards-root .care-date { flex-basis: 75px !important; }
      #care-rewards-root .care-times { gap: 7px !important; }
      #care-rewards-root .care-action { padding: 12px !important; }
    }

    @media(prefers-reduced-motion: reduce) {
      #care-rewards-root *,
      #care-rewards-root *::before,
      #care-rewards-root *::after {
        animation-duration: .01ms !important;
        transition-duration: .01ms !important;
      }
    }
  `;

  document.head.appendChild(style);

  function openDrawer() {
    state.open = true;
    document.getElementById("care-drawer")?.classList.add("open");
    document.getElementById("care-overlay")?.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    state.open = false;
    document.getElementById("care-drawer")?.classList.remove("open");
    document.getElementById("care-overlay")?.classList.remove("show");
    document.body.style.overflow = "";
  }

  function go(panel) {
    // Preserve drawer visibility while replacing its contents.
    state.panel = panel;
    render();
    openDrawer();
  }

  function stepBar(step) {
    return `
      <div class="care-stepbar">
        ${[1, 2, 3].map((n) =>
          `<span class="${step >= n ? "active" : ""}"></span>`
        ).join("")}
      </div>
    `;
  }

  function bookingTop(backAction = "home") {
    return `
      <div class="care-booking-top">
        <button type="button" data-action="${backAction}"
          aria-label="Go back">‹</button>
        <span class="care-booking-top-label">ELCIRCLE 88</span>
        <button type="button" data-action="close"
          aria-label="Close booking">×</button>
      </div>
    `;
  }

  function advisorScreen() {
    return `
      ${bookingTop()}
      ${stepBar(1)}
      <div class="care-eyebrow">YOUR PERSONAL STYLE EXPERIENCE</div>
      <h2 class="care-title">Find your style advisor</h2>
      <p class="care-description">
        Choose a preferred advisor, or let us match you with the
        first available member of our styling team.
      </p>

      ${advisors.map((a) => `
        <button type="button"
          class="care-advisor ${state.advisor === a.name ? "selected" : ""}"
          data-advisor="${esc(a.name)}">
          <span class="care-avatar">${esc(a.initial)}</span>
          <span>
            <span class="care-advisor-name">${esc(a.name)}</span>
            <span class="care-advisor-sub">${esc(a.description)}</span>
          </span>
          <span class="care-chevron">›</span>
        </button>
      `).join("")}

      <div style="margin-top:26px">
        <button class="care-primary" data-action="next-date">
          Choose date and time →
        </button>
      </div>
    `;
  }

  function dateScreen() {
    return `
      ${bookingTop("back-advisor")}
      ${stepBar(2)}
      <div class="care-eyebrow">YOUR BOUTIQUE VISIT</div>
      <h2 class="care-title">Choose your date and time</h2>
      <p class="care-description">
        Select a convenient time for your personal dress viewing.
      </p>

      <div class="care-store">
        <div class="care-store-symbol">✧</div>
        <div class="care-store-name">Private Boutique Visit</div>
        <div class="care-muted">Dress viewing · Personal styling</div>
      </div>

      <div class="care-eyebrow">SELECT A DATE</div>
      <div class="care-dates">
        ${dates.map((d) => `
          <button type="button"
            class="care-date ${state.date === d.value ? "selected" : ""}"
            data-date="${d.value}">
            <div class="care-date-month">${d.month}</div>
            <div class="care-date-day">${d.day}</div>
            <div class="care-date-weekday">${d.weekday}</div>
          </button>
        `).join("")}
      </div>

      <div style="font-size:13px;font-weight:600;margin:20px 0 12px">
        Choose an appointment time
      </div>

      <div class="care-times">
        ${times.map((t) => `
          <button type="button"
            class="care-time ${state.time === t ? "selected" : ""}"
            data-time="${t}">${t}</button>
        `).join("")}
      </div>

      <p class="care-muted" style="margin:18px 0">
        Sample slots for the UI demo. Live availability will be connected later.
      </p>

      <div id="care-date-error" class="care-error" hidden></div>

      <button class="care-primary" data-action="next-details">
        Continue to your details →
      </button>
    `;
  }
    function detailsScreen() {
    return `
      ${bookingTop("back-date")}
      ${stepBar(3)}
      <div class="care-eyebrow">YOUR PRIVATE EXPERIENCE</div>
      <h2 class="care-title">Schedule appointment</h2>
      <p class="care-description">
        Tell us how to reach you and what you would like to explore.
      </p>

      <form id="care-booking-form">
        ${[
          ["firstName", "First name", "text", state.firstName, "given-name"],
          ["lastName", "Last name", "text", state.lastName, "family-name"],
          ["email", "Email address", "email", state.email, "email"],
          ["phone", "Phone number", "tel", state.phone, "tel"],
        ].map(([name, label, type, value, autocomplete]) => `
          <div class="care-field">
            <label for="care-${name}">${label}</label>
            <input id="care-${name}" name="${name}" type="${type}"
              autocomplete="${autocomplete}" value="${esc(value)}"
              required>
          </div>
        `).join("")}

        <div class="care-field">
          <label for="care-purpose">Purpose of your visit</label>
          <select id="care-purpose" name="purpose" required>
            ${[
              "Shopping",
              "Special occasion",
              "Dress fitting and styling",
              "Collection / pick-up",
            ].map((p) => `
              <option ${state.purpose === p ? "selected" : ""}>${p}</option>
            `).join("")}
          </select>
        </div>

        <div class="care-field">
          <label for="care-notes">Anything else? (optional)</label>
          <textarea id="care-notes" name="notes"
            placeholder="Tell us about the dress, occasion, style or size you have in mind.">${esc(state.notes)}</textarea>
        </div>

        <label class="care-check">
          <input type="checkbox" name="newsletter"
            ${state.newsletter ? "checked" : ""}>
          <span>Sign up to receive news and updates about our collections.</span>
        </label>

        <div id="care-details-error" class="care-error" hidden></div>

        <button class="care-primary" type="submit">
          Review appointment →
        </button>
      </form>
    `;
  }

  function reviewScreen() {
    const date = dates.find((d) => d.value === state.date);

    const details = [
      ["Style advisor", state.advisor],
      ["Date", date ? `${date.weekday}, ${date.month} ${date.day}` : state.date],
      ["Time", state.time],
      ["Name", `${state.firstName} ${state.lastName}`],
      ["Email", state.email],
      ["Phone", state.phone],
      ["Visit purpose", state.purpose],
    ];

    if (state.notes) details.push(["Notes", state.notes]);

    return `
      ${bookingTop("back-details")}
      <div class="care-eyebrow">YOUR PRIVATE EXPERIENCE</div>
      <h2 class="care-title">Review your appointment</h2>
      <p class="care-description">
        Everything look right? Review your selections below.
      </p>

      <div class="care-summary">
        ${details.map(([label, value]) => `
          <div class="care-summary-row">
            <span>${esc(label)}</span>
            <strong>${esc(value)}</strong>
          </div>
        `).join("")}

        <div class="care-fee">
          <div>
            <div style="font-size:12px;color:#817b71">Fixed appointment fee</div>
            <div class="care-muted">Store credit payment — coming next</div>
          </div>
          <div class="care-fee-amount">${money(APPOINTMENT_FEE)}</div>
        </div>
      </div>

      <div class="care-note">
        <strong>Payment integration — TODO</strong><br>
        Next, we will check the customer's available Shopify store credit,
        deduct the appointment fee securely, and save the booking.
        This demo does not charge or reserve anything.
      </div>

      <div id="care-confirm-error" class="care-error" hidden></div>

      <button class="care-primary" data-action="confirm-demo">
        Confirm appointment
      </button>
      <button class="care-secondary" data-action="back-details">
        Edit details
      </button>
    `;
  }

  function successScreen() {
    return `
      ${bookingTop("home")}
      <div class="care-success">
        <div class="care-success-icon">✓</div>
        <div class="care-eyebrow">APPOINTMENT PREVIEW</div>
        <h2 class="care-title">Thank you!</h2>
        <p class="care-description">
          Your confirmation screen is ready. In the next stage,
          we will connect store-credit payment and real appointment saving.
        </p>

        <div class="care-summary">
          <div class="care-summary-row">
            <span>Advisor</span><strong>${esc(state.advisor)}</strong>
          </div>
          <div class="care-summary-row">
            <span>Date</span><strong>${esc(state.date)}</strong>
          </div>
          <div class="care-summary-row">
            <span>Time</span><strong>${esc(state.time)}</strong>
          </div>
          <div class="care-summary-row">
            <span>Appointment fee</span><strong>${money(APPOINTMENT_FEE)}</strong>
          </div>
        </div>

        <p class="care-muted">
          Demo only. No payment has been made and no real reservation exists.
        </p>

        <button class="care-primary" data-action="finish">Done</button>
      </div>
    `;
  }

  function homeScreen() {
    const tier = [...tiers].reverse().find(
      (t) => state.lifetimeSpend >= t.min
    ) || tiers[0];

    return `
      <div class="care-eyebrow">YOUR MEMBERSHIP AT A GLANCE</div>
      <h2 class="care-title">A little more rewardinggggggggg.</h2>

      <div class="care-stat-grid">
        <div class="care-stat">
          <div class="care-stat-label">Store credit</div>
          <div class="care-stat-value">${state.storeCredit == null
            ? "Unavailable"
            : money(state.storeCredit)}</div>
          <div class="care-muted">${state.storeCredit == null
            ? "Balance not returned by API"
            : "Available balance"}</div>
        </div>
        <div class="care-stat">
          <div class="care-stat-label">Lifetime spend</div>
          <div class="care-stat-value">${money(state.lifetimeSpend)}</div>
          <div class="care-muted">Qualifying purchases</div>
        </div>
      </div>

      <div class="care-milestone">
        <div class="care-eyebrow">YOUR MEMBERSHIP</div>
        <h3 class="care-title" style="font-size:28px">${esc(
          state.tier || tier.name
        )}</h3>
        <div class="care-muted">
          ${state.loyaltyLoading
            ? "Loading your membership information…"
            : state.loyaltyError
              ? esc(state.loyaltyError)
              : "Your membership information is synced from your loyalty account."}
        </div>
        ${state.loyaltyError
          ? `<button class="care-secondary" data-action="refresh-loyalty">Retry loading data</button>`
          : ""}
      </div>

      <div class="care-action-grid">
        <button class="care-action" data-action="rewards">
          <span>◇</span><strong>Explore rewards</strong>
          <span>Discover your available rewards</span>
        </button>
        <button class="care-action" data-action="earn">
          <span>＋</span><strong>Earn more points</strong>
          <span>See eligible ways to earn</span>
        </button>
        <button class="care-action" data-action="buy">
          <span>◈</span><strong>Buy points</strong>
          <span>Explore point packages</span>
        </button>
        <button class="care-action" data-action="history">
          <span>≡</span><strong>Activity history</strong>
          <span>Track your transactions</span>
        </button>
        <button class="care-action" data-action="appointment"
          style="width:100%;border-color:#c8a45d">
          <span>✧</span><strong>Book a Private Appointment</strong>
          <span>Reserve a boutique visit to view dresses and receive
          personal styling assistance.</span>
        </button>
        <button class="care-action" data-action="tiers">
          <span>✦</span><strong>Your membership</strong>
          <span>Explore membership tiers</span>
        </button>
      </div>
    `;
  }

  function render() {
    const isBooking = [
      "advisor", "date", "details", "review", "success",
    ].includes(state.panel);

    const bookingScreens = {
      advisor: advisorScreen,
      date: dateScreen,
      details: detailsScreen,
      review: reviewScreen,
      success: successScreen,
    };

    const content = isBooking
      ? bookingScreens[state.panel]()
      : state.panel === "home"
        ? homeScreen()
        : state.panel === "history"
          ? historyScreen()
          : `
            <button class="care-back" data-action="home">← Back to overview</button>
            <div class="care-eyebrow">ELCIRCLE 88</div>
            <h2 class="care-title">${esc(
              state.panel.charAt(0).toUpperCase() + state.panel.slice(1)
            )}</h2>
            <p class="care-muted">
              This section can be connected to your loyalty system next.
            </p>
          `;

    root.innerHTML = `
      <button type="button" class="care-floating-btn" id="care-open">
        ELCIRCLE 88 · MEMBERSHIP
      </button>

      <div class="care-overlay ${state.open ? "show" : ""}" id="care-overlay"></div>

      <aside class="care-drawer ${state.open ? "open" : ""} ${
        isBooking ? "booking-mode" : ""
      }" id="care-drawer" role="dialog" aria-modal="true"
        aria-label="ELCIRCLE 88 membership">

        ${isBooking ? "" : `
          <header class="care-head">
            <div class="care-head-top">
              <span class="care-brand">ELCIRCLE 88 · MEMBERSHIP</span>
              <button class="care-close" id="care-close" aria-label="Close">×</button>
            </div>
            <div class="care-kicker">YOUR REWARDS BALANCE</div>
            <div class="care-tier-line">
              <div>
                <div class="care-points">
                  ${Number(state.points).toLocaleString("en-US")}
                  <span style="font-size:15px;color:#e5cf9e">PTS</span>
                </div>
                <div style="font-size:12px;color:#c9c1b5">
                  Available loyalty points
                </div>
              </div>
              <div class="care-tier-badge">
                <div style="font-size:10px;color:#c9c1b5">CURRENT TIER</div>
                <div class="care-tier-name">${esc(state.tier)}</div>
                <div style="font-size:11px;color:#c9c1b5">✦ Member</div>
              </div>
            </div>
          </header>
        `}

        <main class="care-body">
          ${isBooking
            ? `<div class="care-booking">${content}</div>`
            : content}
        </main>
      </aside>
    `;

    bindEvents();
  }

    function bindEvents() {
    document.getElementById("care-open").onclick = openDrawer;

    document.getElementById("care-close")?.addEventListener(
      "click", closeDrawer
    );

    document.getElementById("care-overlay").onclick = closeDrawer;

    root.querySelectorAll("[data-advisor]").forEach((button) => {
      button.onclick = () => {
        state.advisor = button.dataset.advisor;
        render();
        openDrawer();
      };
    });

    root.querySelectorAll("[data-date]").forEach((button) => {
      button.onclick = () => {
        state.date = button.dataset.date;
        state.time = "";
        render();
        openDrawer();
      };
    });

    root.querySelectorAll("[data-time]").forEach((button) => {
      button.onclick = () => {
        state.time = button.dataset.time;
        render();
        openDrawer();
      };
    });

    root.querySelectorAll("[data-action]").forEach((button) => {
      button.onclick = () => {
        const action = button.dataset.action;

        switch (action) {
          case "close":
            closeDrawer();
            break;

          case "home":
          case "finish":
            go("home");
            break;

          case "appointment":
            go("advisor");
            break;

          case "refresh-loyalty":
            loadLoyaltyData();
            break;

          case "next-date":
            go("date");
            break;

          case "back-advisor":
            go("advisor");
            break;

          case "next-details":
            if (!state.date || !state.time) {
              const error = document.getElementById("care-date-error");
              if (error) {
                error.textContent = "Please select a date and time.";
                error.hidden = false;
              }
              return;
            }
            go("details");
            break;

          case "back-date":
            go("date");
            break;

          case "back-details":
            go("details");
            break;

          case "confirm-demo":
            // UI ONLY. Replace this with the actual store-credit
            // payment request and booking API in the next stage.
            go("success");
            break;

          default:
            go(action);
        }
      };
    });

    const form = document.getElementById("care-booking-form");

    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!form.reportValidity()) return;

        const data = new FormData(form);

        state.firstName = String(data.get("firstName") || "").trim();
        state.lastName = String(data.get("lastName") || "").trim();
        state.email = String(data.get("email") || "").trim();
        state.phone = String(data.get("phone") || "").trim();
        state.purpose = String(data.get("purpose") || "Shopping");
        state.notes = String(data.get("notes") || "").trim();
        state.newsletter = data.get("newsletter") === "on";

        if (
          !state.firstName ||
          !state.lastName ||
          !state.email ||
          !state.phone
        ) {
          const error = document.getElementById("care-details-error");
          if (error) {
            error.textContent = "Please complete all required fields.";
            error.hidden = false;
          }
          return;
        }

        go("review");
      });
    }
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.open) closeDrawer();
  });

  render();
  loadLoyaltyData();
}
