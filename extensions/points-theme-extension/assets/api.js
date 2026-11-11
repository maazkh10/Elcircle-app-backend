const API_URL =
  "/apps/elcircle-membership/loyalty/points";

let pointsCache = {};

export async function fetchCustomerPoints(email) {
  if (!email) return 0;

  if (pointsCache[email]) {
    return pointsCache[email];
  }

  try {
    const response = await fetch(
      `${API_URL}?email=${encodeURIComponent(email)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    pointsCache[email] = data.totalpoints || 0;

    return pointsCache[email];
  } catch (error) {
    console.error("Points fetch error:", error);
    return 0;
  }
}
