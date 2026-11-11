// document.addEventListener("DOMContentLoaded", async () => {
//   const root = document.getElementById("care-rewards-root");
//   if (!root) return;

//   root.innerHTML = `
//     <button class="cr-launcher" id="cr-open">
//       <span class="cr-launcher-dot"></span>
//       <span>ELCIRCLE 88</span>
//     </button>

//     <div class="cr-overlay" id="cr-overlay"></div>

//     <div class="cr-panel" id="cr-panel">

//       <div class="cr-header">
//         <button class="cr-close" id="cr-close">✕</button>
//         <p class="cr-header-eyebrow">Your Balance</p>
//         <div class="cr-balance cr-serif"><sup>✦</sup><span id="cr-pts">—</span></div>
//         <div class="cr-tier-pill"><span></span>Sparkle Member</div>
//       </div>

//       <div class="cr-body">

//         <!-- Main Menu -->
//         <div class="cr-view active" id="v-main">
//           <div class="cr-row" data-to="v-rewards">
//             <div class="cr-row-left">
//               <span class="cr-row-title cr-serif">Your rewards</span>
//               <span class="cr-row-sub">2 rewards available to apply</span>
//             </div>
//             <span class="cr-row-arrow">›</span>
//           </div>
//           <div class="cr-row" data-to="v-earn">
//             <div class="cr-row-left">
//               <span class="cr-row-title cr-serif">Ways to earn</span>
//               <span class="cr-row-sub">Purchases, referrals &amp; reviews</span>
//             </div>
//             <span class="cr-row-arrow">›</span>
//           </div>
//           <div class="cr-row" data-to="v-redeem">
//             <div class="cr-row-left">
//               <span class="cr-row-title cr-serif">Ways to redeem</span>
//               <span class="cr-row-sub">Discounts &amp; complimentary shipping</span>
//             </div>
//             <span class="cr-row-arrow">›</span>
//           </div>
//           <div class="cr-row" data-to="v-tier">
//             <div class="cr-row-left">
//               <span class="cr-row-title cr-serif">Sparkle Tier</span>
//               <span class="cr-row-sub">100 points from Gold status</span>
//             </div>
//             <span class="cr-row-arrow">›</span>
//           </div>
//           <div class="cr-row" data-to="v-activity">
//             <div class="cr-row-left">
//               <span class="cr-row-title cr-serif">Recent Activity</span>
//               <span class="cr-row-sub">Points ledger history</span>
//             </div>
//             <span class="cr-row-arrow">›</span>
//           </div>
//           <div class="cr-invite">
//             <p class="cr-invite-hed">Invite a friend</p>
//             <p class="cr-invite-body">Share your code and give friends 10% off their first order. You receive 100 points the moment they check out.</p>
//             <button class="cr-invite-btn" id="cr-copy-btn">Copy referral link</button>
//           </div>
//         </div>

//         <!-- Your Rewards -->
//         <div class="cr-view" id="v-rewards">
//           <button class="cr-back back-btn">Back to account</button>
//           <h2 class="cr-section-title cr-serif">Available rewards</h2>
//           <p class="cr-section-sub">Select a coupon below to apply it to your current session.</p>
//           <div class="cr-item">
//             <div class="cr-item-info">
//               <h4>$10 Gift Card</h4>
//               <p>Code: CARE-10XF99</p>
//             </div>
//             <span class="cr-tag cta apply-tag">Apply</span>
//           </div>
//           <div class="cr-item">
//             <div class="cr-item-info">
//               <h4>Free Standard Shipping</h4>
//               <p>Code: CARE-FREESHIP</p>
//             </div>
//             <span class="cr-tag cta apply-tag">Apply</span>
//           </div>
//         </div>

//         <!-- Ways to Earn -->
//         <div class="cr-view" id="v-earn">
//           <button class="cr-back back-btn">Back to account</button>
//           <h2 class="cr-section-title cr-serif">Ways to earn</h2>
//           <p class="cr-section-sub">Every interaction with the brand is an opportunity to accumulate points toward meaningful rewards.</p>
//           <div class="cr-item">
//             <div class="cr-item-info">
//               <h4>Place an Order</h4>
//               <p>5 points for every $1 spent</p>
//             </div>
//             <span class="cr-tag">Active</span>
//           </div>
//           <div class="cr-item">
//             <div class="cr-item-info">
//               <h4>Write a Review</h4>
//               <p>Share certified product feedback</p>
//             </div>
//             <span class="cr-tag gold">50 pts</span>
//           </div>
//           <div class="cr-item">
//             <div class="cr-item-info">
//               <h4>Follow on Instagram</h4>
//               <p>Track our official channel</p>
//             </div>
//             <span class="cr-tag cta">Follow</span>
//           </div>
//           <div class="cr-item">
//             <div class="cr-item-info">
//               <h4>Refer a Friend</h4>
//               <p>When they complete checkout</p>
//             </div>
//             <span class="cr-tag gold">100 pts</span>
//           </div>
//         </div>

//         <!-- Ways to Redeem -->
//         <div class="cr-view" id="v-redeem">
//           <button class="cr-back back-btn">Back to account</button>
//           <h2 class="cr-section-title cr-serif">Ways to redeem</h2>
//           <p class="cr-section-sub">Exchange points for cart discounts or complimentary benefits at any time.</p>
//           <div class="cr-item">
//             <div class="cr-item-info">
//               <h4>$5 Off Your Order</h4>
//               <p>100 points required</p>
//             </div>
//             <span class="cr-tag cta">Redeem</span>
//           </div>
//           <div class="cr-item">
//             <div class="cr-item-info">
//               <h4>$20 Off Your Order</h4>
//               <p>350 points required</p>
//             </div>
//             <span class="cr-tag cta">Redeem</span>
//           </div>
//           <div class="cr-item">
//             <div class="cr-item-info">
//               <h4>Free Shipping</h4>
//               <p>150 points required</p>
//             </div>
//             <span class="cr-tag cta">Redeem</span>
//           </div>
//         </div>

//         <!-- Tier Status -->
//         <div class="cr-view" id="v-tier">
//           <button class="cr-back back-btn">Back to account</button>
//           <h2 class="cr-section-title cr-serif">Sparkle Tier</h2>
//           <p class="cr-section-sub">Your current status within the ELCIRCLE programme.</p>
//           <div class="cr-progress-wrap">
//             <div class="cr-progress-labels">
//               <span><strong>Sparkle</strong> · 400 pts</span>
//               <span>Gold · 500 pts</span>
//             </div>
//             <div class="cr-progress-track">
//               <div class="cr-progress-fill"></div>
//             </div>
//           </div>
//           <div class="cr-item">
//             <div class="cr-item-info">
//               <h4>Silver</h4>
//               <p>Entry level · 0–199 pts</p>
//             </div>
//             <span class="cr-tag">Passed</span>
//           </div>
//           <div class="cr-item">
//             <div class="cr-item-info">
//               <h4>Sparkle</h4>
//               <p>Current tier · 200–499 pts</p>
//             </div>
//             <span class="cr-tag gold">Active</span>
//           </div>
//           <div class="cr-item">
//             <div class="cr-item-info">
//               <h4>Gold</h4>
//               <p>Requires 500 lifetime points</p>
//             </div>
//             <span class="cr-tag">Locked</span>
//           </div>
//         </div>

//         <!-- Activity Ledger -->
//         <div class="cr-view" id="v-activity">
//           <button class="cr-back back-btn">Back to account</button>
//           <h2 class="cr-section-title cr-serif">Activity</h2>
//           <p class="cr-section-sub">A record of your points earned and redeemed.</p>
//           <div class="cr-activity-row">
//             <span class="cr-activity-desc">Order #1001</span>
//             <span class="cr-activity-pts pos">+20</span>
//             <span class="cr-activity-date">2 days ago</span>
//           </div>
//           <div class="cr-activity-row">
//             <span class="cr-activity-desc">Reward redeemed</span>
//             <span class="cr-activity-pts neg">−100</span>
//             <span class="cr-activity-date">5 days ago</span>
//           </div>
//           <div class="cr-activity-row">
//             <span class="cr-activity-desc">Instagram follow</span>
//             <span class="cr-activity-pts pos">+15</span>
//             <span class="cr-activity-date">3 weeks ago</span>
//           </div>
//           <div class="cr-activity-row">
//             <span class="cr-activity-desc">Welcome bonus</span>
//             <span class="cr-activity-pts pos">+50</span>
//             <span class="cr-activity-date">1 month ago</span>
//           </div>
//         </div>

//       </div>
//     </div>
//   `;

//   // --- Element References ---
//   const panel   = document.getElementById("cr-panel");
//   const overlay = document.getElementById("cr-overlay");
//   const views   = document.querySelectorAll(".cr-view");

//   // --- Open / Close ---
//   function openPanel() {
//     panel.classList.add("open");
//     overlay.classList.add("show");
//   }

//   function closePanel() {
//     panel.classList.remove("open");
//     overlay.classList.remove("show");
//     setTimeout(() => {
//       views.forEach(v => v.classList.remove("active"));
//       document.getElementById("v-main").classList.add("active");
//     }, 450);
//   }

//   document.getElementById("cr-open").addEventListener("click", openPanel);
//   document.getElementById("cr-close").addEventListener("click", closePanel);
//   overlay.addEventListener("click", closePanel);

//   // --- View Router ---
//   document.querySelectorAll("[data-to]").forEach(row => {
//     row.addEventListener("click", () => {
//       const target = row.getAttribute("data-to");
//       views.forEach(v => v.classList.remove("active"));
//       document.getElementById(target).classList.add("active");
//     });
//   });

//   document.querySelectorAll(".back-btn").forEach(btn => {
//     btn.addEventListener("click", () => {
//       views.forEach(v => v.classList.remove("active"));
//       document.getElementById("v-main").classList.add("active");
//     });
//   });

//   // --- Apply Tag Feedback ---
//   document.querySelectorAll(".apply-tag").forEach(tag => {
//     tag.addEventListener("click", () => {
//       tag.textContent = "Copied ✓";
//       tag.style.color = "var(--gold)";
//       tag.style.borderColor = "var(--gold)";
//     });
//   });


//   // --- Fetch Points ---
//   try {
//     const res  = await fetch("https://specifies-prostate-mon-grip.trycloudflare.com/api/loyalty-points");
//     const data = await res.json();
//     document.getElementById("cr-pts").innerText = data.points ?? 0;
//   } catch (err) {
//     console.warn("Points fetch failed — using fallback.", err);
//     document.getElementById("cr-pts").innerText = "400";
//   }
// });











(function () {
  "use strict";

  /*
   * ============================================================
   * REWARDS FLOATING WIDGET
   * ============================================================
   */

  /*
   * Prevent the script from registering the same global
   * event listeners multiple times.
   *
   * Shopify Theme Editor can reload blocks/sections without
   * doing a full page refresh.
   */

  if (window.__RewardsWidgetLoaded) {
    return;
  }

  window.__RewardsWidgetLoaded = true;

  /*
   * ------------------------------------------------------------
   * SELECTORS
   * ------------------------------------------------------------
   */

  var SELECTORS = {
    widget: "[data-rewards-widget]",
    modal: "[data-rewards-modal]",
    open: "[data-open-rewards-modal]",
    close: "[data-close-rewards-modal]"
  };

  /*
   * ------------------------------------------------------------
   * FIND WIDGETS
   * ------------------------------------------------------------
   */

  function getWidgets(scope) {
    var root = scope || document;

    if (!root.querySelectorAll) {
      return [];
    }

    return Array.prototype.slice.call(
      root.querySelectorAll(
        SELECTORS.widget
      )
    );
  }

  /*
   * ------------------------------------------------------------
   * FIND MODAL
   * ------------------------------------------------------------
   */

  function getModal(widget) {
    if (!widget) {
      return null;
    }

    return widget.querySelector(
      SELECTORS.modal
    );
  }

  /*
   * ------------------------------------------------------------
   * CLOSE ALL MODALS
   * ------------------------------------------------------------
   */

  function closeAllModals() {
    getWidgets(document).forEach(
      function (widget) {
        var modal = getModal(widget);

        if (!modal) {
          return;
        }

        modal.classList.remove("is-open");

        modal.setAttribute(
          "aria-hidden",
          "true"
        );

        /*
         * Reset inline visibility if another implementation
         * happens to use it.
         */

        modal.removeAttribute("data-open");
      }
    );

    document.body.style.overflow = "";
  }

  /*
   * ------------------------------------------------------------
   * OPEN MODAL
   * ------------------------------------------------------------
   */

  function openModal(widget) {
    if (!widget) {
      return;
    }

    var modal = getModal(widget);

    if (!modal) {
      console.warn(
        "[Rewards Widget] Modal not found."
      );

      return;
    }

    /*
     * Close another rewards modal first.
     */

    getWidgets(document).forEach(
      function (otherWidget) {
        if (otherWidget === widget) {
          return;
        }

        var otherModal =
          getModal(otherWidget);

        if (!otherModal) {
          return;
        }

        otherModal.classList.remove(
          "is-open"
        );

        otherModal.setAttribute(
          "aria-hidden",
          "true"
        );
      }
    );

    /*
     * Open current modal.
     */

    modal.classList.add("is-open");

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    modal.setAttribute(
      "data-open",
      "true"
    );

    document.body.style.overflow =
      "hidden";

    /*
     * Focus close button.
     */

    var closeButton =
      modal.querySelector(
        ".rw-close"
      );

    if (!closeButton) {
      closeButton =
        modal.querySelector(
          SELECTORS.close
        );
    }

    if (closeButton) {
      window.setTimeout(
        function () {
          try {
            closeButton.focus();
          } catch (error) {
            /*
             * Ignore focus errors.
             */
          }
        },
        50
      );
    }

    /*
     * Dispatch a custom event.
     *
     * Useful later if you want analytics or other functionality.
     */

    try {
      widget.dispatchEvent(
        new CustomEvent(
          "rewards:modal:open",
          {
            bubbles: true
          }
        )
      );
    } catch (error) {}
  }

  /*
   * ------------------------------------------------------------
   * CLOSE MODAL
   * ------------------------------------------------------------
   */

  function closeModal(widget) {
    if (!widget) {
      return;
    }

    var modal = getModal(widget);

    if (!modal) {
      return;
    }

    modal.classList.remove(
      "is-open"
    );

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

    modal.removeAttribute(
      "data-open"
    );

    /*
     * Restore scrolling only when no rewards modal remains open.
     */

    var anotherOpenModal =
      document.querySelector(
        SELECTORS.modal +
          ".is-open"
      );

    if (!anotherOpenModal) {
      document.body.style.overflow =
        "";
    }

    /*
     * Custom event.
     */

    try {
      widget.dispatchEvent(
        new CustomEvent(
          "rewards:modal:close",
          {
            bubbles: true
          }
        )
      );
    } catch (error) {}
  }

  /*
   * ------------------------------------------------------------
   * CLICK HANDLER
   * ------------------------------------------------------------
   *
   * Event delegation means dynamically injected Shopify
   * elements still work.
   * ------------------------------------------------------------
   */

  function handleClick(event) {
    if (!event) {
      return;
    }

    var target =
      event.target;

    if (!target) {
      return;
    }

    /*
     * ----------------------------------------------------------
     * OPEN
     * ----------------------------------------------------------
     */

    var openButton = null;

    if (target.closest) {
      openButton =
        target.closest(
          SELECTORS.open
        );
    }

    if (openButton) {
      event.preventDefault();

      /*
       * Do not stop propagation unnecessarily.
       */

      var widget = null;

      if (openButton.closest) {
        widget =
          openButton.closest(
            SELECTORS.widget
          );
      }

      if (widget) {
        openModal(widget);
      } else {
        console.warn(
          "[Rewards Widget] Open button is outside widget."
        );
      }

      return;
    }

    /*
     * ----------------------------------------------------------
     * CLOSE BUTTON
     * ----------------------------------------------------------
     */

    var closeButton = null;

    if (target.closest) {
      closeButton =
        target.closest(
          SELECTORS.close
        );
    }

    if (closeButton) {
      event.preventDefault();

      var closeWidget = null;

      if (closeButton.closest) {
        closeWidget =
          closeButton.closest(
            SELECTORS.widget
          );
      }

      if (closeWidget) {
        closeModal(closeWidget);
      }

      return;
    }

    /*
     * ----------------------------------------------------------
     * CLICK OUTSIDE MODAL CONTENT
     * ----------------------------------------------------------
     *
     * This supports closing when the overlay itself is clicked.
     *
     * It expects the modal element to be the overlay.
     * ----------------------------------------------------------
     */

    var modal = null;

    if (target.closest) {
      modal =
        target.closest(
          SELECTORS.modal
        );
    }

    if (
      modal &&
      target === modal
    ) {
      var modalWidget =
        modal.closest
          ? modal.closest(
              SELECTORS.widget
            )
          : null;

      if (modalWidget) {
        closeModal(
          modalWidget
        );
      }
    }
  }

  /*
   * ------------------------------------------------------------
   * ESCAPE KEY
   * ------------------------------------------------------------
   */

  function handleKeydown(event) {
    if (!event) {
      return;
    }

    if (
      event.key !== "Escape" &&
      event.key !== "Esc"
    ) {
      return;
    }

    var openModalElement =
      document.querySelector(
        SELECTORS.modal +
          ".is-open"
      );

    if (!openModalElement) {
      return;
    }

    var widget =
      openModalElement.closest
        ? openModalElement.closest(
            SELECTORS.widget
          )
        : null;

    if (widget) {
      closeModal(widget);
    }
  }

  /*
   * ------------------------------------------------------------
   * FOCUS TRAP
   * ------------------------------------------------------------
   */

  function handleTab(event) {
    if (!event) {
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    var modal =
      document.querySelector(
        SELECTORS.modal +
          ".is-open"
      );

    if (!modal) {
      return;
    }

    var focusable =
      modal.querySelectorAll(
        [
          "button:not([disabled])",
          "[href]",
          "input:not([disabled])",
          "select:not([disabled])",
          "textarea:not([disabled])",
          "[tabindex]:not([tabindex=\"-1\"])"
        ].join(",")
      );

    if (!focusable.length) {
      return;
    }

    var first =
      focusable[0];

    var last =
      focusable[
        focusable.length - 1
      ];

    if (
      event.shiftKey &&
      document.activeElement === first
    ) {
      event.preventDefault();

      try {
        last.focus();
      } catch (error) {}

      return;
    }

    if (
      !event.shiftKey &&
      document.activeElement === last
    ) {
      event.preventDefault();

      try {
        first.focus();
      } catch (error) {}
    }
  }

  /*
   * ------------------------------------------------------------
   * SHOPIFY SECTION LOAD
   * ------------------------------------------------------------
   */

  function handleSectionLoad(event) {
    if (!event || !event.target) {
      return;
    }

    var widgets =
      getWidgets(event.target);

    widgets.forEach(
      function (widget) {
        widget.dataset.initialized =
          "true";
      }
    );

    console.log(
      "[Rewards Widget] Section loaded:",
      widgets.length,
      "widget(s)"
    );
  }

  /*
   * ------------------------------------------------------------
   * SHOPIFY SECTION UNLOAD
   * ------------------------------------------------------------
   */

  function handleSectionUnload(event) {
    if (!event || !event.target) {
      return;
    }

    var widgets =
      getWidgets(event.target);

    widgets.forEach(
      function (widget) {
        var modal =
          getModal(widget);

        if (!modal) {
          return;
        }

        modal.classList.remove(
          "is-open"
        );

        modal.setAttribute(
          "aria-hidden",
          "true"
        );

        modal.removeAttribute(
          "data-open"
        );
      }
    );

    /*
     * Always restore page scrolling after a section unload.
     */

    document.body.style.overflow =
      "";
  }

  /*
   * ------------------------------------------------------------
   * SHOPIFY BLOCK SELECT
   * ------------------------------------------------------------
   */

  function handleBlockSelect(event) {
    if (!event || !event.target) {
      return;
    }

    var widget = null;

    if (event.target.querySelector) {
      widget =
        event.target.querySelector(
          SELECTORS.widget
        );
    }

    if (!widget) {
      return;
    }

    widget.dataset.initialized =
      "true";
  }

  /*
   * ------------------------------------------------------------
   * SHOPIFY BLOCK DESELECT
   * ------------------------------------------------------------
   */

  function handleBlockDeselect(event) {
    if (!event || !event.target) {
      return;
    }

    var widget = null;

    if (event.target.querySelector) {
      widget =
        event.target.querySelector(
          SELECTORS.widget
        );
    }

    if (!widget) {
      return;
    }

    closeModal(widget);
  }

  /*
   * ------------------------------------------------------------
   * INITIALIZE WIDGETS
   * ------------------------------------------------------------
   */

  function initializeWidgets() {
    var widgets =
      getWidgets(document);

    widgets.forEach(
      function (widget) {
        widget.dataset.initialized =
          "true";
      }
    );

    return widgets.length;
  }

  /*
   * ------------------------------------------------------------
   * GLOBAL EVENT LISTENERS
   * ------------------------------------------------------------
   */

  document.addEventListener(
    "click",
    handleClick,
    false
  );

  document.addEventListener(
    "keydown",
    handleKeydown,
    false
  );

  document.addEventListener(
    "keydown",
    handleTab,
    false
  );

  /*
   * Shopify Theme Editor events.
   */

  document.addEventListener(
    "shopify:section:load",
    handleSectionLoad,
    false
  );

  document.addEventListener(
    "shopify:section:unload",
    handleSectionUnload,
    false
  );

  document.addEventListener(
    "shopify:block:select",
    handleBlockSelect,
    false
  );

  document.addEventListener(
    "shopify:block:deselect",
    handleBlockDeselect,
    false
  );

  /*
   * ------------------------------------------------------------
   * START
   * ------------------------------------------------------------
   */

  function start() {
    var count =
      initializeWidgets();

    console.log(
      "[Rewards Widget] Initialized.",
      count +
        " widget(s) found."
    );
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      start,
      false
    );
  } else {
    start();
  }

})();
