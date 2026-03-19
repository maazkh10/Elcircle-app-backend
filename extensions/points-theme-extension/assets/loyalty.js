document.addEventListener("DOMContentLoaded", async () => {
  if (!window.customerEmail) return;

  const URL = "https://regina-cycadlike-senatorially.ngrok-free.dev";

  /* ---------------- FETCH POINTS ---------------- */
  try {

    const email  = window.customerEmail?.toLowerCase().trim()

    const shop = window.Shopify?.shop;
    if (!email) {
      console.log("No custonmer email found")
      return;
    }
const res = await fetch(
  `${URL}/api/loyalty/points?email=${email}&shop=${shop}`,
      // `${URL}/api/loyalty/points?email=${window.customerEmail}&shop=${window.Shopify.shop}`,
      { headers: { "ngrok-skip-browser-warning": "true" } }
    );

    const data = await res.json();
    const el = document.getElementById("points-text");

    if (el) el.innerText = `Total Points: ${data.totalpoints}`;

  } catch (err) {
    console.error("Points fetch error:", err);
  }

  /* ---------------- CHECKOUT INTERCEPT ---------------- */

  document.addEventListener("click", async (e) => {
  const btn = e.target.closest(
    "button[name='checkout'], .shopify-payment-button__button"
  );

  if (!btn) return;

  const selectedRadio = document.querySelector(
    "input[name='use_points']:checked"
  );

  if (!selectedRadio || selectedRadio.value !== "yes") {
    return; // normal checkout
  }

  e.preventDefault();
  btn.disabled = true;
  btn.innerText = "Applying loyalty discount...";

  try {
    const redeem = await fetch(`${URL}/api/loyalty/redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        email: window.customerEmail,
        points: "90",
        shop: window.Shopify?.shop,
      }),
    });

    const result = await redeem.json();

    if (!result.success || !result.discountCode) {
      alert(result.error || "Failed to apply discount");
      btn.disabled = false;
      btn.innerText = "Checkout";
      return;
    }

    console.log("Created discount:", result.discountCode);

    window.location.href = `/discount/${result.discountCode}?redirect=/cart`;

  } catch (err) {
    console.error("Redeem error:", err);
    alert("Something went wrong");
    btn.disabled = false;
    btn.innerText = "Checkout";
  }
});

  
});