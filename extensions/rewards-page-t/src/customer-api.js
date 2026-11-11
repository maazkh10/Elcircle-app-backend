import { backendUrl } from "./backend-url";

export async function accountRequest(path, options = {}) {
  const token = await shopify.sessionToken.get();
  const response = await fetch(`${backendUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.error || "Unable to complete this request.");
  }
  return data;
}
