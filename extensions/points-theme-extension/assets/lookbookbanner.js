(function () {
  "use strict";

  /*
   * ============================================================
   * REWARDS API
   * ============================================================
   *
   * This file handles communication with your loyalty backend.
   *
   * IMPORTANT:
   * Replace API_URL with your production API URL when your
   * backend is deployed.
   * ============================================================
   */

  var API_URL =
    "/apps/elcircle-membership/loyalty/points";

  var pointsCache = {};

  /*
   * ------------------------------------------------------------
   * FETCH CUSTOMER POINTS
   * ------------------------------------------------------------
   */

  async function fetchCustomerPoints(email) {
    if (!email) {
      return 0;
    }

    /*
     * Return cached value if we already fetched this customer.
     */

    if (
      Object.prototype.hasOwnProperty.call(
        pointsCache,
        email
      )
    ) {
      return pointsCache[email];
    }

    try {
      var response = await fetch(
        API_URL +
          "?email=" +
          encodeURIComponent(email),
        {
          method: "GET",
          headers: {
            Accept: "application/json"
          }
        }
      );

      if (!response.ok) {
        throw new Error(
          "Rewards API HTTP " + response.status
        );
      }

      var data = await response.json();

      var totalPoints =
        Number(data.totalpoints) || 0;

      pointsCache[email] = totalPoints;

      return totalPoints;
    } catch (error) {
      console.error(
        "[Rewards API] Points fetch error:",
        error
      );

      /*
       * Do not break the storefront if the API is temporarily
       * unavailable.
       */

      return 0;
    }
  }

  /*
   * ------------------------------------------------------------
   * CLEAR CUSTOMER CACHE
   * ------------------------------------------------------------
   */

  function clearCustomerPointsCache(email) {
    if (email) {
      delete pointsCache[email];
      return;
    }

    pointsCache = {};
  }

  /*
   * ------------------------------------------------------------
   * GLOBAL API
   * ------------------------------------------------------------
   *
   * We expose the functions globally because this file is
   * loaded as a normal Shopify asset, not necessarily as an
   * ES module.
   * ------------------------------------------------------------
   */

  window.RewardsAPI =
    window.RewardsAPI || {};

  window.RewardsAPI.fetchCustomerPoints =
    fetchCustomerPoints;

  window.RewardsAPI.clearCustomerPointsCache =
    clearCustomerPointsCache;

})();
