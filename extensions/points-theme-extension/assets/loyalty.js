document.addEventListener("DOMContentLoaded", async () => {
  // 1. Check if email exists
  if (!window.customerEmail || window.customerEmail.trim() === "") {
    console.log("Loyalty App: No customer email found. User might be logged out.");
    return;
  }

  // YOUR DIRECT CLOUDFLARE URL (Ensure this matches your terminal!)
  const CLOUDFLARE_BASE_URL = "https://postposted-prospective-solved-processors.trycloudflare.com/";

  /* -----------------------------
      FETCH CUSTOMER POINTS (DIRECT)
  ------------------------------ */
  try {
    const emailParam = encodeURIComponent(window.customerEmail);
    
    const res = await fetch(`${CLOUDFLARE_BASE_URL}/api/loyalty/points?email=${emailParam}`, {
      method: "GET",
      mode: "cors", 
      headers: { "Accept": "application/json" }
    });

    if (!res.ok) {
      console.error("Loyalty App: Direct fetch failed. Status:", res.status);
      return;
    }

    const data = await res.json();
    console.log("Loyalty App: Received data:", data);

    const text = document.getElementById("points-text");
    if (text) {
      const displayPoints = data.totalpoints || data.points || 0;
      text.innerText = `Total Points: ${displayPoints}`;
    }

  } catch (err) {
    console.error("Loyalty App: Fetch error", err);
  }

  /* -----------------------------
      RADIO BUTTON SAVE
  ------------------------------ */
  document.querySelectorAll("input[name='use_points']").forEach(radio => {
    radio.addEventListener("change", (e) => {
      localStorage.setItem("usePoints", e.target.value);
    });
  });
});

/* ===================================
    INTERCEPT CHECKOUT & BUY IT NOW
=================================== */
document.addEventListener("click", async (e) => {
  // Select either the standard cart checkout button OR the Shopify dynamic 'Buy it now' button
  const checkoutBtn = e.target.closest("button[name='checkout'], .shopify-payment-button__button");
  if (!checkoutBtn) return;

  const usePoints = localStorage.getItem("usePoints");
  if (usePoints !== "yes") return;

  // IMPORTANT: Stop the default checkout immediately
  // e.preventDefault();
  // e.stopPropagation();
  
  // UI Feedback
  const originalText = checkoutBtn.innerText;
  checkoutBtn.disabled = true;
  checkoutBtn.innerText = "Applying Points...";

  // const CLOUDFLARE_URL = "https://local-permanent-generate-refuse.trycloudflare.com";
const CLOUDFLARE_URL = "https://postposted-prospective-solved-processors.trycloudflare.com/";

console.log("Redeem URL:", `${CLOUDFLARE_URL}/api/loyalty/redeem`);

  try {
    const res = await fetch(`${CLOUDFLARE_URL}/api/loyalty/redeem`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: window.customerEmail,
        points: 100, // You can change this to a dynamic value from your select dropdown
      shop: window.shopDomain
      })
    });

    const data = await res.json();
    console.log("Response from server:", data);


    if (data.success && data.discountCode) {
  console.log("Discount created:", data.discountCode);

  // stop further JS execution
  window.location.assign(
    `/discount/${data.discountCode}?redirect=/checkout`
  );

  return;
}

  } catch (err) {
    console.error("Redeem failed:", err);
    alert("Could not apply points: " + err.message);
    
    // Reset button so the user can still buy the product without points
    checkoutBtn.disabled = false;
    checkoutBtn.innerText = originalText;
  }
console.log(CLOUDFLARE_URL)

});

