(function() {
  const API_URL = "https://regina-cycadlike-senatorially.ngrok-free.dev";
  const shop = window.Shopify?.shop || window.shopDomain || new URLSearchParams(window.location.search).get("shop");
  const cleanEmail = window.customerEmail?.toLowerCase().trim();

  if (!cleanEmail) return;

  async function initializeLoyaltyInterface() {
    try {
      const response = await fetch(`${API_URL}/api/loyalty/points?email=${encodeURIComponent(cleanEmail)}&shop=${shop}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "ngrok-skip-browser-warning": "true"
        }
      });
      const data = await response.json();
      const totalPoints = Number(data.totalpoints) || 0;

      const displayElem = document.getElementById("points-number");
      if (displayElem) displayElem.innerText = totalPoints;

      const radioYes = document.getElementById("use-points-yes");
      const sliderPanel = document.getElementById("el-slider-panel");
      const slider = document.getElementById("el-points-slider");
      const pointsValText = document.getElementById("el-slider-points-val");
      const moneyValText = document.getElementById("el-slider-monetary-val");

      if (!slider || totalPoints < 20) {
        if (radioYes) radioYes.disabled = true;
        return;
      }

      slider.max = totalPoints;

      function updateSliderReadout() {
        const selectedPoints = parseInt(slider.value, 10);
        pointsValText.innerText = selectedPoints;
        moneyValText.innerText = (selectedPoints / 20).toFixed(2);
        
        const percentage = ((selectedPoints - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.backgroundSize = `${percentage}% 100%`;
      }

      document.getElementsByName("use_points").forEach(radio => {
        radio.addEventListener("change", (e) => {
          if (e.target.value === "yes" && e.target.checked) {
            sliderPanel.style.display = "block";
            if (parseInt(slider.value, 10) === 0) {
              slider.value = 20; 
            }
            updateSliderReadout();
          } else {
            sliderPanel.style.display = "none";
          }
        });
      });

      slider.addEventListener("input", updateSliderReadout);

    } catch (err) {
      console.error("Failed to load loyalty metadata parameters:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeLoyaltyInterface);
  } else {
    initializeLoyaltyInterface();
  }

  // Intercept checkout click event safely
  
  // Intercept checkout click event safely
document.addEventListener("click", async (e) => {
  // 1. STRIPPED OUT button[name='add'] and .product-form__submit to prevent clashing with cart additions
  const btn = e.target.closest("[name='checkout'], .checkout-button, .cart__submit");
  if (!btn) return;

  const usePoints = document.getElementById("use-points-yes");
  if (!usePoints || !usePoints.checked) return;

  const slider = document.getElementById("el-points-slider");
  const pointsToRedeem = parseInt(slider?.value, 10) || 0;

  if (pointsToRedeem < 20) {
    alert("Please select a minimum value of 20 points to apply rewards.");
    return;
  }

  // Completely break theme listeners to stop home-page redirection rules
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  const originalText = btn.innerText;
  btn.innerText = "APPLYING REWARDS...";
  btn.disabled = true;

  try {
    // Check if the cart has items first if on a product page
    // Optional: If you want to make sure the cart is populated before heading out
    const cartCheck = await fetch('/cart.js').then(res => res.json());
    if (cartCheck.item_count === 0) {
      // If they clicked checkout from a drawer/product page but cart is empty,
      // it means we might need to programmatically add the product first.
      const form = btn.closest('form[action^="/cart/add"]');
      if (form) {
        await fetch('/cart/add.js', {
          method: 'POST',
          body: new FormData(form)
        });
      }
    }

    const response = await fetch(`${API_URL}/api/loyalty/redeem`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Accept": "application/json",
        "ngrok-skip-browser-warning": "true" 
      },
      body: JSON.stringify({ 
        email: cleanEmail, 
        shop: shop, 
        points: pointsToRedeem 
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error status code: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.discountCode) {
      console.log("Discount generated successfully:", result.discountCode);
      // Force browser to go straight to Shopify checkout with discount routing path
      window.location.replace(`/cart/checkout?discount=${encodeURIComponent(result.discountCode)}`);
    } else {
      throw new Error(result.error || "Redemption failed");
    }
  } catch (err) {
    console.error("Loyalty Error:", err);
    alert("Error: " + err.message);
    btn.innerText = originalText;
    btn.disabled = false;
  }
}, true); // High priority capture phase execution

})();